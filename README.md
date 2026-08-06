# NexUpTech

**Uganda's local compliance and security expert.**

NexUpTech is a self-taught, Kampala-based IT and cybersecurity consultancy. We help Ugandan businesses stay secure and compliant to win in the digital age — from NISF 2026 readiness and Data Protection Act audits to penetration testing and secure landing pages.

**Live site:** https://m0ze.github.io/nexuptech/

**WhatsApp:** [+256 764 625 700](https://wa.me/256764625700?text=Hi%2C%20I'm%20interested%20in%20the%20NISF%202026%20Compliance%20Pack%20for%20my%20business.)

**Launch on X:** See [`docs/x-launch-kit.md`](docs/x-launch-kit.md) for ready-to-post copy and thread templates.

**Beta testing:** See [`docs/testing-playbook.md`](docs/testing-playbook.md) — 5 beta Instant Scans at 50% off.

---

## Business model

NexUpTech operates as a **productized services** consultancy — we sell clear outcomes, not vague hourly blocks. Think of it as SaaS-style packaging applied to professional cybersecurity and compliance work.

### Revenue streams

| Stream | Description |
|--------|-------------|
| **Compliance audits** | NISF 2026, DPPA, BoU, and UCC gap analyses with remediation roadmaps |
| **Security assessments** | VAPT, IT audits, cloud security reviews |
| **Incident response** | Forensics and breach recovery on retainer or per incident |
| **Secure web delivery** | Hardened landing pages and brochure sites with WhatsApp lead capture |
| **Lead magnets → upsell** | Free compliance checklists (`compliance-checklists/`) that convert to paid audits |
| **Instant Security Scan** | Automated external scan + PDF report (UGX 1M) via [`scanner/scan.py`](scanner/scan.py) |

### Target customers

1. **Banks and financial institutions** — BoU cyber risk guidelines (primary target)
2. **Government MDAs and their vendors** — mandatory NISF 2026 adoption
3. **Telecom and ISP operators** — UCC cybersecurity guidelines
4. **SMEs and NGOs** — Data Protection Act compliance and affordable security assessments

### Pricing tiers (UGX)

| Tier | Target | Price | Example |
|------|--------|-------|---------|
| Starter | SMEs, startups | 1,000,000 / session | Vulnerability scan, basic assessment |
| Professional | Mid-size, NGOs | 3,000,000 – 5,000,000 / session | Full IT audit, pentest, compliance gap analysis |
| Enterprise | Banks, telcos | Custom (> 10,000,000) | Full compliance audit, red/blue team, retainer |

Full rate card: [`pricing.md`](pricing.md)

---

## Market positioning

Uganda's cybersecurity services market is in a growth phase. Regulatory pressure is creating a **must-have** trend — not a nice-to-have.

### Government and regulatory drivers

- The **National Information Security Framework (NISF) 2026** is mandatory for government ministries, departments, and agencies.
- The **Uganda Communications Commission (UCC)** has issued strict cybersecurity guidelines for telecom operators.
- Many institutions now need professional compliance consulting to meet these requirements.

### Financial sector leadership

- The **Bank of Uganda (BoU)** has issued Cyber and Technology Risk Management Guidelines, mandating compliance for regulated financial institutions — our primary target customer base.

### Data protection awareness

- The **Data Protection and Privacy Act (2019)** is being actively enforced. Companies handling personal data face rising demand for compliance audits.

### Market opportunity

The cybersecurity services market in Uganda covers vulnerability assessments, penetration testing, compliance consulting, and more — with relatively few local specialists who combine technical skill and regulatory knowledge.

**Our positioning:** NexUpTech as Uganda's local compliance and security expert. Core value: helping clients meet NISF, UCC, and BoU regulations while aligning with international standards like ISO/IEC 27001.

---

## Service packs

Detailed catalog: [`services.md`](services.md)

### Core compliance packs
- NISF 2026 compliance audit
- Data protection compliance (PDPO, DPIA)
- Industry-specific: BoU (banks), UCC (telecom)

### Security assessment packs
- Vulnerability assessment and penetration testing (VAPT)
- IT audit services

### Advanced defense packs
- Digital forensics and incident response
- Cloud security assessment (AWS, Azure)
- Secure landing pages (original NexUpTech craft)

---

## Repository structure

```
nexuptech/
├── index.html              # Main landing page (GitHub Pages)
├── style.css               # 3D glassmorphic design system
├── script.js               # Interactions, WhatsApp form, parallax
├── assets/
│   └── og-image.png        # Twitter/X and Open Graph preview card
├── scanner/
│   ├── scan.py             # Instant Security Scan tool
│   ├── requirements.txt
│   └── README.md
├── docs/
│   ├── testing-playbook.md # Beta testing & QA guide
│   └── x-launch-kit.md     # Twitter/X launch copy & thread
├── services.md             # Full service catalog
├── pricing.md              # Transparent UGX pricing
├── certifications.md       # Team credentials and milestones
├── compliance-checklists/
│   ├── nisf-2026-sme-readiness.md
│   ├── bou-cyber-risk-self-assessment.md
│   └── dpo-starter-kit.md
├── .github/workflows/
│   └── pages.yml           # Auto-deploy to GitHub Pages on push
└── README.md               # This file
```

---

## Website sections

The landing page mirrors a professional consultancy site:

| Section | Purpose |
|---------|---------|
| **Home** | Value proposition — secure and compliant in the digital age |
| **Services** | Card-style service packs (compliance, VAPT, forensics, web) |
| **About** | Self-taught team, local expertise, certification path |
| **Pricing** | Starter / Professional / Enterprise in UGX |
| **Resources** | Free compliance checklists for lead generation |
| **Contact** | Form → WhatsApp, direct phone link, floating chat button |

---

## Immediate action plan

- [ ] **NITA-U authorization** — mandatory threshold for bidding on government projects
- [ ] **Master NISF 2026** — make it the core service product
- [ ] **Industry connections** — attend UCC and banking sector events
- [ ] **Content marketing** — publish articles on new regulations (Resources section + blog)
- [ ] **Automated scanning tool** — Instant Scan live in [`scanner/scan.py`](scanner/scan.py) (1M UGX upsell)
- [ ] **X launch** — use [`docs/x-launch-kit.md`](docs/x-launch-kit.md) and recruit 5 beta testers

---

## Local development

```bash
# Clone and serve locally
git clone https://github.com/your-org/nexuptech.git
cd nexuptech
python3 -m http.server 8000
# Visit http://localhost:8000
```

No build step, no dependencies — pure HTML, CSS, and vanilla JavaScript.

### Deploy to GitHub Pages

Pages deploys automatically on every push to `main` via GitHub Actions.

1. Push this repo to GitHub
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Site live at **https://m0ze.github.io/nexuptech/**

Social preview: `assets/og-image.png` (1200×630) is referenced in Open Graph and Twitter meta tags.

---

## Instant Security Scan

```bash
cd scanner
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scan.py --target scanme.nmap.org --client "Beta Test" --authorized
```

Generates JSON, HTML, and PDF reports in `scanner/reports/`. Requires `nmap` and written authorization (`--authorized` flag).

Full docs: [`scanner/README.md`](scanner/README.md)

---

## Launch on X (Twitter)

| Resource | Purpose |
|----------|---------|
| [`docs/x-launch-kit.md`](docs/x-launch-kit.md) | Launch post, 5-part thread, DM templates |
| [`docs/testing-playbook.md`](docs/testing-playbook.md) | Beta program, QA checklist, safe test targets |
| `assets/og-image.png` | Link preview image when you share the site |

**Quick launch:** Post the site URL with the og-image, pin it, and offer 5 beta Instant Scans at 50% off. Reply template: ask prospects to DM "BETA" or WhatsApp you directly.

---

## Technical notes

### Design system
- 3D glassmorphic UI with CSS transforms and backdrop blur
- Mouse-tracking card tilt via `data-tilt` attributes
- Parallax background orbs (RAF-throttled)
- Dark mode with `localStorage` persistence
- Reduced-motion and mobile optimizations disable heavy 3D effects

### Bug fixes applied
- WhatsApp links use digits-only format (`256764625700`, not `+256...`)
- Tilt animation runs only while hovering (no idle RAF loops)
- Parallax scroll throttled with `requestAnimationFrame`
- Theme toggle guarded against missing DOM elements
- IntersectionObserver fallback when unsupported
- Form labels for accessibility (`sr-only`)
- Mobile navigation menu

### Browser support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS 3D transforms | Yes | Yes | Yes | Yes |
| Backdrop filter | Yes | Partial* | Yes | Yes |
| IntersectionObserver | Yes | Yes | Yes | Yes |

*Firefox: backdrop-filter may require flag; solid fallback applies.

---

## Go-to-market

**Website = brochure. WhatsApp = sales channel.**

Default WhatsApp opener:
> Hi, I'm interested in the NISF 2026 Compliance Pack for my business.

Free checklists in `compliance-checklists/` capture leads; full audits are the upsell.

---

## Credits

Built by **Mugagga Moses** — self-taught IT and cybersecurity consultant, Kampala, Uganda.

Stack: HTML5, CSS3 (3D transforms, glassmorphism), vanilla JavaScript. No frameworks. ~25KB total.

Team credentials and milestones: [`certifications.md`](certifications.md)

---

## License

Content and code © 2026 NexUpTech. Compliance checklists may be shared with attribution. Contact us before commercial redistribution.
