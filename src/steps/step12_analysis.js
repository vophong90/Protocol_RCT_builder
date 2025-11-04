// src/steps/step12_analysis.js
// Step 12 – Phân tích số liệu (baseline)
// - Textarea #analysis-desc để nhập/ký gửi kế hoạch phân tích
// - GPT gợi ý kế hoạch phân tích dựa vào PICO, mục tiêu, thiết kế, biến, lịch thu thập
// - GPT đánh giá kế hoạch hiện có
// - Lưu vào state 'analysis' và xuất JSON
//
// Lưu ý: Step 14 (Kiểm tra logic) đọc #analysis-desc, nên giữ đúng id này.

export async function mount(root, ctx) {
  root.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Kế hoạch phân tích số liệu</h3>
    <div class="card-subtitle">
      Mô tả bộ phân tích (ITT/PP), biến kết cục chính/phụ, mô hình/kiểm định, điều chỉnh nhiễu, xử lý thiếu dữ liệu, phân tích dưới nhóm và nhạy cảm.
    </div>
  </div>

  <div class="card-body" style="display:grid; gap:12px;">
    <div class="muted">
      <strong>Tóm tắt bối cảnh (để bạn tham khảo):</strong>
      <div id="anl-context" style="white-space:pre-wrap;"></div>
    </div>

    <label>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <span><strong>Bản thảo kế hoạch phân tích</strong></span>
        <span style="display:flex; gap:8px;">
          <button id="anl-suggest" class="btn-secondary">GPT gợi ý</button>
          <button id="anl-eval" class="btn-secondary">GPT đánh giá</button>
        </span>
      </div>
      <textarea id="analysis-desc" rows="16" placeholder="Mô tả chi tiết kế hoạch phân tích (tiếng Việt)..."></textarea>
    </label>
  </div>

  <div class="card-footer" style="display:flex; gap:10px; flex-wrap:wrap;">
    <button id="anl-save" class="btn-primary">Lưu</button>
    <button id="anl-export" class="btn-secondary">Xuất JSON</button>
  </div>
</div>
`.trim();

  // ---------- Lấy dữ liệu bối cảnh từ các bước trước ----------
  const pico          = ctx.get('pico', {}) || {};
  const mainObj       = ctx.get('mainObjective', '') || '';
  const subObjs       = ctx.get('subObjectives', []) || [];
  const design        = ctx.get('design', {}) || {};
  const interventions = ctx.get('interventions', []) || [];   // từ step 9
  const selVars       = normalizeSelected(ctx.get('selectedVariables', {})); // step 10
  const dc            = normalizeDataCollection(ctx.get('dataCollection', {})); // step 11
  const sampleSize    = ctx.get('sampleSize', {}) || {};      // nếu có từ step 7

  // ---------- DOM ----------
  const ctxEl     = root.querySelector('#anl-context');
  const descEl    = root.querySelector('#analysis-desc');
  const saveBtn   = root.querySelector('#anl-save');
  const exportBtn = root.querySelector('#anl-export');
  const suggestBtn= root.querySelector('#anl-suggest');
  const evalBtn   = root.querySelector('#anl-eval');

  // Điền context tóm tắt
  ctxEl.textContent = makeContextSummary();

  // Nạp bản thảo nếu đã lưu
  descEl.value = ctx.get('analysis', '') || '';

  // ---------- Sự kiện ----------
  saveBtn.addEventListener('click', onSave);
  exportBtn.addEventListener('click', onExport);
  suggestBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  // ======================== Handlers =========================
  function onSave() {
    const text = (descEl.value || '').trim();
    ctx.save('analysis', text);
    ctx.toast('Đã lưu kế hoạch phân tích.');
  }

  function onExport() {
    const payload = {
      analysis: (descEl.value || '').trim(),
      context: {
        pico, mainObjective: mainObj, subObjectives: subObjs,
        design, interventions, selectedVariables: selVars,
        dataCollection: dc, sampleSize
      }
    };
    ctx.downloadJSON('analysis_plan.json', payload);
  }

  async function onSuggest() {
    const prompt = `
Bạn là chuyên gia thống kê lâm sàng. Hãy viết **kế hoạch phân tích số liệu** súc tích, theo dàn ý dưới đây, bằng tiếng Việt, phù hợp bối cảnh nghiên cứu. Không viết phần thừa:
1) Tập phân tích: ITT (primary), PP (sensitivity). Xử lý protocol deviations (ngắn gọn).
2) Mô tả dữ liệu: thống kê mô tả theo nhóm, kiểm tra phân phối, ngoại lai.
3) Kết cục chính: chỉ rõ biến, thời điểm đánh giá, thước đo hiệu quả, mô hình/kiểm định (theo thiết kế). Điều chỉnh nhiễu (nêu rõ biến nền). Báo cáo ước lượng (chênh lệch trung bình/OR/HR...), CI95%, p.
4) Kết cục phụ: tóm tắt mô hình/kiểm định tương ứng, tránh lặp lại dài dòng.
5) Dữ liệu lặp theo thời gian (nếu có): mô hình hỗn hợp lặp đo hoặc GEE, nêu cấu trúc hiệp phương sai.
6) Xử lý thiếu dữ liệu: cơ chế thiếu, phương án (MI/FIML/LOCF – nêu khi phù hợp) và phân tích nhạy cảm.
7) Phân tích dưới nhóm (nếu có): cách kiểm định tương tác, giới hạn suy luận.
8) Kiểm định giả định mô hình & chẩn đoán: phương pháp và xử lý khi vi phạm.
9) Kiểm soát đa so sánh (nếu cần): cách điều chỉnh.
10) Phân tích an toàn: định nghĩa AE/SAE, cách tổng hợp so nhóm.
11) Trình bày kết quả: loại bảng/biểu đồ chính, nguyên tắc làm tròn và báo cáo.

