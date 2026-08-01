# Automated Security Testing & Vulnerability Scanning Guide

This guide details how to perform security audits and vulnerability scans on **FlowCheck** deployments (`https://flowcheck.flowcheck.workers.dev/`) using **OWASP ZAP** (Zed Attack Proxy) and **ProjectDiscovery Nuclei**.

---

## 🚀 Quick Execution Commands

```bash
# 1. OWASP ZAP Baseline Scan (Passive Security Audit - Fast)
docker run -t zaproxy/zap-stable zap-baseline.py -t https://flowcheck.flowcheck.workers.dev/

# 2. ProjectDiscovery Nuclei Vulnerability Scan (Template-based Scan)
nuclei -u https://flowcheck.flowcheck.workers.dev/

# 3. OWASP ZAP Full Scan (Active Vulnerability & Penetration Audit - Deep)
docker run -t zaproxy/zap-stable zap-full-scan.py -t https://flowcheck.flowcheck.workers.dev/
```

---

## 🛠️ Tool Breakdown & How They Work

### 1. OWASP ZAP (Zed Attack Proxy)
[OWASP ZAP](https://www.zaproxy.org/) is the world's most popular open-source web application security scanner.

* **`zap-baseline.py` (Baseline Scan)**:
  * **How it works**: Runs the ZAP spider to crawl the target URL for 1 minute and performs passive security checks.
  * **What it checks**: Missing security HTTP headers (CSP, HSTS, X-Frame-Options), cookie flags (HttpOnly, Secure, SameSite), SSL/TLS configurations, and exposed sensitive metadata.
  * **Risk**: Safe for production systems (non-destructive).

* **`zap-full-scan.py` (Full Active Scan)**:
  * **How it works**: Crawls the entire target application and launches active penetration payloads against endpoints.
  * **What it checks**: SQL Injection (SQLi), Cross-Site Scripting (XSS), Remote Code Execution (RCE), Server-Side Request Forgery (SSRF), CORS misconfigurations, and Path Traversal.
  * **Risk**: Active attack payloads. Run on staging environments or designated test nodes.

---

### 2. ProjectDiscovery Nuclei
[Nuclei](https://github.com/projectdiscovery/nuclei) is a fast, community-powered vulnerability scanner designed for modern web applications and cloud endpoints.

* **How it works**: Uses YAML-based templates to send targeted request payloads and analyze responses for known vulnerabilities, CVEs, misconfigurations, and sensitive file disclosures.
* **What it checks**: OWASP Top 10 vulnerabilities, exposed admin panels, cloud storage leaks, outdated library CVEs, and server misconfigurations.

---

## 💻 Installation & Setup Instructions

### Prerequisites
- **Linux (Ubuntu/Debian, Fedora/RHEL)**, **macOS**, or **Windows (WSL2)**

---

### Step 1: Install Docker (For OWASP ZAP)

#### On Fedora (KDE Plasma 44 / Workstation):
```bash
# Install Docker package via dnf
sudo dnf install -y docker

# Enable and start the Docker service
sudo systemctl enable --now docker

# Add your user to the docker group (avoids needing 'sudo' for docker commands)
sudo usermod -aG docker $USER
newgrp docker
```
> **Note for Fedora users**: Fedora comes with `podman` by default. You can also run ZAP via Podman without installing Docker: `podman run -t zaproxy/zap-stable zap-baseline.py -t https://flowcheck.flowcheck.workers.dev/`

#### On Ubuntu / Debian:
```bash
# Update package list and install Docker
sudo apt update
sudo apt install -y docker.io

# Enable Docker service and start it
sudo systemctl enable --now docker

# Add your user to the docker group (optional, avoids requiring 'sudo' for docker commands)
sudo usermod -aG docker $USER
newgrp docker
```

#### On macOS:
Install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/).

#### On Windows:
Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) (requires WSL2 enabled).

---

### Step 2: Pull OWASP ZAP Docker Image

Pull the official OWASP ZAP stable image:
```bash
docker pull zaproxy/zap-stable
```

---

### Step 3: Install ProjectDiscovery Nuclei

#### Option A: On Fedora (KDE Plasma 44):
```bash
# Install Go compiler via dnf
sudo dnf install -y golang

# Install Nuclei using Go
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Ensure ~/go/bin is in your PATH
export PATH=$PATH:$(go env GOPATH)/bin
```

#### Option B: Using `go` (Ubuntu/Debian/General):
```bash
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

#### Option C: Using Homebrew (macOS / Linuxbrew):
```bash
brew install nuclei
```

#### Option D: Binary Release Download (Linux x86_64 / Fedora):
```bash
# Install prerequisites on Fedora if needed: sudo dnf install -y wget unzip
curl -s https://api.github.com/repos/projectdiscovery/nuclei/releases/latest | grep "browser_download_url.*linux_amd64.zip" | cut -d : -f 2,3 | tr -d \" | wget -i -

# Extract and move to PATH
unzip nuclei_*_linux_amd64.zip
sudo mv nuclei /usr/local/bin/

# Verify installation
nuclei -version
```

---

### Step 4: Update Nuclei Templates

Before running Nuclei, update to the latest community vulnerability templates:
```bash
nuclei -ut
```

---

## 🔍 How to Run the Security Scans

### 1. Run OWASP ZAP Baseline Scan
To quickly audit missing security headers and passive vulnerabilities:
```bash
docker run -t zaproxy/zap-stable zap-baseline.py -t https://flowcheck.flowcheck.workers.dev/
```

To export an HTML report locally:
```bash
docker run -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable zap-baseline.py \
  -t https://flowcheck.flowcheck.workers.dev/ \
  -r zap-baseline-report.html
```

---

### 2. Run Nuclei Vulnerability Scan
To scan for CVEs and misconfigurations:
```bash
# Run default scan
nuclei -u https://flowcheck.flowcheck.workers.dev/

# Run with severe vulnerability filters (Critical & High priority only)
nuclei -u https://flowcheck.flowcheck.workers.dev/ -severity critical,high

# Output results to a text file
nuclei -u https://flowcheck.flowcheck.workers.dev/ -o nuclei-results.txt
```

---

### 3. Run OWASP ZAP Full Active Scan
To perform a complete active penetration test:
```bash
docker run -t zaproxy/zap-stable zap-full-scan.py -t https://flowcheck.flowcheck.workers.dev/
```

To save the HTML report to your current directory:
```bash
docker run -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable zap-full-scan.py \
  -t https://flowcheck.flowcheck.workers.dev/ \
  -r zap-full-report.html
```

---

## 🛡️ Best Practices for FlowCheck Security Scans

1. **Staging vs. Production**: Always run `zap-full-scan.py` against a non-production staging instance to avoid unexpected load spikes or test data creation.
2. **CI/CD Integration**: Integrate `zap-baseline.py` into GitHub Actions to automatically fail PRs if critical security headers or vulnerabilities are introduced.
3. **Template Updates**: Keep Nuclei templates updated using `nuclei -ut` before each release security check.
