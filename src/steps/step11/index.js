// src/steps/step12_analysis.js
// Step 12 – Kế hoạch phân tích số liệu
// - Sử dụng thông tin từ PICO, mục tiêu, thiết kế, biến và lịch thu thập
// - GPT gợi ý kế hoạch phân tích (giống một SAP rút gọn)
// - GPT đánh giá kế hoạch hiện tại
// - Lưu state vào 'analysisPlan' và cho phép xuất JSON

export async function mount(root, ctx) {
  // Gán scope để CSS step12 không ảnh hưởng step khác
  root.closest('.step')?.setAttribute('data-scope', 'step12');

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Kế hoạch phân tích số liệu</h3>
        <div class="card-subtitle">
          Phác thảo <strong>kế hoạch phân tích</strong> cho kết cục chính, kết cục phụ, an toàn và phân tích thăm dò.
          Đây là bản SAP rút gọn, bám sát PICO, mục tiêu, thiết kế và lịch thu thập dữ liệu.
        </div>
      </div>

      <div class="card-body">
        <div class="muted small">
          Gợi ý: mô tả rõ <em>kết cục chính</em>, mô hình thống kê sử dụng, xử lý mất mẫu, phân tích nhạy cảm...
        </div>

        <div class="grid-2 analysis-grid">
          <div>
            <h4 class="section-title">1. Phân tích cho kết cục chính</h4>
            <p class="muted small">
              Mô tả biến kết cục chính, mô hình (ví dụ: t-test, ANCOVA, mixed model), covariates điều chỉnh,
              cách kiểm định giả thuyết, xử lý mất mẫu (LOCF, multiple imputation...), mức ý nghĩa, CI...
            </p>
            <textarea id="analysis-primary" rows="8" placeholder="Ví dụ: So sánh thay đổi trung bình VAS giữa các nhóm bằng mô hình ANCOVA, điều chỉnh giá trị baseline, tuổi, giới..."></textarea>
            <div id="wc-primary" class="muted tiny wc-row">0 từ</div>
          </div>

          <div>
            <h4 class="section-title">2. Kết cục phụ và phân tích an toàn</h4>
            <p class="muted small">
              Liệt kê kết cục phụ, chỉ định phương pháp phân tích cho từng loại biến (liên tục, tỷ lệ, thời gian đến biến cố),
              cách hiệu chỉnh đa so sánh (nếu có), cách mô tả và so sánh các biến an toàn (AE/SAE, xét nghiệm...).
            </p>
            <textarea id="analysis-secondary" rows="8" placeholder="Ví dụ: Kết cục phụ phân tích mô tả & so sánh bằng chi-square, logistic regression; biến an toàn mô tả tần suất và tỷ lệ giữa các nhóm..."></textarea>
            <div id="wc-secondary" class="muted tiny wc-row">0 từ</div>
          </div>

          <div class="full-span">
            <h4 class="section-title">3. Phân tích thăm dò / phân tích thêm</h4>
            <p class="muted small">
              Nêu các phân tích thăm dò (subgroup, exploratory), phân tích trung gian/mô hình cấu trúc nếu có,
              và cách trình bày để tránh diễn giải quá mức.
            </p>
            <textarea id="analysis-exploratory" rows="5" placeholder="Ví dụ: Phân tích thăm dò theo nhóm tuổi & giới, mô hình tương tác nhóm*thời gian; phân tích trung gian nếu phù hợp..."></textarea>
            <div id="wc-exploratory" class="muted tiny wc-row">0 từ</div>
          </div>
        </div>

        <div class="btn-row">
          <button id="btn-gpt-suggest" class="btn btn-secondary">
            GPT gợi ý kế hoạch phân tích
          </button>
          <button id="btn-gpt-eval" class="btn btn-secondary">
            GPT đánh giá kế hoạch hiện tại
          </button>
        </div>

        <div class="muted small">
          Lưu ý: Kế hoạch GPT gợi ý chỉ mang tính tham khảo, bạn cần hiệu chỉnh để phù hợp thực tế nghiên cứu
          và tham khảo thêm ý kiến chuyên gia thống kê.
        </div>
      </div>

      <div class="card-footer">
        <button id="btn-save" class="btn btn-primary">Lưu</button>
        <button id="btn-export" class="btn btn-secondary">Xuất JSON</button>
      </div>
    </div>
  `.trim();

  // ========= DOM =========
  const primaryEl     = root.querySelector('#analysis-primary');
  const secondaryEl   = root.querySelector('#analysis-secondary');
  const exploratoryEl = root.querySelector('#analysis-exploratory');

  const wcPrimaryEl   = root.querySelector('#wc-primary');
  const wcSecondaryEl = root.querySelector('#wc-secondary');
  const wcExplEl      = root.querySelector('#wc-exploratory');

  const saveBtn       = root.querySelector('#btn-save');
  const exportBtn     = root.querySelector('#btn-export');
  const suggestBtn    = root.querySelector('#btn-gpt-suggest');
  const evalBtn       = root.querySelector('#btn-gpt-eval');

  // ========= State init =========
  let plan = normalizePlan(ctx.get('analysisPlan', {}));
  primaryEl.value     = plan.primary;
  secondaryEl.value   = plan.secondary;
  exploratoryEl.value = plan.exploratory;
  updateWordCounts();

  // ========= Events =========
  primaryEl.addEventListener('input', onChange);
  secondaryEl.addEventListener('input', onChange);
  exploratoryEl.addEventListener('input', onChange);

  saveBtn.addEventListener('click', onSave);
  exportBtn.addEventListener('click', onExport);
  suggestBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  function onChange() {
    plan = getCurrentPlan();
    updateWordCounts();
  }

  function getCurrentPlan() {
    return {
      primary: (primaryEl.value || '').trim(),
      secondary: (secondaryEl.value || '').trim(),
      exploratory: (exploratoryEl.value || '').trim(),
    };
  }

  function updateWordCounts() {
    wcPrimaryEl.textContent   = wordCountLabel(primaryEl.value);
    wcSecondaryEl.textContent = wordCountLabel(secondaryEl.value);
    wcExplEl.textContent      = wordCountLabel(exploratoryEl.value);
  }

  function wordCountLabel(text) {
    const n = (text || '')
      .split(/\s+/)
      .filter(Boolean).length;
    return `${n} từ`;
  }

  // ===== Save / Export =====
  function onSave() {
    plan = getCurrentPlan();
    ctx.save('analysisPlan', plan);
    ctx.toast('Đã lưu kế hoạch phân tích.');
  }

  function onExport() {
    plan = getCurrentPlan();
    ctx.downloadJSON('analysis_plan.json', plan);
  }

  // ===== GPT suggest =====
  async function onSuggest() {
    const pico          = ctx.get('pico', {}) || {};
    const objective     = ctx.get('mainObjective', '') || '';
    const design        = ctx.get('design', {}) || {};
    const interventions = ctx.get('interventions', []) || [];
    const vars          = ctx.get('selectedVariables', {}) || {};
    const dataColl      = ctx.get('dataCollection', {}) || {};
    const sampleSize    = ctx.get('sampleSize', {}) || {};

    const prompt = `
Bạn là chuyên gia thống kê lâm sàng, hãy đề xuất **kế hoạch phân tích số liệu** cho một thử nghiệm lâm sàng ngẫu nhiên có đối chứng.

Yêu cầu:
- Viết bằng tiếng Việt, văn phong học thuật, súc tích nhưng đủ chi tiết để đưa vào mục "Phân tích số liệu" của đề cương.
- Trình bày theo ba phần:
  1) Phân tích kết cục chính
  2) Phân tích kết cục phụ và an toàn
  3) Phân tích thăm dò / phân tích thêm
