export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Phân tích số liệu</h3></div>
  <div class="card-body">
    <textarea id="analysis-desc" rows="8" placeholder="Mô tả tổng thể phân tích, mô hình, xử lý thiếu, ITT/PP..."></textarea>
  </div>
  <div class="card-footer"><button id="an-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

analysis_desc.value = ctx.get('analysisDesc', '');
document.getElementById('an-save').addEventListener('click', () => {
  ctx.save('analysisDesc', analysis_desc.value.trim());
  ctx.toast('Đã lưu phân tích số liệu');
});

    }
