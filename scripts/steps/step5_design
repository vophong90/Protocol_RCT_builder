export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Thiết kế nghiên cứu</h3></div>
  <div class="card-body grid-3">
    <label>Loại thiết kế<input id="des-type" placeholder="RCT song song / cross-over"/></label>
    <label>Ngụy trang/che giấu<input id="des-blind" placeholder="mù đơn / đôi / ..."/></label>
    <label>Ghi chú<textarea id="des-notes" rows="3"></textarea></label>
  </div>
  <div class="card-footer"><button id="des-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

const st = ctx.get('design', {});
des_type.value  = st.type || '';
des_blind.value = st.blind || '';
des_notes.value = st.notes || '';
document.getElementById('des-save').addEventListener('click', () => {
  ctx.save('design', { type: des_type.value.trim(), blind: des_blind.value.trim(), notes: des_notes.value.trim() });
  ctx.toast('Đã lưu thiết kế');
});

    }
