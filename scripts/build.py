#!/usr/bin/env python3
"""Build auditable progress data from the journal.

Source of truth:
  data/tracks.json   - curriculum, module XP, level thresholds, XP rules
  journal/*.md       - dated posts with frontmatter and evidence links
  GitHub API         - optional commit XP from the configured learning repos

Output (committed to the repo, so the dashboard is public and verifiable):
  data/progress.json - totals, levels, streaks, per-track progress, badges
  data/posts.json    - post metadata + markdown body for the journal renderer

A post only earns XP when it carries an evidence URL. No receipt, no points.
"""
import json
import re
import sys
import urllib.request
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACKS_FILE = ROOT / "data" / "tracks.json"
JOURNAL = ROOT / "journal"
OUT = ROOT / "data"


def parse_frontmatter(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    head = text[3:end].strip()
    body = text[end + 4:].strip()
    meta = {}
    for line in head.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip()
    return meta, body


def split_list(value):
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def iso_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def fetch_commit_xp(config):
    """Count commits by the operator on configured repos, capped per week."""
    site = config.get("site", {})
    username = site.get("github_username")
    since = site.get("start_date")
    repos = config.get("repos", [])
    rules = config.get("commit_xp", {"per_commit": 2, "weekly_cap": 40})
    counted, weeks = 0, defaultdict(int)

    for repo in repos:
        url = (
            f"https://api.github.com/repos/{repo}/commits"
            f"?author={username}&since={since}T00:00:00Z&per_page=100"
        )
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "dotyoujee-progress-builder",
                "Accept": "application/vnd.github+json",
            })
            with urllib.request.urlopen(req, timeout=8) as response:
                commits = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            print(f"  ! commit XP skipped for {repo}: {exc}", file=sys.stderr)
            continue

        for item in commits:
            commit_date = item.get("commit", {}).get("author", {}).get("date", "")
            if not commit_date:
                continue
            day = datetime.fromisoformat(commit_date.replace("Z", "+00:00")).date()
            weeks[day.isocalendar()[:2]] += 1
            counted += 1

    xp = sum(min(n * rules.get("per_commit", 2), rules.get("weekly_cap", 40)) for n in weeks.values())
    return {"xp": xp, "commits": counted, "repos": repos}


def level_for(xp, levels):
    current = levels[0]
    nxt = None
    for idx, level in enumerate(levels):
        if xp >= level["min"]:
            current = level
            nxt = levels[idx + 1] if idx + 1 < len(levels) else None
    return current, nxt


def streak_info(post_dates):
    if not post_dates:
        return {"current": 0, "longest": 0, "last_entry": None}
    unique = sorted(set(post_dates), reverse=True)
    longest, run = 0, 1
    for i in range(1, len(unique)):
        if (unique[i - 1] - unique[i]).days == 1:
            run += 1
        else:
            longest = max(longest, run)
            run = 1
    longest = max(longest, run)

    today = date.today()
    anchor = today if unique[0] >= today else unique[0]
    if (anchor - unique[0]).days > 1:
        current = 0
    else:
        current, cursor = 0, anchor
        needed = set(unique)
        while cursor in needed:
            current += 1
            cursor -= timedelta(days=1)
    return {"current": current, "longest": longest, "last_entry": unique[0].isoformat()}


