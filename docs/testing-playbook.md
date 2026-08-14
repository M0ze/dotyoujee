# dotyoujee Testing Playbook

How to validate the website, scanner, and service delivery before and during your public launch on X (Twitter).

---

## Phase 1: Local smoke tests (30 minutes)

### Website

```bash
cd dotyoujee
python3 -m http.server 8000
# Open http://localhost:8000
```

| Test | Pass criteria |
|------|---------------|
| All nav links scroll to sections | Services, About, Pricing, Resources, Contact, Instant Scan |
| Dark mode toggle | Persists after page refresh |
| Mobile menu | Hamburger opens/closes nav on narrow screen |
| Contact form | Opens WhatsApp with pre-filled name, email, service, message |
| Floating WhatsApp button | Opens chat with NISF default message |
| Resource links | Open markdown checklists in repo / GitHub |

### Scanner

```bash
cd scanner
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scan.py --target scanme.nmap.org --client "dotyoujee Beta" --authorized
```

| Test | Pass criteria |
|------|---------------|
| Scan completes | JSON, HTML, PDF in `scanner/reports/` |
| PDF readable | Client name, target, findings visible |
| HTML report | Opens in browser with port table and findings |
| Authorization gate | Scan refused without `--authorized` |

### Scan your own deployed site (after GitHub Pages is live)

```bash
python scan.py --target m0ze.github.io --client "Self Test" --authorized
```

Use the HTML/PDF output as a sample deliverable in your X launch thread.

---

## Phase 2: GitHub Pages verification

1. Push to `main` (GitHub Actions deploys automatically).
2. Enable Pages if needed: **Repo → Settings → Pages → Source: GitHub Actions**.
3. Confirm live URL: **https://m0ze.github.io/dotyoujee/**
4. Validate social preview:
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator) (or post draft on X — image should show)
   - [Meta Tags Debugger](https://developers.facebook.com/tools/debug/) for Open Graph
5. Test WhatsApp links from the live site (not just localhost).

---

## Phase 3: Beta testing program

Offer **5 beta slots at 50% off** (UGX 500,000 per Instant Scan) to build case studies and testimonials.

### Ideal beta testers

| Profile | Why |
|---------|-----|
| Kampala SME with a website | Easy authorization, fast turnaround |
| NGO handling donor data | Data Protection Act angle |
| Fintech / SACCO contact | BoU compliance upsell path |
| Dev shop / agency | Referral partner potential |

### Beta workflow

1. **Outreach** — WhatsApp or X DM using templates in [`x-launch-kit.md`](x-launch-kit.md).
2. **Authorization** — Send this message and save their reply:

   > I authorize dotyoujee to perform an external security scan on `[domain/IP]` on `[date]`. I understand this is a surface-level assessment, not a full penetration test.

3. **Run scan** — `python scan.py --target THEIR_DOMAIN --client "Beta - Company Name" --authorized`
4. **Deliver** — Send PDF + HTML via WhatsApp/email within 24 hours.
5. **Follow-up call** — 15-minute review; offer Professional VAPT if findings exist.
6. **Ask for testimonial** — One sentence + permission to quote on site/X.

### Track beta progress

| # | Client | Target | Scan date | Report sent | Testimonial | Upsell |
|---|--------|--------|-----------|-------------|-------------|--------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

---

## Phase 4: Service delivery checklist

Before calling any engagement "done":

- [ ] Written authorization saved (screenshot or email)
- [ ] Scan/report generated and reviewed manually for false positives
- [ ] Executive summary explained in plain language (not just raw nmap output)
- [ ] Remediation priorities ranked (critical → low)
- [ ] Upsell path documented (Starter → Professional → Enterprise)
- [ ] Invoice/receipt sent (mobile money or bank transfer)

---

## Phase 5: Compliance checklist downloads

Verify lead magnets work as marketing tools:

1. Share `compliance-checklists/nisf-2026-sme-readiness.md` on X with a CTA.
2. Track WhatsApp messages mentioning "checklist" or "NISF".
3. Offer a free 15-minute review call for anyone who completes the checklist.

---

## Safe testing targets

| Target | Use case |
|--------|----------|
| `scanme.nmap.org` | Official nmap test server — always safe |
| Your own GitHub Pages URL | Validates your live deployment |
| Your own domain | Production self-test with authorization |
| Client domains | **Only with written authorization**

**Never scan** random IPs, competitors, or government systems without a contract.

---

## Metrics to track (first 30 days)

| Metric | Goal |
|--------|------|
| Site visits | Baseline from GitHub traffic / simple analytics |
| WhatsApp inquiries | 10+ conversations |
| Beta scans completed | 5 |
| Checklist downloads/shares | 20+ impressions on X |
| Paid conversions | 2+ Starter or Instant Scan clients |

---

## Next: launch on X

Ready to go public? Follow the copy and thread templates in [`x-launch-kit.md`](x-launch-kit.md).