- Cần nêu rõ:
  - Biến kết cục chính, loại biến, mô hình thống kê dự kiến
  - Covariates điều chỉnh, chiến lược xử lý mất mẫu
  - Cách hiệu chỉnh đa so sánh (nếu dùng), mức ý nghĩa, khoảng tin cậy
  - Cách phân tích và trình bày biến an toàn
- Trả về **JSON đúng định dạng** (không thêm khóa khác, không thêm chú thích ngoài JSON):

{
  "primary": "Nội dung phân tích kết cục chính...",
  "secondary": "Nội dung phân tích kết cục phụ và an toàn...",
  "exploratory": "Nội dung phân tích thăm dò..."
}

Bối cảnh nghiên cứu:

PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Mục tiêu chính:
${objective || '[chưa khai báo]'}

Thiết kế:
${jsonSafe(design)}

Can thiệp:
${jsonSafe(interventions)}

Cỡ mẫu (nếu có):
${jsonSafe(sampleSize)}

Danh mục biến theo nhóm:
${JSON.stringify(vars, null, 2).slice(0, 2500)}

Kế hoạch thu thập dữ liệu (rút gọn):
${JSON.stringify(dataColl, null, 2).slice(0, 2500)}
`.trim();

    ctx.toast('Đang gợi ý kế hoạch phân tích từ GPT...');
    const raw = await ctx.callGPT(prompt);
    const j = safeParse(raw);
    if (!j || typeof j.primary !== 'string') {
      ctx.toast('GPT không trả về JSON hợp lệ. Vui lòng chỉnh prompt hoặc thử lại.');
      return;
    }

    plan = normalizePlan(j);
    primaryEl.value     = plan.primary;
    secondaryEl.value   = plan.secondary;
    exploratoryEl.value = plan.exploratory;
    updateWordCounts();
    ctx.toast('Đã chèn gợi ý kế hoạch phân tích. Hãy rà soát và chỉnh sửa cho phù hợp.');
  }

  // ===== GPT evaluate =====
  async function onEvaluate() {
    const pico          = ctx.get('pico', {}) || {};
    const objective     = ctx.get('mainObjective', '') || '';
    const design        = ctx.get('design', {}) || {};
    const interventions = ctx.get('interventions', []) || {};
    const vars          = ctx.get('selectedVariables', {}) || {};
    const dataColl      = ctx.get('dataCollection', {}) || {};
    plan = getCurrentPlan();

    const payload = {
      analysisPlan: plan,
      pico,
      objective,
      design,
      interventions,
      variables: vars,
      dataCollection: dataColl,
    };

    const prompt = `
