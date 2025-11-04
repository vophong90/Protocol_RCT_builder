#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "{BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

mkdir -p papaparse pdfjs html2canvas chart.js mermaid

echo "Downloading vendor assets..."

# PapaParse 5.3.2
curl -L "https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js" -o "papaparse/papaparse.min.js"

# pdf.js 3.4.120
curl -L "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js" -o "pdfjs/pdf.min.js"
curl -L "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js" -o "pdfjs/pdf.worker.min.js"

# html2canvas 1.4.1
curl -L "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" -o "html2canvas/html2canvas.min.js"

# Chart.js 4.4.1
curl -L "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" -o "chart.js/chart.umd.min.js"

# Mermaid 10.9.1
curl -L "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js" -o "mermaid/mermaid.min.js"

echo "Done. Files are in $(pwd)"
