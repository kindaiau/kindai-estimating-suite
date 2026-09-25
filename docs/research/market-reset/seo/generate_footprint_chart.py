#!/usr/bin/env python3
from pathlib import Path
import csv

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
charts = ROOT / "charts"
charts.mkdir(parents=True, exist_ok=True)


def finish(fig, ax, output: Path, note: str) -> None:
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.grid(axis="y", color="#E5E7EB", linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(axis="x", labelrotation=10)
    ax.text(0, -0.20, note, transform=ax.transAxes, fontsize=8.5, color="#6B7280")
    plt.tight_layout()
    plt.savefig(output, bbox_inches="tight")
    plt.close(fig)
    print(output)


with (ROOT / "tables/sitemap_footprint.csv").open() as handle:
    footprint_rows = list(csv.DictReader(handle))

labels = [row["domain"] for row in footprint_rows]
values = [int(row["public_urls"]) for row in footprint_rows]
colors = ["#F97316", "#2563EB", "#7C3AED", "#EC4899"]
fig, ax = plt.subplots(figsize=(9.6, 5.4), dpi=160)
fig.patch.set_facecolor("white")
bars = ax.bar(labels, values, color=colors, width=0.62)
ax.set_title("Public URLs declared in competitor sitemaps", loc="left", fontsize=16, fontweight="bold", pad=18)
ax.set_ylabel("Declared public URLs")
for bar, value in zip(bars, values):
    ax.text(bar.get_x() + bar.get_width() / 2, value + max(values) * 0.015, f"{value:,}", ha="center", va="bottom", fontsize=10, fontweight="bold")
finish(fig, ax, charts / "competitor_sitemap_footprint.png", "Source: public XML sitemaps captured 26 September 2026. URL count measures content footprint, not traffic or ranking.")

with (ROOT / "tables/sitemap_content_mix.csv").open() as handle:
    mix_rows = list(csv.DictReader(handle))
lookup = {(row["domain"], row["page_type"]): int(row["urls"]) for row in mix_rows}
competitors = ["Buildxact AU", "Groundplan", "Kreo"]

series = [
    ("Editorial / learning", "#2563EB"),
    ("Trade / use-case landing", "#F97316"),
    ("Product / feature", "#EC4899"),
]
x = list(range(len(competitors)))
width = 0.24
fig, ax = plt.subplots(figsize=(9.6, 5.4), dpi=160)
fig.patch.set_facecolor("white")
for index, (page_type, color) in enumerate(series):
    vals = [lookup.get((domain, page_type), 0) for domain in competitors]
    offset = [(position + (index - 1) * width) for position in x]
    ax.bar(offset, vals, width=width, label=page_type, color=color)
ax.set_xticks(x, competitors)
ax.set_title("Declared discovery pages by commercial topic", loc="left", fontsize=16, fontweight="bold", pad=18)
ax.set_ylabel("Declared public URLs")
ax.legend(frameon=False, ncols=3, fontsize=8, loc="upper right")
finish(fig, ax, charts / "competitor_content_mix.png", "Source: normalized public sitemap classification. Counts do not measure page quality, indexation or traffic.")

series = [
    ("Integrations / partners", "#10B981"),
    ("Case studies", "#7C3AED"),
    ("Commercial conversion", "#F59E0B"),
]
fig, ax = plt.subplots(figsize=(9.6, 5.4), dpi=160)
fig.patch.set_facecolor("white")
for index, (page_type, color) in enumerate(series):
    vals = [lookup.get((domain, page_type), 0) for domain in competitors]
    offset = [(position + (index - 1) * width) for position in x]
    ax.bar(offset, vals, width=width, label=page_type, color=color)
ax.set_xticks(x, competitors)
ax.set_title("Declared ecosystem, proof and conversion pages", loc="left", fontsize=16, fontweight="bold", pad=18)
ax.set_ylabel("Declared public URLs")
ax.legend(frameon=False, ncols=3, fontsize=8, loc="upper right")
finish(fig, ax, charts / "competitor_commercial_surface.png", "Source: normalized public sitemap classification. Page presence does not prove backlinks or conversion performance.")
