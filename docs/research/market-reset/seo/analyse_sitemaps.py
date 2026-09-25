#!/usr/bin/env python3
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

import requests

ROOT = Path(__file__).resolve().parent
COMPETITORS = ROOT / "competitors"
TABLES = ROOT / "tables"
TABLES.mkdir(parents=True, exist_ok=True)
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def xml_urls(path: Path) -> list[str]:
    root = ET.fromstring(path.read_bytes())
    return [node.text.strip() for node in root.findall(".//sm:url/sm:loc", NS) if node.text]


def fetch_buildxact_children() -> list[str]:
    index_path = COMPETITORS / "buildxact-au-sitemap-index.xml"
    root = ET.fromstring(index_path.read_bytes())
    child_urls = [node.text.strip() for node in root.findall(".//sm:sitemap/sm:loc", NS) if node.text]
    urls: list[str] = []
    for child_url in child_urls:
        name = urlparse(child_url).path.strip("/").replace("/", "-")
        target = COMPETITORS / f"buildxact-au-{name}"
        if not target.exists():
            response = requests.get(child_url, timeout=30, headers={"User-Agent": "KindAI-research/1.0"})
            response.raise_for_status()
            target.write_bytes(response.content)
        urls.extend(xml_urls(target))
    return sorted(set(urls))


def classify(url: str) -> str:
    path = urlparse(url).path.lower().strip("/")
    if not path:
        return "Homepage"
    if path.startswith("glossary/") or path.startswith("letter/"):
        return "Glossary / definitions"
    if any(token in path for token in ["blog/", "news-2d-takeoff/", "category/"]):
        return "Editorial / learning"
    if any(token in path for token in ["case-stud", "customer-stor"]):
        return "Case studies"
    if any(token in path for token in ["integration", "partner"]):
        return "Integrations / partners"
    if any(token in path for token in ["compare", "-vs-"]):
        return "Comparison"
    if any(token in path for token in ["pricing", "signup", "demo", "contact"]):
        return "Commercial conversion"
    if any(token in path for token in ["trade", "estimating-software/", "solutions/", "industr"]):
        return "Trade / use-case landing"
    if any(token in path for token in ["feature", "takeoff", "estimate", "measurement", "count-assist", "plan-"]):
        return "Product / feature"
    if any(token in path for token in ["support", "training", "faq", "getting-started", "education"]):
        return "Help / education"
    return "Other public page"


def main() -> None:
    datasets = {
        "Buildxact AU": fetch_buildxact_children(),
        "Groundplan": xml_urls(COMPETITORS / "groundplan-com-sitemap.xml"),
        "Kreo": xml_urls(COMPETITORS / "kreo-net-sitemap.xml"),
        "KindAI intended": xml_urls(ROOT.parent.parent.parent.parent / "client/public/sitemap.xml"),
    }

    footprint_rows = []
    mix_rows = []
    for domain, urls in datasets.items():
        counts = Counter(classify(url) for url in urls)
        footprint_rows.append({"domain": domain, "public_urls": len(urls)})
        for page_type, count in sorted(counts.items()):
            mix_rows.append({
                "domain": domain,
                "page_type": page_type,
                "urls": count,
                "share_pct": round(count / len(urls) * 100, 1) if urls else 0,
            })

    with (TABLES / "sitemap_footprint.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["domain", "public_urls"])
        writer.writeheader()
        writer.writerows(footprint_rows)

    with (TABLES / "sitemap_content_mix.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["domain", "page_type", "urls", "share_pct"])
        writer.writeheader()
        writer.writerows(mix_rows)

    print("Sitemap footprint")
    for row in footprint_rows:
        print(f"{row['domain']}: {row['public_urls']}")
    print(f"Wrote {TABLES / 'sitemap_footprint.csv'}")
    print(f"Wrote {TABLES / 'sitemap_content_mix.csv'}")


if __name__ == "__main__":
    main()