def main():
    config = json.loads(TRACKS_FILE.read_text(encoding="utf-8"))
    tracks = config["tracks"]
    rules = config["xp_rules"]
    levels = config["levels"]

    modules = {}
    for track in tracks:
        for module in track["modules"]:
            modules[module["id"]] = {**module, "track": track["id"]}

    posts = []
    for path in sorted(JOURNAL.glob("*.md")):
        if path.name.startswith("_"):
            continue
        meta, body = parse_frontmatter(path)
        if not meta or not meta.get("title"):
            print(f"  ! skipping {path.name}: no frontmatter", file=sys.stderr)
            continue
        post_type = meta.get("type", "notes").strip().lower()
        if post_type not in rules:
            post_type = "notes"
        evidence = meta.get("evidence", "").strip()
        verified = evidence.startswith("http")
        post_date = iso_date(meta.get("date"))
        if not post_date:
            print(f"  ! skipping {path.name}: bad date", file=sys.stderr)
            continue

        completed = [m for m in split_list(meta.get("completed")) if m in modules]
        xp = rules[post_type] if verified or post_type in ("meta", "notes") else 0
        posts.append({
            "slug": path.stem,
            "title": meta["title"],
            "date": post_date.isoformat(),
            "type": post_type,
            "track": meta.get("track", ""),
            "difficulty": meta.get("difficulty", ""),
            "hours": float(meta.get("hours") or 0),
            "summary": meta.get("summary", ""),
            "tags": split_list(meta.get("tags")),
            "evidence": evidence,
            "evidence_label": meta.get("evidence_label", "Evidence"),
            "verified": verified,
            "completed": completed,
            "base_xp": rules[post_type] if verified or post_type in ("meta", "notes") else 0,
            "xp": 0,  # filled below after module de-duplication
            "body": body,
        })

    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)

    # Module XP goes to the earliest verified post that claims it. Once.
    claimed = set()
    track_earned = Counter()
    by_type = Counter()
    hours = 0.0
    for post in posts:
        module_xp = 0
        for module_id in post["completed"]:
            if module_id in claimed:
                continue
            claimed.add(module_id)
            module_xp += modules[module_id]["xp"]
            track_earned[modules[module_id]["track"]] += modules[module_id]["xp"]
        post["xp"] = post["base_xp"] + module_xp
        post["module_xp"] = module_xp
        by_type[post["type"]] += 1
        hours += post["hours"]

    commits = fetch_commit_xp(config)
    total_xp = sum(p["xp"] for p in posts) + commits["xp"]
    current_level, next_level = level_for(total_xp, levels)

    track_progress = []
    for track in tracks:
        done = [m for m in track["modules"] if m["id"] in claimed]
        track_progress.append({
            "id": track["id"],
            "title": track["title"],
            "short": track["short"],
            "status": track["status"],
            "color": track["color"],
            "total": len(track["modules"]),
            "completed": len(done),
            "percent": round(len(done) / len(track["modules"]) * 100) if track["modules"] else 0,
            "xp": track_earned[track["id"]],
            "modules": [
                {**m, "done": m["id"] in claimed}
                for m in track["modules"]
            ],
        })

    badges = []
    if any(p["verified"] for p in posts):
        badges.append({"id": "first-receipt", "name": "First Receipt", "desc": "One post with a real evidence link."})
    if by_type["lab"] >= 3:
        badges.append({"id": "lab-rat", "name": "Lab Rat", "desc": "Three logged labs with evidence."})
    if by_type["ctf"] >= 3:
        badges.append({"id": "flag-hunter", "name": "Flag Hunter", "desc": "Three CTF or platform completions."})
    if by_type["cert"] >= 1:
        badges.append({"id": "verified-cert", "name": "Verified Credential", "desc": "A certification with a checkable ID."})
    if track_earned["build-free"] > 0:
        badges.append({"id": "builder", "name": "Builder", "desc": "Shipped something on the free-tier track."})
    if track_earned["reverse"] > 0:
        badges.append({"id": "binary-toucher", "name": "Binary Toucher", "desc": "Started the reverse-engineering track."})
    active = next((t for t in track_progress if t["id"] == "network-linux"), None)
    if active and active["completed"] == active["total"]:
        badges.append({"id": "networked", "name": "Networked", "desc": "Finished the Networking & Linux boss fight."})

    progress = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "operator": config["site"]["operator"],
        "tagline": config["site"]["tagline"],
        "totals": {
            "xp": total_xp,
            "posts": len(posts),
            "verified_posts": sum(1 for p in posts if p["verified"]),
            "hours": round(hours, 1),
            "modules_done": len(claimed),
            "modules_total": sum(len(t["modules"]) for t in tracks),
            "by_type": dict(by_type),
        },
        "level": {
            "name": current_level["name"],
            "min": current_level["min"],
            "next": next_level["name"] if next_level else None,
            "next_min": next_level["min"] if next_level else None,
            "to_next": (next_level["min"] - total_xp) if next_level else 0,
        },
        "commit_xp": commits,
        "streak": streak_info([iso_date(p["date"]) for p in posts]),
        "tracks": track_progress,
        "badges": badges,
        "recent": [
            {k: p[k] for k in ("slug", "title", "date", "type", "track", "xp", "evidence", "verified")}
            for p in posts[:6]
        ],
        "rules": rules,
    }

    (OUT / "progress.json").write_text(
        json.dumps(progress, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "posts.json").write_text(
        json.dumps(posts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Built progress.json: {total_xp} XP, {len(posts)} posts, "
          f"{len(claimed)} modules, {commits['commits']} commits counted.")


if __name__ == "__main__":
    main()
