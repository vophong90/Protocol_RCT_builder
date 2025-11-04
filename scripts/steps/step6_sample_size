export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Cỡ mẫu</h3></div>
  <div class="card-body grid-3">
    <label>Phương pháp/ Công thức<textarea id="ss-formula" rows="3"></textarea></label>
    <label>Thông số chính<textarea id="ss-params" rows="3" placeholder="alpha, beta, SD, hiệu quả, ..."></textarea></label>
    <label>Kết quả ước tính<textarea id="ss-result" rows="3" placeholder="n mỗi nhánh, tổng n, ..."></textarea></label>
  </div>
  <div class="card-footer"><button id="ss-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

const st = ctx.get('sampleSize', {});
ss_formula.value = st.formula || '';
ss_params.value  = st.params  || '';
ss_result.value  = st.result  || '';
document.getElementById('ss-save').addEventListener('click', () => {
  ctx.save('sampleSize', { formula: ss_formula.value.trim(), params: ss_params.value.trim(), result: ss_result.value.trim() });
  ctx.toast('Đã lưu cỡ mẫu');
});

    }
