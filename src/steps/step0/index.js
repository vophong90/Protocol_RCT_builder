export const id = 0;
export const title = "PICO";
export const subtitle = "";
export const css = null;

export async function mount(rootEl, ctx){
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">PICO (demo shell)</h3>
      <div class="card-subtitle">Đây là vỏ refactor, chưa dùng dữ liệu thật.</div>
    </div>
    <div class="card-body">
      <div class="muted">Bạn đang xem index_refactor.html (song song với app cũ).</div>
    </div>`;
}
