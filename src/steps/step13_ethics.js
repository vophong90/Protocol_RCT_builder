// src/steps/step13_ethics.js
// Step 13 – Đạo đức nghiên cứu (baseline)
// - Textarea #ethics-desc để mô tả các khía cạnh đạo đức
// - GPT gợi ý nội dung đạo đức dựa trên PICO, thiết kế, can thiệp, thu thập dữ liệu
// - GPT đánh giá bản thảo đạo đức hiện tại
// - Lưu vào state 'ethics' và cho phép xuất JSON
//
// Lưu ý: Step 14 (Kiểm tra logic) đọc #ethics-desc, nên giữ đúng id này.

export async function mount(root, ctx) {
  root.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Đạo đức nghiên cứu</h3>
    <div class="card-subtitle">
      Trình bày phê duyệt HĐĐĐ/IRB, đồng thuận tham gia, nguy cơ–lợi ích, bảo mật dữ liệu, báo cáo AE/SAE, giám sát an toàn, đối tượng dễ tổn thương, đăng ký thử nghiệm, bồi hoàn/bảo hiểm, và tuân thủ GCP.
    </div>
  </div>

  <div class="card-body" style="display:grid; gap:12px;">
    <div class="muted">
      <strong>Tóm tắt bối cảnh (tham khảo):</strong>
      <div id="eth-context" style="white-space:pre-wrap;"></div>
    </div>

    <label>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <span><strong>Bản thảo phần Đạo đức</strong></span>
        <span style="display:flex; gap:8px;">
          <button id="eth-suggest" class="btn-secondary">GPT gợi ý</button>
          <button id="eth-eval" class="btn-secondary">GPT đánh giá</button>
        </span>
      </div>
      <textarea id="ethics-desc" rows="16" placeholder="Mô tả chi tiết các vấn đề đạo đức (tiếng Việt)..."></textarea>
    </label>
  </div>

  <div class="card-footer" style="display:flex; gap:10px; flex-wrap:wrap;">
    <button id="eth-save" class="btn-primary">Lưu</button>
    <button id="eth-export" class="btn-secondary">Xuất JSON</button>
  </div>
</div>
`.trim();

  // --------- Lấy dữ liệu bối cảnh cần thiết từ state ----------
  const pico          = ctx.get('pico', {}) || {};
  const design        = ctx.get('design', {}) || {};
  const interventions = ctx.get('interventions', []) || [];
  const dc            = normalizeDataCollection(ctx.get('dataCollection', {})); // step 11
  const sampleSize    = ctx.get('sampleSize', {}) || {};
  const variablesSel  = normalizeSelected(ctx.get('selectedVariables', {}));    // step 10

  // --------- DOM ----------
  const ctxEl      = root.querySelector('#eth-context');
  const descEl     = root.querySelector('#ethics-desc');
  const saveBtn    = root.querySelector('#eth-save');
  const exportBtn  = root.querySelector('#eth-export');
  const suggestBtn = root.querySelector('#eth-suggest');
  const evalBtn    = root.querySelector('#eth-eval');

  // Hiển thị bối cảnh tóm tắt
  ctxEl.textContent = makeContextSummary();

  // Nạp bản thảo đã lưu (nếu có)
  descEl.value = ctx.get('ethics', '') || '';

  // --------- Sự kiện ----------
  saveBtn.addEventListener('click', onSave);
  exportBtn.addEventListener('click', onExport);
  suggestBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  // =================== Handlers ===================
  function onSave() {
    const text = (descEl.value || '').trim();
    ctx.save('ethics', text);
    ctx.toast('Đã lưu phần Đạo đức.');
  }

  function onExport() {
    const payload = {
      ethics: (descEl.value || '').trim(),
      context: {
        pico, design, interventions,
        dataCollection: dc,
        sampleSize,
        selectedVariables: summarizeSelected(variablesSel)
      }
    };
    ctx.downloadJSON('ethics_section.json', payload);
  }

  async function onSuggest() {
    const prompt = `
Bạn là chuyên gia đạo đức nghiên cứu lâm sàng. Viết **phần Đạo đức** ngắn gọn, đầy đủ, phù hợp bối cảnh sau; không chèn số liệu giả, không bịa thông tin ngoài bối cảnh:

Bối cảnh:
PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Thiết kế: ${jsonSafe(design)}
Can thiệp (các nhánh): ${jsonSafe(interventions)}
Cỡ mẫu (nếu có): ${jsonSafe(sampleSize)}
Lịch thu thập (mốc: ${dc.timepoints.length}): ${dc.timepoints.map(t=>t.label).join(', ')}

Biến quan tâm (tóm tắt):
${JSON.stringify(summarizeSelected(variablesSel), null, 2).slice(0, 1600)}

Yêu cầu nội dung theo dàn ý:
1) Phê duyệt HĐĐĐ/IRB và tuân thủ GCP/Declaration of Helsinki (nói chung).
2) Đồng thuận tham gia: quy trình, quyền rút lui, tài liệu thông tin.
3) Phân tích nguy cơ–lợi ích: theo tính chất can thiệp trong bối cảnh trên; biện pháp giảm thiểu nguy cơ.
4) Bảo mật & riêng tư dữ liệu: ẩn danh/giả danh, lưu trữ/bảo vệ, quyền truy cập.
5) Báo cáo và xử trí AE/SAE: định nghĩa, quy trình ghi nhận, thời hạn và thẩm quyền báo cáo; xử trí khẩn cấp và unblinding (nếu có).
6) Giám sát an toàn (DSMB hoặc tương đương) và tiêu chí dừng sớm (nếu phù hợp với thiết kế).
7) Đối tượng dễ tổn thương (nếu có): biện pháp bảo vệ bổ sung.
8) Bồi hoàn/bảo hiểm cho người tham gia (nếu áp dụng).
9) Đăng ký thử nghiệm lâm sàng và quyền tiếp cận kết quả; chia sẻ dữ liệu (nếu có chính sách).
10) Tuân thủ quy định pháp lý/địa phương hiện hành (nói chung, không chỉ định cơ quan cụ thể).