Bối cảnh:
PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Mục tiêu chính: ${mainObj}
Mục tiêu phụ: ${JSON.stringify(subObjs || [])}

Thiết kế: ${jsonSafe(design)}
Can thiệp (nhánh): ${jsonSafe(interventions)}
Cỡ mẫu (nếu có): ${jsonSafe(sampleSize)}

Biến đã chọn (theo nhóm):
${JSON.stringify(summarizeSelected(selVars), null, 2).slice(0, 2000)}

Lịch thu thập:
${JSON.stringify(dc, null, 2).slice(0, 2000)}

Yêu cầu:
- Viết **một đoạn kế hoạch** hoàn chỉnh, rõ ràng, có cấu trúc mục nhỏ như dàn ý trên.
- Không bịa biến mới ngoài danh sách biến đã có.
- Nếu cần ví dụ thông số (như cấu trúc tương quan), nêu theo thông lệ chung, không gắn số giả cụ thể.
`.trim();

    ctx.toast('Đang gợi ý kế hoạch phân tích từ GPT...');
    const text = await ctx.callGPT(prompt);
    if (!text) { ctx.toast('Không nhận được gợi ý.'); return; }
    // Ghi đè vào textarea (để người dùng duyệt/sửa)
    descEl.value = text;
    ctx.toast('Đã chèn gợi ý vào bản thảo.');
  }

  async function onEvaluate() {
    const draft = (descEl.value || '').trim();
    if (!draft) { ctx.toast('Chưa có nội dung để đánh giá.'); return; }

    const prompt = `
Bạn là phản biện thống kê. Hãy **đánh giá kế hoạch phân tích** dưới đây theo 6 tiêu chí:
1) Phù hợp mục tiêu/kết cục
2) Phù hợp thiết kế/ngẫu nhiên
3) Xử lý nhiễu/thành phần nền
4) Thiếu dữ liệu & phân tích nhạy cảm
5) Kiểm định giả định & chẩn đoán
6) Tính tái lập & cách báo cáo

Mỗi tiêu chí phản hồi ngắn (2–3 câu), nêu điểm mạnh và đề xuất chỉnh sửa cụ thể.
Ngữ cảnh (rút gọn):
- Mục tiêu chính: ${mainObj}
- Thiết kế: ${jsonSafe(design)}
- Kết cục & biến: ${JSON.stringify(summarizeSelected(selVars), null, 0).slice(0, 500)}
- Lịch thu thập (số mốc: ${dc.timepoints.length})

Bản thảo cần đánh giá:
---
${draft.slice(0, 6000)}
---`.trim();

    ctx.toast('Đang đánh giá bản thảo phân tích...');
    const fb = await ctx.callGPT(prompt);
    showFeedbackDialog(fb || 'Không nhận được phản hồi.');
  }

  // ======================== Helpers =========================
  function makeContextSummary() {
    const lines = [];
    lines.push(`PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}`);

    lines.push('');
    lines.push(`Mục tiêu:
