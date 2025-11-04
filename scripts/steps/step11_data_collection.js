export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Thu thập dữ liệu</h3></div>
  <div class="card-body">
    <textarea id="coll-plan" rows="8" placeholder="Mô tả lịch thăm khám, thời điểm đo, công cụ đo, người thu thập..."></textarea>
  </div>
  <div class="card-footer"><button id="coll-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

coll_plan.value = ctx.get('collectionPlan', '');
document.getElementById('coll-save').addEventListener('click', () => {
  ctx.save('collectionPlan', coll_plan.value.trim());
  ctx.toast('Đã lưu kế hoạch thu thập');
});

    }
