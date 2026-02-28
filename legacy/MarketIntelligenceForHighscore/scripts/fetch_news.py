#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.error import HTTPError, URLError

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PROJECTS_FILE = DATA_DIR / "projects.json"
OUTPUT_FILE = DATA_DIR / "latest_signals.json"
DIGEST_FILE = DATA_DIR / "daily_digest.json"

TOPICS = {
    "related_projects": "sponsor related clinical development project",
    "technology_platform": "technology platform AI data platform",
    "vendors": "vendor CRO software provider",
    "outcomes": "outcome efficiency timeline cost reduction",
    "partnerships": "partnership collaboration alliance",
    "tech_companies": "technology company startup biotech software",
    "consulting_reports": "consulting report benchmark maturity",
    "academic_literature": "academic paper case study",
    "tech_giants_watch": "OpenAI OR Anthropic OR AWS OR IBM OR Microsoft OR Google clinical trial AI platform",
}

KEYWORD_BONUS = {
    "ai": 0.07,
    "platform": 0.05,
    "clinical": 0.05,
    "trial": 0.05,
    "vendor": 0.04,
    "sponsor": 0.04,
}

WATCHLIST_COMPANIES = {
    "OpenAI": ["openai"],
    "Anthropic": ["anthropic"],
    "AWS": ["aws", "amazon web services"],
    "IBM": ["ibm", "watsonx"],
    "Microsoft": ["microsoft", "azure"],
    "Google": ["google", "google cloud", "vertex ai"],
}

PROVIDER_BUILDERS = {
    "google": lambda encoded_query: (
        f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    ),
    "bing": lambda encoded_query: (
        f"https://www.bing.com/news/search?q={encoded_query}&format=rss&setlang=en-US"
    ),
}


