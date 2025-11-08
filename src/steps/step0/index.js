// src/steps/step0/index.js
export const id = 0;
export const title = "PICO";
export const subtitle = "";       // (tuỳ chọn)
export const css = null;          // (có thể trỏ tới /public/css/steps/step0.css nếu cần)

export async function mount(rootEl, ctx){
  const pico = ctx.get('pico', {}) || {};
  const P = pico.p || "";
  const I = pico.i || "";
  const C = pico.c || "";
  const O = pico.o || "";

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">PICO</h3>
      <div class="card-subtitle">Nhập nhanh P/I/C/O, dữ liệu lưu vào state.</div>
    </div>
    <div class="card-body grid-2">
      <label>P (Population)
        <textarea id="pico-p" rows="3" placeholder="Đối tượng nghiên cứu...">${P}</textarea>
      </label>
      <label>I (Intervention)
        <textarea id="pico-i" rows="3" placeholder="Can thiệp...">${I}</textarea>
      </label>
      <label>C (Comparator)
        <textarea id="pico-c" rows="3" placeholder="So sánh (nếu có)...">${C}</textarea>
      </label>
      <label>O (Outcome)
        <textarea id="pico-o" rows="3" placeholder="Kết cục chính/phụ...">${O}</textarea>
      </label>
    </div>
    <div class="card-footer">
      <button id="pico-save" class="btn btn-primary" type="button">Lưu PICO</button>
    </div>
  `;

  document.getElementById('pico-save').addEventListener('click', () => {
    const next = {
      p: (document.getElementById('pico-p').value || '').trim(),
      i: (document.getElementById('pico-i').value || '').trim(),
      c: (document.getElementById('pico-c').value || '').trim(),
      o: (document.getElementById('pico-o').value || '').trim(),
    };
    ctx.save('pico', next);
    ctx.toast('Đã lưu PICO');
  });
}
