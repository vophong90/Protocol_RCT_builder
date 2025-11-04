export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Câu hỏi nghiên cứu</h3></div>
  <div class="card-body">
    <textarea id="rq" rows="4" placeholder="Nhập câu hỏi nghiên cứu"></textarea>
  </div>
  <div class="card-footer">
    <button id="rq-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

const el = document.getElementById('rq');
el.value = ctx.get('researchQuestion', '');
document.getElementById('rq-save').addEventListener('click', () => {
  ctx.save('researchQuestion', el.value.trim());
  ctx.toast('Đã lưu câu hỏi nghiên cứu');
});

    }