def load_projects():
    with PROJECTS_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_previous_signals():
    if not OUTPUT_FILE.exists():
        return []
    try:
        with OUTPUT_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def parse_rss(url, timeout=8):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        data = response.read()
    root = ET.fromstring(data)
    channel = root.find("channel")
    if channel is None:
        return []
    items = []
    for item in channel.findall("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        description = (item.findtext("description") or "").strip()
        source_el = item.find("source")
        source = (
            (source_el.text or "").strip()
            if source_el is not None and source_el.text
            else "Unknown"
        )
        items.append(
            {
                "title": title,
                "link": link,
                "published_at": normalize_date(pub_date),
                "summary": strip_html(description)[:360],
                "source": source,
            }
        )
    return items


def normalize_date(raw):
    if not raw:
        return dt.date.today().isoformat()

    fmts = [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
    ]
    for fmt in fmts:
        try:
            parsed = dt.datetime.strptime(raw, fmt)
            return parsed.date().isoformat()
        except ValueError:
            continue
    return dt.date.today().isoformat()


def strip_html(text):
    return re.sub(r"<[^>]+>", "", text).strip()


def extract_entities(text):
    words = re.findall(r"\b[A-Z][A-Za-z0-9&.-]{2,}\b", text)
    deduped = []
    for w in words:
        if w not in deduped:
            deduped.append(w)
    return deduped[:8]


def detect_watchlist_mentions(text):
    lowered = text.lower()
    hits = []
    for company, patterns in WATCHLIST_COMPANIES.items():
        if any(p in lowered for p in patterns):
            hits.append(company)
    return hits


def score_signal(title, summary, project_keywords):
    text = f"{title} {summary}".lower()
    score = 0.55
    for kw in project_keywords:
        if kw.lower() in text:
            score += 0.08
    for token, bonus in KEYWORD_BONUS.items():
        if token in text:
            score += bonus
    if detect_watchlist_mentions(text):
        score += 0.06
    return min(round(score, 2), 0.99)


def build_query(project_keywords, topic_hint):
    query = f"({' OR '.join(project_keywords[:3])}) {topic_hint}"
    return urllib.parse.quote(query)


def to_signal(item, project, topic):
    watch_hits = detect_watchlist_mentions(f"{item['title']} {item['summary']}")
    digest = hashlib.md5(
        f"{item['link']}|{project['id']}|{topic}".encode("utf-8")
    ).hexdigest()[:12]
    tags = project["keywords"][:2] + [topic.replace("_", " ")]
    if watch_hits:
        tags.extend([f"watch:{c}" for c in watch_hits])

    return {
        "id": digest,
        "project_id": project["id"],
        "topic": topic,
        "title": item["title"],
        "summary": item["summary"],
        "source": item["source"],
        "published_at": item["published_at"],
        "link": item["link"],
        "entities": extract_entities(f"{item['title']} {item['summary']}"),
        "watchlist_hits": watch_hits,
        "tags": tags,
        "relevance_score": score_signal(item["title"], item["summary"], project["keywords"]),
    }


def collect(limit_per_topic=2, timeout=8, max_requests=None, verbose=False, providers=None):
    projects = load_projects()
    seen = set()
    signals = []
    attempted = 0
    failed = 0
    total_steps = len(projects) * len(TOPICS)
    active_providers = providers or ["google", "bing"]

    for p_idx, project in enumerate(projects, start=1):
        for t_idx, (topic, hint) in enumerate(TOPICS.items(), start=1):
            if max_requests is not None and attempted >= max_requests:
                if verbose:
                    print(f"[stop] reached max_requests={max_requests}", flush=True)
                signals.sort(key=lambda x: (x["published_at"], x["relevance_score"]), reverse=True)
                return signals, attempted, failed

            attempted += 1
            step = (p_idx - 1) * len(TOPICS) + t_idx
            if verbose:
                print(
                    f"[{step}/{total_steps}] {project['id']} -> {topic} (attempt {attempted})",
                    flush=True,
                )

            q = build_query(project["keywords"], hint)
            items = []
            provider_ok = None
            for provider in active_providers:
                builder = PROVIDER_BUILDERS.get(provider)
                if builder is None:
                    continue
                rss_url = builder(q)
                try:
                    items = parse_rss(rss_url, timeout=timeout)
                    provider_ok = provider
                    break
                except (URLError, HTTPError, TimeoutError, ET.ParseError):
                    if verbose:
                        print(f"  ! provider={provider} failed", flush=True)

            if provider_ok is None:
                failed += 1
                if verbose:
                    print(f"  ! all providers failed for topic={topic}", flush=True)
                continue

            count = 0
            for item in items:
                key = item["link"]
                if not key or key in seen:
                    continue
                seen.add(key)
                signals.append(to_signal(item, project, topic))
                count += 1
                if count >= limit_per_topic:
                    break

            if verbose:
                print(f"  + provider={provider_ok}, kept {count} items", flush=True)

    signals.sort(key=lambda x: (x["published_at"], x["relevance_score"]), reverse=True)
    return signals, attempted, failed


def make_digest(current_signals, previous_signals, attempted, failed, providers):
    now = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    today = dt.date.today().isoformat()
    prev_ids = {s.get("id") for s in previous_signals}
    new_signals = [s for s in current_signals if s.get("id") not in prev_ids]
    today_signals = [s for s in current_signals if s.get("published_at") == today]

    watch_count = {k: 0 for k in WATCHLIST_COMPANIES.keys()}
    watch_new_count = {k: 0 for k in WATCHLIST_COMPANIES.keys()}

    for item in current_signals:
        for company in item.get("watchlist_hits", []):
            if company in watch_count:
                watch_count[company] += 1

    new_ids = {s.get("id") for s in new_signals}
    for item in current_signals:
        if item.get("id") not in new_ids:
            continue
        for company in item.get("watchlist_hits", []):
            if company in watch_new_count:
                watch_new_count[company] += 1

    watch_highlights = [
        {
            "title": s.get("title"),
            "project_id": s.get("project_id"),
            "published_at": s.get("published_at"),
            "source": s.get("source"),
            "link": s.get("link"),
            "companies": s.get("watchlist_hits", []),
        }
        for s in current_signals
        if s.get("watchlist_hits")
    ][:12]

    return {
        "updated_at": now,
        "today": today,
        "total_signals": len(current_signals),
        "new_since_last_run": len(new_signals),
        "new_published_today": len(today_signals),
        "pipeline": {
            "attempted_requests": attempted,
            "failed_requests": failed,
            "providers": providers,
        },
        "watchlist": {
            "companies": list(WATCHLIST_COMPANIES.keys()),
            "total_hits": sum(watch_count.values()),
            "hit_breakdown": watch_count,
            "new_hit_breakdown": watch_new_count,
            "highlights": watch_highlights,
        },
        "new_items": [
            {
                "title": s.get("title"),
                "project_id": s.get("project_id"),
                "published_at": s.get("published_at"),
                "source": s.get("source"),
                "link": s.get("link"),
            }
            for s in new_signals[:15]
        ],
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Fetch clinical intelligence signals from RSS.")
    parser.add_argument("--limit-per-topic", type=int, default=2, help="Max items kept per topic.")
    parser.add_argument("--timeout", type=int, default=8, help="Per-request timeout in seconds.")
    parser.add_argument("--max-requests", type=int, default=None, help="Cap number of topic requests.")
    parser.add_argument(
        "--providers",
        type=str,
        default="google,bing",
        help="Comma-separated provider list (supported: google,bing).",
    )
    parser.add_argument("--verbose", action="store_true", help="Show progress logs.")
    return parser.parse_args()


def main():
    args = parse_args()
    providers = [x.strip().lower() for x in args.providers.split(",") if x.strip()]

    previous = load_previous_signals()
    signals, attempted, failed = collect(
        limit_per_topic=args.limit_per_topic,
        timeout=args.timeout,
        max_requests=args.max_requests,
        verbose=args.verbose,
        providers=providers,
    )

    digest = make_digest(signals, previous, attempted, failed, providers)

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(signals, f, ensure_ascii=False, indent=2)

    with DIGEST_FILE.open("w", encoding="utf-8") as f:
        json.dump(digest, f, ensure_ascii=False, indent=2)

    print(
        f"wrote {len(signals)} signals to {OUTPUT_FILE} "
        f"(attempted={attempted}, failed={failed}, timeout={args.timeout}s)"
    )
    print(
        f"daily digest: new_since_last_run={digest['new_since_last_run']}, "
        f"watch_hits={digest['watchlist']['total_hits']} -> {DIGEST_FILE}"
    )


if __name__ == "__main__":
    main()