Bạn là phản biện thống kê cho một đề cương RCT. Hãy **đánh giá kế hoạch phân tích số liệu** dưới đây.

Nội dung cần đánh giá:
- Tính rõ ràng và phù hợp của phân tích kết cục chính (mô hình, giả định, covariates, mất mẫu...)
- Độ đầy đủ của phân tích kết cục phụ và biến an toàn
- Cách xử lý đa so sánh, phân tích phân nhóm, phân tích thăm dò
- Sự nhất quán với PICO, mục tiêu nghiên cứu và thiết kế RCT
- Gợi ý cải thiện cụ thể, ưu tiên gạch đầu dòng, đánh dấu những điểm "bắt buộc nên sửa".

Ngữ cảnh (JSON):
${JSON.stringify(payload, null, 2).slice(0, 4000)}

Trả lời bằng tiếng Việt, dùng gạch đầu dòng rõ ràng.
`.trim();

    ctx.toast('Đang đánh giá kế hoạch phân tích...');
    const fb = await ctx.callGPT(prompt);
    showFeedbackDialog(fb || 'Không nhận được phản hồi từ GPT.');
  }

  // ========= Helpers =========
  function normalizePlan(x) {
    return {
      primary: String(x?.primary || '').trim(),
      secondary: String(x?.secondary || '').trim(),
      exploratory: String(x?.exploratory || x?.extra || '').trim(),
    };
  }

  function safeParse(s) {
    try { return JSON.parse(s); } catch { return null; }
  }

  function jsonSafe(obj) {
    try { return JSON.stringify(obj); } catch { return ''; }
  }

  function showFeedbackDialog(text) {
    const id = 'analysis-fb-dialog';
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
        <div style="background:#fff; max-width:760px; width:90vw; padding:18px; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.24)">
          <div style="font-weight:700; margin-bottom:8px;">Đánh giá kế hoạch phân tích</div>
          <div id="analysis-fb-text" style="white-space:pre-wrap; line-height:1.5; max-height:60vh; overflow:auto;"></div>
          <div style="display:flex; justify-content:flex-end; margin-top:12px; gap:8px;">
            <button id="analysis-fb-close" class="btn btn-primary">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(dlg);
      dlg.querySelector('#analysis-fb-close').addEventListener('click', () => dlg.remove());
    }
    dlg.querySelector('#analysis-fb-text').textContent = text;
  }
}
