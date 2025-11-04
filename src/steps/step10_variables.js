export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Biến số</h3></div>
  <div class="card-body">
    <div class="grid-3">
      <label>Danh sách biến (phân tách bằng dấu phẩy)
        <textarea id="var-list" rows="4" placeholder="ví dụ: VAS, WOMAC, Tuổi, Giới, ..."></textarea>
      </label>
      <label>Nhóm biến
        <select id="var-role">
          <option value="primary">Kết cục chính</option>
          <option value="secondary">Kết cục phụ</option>
          <option value="baseline">Nền</option>
          <option value="confounder">Nhiễu</option>
          <option value="mediator">Trung gian</option>
          <option value="moderator">Điều biến</option>
          <option value="safety">An toàn</option>
        </select>
      </label>
      <div class="stack">
        <button id="var-add" class="btn-secondary">Thêm vào nhóm</button>
        <button id="var-clear" class="btn-light">Xoá tất cả</button>
      </div>
    </div>
    <div id="var-preview" class="muted" style="margin-top:1rem;"></div>
  </div>
  <div class="card-footer"><button id="var-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

function emptyMap(){
  return { primary:[], secondary:[], baseline:[], confounder:[], mediator:[], moderator:[], safety:[] };
}
let sel = ctx.get('selectedVariables', emptyMap());
const listEl = document.getElementById('var-list');
const roleEl = document.getElementById('var-role');
const prevEl = document.getElementById('var-preview');

function renderPreview(){
  const roles = Object.keys(sel);
  let html = roles.map(r => {
    const items = sel[r].map(v => v.name).join(', ') || '<i>(trống)</i>';
    return `<div><b>${r}</b>: ${items}</div>`;
  }).join('');
  prevEl.innerHTML = html;
}
renderPreview();

document.getElementById('var-add').addEventListener('click', () => {
  const names = listEl.value.split(',').map(s => s.trim()).filter(Boolean);
  if(!names.length){ ctx.toast('Không có biến nào.'); return; }
  const r = roleEl.value;
  sel[r] = sel[r] || [];
  const set = new Set(sel[r].map(v => v.name));
  for(const n of names){ if(!set.has(n)) sel[r].push({ name:n }); }
  renderPreview();
});

document.getElementById('var-clear').addEventListener('click', () => {
  sel = emptyMap();
  renderPreview();
});

document.getElementById('var-save').addEventListener('click', () => {
  ctx.save('selectedVariables', sel);
  ctx.toast('Đã lưu biến số');
});

    }
