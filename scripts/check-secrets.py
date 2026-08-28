#!/usr/bin/env python3
"""Fail safely when tracked files contain high-confidence credential material.

The scanner reports only rule names and file locations. It never prints the
matching value, which prevents CI logs from becoming another disclosure path.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_TEXT_FILE_BYTES = 2_000_000

SKIP_SUFFIXES = {
    ".avif",
    ".gif",
    ".ico",
    ".jpeg",
    ".jpg",
    ".lock",
    ".pdf",
    ".png",
    ".svg",
    ".ttf",
    ".webp",
    ".woff",
    ".woff2",
    ".zip",
}

ALLOWLISTED_FILES = {
    ".env.example",
    ".project-config.example.json",
}

PLACEHOLDER_MARKERS = {
    "changeme",
    "dummy",
    "example",
    "placeholder",
    "replace_me",
    "replace-with",
    "test_value",
    "your_",
    "<",
    "${",
}

PATTERNS = (
    (
        "private-key-material",
        re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    ),
    (
        "aws-access-key-id",
        re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    ),
    (
        "provider-token",
        re.compile(
            r"\b(?:sk|re|pat-na\d+|xkeysib|xsmtpsib|smk|key)"
            r"[-_][A-Za-z0-9_./+=-]{20,}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "meta-access-token",
        re.compile(r"\bEAA[A-Za-z0-9]{40,}\b"),
    ),
    (
        "credential-in-url",
        re.compile(r"\b[a-z][a-z0-9+.-]*://[^\s/:]+:[^\s/@]+@", re.IGNORECASE),
    ),
    (
        "secret-assignment",
        re.compile(
            r"(?i)(?:api[_-]?key|access[_-]?token|client[_-]?secret|"
            r"private[_-]?key|secret[_-]?key|webhook[_-]?secret|"
            r"jwt[_-]?secret|app[_-]?password|database[_-]?url|password)"
            r"[\"']?\s*(?:=|:)\s*[\"']([^\"'\s]{16,})"
        ),
    ),
)


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [ROOT / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def is_placeholder(value: str) -> bool:
    lowered = value.lower()
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def scan_file(path: Path) -> list[tuple[int, str]]:
    if path.suffix.lower() in SKIP_SUFFIXES or not path.is_file():
        return []
    if path.stat().st_size > MAX_TEXT_FILE_BYTES:
        return []

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return []

    findings: list[tuple[int, str]] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        for rule_name, pattern in PATTERNS:
            match = pattern.search(line)
            if not match:
                continue

            captured = match.group(1) if match.lastindex else match.group(0)
            relative = path.relative_to(ROOT).as_posix()
            if relative in ALLOWLISTED_FILES and is_placeholder(captured):
                continue
            if is_placeholder(captured):
                continue
            findings.append((line_number, rule_name))
    return findings


def main() -> int:
    findings: list[tuple[str, int, str]] = []
    for path in tracked_files():
        relative = path.relative_to(ROOT).as_posix()
        for line_number, rule_name in scan_file(path):
            findings.append((relative, line_number, rule_name))

    if findings:
        print("Potential committed credentials detected. Values are intentionally hidden.")
        for relative, line_number, rule_name in findings:
            print(f"- {relative}:{line_number} [{rule_name}]")
        print("Move secrets to the deployment secret store and commit placeholders only.")
        return 1

    print("Secret scan passed: no high-confidence credential material found in tracked files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
