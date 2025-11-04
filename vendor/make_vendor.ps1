# PowerShell vendor downloader
$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

New-Item -ItemType Directory -Force -Path "papaparse" | Out-Null
New-Item -ItemType Directory -Force -Path "pdfjs" | Out-Null
New-Item -ItemType Directory -Force -Path "html2canvas" | Out-Null
New-Item -ItemType Directory -Force -Path "chart.js" | Out-Null
New-Item -ItemType Directory -Force -Path "mermaid" | Out-Null

Write-Host "Downloading vendor assets..."

# PapaParse 5.3.2
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js" -OutFile "papaparse/papaparse.min.js"

# pdf.js 3.4.120
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js" -OutFile "pdfjs/pdf.min.js"
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js" -OutFile "pdfjs/pdf.worker.min.js"

# html2canvas 1.4.1
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" -OutFile "html2canvas/html2canvas.min.js"

# Chart.js 4.4.1
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" -OutFile "chart.js/chart.umd.min.js"

# Mermaid 10.9.1
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js" -OutFile "mermaid/mermaid.min.js"

Write-Host "Done. Files are in $((Get-Location).Path)"