Viết bằng tiếng Việt, mạch lạc, theo các mục nhỏ; không lặp ý, không dùng placeholder như [tên cơ quan].`.trim();

    ctx.toast('Đang gợi ý phần Đạo đức từ GPT...');
    const text = await ctx.callGPT(prompt);
    if (!text) { ctx.toast('Không nhận được gợi ý.'); return; }
    descEl.value = text;
    ctx.toast('Đã chèn gợi ý vào bản thảo.');
  }

  async function onEvaluate() {
    const draft = (descEl.value || '').trim();
    if (!draft) { ctx.toast('Chưa có nội dung để đánh giá.'); return; }

    const prompt = `
Bạn là phản biện đạo đức nghiên cứu. **Đánh giá** đoạn "Đạo đức" dưới đây theo 7 tiêu chí, mỗi tiêu chí 2–3 câu, nêu điểm đạt/chưa đạt và đề xuất chỉnh sửa cụ thể:
1) IRB/HĐĐĐ & chuẩn mực GCP/Helsinki
2) Đồng thuận tham gia (thông tin, quyền rút lui)
3) Nguy cơ–lợi ích & biện pháp giảm thiểu
4) Bảo mật/riêng tư & quản trị dữ liệu
5) AE/SAE: định nghĩa, ghi nhận, báo cáo, xử trí khẩn
6) Giám sát an toàn/DSMB & tiêu chí dừng sớm (nếu phù hợp thiết kế)
7) Đối tượng dễ tổn thương, bồi hoàn/bảo hiểm, đăng ký thử nghiệm & công bố kết quả

Ngữ cảnh rút gọn:
- Thiết kế: ${jsonSafe(design)}
- Can thiệp: ${jsonSafe(interventions)}
- Thu thập dữ liệu: mốc ${dc.timepoints.length}

Bản thảo:
---
${draft.slice(0, 6000)}
---`.trim();

    ctx.toast('Đang đánh giá phần Đạo đức...');
    const fb = await ctx.callGPT(prompt);
    showFeedbackDialog(fb || 'Không nhận được phản hồi.');
  }

  // =================== Helpers ===================
  function makeContextSummary() {
    const lines = [];
    lines.push(`PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}`);

    lines.push('');
    lines.push(`Thiết kế: ${jsonSafe(design)}`);
    const arms = (interventions || []).map((x,i)=>`Nhánh ${i+1}: ${typeof x==='string'?x:(x?.name||('Arm '+(i+1)))}`).join(' | ');
    lines.push(`Can thiệp: ${arms || '(chưa nhập)'}`);

    lines.push('');
    lines.push(`Lịch thu thập: ${dc.timepoints.length} mốc`);
    if (dc.timepoints.length) {
      lines.push('  ' + dc.timepoints.map(tp => `${tp.label} (ngày ${tp.day})`).join(' • '));
    }

    const varSum = summarizeSelected(variablesSel);
    lines.push('');
    lines.push('Biến quan tâm:');
    Object.entries(varSum).forEach(([g, arr]) => {
      lines.push(`- ${groupLabel(g)} (${arr.length}): ${arr.join(', ') || '—'}`);
    });
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
    const id = 'eth-fb-dialog';
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
          <div style="font-weight:700; margin-bottom:8px;">Đánh giá phần Đạo đức</div>
          <div id="eth-fb-text" style="white-space:pre-wrap; line-height:1.4; max-height:60vh; overflow:auto;"></div>
          <div style="display:flex; justify-content:flex-end; margin-top:12px;">
            <button id="eth-fb-close" class="btn-primary">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(dlg);
      dlg.querySelector('#eth-fb-close').addEventListener('click', () => dlg.remove());
    }
    dlg.querySelector('#eth-fb-text').textContent = text;
  }
}
