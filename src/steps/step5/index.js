export const id = 5;
export const title = "Thiết kế nghiên cứu";
export const subtitle = "";
export const css = "/public/css/steps/step5.css";

export async function mount(rootEl, ctx){
  rootEl.closest('.step')?.setAttribute('data-scope', 'step5');
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Thiết kế nghiên cứu (demo)</h3>
      <div class="card-subtitle">Sau khi nhận code Step 5 cũ, mình sẽ port vào đây.</div>
    </div>
    <div class="card-body">
      <div class="pill">Song song</div>
      <div class="pill">Double-blind</div>
      <div class="pill">1:1</div>
      <div class="pill">2 nhánh</div>
    </div>`;
}
