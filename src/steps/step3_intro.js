export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Mở đầu theo CaRS</h3></div>
  <div class="card-body grid-3">
    <label>Territory<textarea id="cars-territory" rows="3"></textarea></label>
    <label>Niche<textarea id="cars-niche" rows="3"></textarea></label>
    <label>Occupy<textarea id="cars-occupy" rows="3"></textarea></label>
  </div>
  <div class="card-footer">
    <button id="cars-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

const st = ctx.get('introCars', {});
document.getElementById('cars-territory').value = st.territory || '';
document.getElementById('cars-niche').value = st.niche || '';
document.getElementById('cars-occupy').value = st.occupy || '';
document.getElementById('cars-save').addEventListener('click', () => {
  ctx.save('introCars', {
    territory: document.getElementById('cars-territory').value.trim(),
    niche: document.getElementById('cars-niche').value.trim(),
    occupy: document.getElementById('cars-occupy').value.trim(),
  });
  ctx.toast('Đã lưu phần mở đầu CaRS');
});

    }
