// src/steps/step1/index.js
export const id = 1;
export const title = "Câu hỏi nghiên cứu";
export const subtitle = "";
export const css = null;

export async function mount(rootEl, ctx){
  const rq = ctx.get('researchQuestion', '') || '';
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Câu hỏi nghiên cứu</h3>
      <div class="card-subtitle">Ghi câu hỏi chính của đề cương.</div>
    </div>
    <div class="card-body grid-1">
      <label>Câu hỏi
        <textarea id="rq-ta" rows="4" placeholder="Ví dụ: Ở [P], can thiệp [I] so với [C] có cải thiện [O] không?">${rq}</textarea>
      </label>
    </div>
    <div class="card-footer">
      <button id="rq-save" class="btn btn-primary" type="button">Lưu câu hỏi</button>
    </div>
  `;
  document.getElementById('rq-save').addEventListener('click', () => {
    const val = (document.getElementById('rq-ta').value || '').trim();
    ctx.save('researchQuestion', val);
    ctx.toast('Đã lưu câu hỏi');
  });
}
