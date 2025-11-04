export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Sơ đồ nghiên cứu (Mermaid)</h3></div>
  <div class="card-body">
    <textarea id="mm-code" rows="10" placeholder="flowchart TD; A[Assessed] -->|Excluded| B[Not meeting criteria]; ..."></textarea>
    <div class="stack" style="margin:.75rem 0;">
      <button id="mm-render" class="btn-secondary">Render</button>
      <button id="mm-export" class="btn-light">Xuất PNG</button>
    </div>
    <div id="mm-view" class="mermaid"></div>
  </div>
</div>
`.trim();

const mm = ctx.vendor?.mermaid;
const h2c = ctx.vendor?.html2canvas;

function render(){
  const code = document.getElementById('mm-code').value;
  const view = document.getElementById('mm-view');
  view.textContent = code;
  try{
    if(mm){ mm.init(undefined, view); }
  }catch(e){ console.error(e); ctx.toast('Mermaid render lỗi.'); }
}

document.getElementById('mm-render').addEventListener('click', render);

document.getElementById('mm-export').addEventListener('click', async () => {
  const node = document.getElementById('mm-view');
  if(!h2c){ ctx.toast('Thiếu html2canvas'); return; }
  const c = await h2c(node);
  c.toBlob(b => {
    if(!b) return;
    const url = URL.createObjectURL(b);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'flow.png' });
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
  });
});

    }
