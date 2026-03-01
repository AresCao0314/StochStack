#!/usr/bin/env python3
"""Daily sync for vendor/literature AI signals into runtime data path.

- Pulls RSS/Atom feeds from source-manifest.json
- Applies keyword matching to scenarios and technologies
- Writes normalized latest signals JSON
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_feed(xml_text: str, fallback_source: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    try:
      root = ET.fromstring(xml_text)
    except ET.ParseError:
      return entries

    # RSS
    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        date = (item.findtext("pubDate") or "").strip()
        if title:
            entries.append({"title": title, "link": link, "publishedAt": date, "source": fallback_source})

    # Atom
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    for entry in root.findall(".//atom:entry", ns):
        title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
        link_node = entry.find("atom:link", ns)
        link = link_node.attrib.get("href", "").strip() if link_node is not None else ""
        date = (entry.findtext("atom:updated", default="", namespaces=ns) or "").strip()
        if title:
            entries.append({"title": title, "link": link, "publishedAt": date, "source": fallback_source})

    return entries


def match_keywords(text: str, mapping: dict[str, list[str]]) -> tuple[list[str], int]:
    hits: list[str] = []
    total_matches = 0
    lower = text.lower()
    for key, words in mapping.items():
        for word in words:
            if re.search(r"\\b" + re.escape(word.lower()) + r"\\b", lower):
                hits.append(key)
                total_matches += 1
                break
    return hits, total_matches


def normalize_date(raw: str) -> str:
    if not raw:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return raw[:10]


def fetch_feed(url: str, timeout: int) -> str:
    req = Request(url, headers={"User-Agent": "stochstack-vendor-radar/1.0"})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def build_signals(manifest: dict[str, Any], timeout: int, limit_per_feed: int) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []
    feeds = manifest.get("feeds", [])
    scenario_keywords = manifest.get("scenarioKeywords", {})
    tech_keywords = manifest.get("technologyKeywords", {})

    for feed in feeds:
        name = feed.get("name", "feed")
        url = feed.get("url", "")
        kind = feed.get("kind", "vendor_update")
        if not url:
            continue

        try:
            xml_text = fetch_feed(url, timeout)
            entries = parse_feed(xml_text, name)[:limit_per_feed]
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] failed to fetch {name}: {exc}", file=sys.stderr)
            continue

        for idx, item in enumerate(entries):
            text = f"{item['title']} {item.get('source', '')}"
            scenarios, scenario_hit_count = match_keywords(text, scenario_keywords)
            technologies, tech_hit_count = match_keywords(text, tech_keywords)
            raw_score = scenario_hit_count * 0.12 + tech_hit_count * 0.1
            confidence = max(0.45, min(0.98, raw_score))
            if not scenarios:
                scenarios = ["portfolio-control-tower"]
                confidence = max(0.45, confidence - 0.1)
            if not technologies:
                technologies = ["Machine Learning"]
                confidence = max(0.45, confidence - 0.08)

            signals.append(
                {
                    "id": f"{name.lower().replace(' ', '-')}-{idx}",
                    "title": item["title"],
                    "source": item.get("source", name),
                    "publishedAt": normalize_date(item.get("publishedAt", "")),
                    "link": item.get("link", ""),
                    "scenarios": scenarios,
                    "technologies": technologies,
                    "kind": kind,
                    "classificationConfidence": round(confidence, 2),
                }
            )

    signals.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
    return signals


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync vendor/literature AI signals for radar prototype")
    parser.add_argument("--manifest", default="src/content/vendor-intelligence/source-manifest.json")
    parser.add_argument("--output", default="runtime-data/vendor-intelligence/signals.json")
    parser.add_argument("--timeout", type=int, default=12)
    parser.add_argument("--limit-per-feed", type=int, default=8)
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    output_path = Path(args.output)

    manifest = read_json(manifest_path)
    signals = build_signals(manifest, timeout=args.timeout, limit_per_feed=args.limit_per_feed)

    if not signals and output_path.exists():
        existing = read_json(output_path)
        existing_items = existing.get("items", []) if isinstance(existing, dict) else []
        if existing_items:
            payload = {
                "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "items": existing_items,
            }
            output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"[WARN] no fresh signals fetched; preserved {len(existing_items)} existing signals")
            return 0

    payload = {
        "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "items": signals,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] wrote {len(signals)} signals to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