- Chính: ${mainObj || '(chưa nhập)'}
- Phụ: ${(subObjs || []).length ? (subObjs.map((x,i)=>`(${i+1}) ${x}`).join(' | ')) : '(chưa có)'}`);

    const arms = (interventions || []).map((x,i)=>`Nhánh ${i+1}: ${typeof x==='string'?x: (x?.name||('Arm '+(i+1)))}`).join(' | ');
    lines.push('');
    lines.push(`Thiết kế: ${jsonSafe(design)}`);
    lines.push(`Can thiệp: ${arms || '(chưa nhập)'}`);

    lines.push('');
    const varSum = summarizeSelected(selVars);
    lines.push('Biến đã chọn:');
    Object.entries(varSum).forEach(([g, arr]) => {
      lines.push(`- ${groupLabel(g)} (${arr.length}): ${arr.join(', ') || '—'}`);
    });

    lines.push('');
    lines.push(`Lịch thu thập: ${dc.timepoints.length} mốc`);
    if (dc.timepoints.length) {
      lines.push('  ' + dc.timepoints.map(tp => `${tp.label} (ngày ${tp.day})`).join(' • '));
    }
    return lines.join('\n');
  }

  function normalizeSelected(sel) {
    const keys = ['primary','secondary','baseline','confounder','mediator','moderator','safety'];
    const out = {};
    keys.forEach(k => {
      out[k] = Array.isArray(sel?.[k]) ? sel[k].map(v => ({ name: String(v.name||'').trim() })).filter(x => x.name) : [];
    });
    return out;
  }

  function summarizeSelected(sel) {
    const obj = {};
    Object.keys(sel).forEach(k => {
      obj[k] = (sel[k] || []).map(v => v.name).sort(alpha);
    });
    return obj;
  }

  function normalizeDataCollection(x) {
    const timepoints = Array.isArray(x?.timepoints) ? x.timepoints.map(tp => ({
      id: String(tp.id || '').trim() || makeId(tp.label, tp.day),
      label: String(tp.label || '').trim() || 'Mốc',
      day: num(tp.day),
    })).filter(tp => tp.id && !Number.isNaN(tp.day)) : [];

    const assignments = {};
    if (x && typeof x.assignments === 'object') {
      Object.entries(x.assignments).forEach(([name, arr]) => {
        if (!name) return;
        assignments[name] = Array.isArray(arr) ? arr.map(String) : [];
      });
    }
    return { timepoints, assignments };
  }

  function groupLabel(g) {
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

  function alpha(a, b) {
    a = (typeof a === 'object' ? a?.name : a) ?? '';
    b = (typeof b === 'object' ? b?.name : b) ?? '';
    a = a.toString().toLowerCase();
    b = b.toString().toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  }

  function makeId(label, day) {
    const d = num(day);
    const slug = String(label || '').toLowerCase()
      .replace(/[()]/g,'').replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').replace(/_+/g,'_');
    return `${slug || 'tp'}_d${Number.isNaN(d) ? 'x' : d}`;
  }

  function jsonSafe(x) { try { return JSON.stringify(x); } catch { return String(x); } }

  function showFeedbackDialog(text) {
    const id = 'anl-fb-dialog';
    let dlg = document.getElementById(id);
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.id = id;
      dlg.style.position = 'fixed';
      dlg.style.inset = '0';
      dlg.style.background = 'rgba(0,0,0,.4)';
      dlg.style.zIndex = '60';
      dlg.style.display = 'flex';
      dlg.style.alignItems = 'center';
      dlg.style.justifyContent = 'center';
      dlg.innerHTML = `
        <div style="background:#fff; max-width:780px; width:92vw; padding:18px; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.24)">
          <div style="font-weight:700; margin-bottom:8px;">Đánh giá kế hoạch phân tích</div>
          <div id="anl-fb-text" style="white-space:pre-wrap; line-height:1.4; max-height:60vh; overflow:auto;"></div>
          <div style="display:flex; justify-content:flex-end; margin-top:12px;">
            <button id="anl-fb-close" class="btn-primary">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(dlg);
      dlg.querySelector('#anl-fb-close').addEventListener('click', () => dlg.remove());
    }
    dlg.querySelector('#anl-fb-text').textContent = text;
  }
}
