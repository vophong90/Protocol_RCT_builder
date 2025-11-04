$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path vendor\pdfjs, vendor\papaparse, vendor\html2canvas, vendor\mermaid, vendor\chart.js | Out-Null

Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js           -OutFile vendor/pdfjs/pdf.min.js
Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js    -OutFile vendor/pdfjs/pdf.worker.min.js

Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js    -OutFile vendor/papaparse/papaparse.min.js
Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js -OutFile vendor/html2canvas/html2canvas.min.js
Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js       -OutFile vendor/mermaid/mermaid.min.js
Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js     -OutFile vendor/chart.js/chart.umd.min.js

Write-Host "✅ Vendors downloaded into .\vendor"
