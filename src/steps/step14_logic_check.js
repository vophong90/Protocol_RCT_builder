// src/steps/step14_logic_check.js
// Step 14 – Kiểm tra logic tổng thể (baseline)
// - Thu thập bối cảnh từ state + DOM (fallback)
// - Tạo prompt chuẩn và gọi ctx.callGPT(prompt)
// - Hiển thị kết quả, cho phép lưu/copy/xuất JSON
//
// Yêu cầu tương thích với:
//  - Step 12: textarea id="analysis-desc" (kế hoạch phân tích)
//  - Step 13: textarea id="ethics-desc"   (đạo đức)
//  - State keys: 'pico', 'researchQuestion', 'mainObjective',
//                'interventions', 'selectedVariables', 'analysis', 'ethics'

export async function mount(root, ctx) {
  root.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Kiểm tra logic tổng thể</h3>
    <div class="card-subtitle">
      Đối chiếu tính nhất quán giữa PICO, câu hỏi, mục tiêu, thiết kế/nhánh can thiệp, biến & kế hoạch phân tích, và phần đạo đức.
    </div>
  </div>

  <div class="card-body" style="display:grid; gap:12px;">
    <div class="muted">
      <strong>Bối cảnh (tự động tạo từ các bước):</strong>
      <pre id="logic-context" style="white-space:pre-wrap; margin:0;"></pre>
    </div>

    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button id="logic-run"   class="btn-primary">GPT kiểm tra logic</button>
      <button id="logic-save"  class="btn-secondary">Lưu báo cáo</button>
      <button id="logic-copy"  class="btn-secondary">Sao chép</button>
      <button id="logic-export" class="btn-secondary">Xuất JSON</button>
    </div>

    <label>
      <div style="font-weight:600; margin-bottom:6px;">Kết quả kiểm tra</div>
      <textarea id="logic-fb" rows="18" placeholder="Kết quả GPT sẽ hiển thị ở đây..."></textarea>
    </label>
  </div>
</div>
`.trim();

  // --------- Lấy dữ liệu bối cảnh ----------
  const pico       = ctx.get('pico', {}) || {};
  const rq         = ctx.get('researchQuestion', '') || '';
  const objective  = ctx.get('mainObjective', '') || '';
  const arms       = Array.isArray(ctx.get('interventions', [])) ? ctx.get('interventions', []) : [];
  const numArmsLS  = (typeof localStorage !== 'undefined') ? (localStorage.getItem('num-arms') || '') : '';
  const numArms    = arms.length > 0 ? String(arms.length) : (numArmsLS || 'Không xác định');

  // Biến đã chọn (step 10)
  const selected = normalizeSelected(ctx.get('selectedVariables', {}));

  // Phân tích & Đạo đức: ưu tiên đọc trực tiếp DOM nếu có (đã mount Step 12/13),
  // nếu không thì fallback từ state ('analysis', 'ethics')
  const analysisDom = document.getElementById('analysis-desc');
  const ethicsDom   = document.getElementById('ethics-desc');
  const analysis    = (analysisDom?.value ?? ctx.get('analysis', '') ?? '').trim();
  const ethics      = (ethicsDom?.value   ?? ctx.get('ethics',   '') ?? '').trim();

  // --------- DOM refs ----------
  const ctxEl     = root.querySelector('#logic-context');
  const runBtn    = root.querySelector('#logic-run');
  const saveBtn   = root.querySelector('#logic-save');
  const copyBtn   = root.querySelector('#logic-copy');
  const exportBtn = root.querySelector('#logic-export');
  const fbEl      = root.querySelector('#logic-fb');

  // Hiển thị bối cảnh tóm tắt
  ctxEl.textContent = buildContextSummary();

  // Nếu trước đó đã lưu báo cáo, nạp lại
  const savedReport = ctx.get('logicCheck', '');
  if (savedReport) fbEl.value = savedReport;

  // --------- Events ----------
  runBtn.addEventListener('click', onRun);
  saveBtn.addEventListener('click', onSave);
  copyBtn.addEventListener('click', onCopy);
  exportBtn.addEventListener('click', onExport);

  // =================== Handlers ===================
  async function onRun() {
    const prompt = buildPrompt();
    ctx.toast('Đang kiểm tra logic tổng thể...');
    const res = await ctx.callGPT(prompt);
    if (!res) { ctx.toast('Không nhận được phản hồi.'); return; }
    fbEl.value = res;
    ctx.toast('Đã nhận kết quả từ GPT.');
  }

  function onSave() {
    const text = (fbEl.value || '').trim();
    ctx.save('logicCheck', text);
    ctx.toast('Đã lưu báo cáo kiểm tra logic.');
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(fbEl.value || '');
      ctx.toast('Đã sao chép vào clipboard.');
    } catch {
      ctx.toast('Sao chép không thành công.');
    }
  }

  function onExport() {
    const payload = {
      context: {
        pico,
        researchQuestion: rq,
        mainObjective: objective,
        interventions: arms,
        numArms,
        selectedVariables: summarizeSelected(selected),
        analysis,
        ethics,
      },
      report: (fbEl.value || '').trim(),
      generated_at: new Date().toISOString(),
    };
    ctx.downloadJSON('logic_check_report.json', payload);
  }

  // =================== Builders ===================
  function buildContextSummary() {
    const lines = [];

    lines.push(`PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}`);

    lines.push('');
    lines.push(`Câu hỏi nghiên cứu: ${rq || '(chưa nhập)'}`);
    lines.push(`Mục tiêu chính: ${objective || '(chưa nhập)'}`);

    const armStr = arms.map((x, i) => `Nhánh ${i + 1}: ${armName(x)}`).join(' | ');
    lines.push(`Số nhóm can thiệp: ${numArms}`);
    lines.push(`Can thiệp: ${armStr || '(chưa nhập)'}`);

    lines.push('');
    lines.push('Biến đã chọn:');
    const sum = summarizeSelected(selected);
    Object.entries(sum).forEach(([role, arr]) => {
      lines.push(`- ${roleLabel(role)} (${arr.length}): ${arr.join(', ') || '—'}`);
    });

    lines.push('');
    lines.push(`Kế hoạch phân tích (rút gọn): ${brief(analysis)}`);
    lines.push(`Đạo đức (rút gọn): ${brief(ethics)}`);
    return lines.join('\n');
  }

  function buildPrompt() {
    const variableList = Object.entries(selected)
      .flatMap(([role, arr]) => arr.map(v => `${v.name} (${roleLabel(role)})`))
      .join(', ');

    return `
