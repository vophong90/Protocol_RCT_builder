export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Mục tiêu</h3></div>
  <div class="card-body">
    <label>Mục tiêu chính<textarea id="main-obj" rows="3" placeholder="Nhập mục tiêu chính"></textarea></label>
  </div>
  <div class="card-footer">
    <button id="obj-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

const m = document.getElementById('main-obj');
m.value = ctx.get('mainObjective', '');
document.getElementById('obj-save').addEventListener('click', () => {
  ctx.save('mainObjective', m.value.trim());
  ctx.toast('Đã lưu mục tiêu');
});

    }
