// src/steps/step5_overview.js
// Step 5 – Tổng quan tài liệu (khớp index.html mới)
//
// Yêu cầu của bạn (nhớ từ lần trước):
// - Chia 9 tiểu mục, mỗi tiểu mục có ô tải PDF riêng, GPT gợi ý & GPT đánh giá riêng
// - Không dùng helper bên ngoài: prompt được dựng ngay trong step này
// - Lưu vào state: overview = { [key]: { text, sources, gpt_suggest, gpt_eval, savedAt } }
// - Tuân thủ UI: .card/.card-header/.card-body/.grid-3/.btn-primary/.btn-secondary, file input theo CSS mới

export async function mount(rootEl, ctx) {
  // ---- cấu hình 9 tiểu mục
  const SECTIONS = [
    { id: 'yhhd_overview', title: '1) Đại cương YHHĐ', hint: 'Khái quát bệnh/lý do quan trọng, sinh lý bệnh cốt lõi' },
    { id: 'epidemiology',  title: '2) Dịch tễ học & gánh nặng', hint: 'Tỉ lệ hiện mắc, biến thiên theo tuổi/giới/khu vực, gánh nặng' },
    { id: 'diagnosis',     title: '3) Chẩn đoán YHHĐ', hint: 'Tiêu chuẩn, thang đo, cận lâm sàng chủ chốt' },
    { id: 'treatment',     title: '4) Điều trị YHHĐ', hint: 'Phác đồ hiện hành, bằng chứng hiệu quả/độc tính' },
    { id: 'limits_yhhd',   title: '5) Hạn chế của YHHĐ', hint: 'Khoảng trống quản lý bệnh, đối tượng đáp ứng kém' },
    { id: 'yhct_overview', title: '6) Đại cương YHCT', hint: 'Biện chứng, căn nguyên – cơ chế theo YHCT' },
    { id: 'intervention',  title: '7) Liệu pháp can thiệp nghiên cứu', hint: 'Lý do chọn can thiệp, cơ chế, an toàn' },
    { id: 'related',       title: '8) Nghiên cứu cùng loại', hint: 'Tổng hợp RCT/quan sát liên quan (so sánh nhanh)' },
    { id: 'methods_new',   title: '9) Phương pháp mới trong phân tích/đánh giá', hint: 'Kỹ thuật, chỉ dấu, mô hình mới' },
  ];

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Tổng quan tài liệu</h3>
      <div class="card-subtitle">
        Mỗi tiểu mục có thể đọc PDF để lấy ngữ cảnh, dùng GPT gợi ý/đánh giá và biên tập trong ô nội dung. 
        Nhấn “Lưu tất cả” ở cuối để chốt.
      </div>
    </div>

    ${SECTIONS.map(sec => sectionCardHTML(sec)).join('')}

    <div class="card-footer">
      <button id="ov-save-all" class="btn-primary" type="button">Lưu tất cả</button>
    </div>
  `.trim();

  // ---- khôi phục state
  const saved = ctx.get('overview', {}) || {};
  for (const sec of SECTIONS) {
    const s = saved[sec.id] || {};
    q(`#ov-${sec.id}-text`).value  = s.text || '';
    if (s.sources) setPdfHint(sec.id, s.sources.length);
    if (s.gpt_suggest) q(`#ov-${sec.id}-sugg`).value = s.gpt_suggest;
    if (s.gpt_eval)    q(`#ov-${sec.id}-eval`).value = s.gpt_eval;
  }

  // ---- wire từng tiểu mục
  for (const sec of SECTIONS) {
    wireSection(sec);
  }

  // ---- Lưu tất cả
  q('#ov-save-all').addEventListener('click', () => {
    const next = {};
    for (const sec of SECTIONS) {
      next[sec.id] = collectSection(sec.id);
      next[sec.id].savedAt = new Date().toISOString();
    }
    ctx.save('overview', next);
    ctx.toast('Đã lưu toàn bộ phần Tổng quan.');
  });

  // ==========================================
  // ============ helpers & wiring ============
  // ==========================================
  function q(sel, parent = rootEl) { return parent.querySelector(sel); }

  function sectionCardHTML(sec) {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${sec.title}</div>
          <div class="card-subtitle">${sec.hint}</div>
        </div>

        <div class="card-body grid-3">
          <label class="control-row">Tải PDF hỗ trợ
            <input id="ov-${sec.id}-pdf" type="file" accept="application/pdf" />
          </label>
          <button id="ov-${sec.id}-read" class="btn-secondary" type="button" style="align-self:end">Đọc PDF</button>
          <div id="ov-${sec.id}-pdfhint" class="muted" style="align-self:end">Chưa có ngữ cảnh PDF</div>
        </div>

        <div class="card-body">
          <label>Nội dung biên tập
            <textarea id="ov-${sec.id}-text" rows="10" placeholder="Viết nội dung tổng quan cho tiểu mục này..."></textarea>
          </label>
        </div>

        <div class="card-body control-row">
          <button id="ov-${sec.id}-sugg-btn" class="btn-primary"  type="button">GPT gợi ý</button>
          <button id="ov-${sec.id}-eval-btn" class="btn-primary"  type="button">GPT đánh giá</button>
          <button id="ov-${sec.id}-save"     class="btn-secondary" type="button">Lưu mục này</button>
        </div>

        <div id="ov-${sec.id}-sugg-box" class="card" style="display:none">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <strong>Gợi ý từ GPT</strong>
            <div class="control-row">
              <button id="ov-${sec.id}-sugg-merge" class="btn-primary" type="button">Chèn vào nội dung</button>
              <button id="ov-${sec.id}-sugg-copy"  class="btn-ghost"   type="button">Sao chép</button>
              <button id="ov-${sec.id}-sugg-hide"  class="btn-ghost"   type="button">Ẩn</button>
            </div>
          </div>
          <div class="card-body">
            <textarea id="ov-${sec.id}-sugg" rows="8" placeholder="(GPT) Gợi ý dàn ý & đoạn văn ngắn"></textarea>
          </div>
        </div>

        <div id="ov-${sec.id}-eval-box" class="card" style="display:none">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <strong>Đánh giá từ GPT</strong>
            <div class="control-row">
              <button id="ov-${sec.id}-eval-copy" class="btn-ghost" type="button">Sao chép</button>
              <button id="ov-${sec.id}-eval-hide" class="btn-ghost" type="button">Ẩn</button>
            </div>
          </div>
          <div class="card-body">
            <textarea id="ov-${sec.id}-eval" rows="8" placeholder="(GPT) Nhận xét, thiếu sót, gợi ý tài liệu bổ sung"></textarea>
          </div>
        </div>
      </div>
    `.trim();
  }

  // Lưu/đọc PDF text theo từng secId (đặt trong RAM step này, khi lưu thì ghi vào ctx.save)
  const pdfContext = {};  // { secId: 'text...' }

  function setPdfHint(secId, len) {
    const el = q(`#ov-${secId}-pdfhint`);
    if (len && len > 0) el.textContent = `Đã nạp PDF (${len.toLocaleString()} ký tự)`;
    else el.textContent = 'Chưa có ngữ cảnh PDF';
  }

  function safeSlice(s, n = 20000) {
    if (!s) return '';
    const t = String(s);
    return t.length > n ? t.slice(0, n) : t;
  }

  function collectSection(secId) {
    return {
      text: q(`#ov-${secId}-text`).value || '',
      sources: pdfContext[secId] || (saved?.[secId]?.sources || ''),
      gpt_suggest: q(`#ov-${secId}-sugg`)?.value || '',
      gpt_eval: q(`#ov-${secId}-eval`)?.value || '',
    };
  }

  function wireSection(sec) {
    const pdfInput = q(`#ov-${sec.id}-pdf`);
    const readBtn  = q(`#ov-${sec.id}-read`);
    const saveBtn  = q(`#ov-${sec.id}-save`);

    const suggBtn  = q(`#ov-${sec.id}-sugg-btn`);
    const suggBox  = q(`#ov-${sec.id}-sugg-box`);
    const suggTA   = q(`#ov-${sec.id}-sugg`);
    q(`#ov-${sec.id}-sugg-hide`)?.addEventListener('click', () => (suggBox.style.display = 'none'));
    q(`#ov-${sec.id}-sugg-copy`)?.addEventListener('click', () => copy(suggTA.value || ''));
    q(`#ov-${sec.id}-sugg-merge`)?.addEventListener('click', () => {
      const main = q(`#ov-${sec.id}-text`);
      main.value = mergeMarkdown(main.value, suggTA.value);
      ctx.toast('Đã chèn gợi ý vào nội dung.');
    });

    const evalBtn = q(`#ov-${sec.id}-eval-btn`);
    const evalBox = q(`#ov-${sec.id}-eval-box`);
    const evalTA  = q(`#ov-${sec.id}-eval`);
    q(`#ov-${sec.id}-eval-hide`)?.addEventListener('click', () => (evalBox.style.display = 'none'));
    q(`#ov-${sec.id}-eval-copy`)?.addEventListener('click', () => copy(evalTA.value || ''));

    // Đọc PDF
    readBtn.addEventListener('click', async () => {
      try {
        const f = pdfInput.files && pdfInput.files[0];
        if (!f) { ctx.toast('Chọn một file PDF trước đã.'); return; }
        const text = await ctx.extractTextFromPDF(f);
        pdfContext[sec.id] = safeSlice(text, 20000);
        setPdfHint(sec.id, pdfContext[sec.id].length);
        ctx.toast('Đã đọc PDF.');
      } catch (e) {
        console.error(e);
        ctx.toast('Không đọc được PDF.');
      }
    });

    // GPT gợi ý
    suggBtn.addEventListener('click', async () => {
      try {
        toggleBusy(suggBtn, true, 'GPT gợi ý');
        const prompt = buildSuggestPrompt(sec.id);
        const raw = await ctx.callGPT(prompt);
        suggTA.value = String(raw || '').trim();
        suggBox.style.display = '';
        ctx.toast('Đã nhận gợi ý.');
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT gợi ý.');
      } finally {
        toggleBusy(suggBtn, false);
      }
    });

    // GPT đánh giá
    evalBtn.addEventListener('click', async () => {
      try {
        toggleBusy(evalBtn, true, 'GPT đánh giá');
        const content = q(`#ov-${sec.id}-text`).value || '';
        if (!content.trim()) { ctx.toast('Chưa có nội dung để đánh giá.'); return; }
        const prompt = buildEvaluatePrompt(sec.id, content);
        const raw = await ctx.callGPT(prompt);
        evalTA.value = String(raw || '').trim();
        evalBox.style.display = '';
        ctx.toast('Đã nhận đánh giá.');
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT đánh giá.');
      } finally {
        toggleBusy(evalBtn, false);
      }
    });

    // Lưu mục này
    saveBtn.addEventListener('click', () => {
      const next = { ...(ctx.get('overview', {}) || {}) };
      next[sec.id] = {
        ...collectSection(sec.id),
        savedAt: new Date().toISOString(),
      };
      ctx.save('overview', next);
      ctx.toast(`Đã lưu: ${sec.title}`);
    });
  }

  // ===== Prompt builders (tự dựng, không phụ thuộc helper ngoài) =====
  function baseContextLines() {
    const pico   = ctx.get('pico', {}) || {};
    const dsg    = ctx.get('design', {}) || {};
    const rq     = ctx.get('researchQuestion', '') || '';
    const obj    = ctx.get('mainObjective', '') || '';
    const subObj = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
    return [
      `PICO: P=${pico.p||'(?)'}; I=${pico.i||'(?)'}; C=${pico.c||'(?)'}; O=${pico.o||'(?)'}`,
      `Thiết kế: loại=${dsg.type||'(?)'}; blinding=${dsg.blinding||'(?)'}; nhánh=${dsg.arms||'(?)'}; allocation=${dsg.allocationRatio||'(?)'}`,
      `Câu hỏi NC: ${rq || '(chưa có)'}`,
      `Mục tiêu chính: ${obj || '(chưa có)'}`,
      `Mục tiêu phụ: ${subObj.length ? subObj.map((s,i)=>`${i+1}) ${s}`).join(' | ') : '(chưa có)'}`,
    ].join('\n');
  }

  function buildSuggestPrompt(secId) {
    const base = baseContextLines();
    const pdfTxt = safeSlice(pdfContext[secId] || (saved?.[secId]?.sources || ''), 6000);

    const GUIDE = {
      yhhd_overview: `Hãy viết mô tả <200–300 từ> về đại cương YHHĐ: định nghĩa, sinh lý bệnh then chốt, gánh nặng chung.`,
      epidemiology:  `Tóm lược dịch tễ: hiện mắc/tỉ lệ mới mắc, theo nhóm tuổi/giới/khu vực, gánh nặng DALY/QoL.`,
      diagnosis:     `Trình bày tiêu chuẩn chẩn đoán, xét nghiệm/chỉ số chính, độ nhạy/đặc hiệu khái quát, thang điểm thường dùng.`,
      treatment:     `Tóm tắt điều trị hiện hành (hướng dẫn gần nhất): bậc thang, liều chính, hiệu quả và tác dụng không mong muốn điển hình.`,
      limits_yhhd:   `Nêu khoảng trống/hạn chế quản lý: nhóm đáp ứng kém, tái phát, tác dụng phụ, chi phí/tuân thủ.`,
      yhct_overview: `Khung YHCT: căn nguyên – cơ chế – tạng phủ – kinh lạc, các thể bệnh điển hình và nguyên tắc trị.`,
      intervention:  `Lý do chọn can thiệp nghiên cứu (YHCT/tích hợp): cơ chế, chỉ định, an toàn; dẫn chứng y văn tiêu biểu.`,
      related:       `Tổng hợp nhanh các nghiên cứu liên quan (bảng chữ hoặc bullet): thiết kế, cỡ mẫu, kết cục chính, kết quả.`,
      methods_new:   `Nêu phương pháp mới trong phân tích/đánh giá: chỉ dấu mới, mô hình, kỹ thuật đo; ứng dụng cho đề cương.`,
    };

    return (
`Bạn là trợ lý tổng quan tài liệu. Dựa vào thông tin đề cương và bối cảnh PDF, hãy GỢI Ý nội dung cho tiểu mục sau, viết ngắn gọn, rõ, có cấu trúc (tiêu đề phụ/bullet khi phù hợp).

${base}

Ngữ cảnh PDF (có thể bỏ qua phần không liên quan):
"""${pdfTxt}"""

Tiểu mục cần viết: ${titleFromId(secId)}

YÊU CẦU:
- ${GUIDE[secId] || 'Viết nội dung phù hợp tiểu mục.'}
- Không bịa số liệu/nguồn; nếu trích dẫn số liệu phải ghi “ước lượng/nguồn tham khảo” chung chung.
- Độ dài gợi ý: 150–300 từ, ưu tiên mục tiêu đề cương.

Trả về bằng Markdown (có tiêu đề phụ nếu cần).`);
  }

  function buildEvaluatePrompt(secId, content) {
    const base = baseContextLines();
    const pdfTxt = safeSlice(pdfContext[secId] || (saved?.[secId]?.sources || ''), 4000);
    return (
`Bạn là phản biện học thuật. Hãy ĐÁNH GIÁ nội dung hiện tại của tiểu mục **${titleFromId(secId)}** về:
1) Phủ đủ ý chưa? (so với mục tiêu đề cương)
2) Điểm mơ hồ/thiếu nhất quán/thiếu nguồn
3) Gợi ý chỉnh sửa ngắn (bullet)
4) Gợi ý tài liệu tra cứu (tên tác giả/năm hoặc guideline)

${base}

Ngữ cảnh PDF (tuỳ dùng):
"""${pdfTxt}"""

NỘI DUNG HIỆN TẠI:
"""${content}"""

Trả về bằng Markdown, ngắn gọn, có các mục 1–4 như yêu cầu.`);
  }

  function titleFromId(id) {
    const m = SECTIONS.find(s => s.id === id);
    return m ? m.title : id;
  }

  function mergeMarkdown(main, sugg) {
    const a = (main || '').trim();
    const b = (sugg || '').trim();
    if (!a) return b;
    if (!b) return a;
    // tránh lặp tiêu đề: nếu b bắt đầu bằng cùng dòng title, bỏ title đầu
    const lines = b.split(/\r?\n/);
    if (lines[0].replace(/^#+\s*/, '').trim().toLowerCase() ===
        (a.split(/\r?\n/)[0] || '').replace(/^#+\s*/, '').trim().toLowerCase()) {
      lines.shift();
    }
    return a + '\n\n' + lines.join('\n');
  }

  function copy(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }

  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.dataset.prev = btn.textContent || ''; btn.textContent = label || 'Đang xử lý...'; }
    else { btn.disabled = false; btn.textContent = btn.dataset.prev || 'Xong'; }
  }
}