Bạn là chuyên gia đánh giá đề cương RCT. Hãy kiểm tra **tính nhất quán và logic** giữa các phần bên dưới, chỉ ra mâu thuẫn/thiếu sót cụ thể và đề xuất chỉnh sửa khả thi:

- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}
- Câu hỏi nghiên cứu: ${rq || ''}
- Mục tiêu nghiên cứu: ${objective || ''}
- Số nhóm can thiệp: ${numArms}
- Danh sách biến đã chọn: ${variableList || '(chưa chọn)'}
- Kế hoạch phân tích: ${analysis || '(chưa có)'}
- Đạo đức nghiên cứu: ${ethics || '(chưa có)'}

YÊU CẦU:
1) Chỉ ra các mâu thuẫn/thiếu sót theo gạch đầu dòng, trích dẫn chính xác phần gây mâu thuẫn (nếu có).
2) Đề xuất chỉnh sửa cụ thể: điều chỉnh PICO/câu hỏi/mục tiêu/biến/thiết kế/phân tích/đạo đức. Không bịa số liệu; không đưa placeholder như [tên cơ quan].
3) Ước lượng mức rủi ro logic (thấp/vừa/cao) và liệt kê 3 việc cần làm ngay (Next actions).

Trả lời bằng tiếng Việt, rõ ràng, súc tích, cấu trúc theo mục.`
    .trim();
  }

  // =================== Helpers ===================
  function normalizeSelected(sel) {
    const roles = ['primary','secondary','baseline','confounder','mediator','moderator','safety'];
    const out = {};
    roles.forEach(r => {
      out[r] = Array.isArray(sel?.[r])
        ? sel[r].map(v => ({ name: String(v?.name || '').trim() })).filter(x => x.name)
        : [];
    });
    return out;
  }

  function summarizeSelected(sel) {
    const obj = {};
    Object.keys(sel).forEach(k => { obj[k] = (sel[k] || []).map(v => v.name).sort(alpha); });
    return obj;
  }

  function roleLabel(g) {
    switch ((g||'').toLowerCase()) {
      case 'primary': return 'Kết cục chính';
      case 'secondary': return 'Kết cục phụ';
      case 'baseline': return 'Biến nền';
      case 'confounder': return 'Nhiễu';
      case 'mediator': return 'Trung gian';
      case 'moderator': return 'Điều biến';
      case 'safety': return 'An toàn';
      default: return g;
    }
  }

  function armName(x) {
    if (typeof x === 'string') return x;
    const n = x?.name || x?.label || '';
    return String(n || '').trim() || 'Arm';
  }

  function alpha(a, b) {
    a = (typeof a === 'object' ? a?.name : a) ?? '';
    b = (typeof b === 'object' ? b?.name : b) ?? '';
    a = a.toString().toLowerCase();
    b = b.toString().toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function brief(s, n = 200) {
    const t = (s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? (t.slice(0, n) + '…') : (t || '—');
  }
}
