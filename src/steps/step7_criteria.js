export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Tiêu chí vào/loại</h3></div>
  <div class="card-body grid-2">
    <label>Tiêu chí vào<textarea id="in-crit" rows="6"></textarea></label>
    <label>Tiêu chí loại<textarea id="ex-crit" rows="6"></textarea></label>
  </div>
  <div class="card-footer"><button id="crit-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

const st = ctx.get('criteria', {});
in_crit.value = st.inclusion || '';
ex_crit.value = st.exclusion || '';
document.getElementById('crit-save').addEventListener('click', () => {
  ctx.save('criteria', { inclusion: in_crit.value.trim(), exclusion: ex_crit.value.trim() });
  ctx.toast('Đã lưu tiêu chí');
});

    }
