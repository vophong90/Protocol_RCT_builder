export async function mount(el, ctx) {
      el.innerHTML = `
<div class="card">
  <div class="card-header"><h3 class="card-title">Kiểm tra logic</h3></div>
  <div class="card-body">
    <button id="logic-run" class="btn-secondary">Chạy kiểm tra</button>
    <div id="logic-out" class="prose" style="margin-top:1rem;"></div>
  </div>
</div>
`.trim();

async function run(){
  const s = ctx.get();
  const pico = s.pico || {};
  const objective = s.mainObjective || '';
  const interventions = s.interventions || [];
  const numArms = localStorage.getItem('num-arms') || String(Array.isArray(interventions)?interventions.length: 'Không xác định');

  const selected = s.selectedVariables || {};
  const variableList = Object.entries(selected).flatMap(([role, vars]) =>
    (vars||[]).map(v => `${v.name} (${role})`)
  ).join(', ');

  const analysis = s.analysisDesc || '';
  const ethics = s.ethicsDesc || '';

  const prompt = `
Bạn là chuyên gia đánh giá đề cương RCT. Hãy kiểm tra tính nhất quán và logic giữa các phần sau:

- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}
- Mục tiêu nghiên cứu: ${objective}
- Số nhóm can thiệp: ${numArms}
- Các nhánh can thiệp: ${interventions.join(' | ')}
- Danh sách biến số: ${variableList}
- Kế hoạch phân tích: ${analysis}
- Đạo đức nghiên cứu: ${ethics}

Yêu cầu:
1) Chỉ ra các mâu thuẫn/thiếu dữ liệu/không khả thi (nếu có).
2) Gợi ý chỉnh theo hướng nhất quán, nhưng KHÔNG thay đổi mục tiêu gốc.
3) Đưa checklist ngắn cần hoàn thiện (gạch đầu dòng).`;

  const out = document.getElementById('logic-out');
  out.innerHTML = '<div class="muted">Đang kiểm tra...</div>';
  const res = await ctx.callGPT(prompt);
  out.innerHTML = res ? `<pre class="pre-wrap">${ctx.vendor ? (res) : res}</pre>` : '<span style="color:#b91c1c">Không nhận được phản hồi.</span>';
}

document.getElementById('logic-run').addEventListener('click', run);

    }
