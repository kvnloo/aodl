#!/usr/bin/env python3
"""Build language/ for every origin branch into site/ for GitHub Pages.

main  → site/                    https://kvnloo.github.io/aodl/
other → site/preview/<slug>/     https://kvnloo.github.io/aodl/preview/<slug>/

Usage:
  python3 scripts/build-pages.py
  python3 scripts/build-pages.py --current-only
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO_BASE = "/aodl/"
SKIP_BRANCHES = {"gh-pages", "HEAD", "origin"}


def run(cmd: list[str], cwd: Path | None = None, env: dict[str, str] | None = None) -> str:
    proc = subprocess.run(cmd, cwd=cwd, env=env, text=True, capture_output=True)
    if proc.returncode != 0:
        sys.stderr.write(proc.stdout)
        sys.stderr.write(proc.stderr)
        raise SystemExit(f"command failed ({proc.returncode}): {' '.join(cmd)}")
    return proc.stdout


def slug(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "--", name).strip("-._") or "unnamed"


def git_sha(ref: str) -> str | None:
    proc = subprocess.run(
        ["git", "rev-parse", "--verify", "--short", ref],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        return None
    return proc.stdout.strip()


def origin_branches() -> list[str]:
    out = run(
        ["git", "for-each-ref", "--format=%(refname:lstrip=3)", "refs/remotes/origin"],
        cwd=ROOT,
    )
    names: list[str] = []
    for short in out.splitlines():
        name = short.strip()
        if not name or name in SKIP_BRANCHES:
            continue
        if git_sha(f"origin/{name}") is None:
            print(f"skip {name}: origin/{name} is not a commit")
            continue
        names.append(name)
    return sorted(set(names), key=lambda n: (n != "main", n))


def current_branch() -> str:
    name = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT).strip()
    return "main" if name == "HEAD" else name


def bun() -> str:
    path = shutil.which("bun")
    if not path:
        raise SystemExit("bun is required to build language/")
    return path


def vite_build(src: Path, dest: Path, *, base: str, branch: str, sha: str) -> bool:
    lang = src / "language"
    if not (lang / "package.json").exists():
        print(f"skip {branch}: no language/package.json")
        return False
    env = os.environ.copy()
    env["BASE_PATH"] = base
    env["VITE_AODL_BRANCH"] = branch
    env["VITE_AODL_SHA"] = sha
    bun_bin = bun()
    run([bun_bin, "install"], cwd=lang, env=env)
    run([bun_bin, "run", "build"], cwd=lang, env=env)
    dist = lang / "dist"
    if not dist.is_dir():
        raise SystemExit(f"{branch}: language/dist missing after build")
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(dist, dest)
    print(f"ok   {branch} @ {sha} → {dest}  base={base}")
    return True


def write_preview_index(site: Path, built: list[dict[str, str]]) -> None:
    preview = site / "preview"
    preview.mkdir(parents=True, exist_ok=True)
    rows = []
    for row in built:
        rows.append(
            f'<li><a href="{row["url"]}">{row["branch"]}</a> <code>{row["sha"]}</code></li>'
        )
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>AODL language previews</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  :root {{ color-scheme: dark; --bg:#0c1210; --ink:#e7efe4; --muted:#9ca39a; --gold:#e6b86f; }}
  html,body {{ margin:0; background:var(--bg); color:var(--ink);
    font-family: ui-sans-serif, system-ui, sans-serif; }}
  main {{ max-width: 40rem; padding: 40px 28px; }}
  h1 {{ font-weight: 500; }}
  a {{ color: var(--gold); }}
  code {{ color: var(--muted); font-size: 12px; }}
  li {{ margin: 8px 0; }}
</style>
</head>
<body>
<main>
  <h1>AODL language catalog</h1>
  <p>Main is the default branch. Other git branches deploy under <code>/preview/&lt;branch&gt;/</code>.</p>
  <ul>
    {''.join(rows)}
  </ul>
</main>
</body>
</html>
"""
    (preview / "index.html").write_text(html)
    (site / "versions.json").write_text(json.dumps({"built": built}, indent=2) + "\n")


def assemble(site: Path, artifacts: list[tuple[str, Path, str, str]]) -> list[dict[str, str]]:
    if site.exists():
        shutil.rmtree(site)
    site.mkdir()
    (site / ".nojekyll").write_text("")
    built: list[dict[str, str]] = []
    for branch, dist, sha, base in artifacts:
        if branch == "main":
            dest = site
            for item in dist.iterdir():
                target = dest / item.name
                if item.is_dir():
                    shutil.copytree(item, target)
                else:
                    shutil.copy2(item, target)
        else:
            dest = site / "preview" / slug(branch)
            shutil.copytree(dist, dest)
        built.append({"branch": branch, "sha": sha, "url": base})
    write_preview_index(site, built)
    return built


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--current-only", action="store_true")
    args = parser.parse_args(argv[1:])
    bun()

    if args.current_only:
        jobs = [(current_branch(), "HEAD")]
    else:
        jobs = [(name, f"origin/{name}") for name in origin_branches()]
        if not jobs:
            jobs = [(current_branch(), "HEAD")]

    artifacts: list[tuple[str, Path, str, str]] = []
    scratch = Path(tempfile.mkdtemp(prefix="aodl-pages-"))
    try:
        for branch, ref in jobs:
            sha = git_sha(ref) or git_sha("HEAD")
            if not sha:
                print(f"skip {branch}: no sha for {ref}")
                continue
            base = REPO_BASE if branch == "main" else f"{REPO_BASE}preview/{slug(branch)}/"
            dist = scratch / slug(branch)
            if ref == "HEAD":
                ok = vite_build(ROOT, dist, base=base, branch=branch, sha=sha)
            else:
                work = scratch / f"wt-{slug(branch)}"
                run(["git", "worktree", "add", "--detach", str(work), ref], cwd=ROOT)
                try:
                    ok = vite_build(work, dist, base=base, branch=branch, sha=sha)
                finally:
                    run(["git", "worktree", "remove", "--force", str(work)], cwd=ROOT)
            if ok:
                artifacts.append((branch, dist, sha, base))
        built = assemble(ROOT / "site", artifacts)
    finally:
        shutil.rmtree(scratch, ignore_errors=True)

    print(f"{len(built)} catalog(s) in site/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
