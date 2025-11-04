export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Mô tả can thiệp</h3></div>
  <div class="card-body">
    <label>Số nhánh can thiệp
      <input id="num-arms" type="number" min="1" max="10" step="1" value="2"/>
    </label>
    <div id="arms" class="stack" style="margin-top:.75rem;"></div>
  </div>
  <div class="card-footer"><button id="arms-save" class="btn-primary">Lưu</button></div>
</div>
`.trim();

const armsWrap = document.getElementById('arms');
const numEl = document.getElementById('num-arms');
const st = ctx.get('interventions', []);
const savedNum = parseInt(localStorage.getItem('num-arms') || String(Math.max(2, st.length || 2)),10);
numEl.value = isNaN(savedNum) ? 2 : savedNum;

function render(){
  armsWrap.innerHTML='';
  const n = parseInt(numEl.value,10) || 1;
  for(let i=0;i<n;i++){
    const v = st[i] || '';
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<label>Nhánh ${i+1}<textarea data-idx="${i}" rows="3" placeholder="Mô tả nhánh ${i+1}"></textarea></label>`;
    armsWrap.appendChild(row);
    row.querySelector('textarea').value = v;
  }
}
numEl.addEventListener('change', render);
render();

document.getElementById('arms-save').addEventListener('click', () => {
  const n = parseInt(numEl.value,10) || 1;
  const vals = Array.from(armsWrap.querySelectorAll('textarea')).slice(0,n).map(t => t.value.trim());
  ctx.save('interventions', vals);
  localStorage.setItem('num-arms', String(n)); // giữ tương thích logic cũ
  ctx.toast('Đã lưu can thiệp & số nhánh');
});

    }
