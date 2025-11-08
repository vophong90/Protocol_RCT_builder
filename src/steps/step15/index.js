export const id = 15;
export const title = "Sơ đồ nghiên cứu (Mermaid)";
export const subtitle = "";
export const css = null;

export async function mount(rootEl, ctx){
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Sơ đồ nghiên cứu</h3>
      <div class="card-subtitle">Mermaid sẽ được gắn sau khi port.</div>
    </div>
    <div class="card-body">
      <div class="muted">Stub.</div>
    </div>`;
}
