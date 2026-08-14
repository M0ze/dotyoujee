#!/usr/bin/env python3
"""
dotyoujee Instant Security Scan
Lightweight external vulnerability assessment for authorized targets only.

Usage:
  python scan.py --target scanme.nmap.org --client "Beta Tester" --authorized

Legal: Only scan systems you own or have explicit written permission to test.
"""

from __future__ import annotations

import argparse
import json
import re
import socket
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

try:
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos
except ImportError:
    FPDF = None  # type: ignore
    XPos = YPos = None  # type: ignore


REPORTS_DIR = Path(__file__).resolve().parent / "reports"
COMMON_WEB_PORTS = {80, 443, 8080, 8443}
SECURITY_HEADERS = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
]


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return cleaned.strip("-") or "scan"


def validate_target(target: str) -> str:
    target = target.strip().lower().removeprefix("https://").removeprefix("http://")
    target = target.split("/")[0].split(":")[0]
    if not re.match(r"^[a-z0-9][a-z0-9.\-]*[a-z0-9]$|^[a-z0-9]$", target):
        raise ValueError(f"Invalid target: {target}")
    return target


def run_nmap(target: str, ports: str = "1-1024,8080,8443") -> dict[str, Any]:
    cmd = [
        "nmap",
        "-Pn",
        "-sT",
        "-T4",
        "--top-ports",
        "200",
        "-oX",
        "-",
        target,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180, check=False)
    except FileNotFoundError:
        sys.exit("Error: nmap is not installed. Install with: sudo apt install nmap")

    if result.returncode not in (0, 1):
        sys.exit(f"nmap failed: {result.stderr.strip() or result.stdout.strip()}")

    return parse_nmap_xml(result.stdout, target)


def parse_nmap_xml(xml_output: str, target: str) -> dict[str, Any]:
    if not xml_output.strip():
        return {"target": target, "state": "unknown", "open_ports": [], "services": []}

    root = ET.fromstring(xml_output)
    host = root.find("host")
    if host is None:
        return {"target": target, "state": "down", "open_ports": [], "services": []}

    state_el = host.find("status")
    state = state_el.get("state", "unknown") if state_el is not None else "unknown"

    open_ports: list[dict[str, Any]] = []
    for port in host.findall("ports/port"):
        port_state = port.find("state")
        if port_state is None or port_state.get("state") != "open":
            continue
        port_id = int(port.get("portid", 0))
        service_el = port.find("service")
        service_name = service_el.get("name", "unknown") if service_el is not None else "unknown"
        product = service_el.get("product", "") if service_el is not None else ""
        version = service_el.get("version", "") if service_el is not None else ""
        open_ports.append(
            {
                "port": port_id,
                "protocol": port.get("protocol", "tcp"),
                "service": service_name,
                "product": product,
                "version": version,
            }
        )

    return {
        "target": target,
        "state": state,
        "open_ports": open_ports,
        "services": [p for p in open_ports],
    }


def fetch_http_headers(target: str, use_https: bool) -> dict[str, Any]:
    scheme = "https" if use_https else "http"
    url = f"{scheme}://{target}"
    result: dict[str, Any] = {
        "url": url,
        "reachable": False,
        "status_code": None,
        "headers_present": {},
        "headers_missing": [],
        "findings": [],
    }

    try:
        request = urllib.request.Request(url, headers={"User-Agent": "dotyoujee-Scanner/1.0"})
        with urllib.request.urlopen(request, timeout=12) as response:
            result["reachable"] = True
            result["status_code"] = response.status
            headers = {k.lower(): v for k, v in response.headers.items()}
            for header in SECURITY_HEADERS:
                if header in headers:
                    result["headers_present"][header] = headers[header]
                else:
                    result["headers_missing"].append(header)
    except urllib.error.HTTPError as exc:
        result["reachable"] = True
        result["status_code"] = exc.code
        headers = {k.lower(): v for k, v in exc.headers.items()} if exc.headers else {}
        for header in SECURITY_HEADERS:
            if header in headers:
                result["headers_present"][header] = headers[header]
            else:
                result["headers_missing"].append(header)
    except Exception as exc:  # noqa: BLE001 - report all connection failures
        result["findings"].append(f"Could not reach {url}: {exc}")

    if result["reachable"] and result["headers_missing"]:
        result["findings"].append(
            f"Missing recommended security headers: {', '.join(result['headers_missing'])}"
        )
    if use_https and "strict-transport-security" in result["headers_missing"]:
        result["findings"].append("HTTPS reachable but HSTS header is missing.")

    return result


