---
title: Why this log exists, and how the points actually work
date: 2026-11-19
type: meta
track: network-linux
difficulty: beginner
hours: 1
evidence:
evidence_label:
completed:
tags: meta, rules, transparency
summary: An honest apprenticeship log where progress needs receipts, not vibes.
---

# Why this log exists

I am learning IT and cybersecurity in public. This is the journal and the scoreboard.

I want to show progress to myself and to anyone who cares, but I do not want to
become the kind of site that claims a 24/7 SOC, invented certifications and a
"100% pass rate". So the rules here are deliberately hostile to fakery.

## The only rule that matters

**No receipt, no points.**

Every post that earns XP must carry a link to something checkable:

- a lab writeup in this repo,
- a CTF flag or TryHackMe / Hack The Box completion,
- a certification with a verifiable ID,
- or a commit in one of the learning repositories.

Meta posts and notes are allowed, but they earn zero. That is on purpose.

## Where the points come from

- Lab writeup: 60 XP, plus the XP of any modules marked complete in that post.
- Full writeup: 120 XP.
- CTF or platform completion: 80 XP.
- Verifiable certification: 500 XP.
- Commits to the configured learning repos: 2 XP each, capped at 40 per week.

A module only pays out once. If two posts claim the same module, the earlier one
gets the XP. You cannot grind the same lesson twice.

## What the levels mean

Recruit → Initiate → Operator → Analyst → Engineer → Architect.

These are progress markers in a personal game. They are not certifications, not
job titles, and not permission to call myself a security professional. The only
things I claim externally are the things I can point to.

## The first track

Networking and Linux foundations. It is ten modules: packets, subnetting,
DNS/HTTP/TLS, Linux permissions, services, shell tooling, Linux networking,
Windows and Active Directory basics, logs and time, then a boss fight to build a
home lab. Everything else — penetration testing, reverse engineering, defensive
operations, zero-budget building and Uganda compliance — is mapped out but locked
until the foundations are done.

That order is not arbitrary. You cannot test a network you cannot explain, and you
cannot explain a network you have not built.

## How this is generated

The posts are Markdown files in `journal/`. `scripts/build.py` reads them, checks
their evidence fields, counts commits through the GitHub API, and writes
`data/progress.json` and `data/posts.json`. Those generated files are committed
to the repo, so what you see on the dashboard is the same data anyone can audit.

If a claim here looks big, click the evidence link. If there is no link, there
should be no points behind it.
