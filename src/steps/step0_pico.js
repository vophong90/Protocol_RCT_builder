export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">PICO</h3></div>
  <div class="card-body grid-2">
    <label>Population (P)<textarea id="pico-p" rows="3" placeholder="Đối tượng nghiên cứu"></textarea></label>
    <label>Intervention (I)<textarea id="pico-i" rows="3" placeholder="Can thiệp"></textarea></label>
    <label>Comparator (C)<textarea id="pico-c" rows="3" placeholder="Đối chứng"></textarea></label>
    <label>Outcome (O)<textarea id="pico-o" rows="3" placeholder="Kết cục"></textarea></label>
  </div>
  <div class="card-footer">
    <button id="pico-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

const p = document.getElementById('pico-p');
const i = document.getElementById('pico-i');
const c = document.getElementById('pico-c');
const o = document.getElementById('pico-o');

const st = ctx.get('pico', {});
p.value = st.p || ''; i.value = st.i || ''; c.value = st.c || ''; o.value = st.o || '';

document.getElementById('pico-save').addEventListener('click', () => {
  ctx.save('pico', { p: p.value.trim(), i: i.value.trim(), c: c.value.trim(), o: o.value.trim() });
  ctx.toast('Đã lưu PICO');
});

    }
