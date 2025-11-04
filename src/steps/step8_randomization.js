export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Ngẫu nhiên hoá</h3></div>
  <div class="card-body grid-3">
    <label>Phương pháp<input id="rnd-method" placeholder="block / stratified / ..."/></label>
    <label>Tỉ lệ phân bổ<input id="rnd-ratio" placeholder="1:1 / 2:1 / ..."/></label>
    <label>Che giấu phân bổ<textarea id="rnd-conceal" rows="3"></textarea></label>
  </div>
  <div class="card-footer"><button id="rnd-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

const st = ctx.get('randomization', {});
rnd_method.value  = st.method || '';
rnd_ratio.value   = st.ratio  || '';
rnd_conceal.value = st.conceal|| '';
document.getElementById('rnd-save').addEventListener('click', () => {
  ctx.save('randomization', { method: rnd_method.value.trim(), ratio: rnd_ratio.value.trim(), conceal: rnd_conceal.value.trim() });
  ctx.toast('Đã lưu ngẫu nhiên hoá');
});

    }