def check_tls(target: str) -> dict[str, Any]:
    result: dict[str, Any] = {
        "supported": False,
        "protocol": None,
        "cipher": None,
        "certificate": {},
        "findings": [],
    }
    context = ssl.create_default_context()
    try:
        with socket.create_connection((target, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=target) as secure:
                result["supported"] = True
                result["protocol"] = secure.version()
                cipher = secure.cipher()
                if cipher:
                    result["cipher"] = cipher[0]
                cert = secure.getpeercert()
                if cert:
                    result["certificate"] = {
                        "subject": dict(x[0] for x in cert.get("subject", [])),
                        "issuer": dict(x[0] for x in cert.get("issuer", [])),
                        "notAfter": cert.get("notAfter"),
                    }
                    if cert.get("notAfter"):
                        expiry = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                        days_left = (expiry - datetime.now(timezone.utc).replace(tzinfo=None)).days
                        if days_left < 30:
                            result["findings"].append(f"TLS certificate expires in {days_left} days.")
    except Exception as exc:  # noqa: BLE001
        result["findings"].append(f"TLS check failed: {exc}")

    if result["supported"] and result["protocol"] in {"TLSv1", "TLSv1.1", "SSLv3"}:
        result["findings"].append(f"Outdated TLS protocol in use: {result['protocol']}")

    return result


def build_findings(scan: dict[str, Any]) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []

    if scan["nmap"]["state"] == "down":
        findings.append(
            {
                "severity": "info",
                "title": "Host appears unreachable",
                "detail": "The target did not respond to the external scan. It may be offline or blocking probes.",
            }
        )

    open_ports = scan["nmap"]["open_ports"]
    if len(open_ports) > 10:
        findings.append(
            {
                "severity": "medium",
                "title": "Large attack surface",
                "detail": f"{len(open_ports)} open ports detected. Consider closing unused services.",
            }
        )

    risky = {"telnet", "ftp", "ms-wbt-server", "vnc"}
    for port in open_ports:
        if port["service"] in risky:
            findings.append(
                {
                    "severity": "high",
                    "title": f"Risky service exposed: {port['service']}",
                    "detail": f"Port {port['port']}/{port['service']} is reachable from the internet.",
                }
            )

    for http_result in scan.get("http_checks", []):
        for item in http_result.get("findings", []):
            findings.append(
                {
                    "severity": "medium",
                    "title": "Web security header gap",
                    "detail": item,
                }
            )

    for item in scan.get("tls", {}).get("findings", []):
        findings.append(
            {
                "severity": "medium",
                "title": "TLS configuration issue",
                "detail": item,
            }
        )

    if not findings:
        findings.append(
            {
                "severity": "info",
                "title": "No critical issues in this quick scan",
                "detail": "This is a surface-level external scan. A full VAPT is recommended for production systems.",
            }
        )

    return findings


def run_scan(target: str, client: str) -> dict[str, Any]:
    nmap_result = run_nmap(target)
    open_port_numbers = {p["port"] for p in nmap_result["open_ports"]}

    http_checks = []
    if 443 in open_port_numbers or 8443 in open_port_numbers:
        http_checks.append(fetch_http_headers(target, use_https=True))
    elif 80 in open_port_numbers or 8080 in open_port_numbers:
        http_checks.append(fetch_http_headers(target, use_https=False))

    tls_result = check_tls(target) if 443 in open_port_numbers else {"supported": False, "findings": []}

    scan = {
        "meta": {
            "scanner": "dotyoujee Instant Scan v1.0",
            "client": client,
            "target": target,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "Authorized external scan only. Not a substitute for full penetration testing.",
        },
        "nmap": nmap_result,
        "http_checks": http_checks,
        "tls": tls_result,
    }
    scan["findings"] = build_findings(scan)
    scan["summary"] = {
        "open_port_count": len(nmap_result["open_ports"]),
        "finding_count": len(scan["findings"]),
        "high": sum(1 for f in scan["findings"] if f["severity"] == "high"),
        "medium": sum(1 for f in scan["findings"] if f["severity"] == "medium"),
        "info": sum(1 for f in scan["findings"] if f["severity"] == "info"),
    }
    return scan


def write_json(report: dict[str, Any], path: Path) -> None:
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")


def write_html(report: dict[str, Any], path: Path) -> None:
    findings_rows = "".join(
        f"<tr><td>{f['severity'].upper()}</td><td>{f['title']}</td><td>{f['detail']}</td></tr>"
        for f in report["findings"]
    )
    ports_rows = "".join(
        f"<tr><td>{p['port']}</td><td>{p['service']}</td><td>{p.get('product', '')} {p.get('version', '')}</td></tr>"
        for p in report["nmap"]["open_ports"]
    ) or "<tr><td colspan='3'>No open ports in scanned range</td></tr>"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>dotyoujee Scan Report — {report['meta']['target']}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #0f172a; }}
    h1 {{ color: #2563eb; }}
    table {{ width: 100%; border-collapse: collapse; margin: 16px 0 32px; }}
    th, td {{ border: 1px solid #e2e8f0; padding: 10px; text-align: left; }}
    th {{ background: #f8fafc; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 0.85rem; }}
    footer {{ color: #64748b; font-size: 0.9rem; margin-top: 40px; }}
  </style>
</head>
<body>
  <h1>dotyoujee Instant Security Scan</h1>
  <p><span class="badge">Client: {report['meta']['client']}</span></p>
  <p><strong>Target:</strong> {report['meta']['target']}<br>
     <strong>Scan time (UTC):</strong> {report['meta']['timestamp']}<br>
     <strong>Open ports:</strong> {report['summary']['open_port_count']} |
     <strong>Findings:</strong> {report['summary']['finding_count']}</p>

  <h2>Open ports</h2>
  <table><tr><th>Port</th><th>Service</th><th>Version</th></tr>{ports_rows}</table>

  <h2>Findings</h2>
  <table><tr><th>Severity</th><th>Issue</th><th>Detail</th></tr>{findings_rows}</table>

  <footer>
    {report['meta']['disclaimer']}<br>
    dotyoujee — Uganda's local compliance and security expert.
  </footer>
</body>
</html>"""
    path.write_text(html, encoding="utf-8")


def write_pdf(report: dict[str, Any], path: Path) -> None:
    if FPDF is None:
        return

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "dotyoujee Instant Security Scan", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", size=11)
    pdf.cell(0, 8, f"Client: {report['meta']['client']}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 8, f"Target: {report['meta']['target']}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 8, f"UTC: {report['meta']['timestamp']}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Summary", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", size=11)
    pdf.cell(0, 8, f"Open ports: {report['summary']['open_port_count']}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 8, f"Findings: {report['summary']['finding_count']}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Findings", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", size=10)
    for finding in report["findings"]:
        pdf.multi_cell(0, 6, f"[{finding['severity'].upper()}] {finding['title']}: {finding['detail']}")
        pdf.ln(1)
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(0, 5, report["meta"]["disclaimer"])
    pdf.output(str(path))


def main() -> None:
    parser = argparse.ArgumentParser(description="dotyoujee authorized external security scan")
    parser.add_argument("--target", required=True, help="Hostname or IP (e.g. scanme.nmap.org)")
    parser.add_argument("--client", default="Internal Test", help="Client name for the report")
    parser.add_argument(
        "--authorized",
        action="store_true",
        help="Confirm you have written authorization to scan this target",
    )
    args = parser.parse_args()

    if not args.authorized:
        sys.exit(
            "Refusing to scan: pass --authorized to confirm written permission from the target owner."
        )

    target = validate_target(args.target)
    print(f"Starting dotyoujee scan for {target} ...")

    report = run_scan(target, args.client)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    base = REPORTS_DIR / f"{slugify(args.client)}-{slugify(target)}-{stamp}"

    json_path = base.with_suffix(".json")
    html_path = base.with_suffix(".html")
    pdf_path = base.with_suffix(".pdf")

    write_json(report, json_path)
    write_html(report, html_path)
    write_pdf(report, pdf_path)

    print("\nScan complete.")
    print(f"  JSON : {json_path}")
    print(f"  HTML : {html_path}")
    if pdf_path.exists():
        print(f"  PDF  : {pdf_path}")
    else:
        print("  PDF  : skipped (install fpdf2)")
    print(
        f"\nSummary: {report['summary']['open_port_count']} open ports, "
        f"{report['summary']['finding_count']} findings "
        f"({report['summary']['high']} high, {report['summary']['medium']} medium)"
    )


if __name__ == "__main__":
    main()
