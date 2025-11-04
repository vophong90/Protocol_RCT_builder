export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Tổng quan tài liệu</h3></div>
  <div class="card-body">
    <input id="lr-pdf" type="file" accept=".pdf" />
    <p class="muted">Có thể tải PDF để trích xuất text hỗ trợ (tuỳ chọn).</p>
    <div class="grid-3">
      <label>1. Đại cương YHHĐ<textarea id="lr-1" rows="4"></textarea></label>
      <label>2. Dịch tễ học<textarea id="lr-2" rows="4"></textarea></label>
      <label>3. Chẩn đoán YHHĐ<textarea id="lr-3" rows="4"></textarea></label>
      <label>4. Điều trị YHHĐ<textarea id="lr-4" rows="4"></textarea></label>
      <label>5. Hạn chế YHHĐ<textarea id="lr-5" rows="4"></textarea></label>
      <label>6. Đại cương YHCT<textarea id="lr-6" rows="4"></textarea></label>
      <label>7. Can thiệp YHCT<textarea id="lr-7" rows="4"></textarea></label>
      <label>8. Nghiên cứu liên quan<textarea id="lr-8" rows="4"></textarea></label>
      <label>9. Phương pháp phân tích mới<textarea id="lr-9" rows="4"></textarea></label>
    </div>
  </div>
  <div class="card-footer"><button id="lr-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

const st = ctx.get('review', {});
for (let i=1;i<=9;i++){ const el = document.getElementById('lr-'+i); el.value = st['s'+i] || ''; }
document.getElementById('lr-save').addEventListener('click', () => {
  const out = {}; for (let i=1;i<=9;i++){ out['s'+i] = document.getElementById('lr-'+i).value.trim(); }
  ctx.save('review', out);
  ctx.toast('Đã lưu tổng quan');
});
document.getElementById('lr-pdf').addEventListener('change', async (e) => {
  const f = e.target.files?.[0]; if(!f) return;
  const text = await ctx.extractTextFromPDF(f);
  if (text) navigator.clipboard?.writeText(text).catch(()=>{});
  ctx.toast('Đã trích xuất text PDF vào clipboard (nếu cho phép).');
});

    }
