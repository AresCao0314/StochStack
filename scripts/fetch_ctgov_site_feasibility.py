#!/usr/bin/env python3
"""
Nightly sync for Site Feasibility Scoring data from ClinicalTrials.gov API v2.

Output:
- src/content/site-feasibility/sites.json (aggregated site-level data for frontend)
- src/content/site-feasibility/ctgov-sync-meta.json (sync stats)
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import re
import statistics
import urllib.parse
import urllib.request
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

API_URL = "https://clinicaltrials.gov/api/v2/studies"

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src" / "content" / "site-feasibility"
OUT_FILE = OUT_DIR / "sites.json"
META_FILE = OUT_DIR / "ctgov-sync-meta.json"

COMPETITOR_KEYWORDS = [
    "pfizer",
    "novartis",
    "roche",
    "bms",
    "bristol myers",
    "msd",
    "merck",
    "sanofi",
    "astrazeneca",
    "gsk",
    "lilly",
    "boehringer",
    "amgen",
    "takeda",
    "j&j",
    "johnson",
    "abbvie",
]

COUNTRY_REGION = {
    "United States": "North America",
    "Canada": "North America",
    "Germany": "Europe",
    "United Kingdom": "Europe",
    "France": "Europe",
    "Spain": "Europe",
    "Italy": "Europe",
    "China": "APAC",
    "Japan": "APAC",
    "South Korea": "APAC",
    "Singapore": "APAC",
    "Australia": "APAC",
    "India": "APAC",
}

PROFILE_DEFS = [
    {"therapeuticArea": "Oncology", "indication": "NSCLC", "phase": "Phase 3"},
    {"therapeuticArea": "Oncology", "indication": "Breast Cancer", "phase": "Phase 3"},
    {"therapeuticArea": "Oncology", "indication": "Gastric Cancer", "phase": "Phase 2"},
    {"therapeuticArea": "Oncology", "indication": "Hepatocellular Carcinoma", "phase": "Phase 2"},
    {"therapeuticArea": "Immunology", "indication": "Rheumatoid Arthritis", "phase": "Phase 3"},
    {"therapeuticArea": "Immunology", "indication": "Systemic Lupus Erythematosus", "phase": "Phase 2"},
    {"therapeuticArea": "CNS", "indication": "Alzheimer's Disease", "phase": "Phase 2"},
    {"therapeuticArea": "CNS", "indication": "Parkinson's Disease", "phase": "Phase 3"},
    {"therapeuticArea": "Cardiovascular", "indication": "Heart Failure", "phase": "Phase 3"},
    {"therapeuticArea": "Cardiovascular", "indication": "Atrial Fibrillation", "phase": "Phase 2"},
]


@dataclass
class ProfileStats:
    ctgov_trials: int = 0
    competitor_trials: int = 0
    enrollments: list[int] = field(default_factory=list)


@dataclass
class SiteStats:
    id: str
    name: str
    country: str
    city: str
    region: str
    pis: set[str] = field(default_factory=set)
    statuses: defaultdict[str, int] = field(default_factory=lambda: defaultdict(int))
    recent_years: set[int] = field(default_factory=set)
    sponsor_total: int = 0
    sponsor_global_pharma: int = 0
    sponsor_biotech: int = 0
    profile_stats: defaultdict[str, ProfileStats] = field(default_factory=lambda: defaultdict(ProfileStats))


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:64]


def map_phase(raw: Any) -> str:
    if isinstance(raw, list):
        joined = " ".join(str(x) for x in raw)
    else:
        joined = str(raw or "")
    up = joined.upper()
    if "PHASE4" in up or "PHASE 4" in up:
        return "Phase 4"
    if "PHASE3" in up or "PHASE 3" in up:
        return "Phase 3"
    if "PHASE2" in up or "PHASE 2" in up:
        return "Phase 2"
    if "PHASE1" in up or "PHASE 1" in up:
        return "Phase 1"
    return "Unknown"


def normalize_study_type(raw: Any) -> str:
    v = str(raw or "").upper()
    if "INTERVENTION" in v:
        return "Interventional"
    if "OBSERVATIONAL" in v:
        return "Observational"
    return "Interventional"


def parse_year(date_str: str | None) -> int | None:
    if not date_str:
        return None
    m = re.match(r"^(\d{4})", date_str)
    if not m:
        return None
    return int(m.group(1))


def is_competitor(sponsor_text: str) -> bool:
    lowered = sponsor_text.lower()
    return any(k in lowered for k in COMPETITOR_KEYWORDS)


def classify_sponsor(sponsor_text: str) -> tuple[bool, bool]:
    low = sponsor_text.lower()
    global_pharma = is_competitor(low)
    biotech = any(x in low for x in ["bio", "therapeutics", "gen", "biotech"]) and not global_pharma
    return global_pharma, biotech


def fetch_profile_studies(indication: str, page_size: int, max_pages: int, timeout: int) -> list[dict[str, Any]]:
    studies: list[dict[str, Any]] = []
    page_token = None

    for _ in range(max_pages):
        params = {
            "query.cond": indication,
            "countTotal": "false",
            "pageSize": str(page_size),
            "format": "json",
        }
        if page_token:
            params["pageToken"] = page_token

        url = f"{API_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": "StochStack/1.0"})

        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))

        page_studies = payload.get("studies", [])
        studies.extend(page_studies)

        page_token = payload.get("nextPageToken")
        if not page_token:
            break

    return studies


def build_site_key(facility: str, country: str, city: str) -> str:
    return f"{slugify(country)}-{slugify(city)}-{slugify(facility)}"


def startup_estimate(site: SiteStats, trial_count: int) -> int:
    completed = site.statuses.get("COMPLETED", 0)
    terminated = site.statuses.get("TERMINATED", 0) + site.statuses.get("WITHDRAWN", 0)
    pi_count = max(1, len(site.pis))

    base = 78 - min(trial_count, 24) * 1.4 - min(pi_count, 20) * 0.7
    penalty = terminated * 1.8
    bonus = min(completed, 15) * 0.6

    val = base + penalty - bonus
    return int(max(28, min(120, round(val))))


def stability_score(site: SiteStats, trial_count: int) -> int:
    completed = site.statuses.get("COMPLETED", 0)
    terminated = site.statuses.get("TERMINATED", 0) + site.statuses.get("WITHDRAWN", 0)
    active = site.statuses.get("RECRUITING", 0) + site.statuses.get("ACTIVE_NOT_RECRUITING", 0)

    if trial_count == 0:
        return 60

    score = 70 + completed * 2.2 + active * 0.8 - terminated * 3.6
    score += min(trial_count, 30) * 0.3
    return int(max(40, min(95, round(score))))


def aggregate(limit_per_profile: int, page_size: int, max_pages: int, timeout: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    raw_study_count = 0
    site_map: dict[str, SiteStats] = {}

    for profile in PROFILE_DEFS:
        indication = profile["indication"]
        studies = fetch_profile_studies(indication, page_size=page_size, max_pages=max_pages, timeout=timeout)
        raw_study_count += len(studies)

        kept = 0
        for study in studies:
            if kept >= limit_per_profile:
                break

            protocol = study.get("protocolSection", {})
            status_module = protocol.get("statusModule", {})
            ident_module = protocol.get("identificationModule", {})
            design_module = protocol.get("designModule", {})
            sponsor_module = protocol.get("sponsorCollaboratorsModule", {})
            contacts_module = protocol.get("contactsLocationsModule", {})

            phase = map_phase(design_module.get("phases"))
            if phase != profile["phase"]:
                continue

            study_type = normalize_study_type(design_module.get("studyType"))
            conditions = protocol.get("conditionsModule", {}).get("conditions", [])
            conditions_text = " ".join(str(x) for x in conditions).lower()
            if profile["indication"].lower() not in conditions_text:
                continue

            enrollment_raw = design_module.get("enrollmentInfo", {}).get("count")
            try:
                enrollment = int(enrollment_raw)
            except Exception:
                enrollment = 0

            sponsor_name = str(sponsor_module.get("leadSponsor", {}).get("name", ""))
            collabs = sponsor_module.get("collaborators", [])
            collab_names = " ".join(str(c.get("name", "")) for c in collabs if isinstance(c, dict))
            sponsor_text = f"{sponsor_name} {collab_names}".strip()

            global_pharma, biotech = classify_sponsor(sponsor_text)
            competitor = is_competitor(sponsor_text)

            status = str(status_module.get("overallStatus", "UNKNOWN"))
            start_year = parse_year(status_module.get("startDateStruct", {}).get("date"))

            locations = contacts_module.get("locations", [])
            if not isinstance(locations, list):
                continue

            matched_location = False
            for loc in locations:
                if not isinstance(loc, dict):
                    continue
                facility = str(loc.get("facility", "")).strip()
                country = str(loc.get("country", "")).strip()
                city = str(loc.get("city", "")).strip() or "Unknown"

                if not facility or not country:
                    continue

                matched_location = True
                key = build_site_key(facility, country, city)
                if key not in site_map:
                    site_map[key] = SiteStats(
                        id=key,
                        name=facility,
                        country=country,
                        city=city,
                        region=COUNTRY_REGION.get(country, "Global"),
                    )

                site = site_map[key]
                site.statuses[status] += 1
                if start_year:
                    site.recent_years.add(start_year)

                if sponsor_text:
                    site.sponsor_total += 1
                    if global_pharma:
                        site.sponsor_global_pharma += 1
                    if biotech:
                        site.sponsor_biotech += 1

                for contact in loc.get("contacts", []) or []:
                    name = str(contact.get("name", "")).strip()
                    role = str(contact.get("role", "")).upper()
                    if name and ("PRINCIPAL" in role or "INVESTIGATOR" in role):
                        site.pis.add(name)

                pkey = f"{profile['therapeuticArea']}|{profile['indication']}|{phase}|{study_type}"
                pstat = site.profile_stats[pkey]
                pstat.ctgov_trials += 1
                if competitor:
                    pstat.competitor_trials += 1
                if enrollment > 0:
                    pstat.enrollments.append(enrollment)

            if matched_location:
                kept += 1

    rows: list[dict[str, Any]] = []
    for site in site_map.values():
        profile_rows = []
        total_trials = 0
        for pkey, ps in site.profile_stats.items():
            ta, ind, phase, study_type = pkey.split("|")
            total_trials += ps.ctgov_trials
            avg_enrollment = int(round(statistics.mean(ps.enrollments))) if ps.enrollments else 0
            profile_rows.append(
                {
                    "therapeuticArea": ta,
                    "indication": ind,
                    "phase": phase,
                    "studyType": study_type,
                    "ctgovTrials": ps.ctgov_trials,
                    "competitorTrials": ps.competitor_trials,
                    "avgEnrollment": avg_enrollment,
                }
            )

        if total_trials == 0:
            continue

        profile_rows.sort(key=lambda x: (x["ctgovTrials"], x["competitorTrials"]), reverse=True)

        pi_count = len(site.pis)
        if pi_count == 0:
            pi_count = max(2, min(18, int(round(math.sqrt(total_trials) * 2.1))))

        sponsor_total = max(site.sponsor_total, 1)
        rows.append(
            {
                "id": site.id,
                "name": site.name,
                "country": site.country,
                "region": site.region,
                "city": site.city,
                "startupMedianDays": startup_estimate(site, total_trials),
                "piCount": pi_count,
                "stabilityScore": stability_score(site, total_trials),
                "recentTrialYears": sorted(site.recent_years, reverse=True)[:8],
                "sponsorAffinity": {
                    "globalPharma": round(site.sponsor_global_pharma / sponsor_total, 2),
                    "biotech": round(site.sponsor_biotech / sponsor_total, 2),
                },
                "conditionProfiles": profile_rows[:8],
            }
        )

    rows.sort(
        key=lambda x: (
            sum(p["ctgovTrials"] for p in x["conditionProfiles"]),
            x["piCount"],
            -x["startupMedianDays"],
        ),
        reverse=True,
    )

    meta = {
        "syncedAt": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "source": "ClinicalTrials.gov API v2",
        "profileCount": len(PROFILE_DEFS),
        "rawStudyCount": raw_study_count,
        "siteCount": len(rows),
    }

    return rows, meta


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync Site Feasibility data from ClinicalTrials.gov")
    parser.add_argument("--limit-per-profile", type=int, default=240, help="Max studies kept per profile after phase filtering")
    parser.add_argument("--page-size", type=int, default=100, help="API page size")
    parser.add_argument("--max-pages", type=int, default=5, help="Max pages to fetch per profile")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout seconds")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows, meta = aggregate(
        limit_per_profile=args.limit_per_profile,
        page_size=args.page_size,
        max_pages=args.max_pages,
        timeout=args.timeout,
    )

    if not rows:
      print("No site rows generated from API. Existing file kept unchanged.")
      return

    with OUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    with META_FILE.open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"Synced {len(rows)} sites -> {OUT_FILE}")
    print(f"Meta -> {META_FILE}")


if __name__ == "__main__":
    main()
