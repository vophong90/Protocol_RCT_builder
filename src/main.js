<!-- Vendor libs (local, pinned versions) -->
<script src="./vendor/papaparse/papaparse.min.js"></script>
<script src="./vendor/pdfjs/pdf.min.js"></script>
<script src="./vendor/html2canvas/html2canvas.min.js"></script>
<script src="./vendor/chart.js/chart.umd.min.js"></script>
<script src="./vendor/mermaid/mermaid.min.js"></script>

<!-- (Tuỳ chọn) Khởi tạo Mermaid, giữ nguyên logic cũ -->
<script>
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose' // cho phép render từ nội dung nội bộ
    });
  }
</script>

<!-- App -->
<script type="module" src="./src/main.js"></script>
