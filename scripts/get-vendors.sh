#!/usr/bin/env bash
set -euo pipefail

mkdir -p vendor/pdfjs vendor/papaparse vendor/html2canvas vendor/mermaid vendor/chart.js

curl -L -o vendor/pdfjs/pdf.min.js         https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js
curl -L -o vendor/pdfjs/pdf.worker.min.js  https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js

curl -L -o vendor/papaparse/papaparse.min.js     https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js
curl -L -o vendor/html2canvas/html2canvas.min.js https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
curl -L -o vendor/mermaid/mermaid.min.js         https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js
curl -L -o vendor/chart.js/chart.umd.min.js      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js

echo "✅ Vendors downloaded into ./vendor"
