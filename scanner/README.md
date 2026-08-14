# dotyoujee Instant Scan

Lightweight external vulnerability scanner for authorized targets. Generates JSON, HTML, and PDF reports suitable for client delivery or internal beta testing.

## Prerequisites

```bash
sudo apt install nmap python3 python3-venv
cd scanner
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Legal requirement

**Only scan systems you own or have explicit written permission to test.** The scanner refuses to run without the `--authorized` flag.

## Quick test (safe public target)

Nmap maintains an official test server:

```bash
python scan.py --target scanme.nmap.org --client "dotyoujee Beta" --authorized
```

Reports are written to `reports/`:

- `*.json` — machine-readable results
- `*.html` — open in browser for review
- `*.pdf` — client-ready summary (requires `fpdf2`)

## Scan your own site

After deploying to GitHub Pages:

```bash
python scan.py --target m0ze.github.io --client "Self Test" --authorized
```

For a custom domain, replace the target accordingly.

## What it checks

| Check | Description |
|-------|-------------|
| Port scan | Top 200 TCP ports via nmap |
| Risky services | Flags telnet, FTP, RDP, VNC if exposed |
| HTTP headers | HSTS, CSP, X-Frame-Options, and related headers |
| TLS | Certificate expiry and protocol version |
| Findings summary | Severity-ranked issues for the report |

## Monetization flow

1. Client requests **Instant Scan** (UGX 1,000,000) via WhatsApp or the website form.
2. Client signs a short authorization letter (email/WhatsApp is fine for beta).
3. Run the scan and deliver PDF + HTML within 24 hours.
4. Upsell **Professional VAPT** if medium/high findings appear.

## Limitations

This is a **surface-level external scan**, not a full penetration test. Position it as a fast first look — full VAPT and compliance audits are separate Professional/Enterprise packs.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `nmap is not installed` | `sudo apt install nmap` |
| `PDF skipped` | `pip install fpdf2` |
| Host shows down | Target may block external scans; confirm firewall rules |
| Scan slow | Normal for 200-port sweep; expect 1–3 minutes |

## Next steps

See [`docs/testing-playbook.md`](../docs/testing-playbook.md) for the full beta testing program and [`docs/x-launch-kit.md`](../docs/x-launch-kit.md) for Twitter/X launch copy.
