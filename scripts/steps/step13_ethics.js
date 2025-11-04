export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Đạo đức nghiên cứu</h3></div>
  <div class="card-body">
    <textarea id="ethics-desc" rows="8" placeholder="Chấp thuận HĐĐĐ, bảo mật, quyền lợi/ nguy cơ, bồi hoàn..."></textarea>
  </div>
  <div class="card-footer"><button id="eth-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

ethics_desc.value = ctx.get('ethicsDesc', '');
document.getElementById('eth-save').addEventListener('click', () => {
  ctx.save('ethicsDesc', ethics_desc.value.trim());
  ctx.toast('Đã lưu đạo đức nghiên cứu');
});

    }
