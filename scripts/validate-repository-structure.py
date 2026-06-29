#!/usr/bin/env python3
"""Waliduje strukturę repozytorium i ścieżki po reorganizacji."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse


REPO_ROOT = Path(__file__).resolve().parent.parent

ALLOWED_ROOT_FILES = {
    ".gitignore",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "LICENSE",
    "README.md",
    "index.html",
    "manifest.json",
    "offline.html",
    "package-lock.json",
    "package.json",
    "playwright.config.js",
    "sw.js",
}

REQUIRED_PATHS = {
    "assets/css/font-size-config.css",
    "assets/css/styles.css",
    "data/pam-wiki-config.json",
    "data/quiz-questions.json",
    "data/students-data.json",
    "database/supabase-project-teams.sql",
    "docs/supabase-setup.md",
    "pages/community/studenci.html",
    "pages/exams/test.html",
    "pages/exams/zal.html",
    "pages/exams/zal_sesje.html",
    "pages/guides/obrona_projektu.html",
    "pages/guides/pierwsza-aplikacja.html",
    "pages/guides/projektowanie-aplikacji.html",
    "src/entries/dev-mode.js",
    "src/entries/pam-files.js",
    "src/entries/pam-wiki.js",
    "src/entries/quiz-module.js",
    "src/fragments/logo.html",
}

LEGACY_ROOT_FILES = {
    "analiza.pdf",
    "dev-mode.js",
    "fix_liquid_jsx.py",
    "font-size-config.css",
    "logo.html",
    "obrona_projektu.html",
    "pam-files.js",
    "pam-wiki-config.json",
    "pam-wiki.js",
    "pierwsza-aplikacja.html",
    "projektowanie-aplikacji.html",
    "quiz-module.js",
    "quiz-questions.json",
    "students-data.json",
    "studenci.html",
    "styles.css",
    "supabase-project-teams.sql",
    "supabase-setup.md",
    "sw-manual-checklist.md",
    "test.html",
    "zal.html",
    "zal_sesje.html",
}

PUBLIC_HTML = {
    "index.html",
    "pages/community/studenci.html",
    "pages/exams/test.html",
    "pages/exams/zal.html",
    "pages/exams/zal_sesje.html",
    "pages/guides/obrona_projektu.html",
    "pages/guides/pierwsza-aplikacja.html",
    "pages/guides/projektowanie-aplikacji.html",
}

DEPLOYMENT_PREFIXES = ("", "MobileHub/")


class LocalLinkParser(HTMLParser):
    """Zbiera lokalne odwołania HTML z uwzględnieniem elementu base."""

    def __init__(self, document_url: str) -> None:
        super().__init__()
        self.base_url = document_url
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "base" and values.get("href"):
            self.base_url = urljoin(self.base_url, values["href"])
            return

        for attribute in ("href", "src", "data-src"):
            value = values.get(attribute)
            if value:
                self.references.append((attribute, urljoin(self.base_url, value)))


def add_error(errors: list[str], message: str) -> None:
    errors.append(message)


def validate_root(errors: list[str]) -> None:
    root_files = {path.name for path in REPO_ROOT.iterdir() if path.is_file()}
    unexpected = sorted(root_files - ALLOWED_ROOT_FILES)
    missing = sorted(ALLOWED_ROOT_FILES - root_files)

    for name in unexpected:
        add_error(errors, f"Niedozwolony plik w katalogu głównym: {name}")
    for name in missing:
        add_error(errors, f"Brak wymaganego pliku głównego: {name}")
    for name in sorted(LEGACY_ROOT_FILES & root_files):
        add_error(errors, f"Plik powinien pozostać poza katalogiem głównym: {name}")


def validate_required_paths(errors: list[str]) -> None:
    for relative_path in sorted(REQUIRED_PATHS):
        if not (REPO_ROOT / relative_path).is_file():
            add_error(errors, f"Brak pliku po reorganizacji: {relative_path}")


def validate_json(errors: list[str]) -> None:
    for relative_path in (
        "data/pam-wiki-config.json",
        "data/quiz-questions.json",
        "data/students-data.json",
        "manifest.json",
    ):
        try:
            with (REPO_ROOT / relative_path).open(encoding="utf-8") as stream:
                json.load(stream)
        except (OSError, json.JSONDecodeError) as error:
            add_error(errors, f"Niepoprawny JSON {relative_path}: {error}")


def repository_path_from_url(url: str, prefix: str) -> str | None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or parsed.netloc != "example.test":
        return None

    prefix_path = f"/{prefix}"
    if not parsed.path.startswith(prefix_path):
        return "__outside__"

    return parsed.path[len(prefix_path):].lstrip("/")


def validate_html_links(errors: list[str]) -> None:
    ignored_prefixes = ("#", "about:", "data:", "javascript:", "mailto:", "tel:")

    for prefix in DEPLOYMENT_PREFIXES:
        for relative_path in sorted(PUBLIC_HTML):
            source = REPO_ROOT / relative_path
            document_url = f"https://example.test/{prefix}{relative_path}"
            parser = LocalLinkParser(document_url)
            parser.feed(source.read_text(encoding="utf-8"))

            for attribute, resolved_url in parser.references:
                raw = urlparse(resolved_url)
                if resolved_url.startswith(ignored_prefixes) or raw.netloc not in ("", "example.test"):
                    continue

                repository_path = repository_path_from_url(resolved_url, prefix)
                if repository_path == "__outside__":
                    add_error(
                        errors,
                        f"Odwołanie wychodzi poza prefiks /{prefix}: "
                        f"{relative_path} [{attribute}] -> {resolved_url}",
                    )
                elif repository_path and not (REPO_ROOT / repository_path).exists():
                    add_error(
                        errors,
                        f"Nieistniejące odwołanie dla /{prefix}: "
                        f"{relative_path} [{attribute}] -> {repository_path}",
                    )


def validate_css_urls(errors: list[str]) -> None:
    pattern = re.compile(r"url\(\s*['\"]?([^)'\"]+)")
    for source in (REPO_ROOT / "assets/css").glob("*.css"):
        for value in pattern.findall(source.read_text(encoding="utf-8")):
            if value.startswith(("data:", "http:", "https:", "#")):
                continue
            target = (source.parent / urlparse(value).path).resolve()
            if not target.exists():
                add_error(
                    errors,
                    f"Nieistniejący zasób CSS: {source.relative_to(REPO_ROOT)} -> {value}",
                )


def validate_js_imports(errors: list[str]) -> None:
    pattern = re.compile(
        r"^\s*import(?:[\s\S]*?from\s*)?['\"]([^'\"]+)['\"]",
        re.MULTILINE,
    )
    for source in (REPO_ROOT / "src").rglob("*.js"):
        for specifier in pattern.findall(source.read_text(encoding="utf-8")):
            if not specifier.startswith("."):
                continue
            target = (source.parent / specifier).resolve()
            if not target.exists():
                add_error(
                    errors,
                    f"Nieistniejący import JS: {source.relative_to(REPO_ROOT)} -> {specifier}",
                )


def validate_service_worker_assets(errors: list[str]) -> None:
    source = (REPO_ROOT / "sw.js").read_text(encoding="utf-8")
    assets_match = re.search(
        r"const ASSETS_TO_CACHE = \[(.*?)\];",
        source,
        flags=re.DOTALL,
    )
    if not assets_match:
        add_error(errors, "Nie znaleziono ASSETS_TO_CACHE w sw.js.")
        return

    for asset in re.findall(r"['\"]\./([^'\"]+)['\"]", assets_match.group(1)):
        if not (REPO_ROOT / asset).exists():
            add_error(errors, f"Nieistniejący zasób precache w sw.js: {asset}")


def main() -> int:
    errors: list[str] = []

    validate_root(errors)
    validate_required_paths(errors)
    validate_json(errors)
    validate_html_links(errors)
    validate_css_urls(errors)
    validate_js_imports(errors)
    validate_service_worker_assets(errors)

    if errors:
        print("Błędy stabilizacji struktury repozytorium:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        "Struktura repozytorium jest poprawna. "
        "Sprawdzono katalog główny, JSON, importy oraz ścieżki dla / i /MobileHub/."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
