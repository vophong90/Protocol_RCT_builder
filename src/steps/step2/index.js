// src/steps/step2/index.js
// Step 2 – Mục tiêu nghiên cứu (main + subs)
// Cần ctx: get/save/toast, extractTextFromPDF(file), callStepGPT(bindingKey, prompt)

export const id = 2;
export const title = "Mục tiêu nghiên cứu";
export const subtitle =
  "Đặt mục tiêu chính/phụ; có thể nhờ GPT gợi ý từ PICO, Câu hỏi nghiên cứu và PDF.";
export const css = "./public/css/steps/step2.css";

export async function mount(rootEl, ctx) {
  // Scope CSS riêng cho step2
  rootEl.closest(".step")?.setAttribute("data-scope", "step2");

  // rootEl CHÍNH LÀ .card → không lồng .card mới
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Mục tiêu nghiên cứu</h3>
      <div class="card-subtitle">
        Đặt mục tiêu chính và các mục tiêu phụ. Có thể nhờ GPT gợi ý dựa trên PICO, Câu hỏi nghiên cứu và tài liệu PDF.
      </div>
    </div>

    <div class="card-body">
      <label class="obj-main-label">
        Mục tiêu chính
        <textarea
          id="obj-main"
          rows="3"
          placeholder="Nhập mục tiêu chính, bám PICO và câu hỏi nghiên cứu"></textarea>
      </label>
    </div>

    <div class="card-body">
      <div class="obj-sub-title">Mục tiêu phụ</div>
      <div class="obj-sub-row">
        <input
          id="obj-sub-input"
          type="text"
          placeholder="Nhập mục tiêu phụ..." />
        <button
          id="obj-sub-add"
          class="btn btn-secondary"
          type="button">
          Thêm
        </button>
      </div>
      <div id="obj-sub-list" class="obj-sub-list"></div>
    </div>

    <!-- File + 2 nút GPT -->
    <div class="card-body">
      <label class="obj-file-row">
        <span class="obj-file-label">Tài liệu tham khảo (PDF, tuỳ chọn)</span>
        <input id="obj-pdf" type="file" accept="application/pdf" />
      </label>

      <div class="obj-gpt-row">
        <button id="obj-gpt"  class="btn btn-primary"  type="button">
          GPT gợi ý mục tiêu
        </button>
        <button id="obj-eval" class="btn btn-secondary" type="button">
          GPT đánh giá mục tiêu
        </button>
      </div>
    </div>

    <!-- Kết quả GPT – GỢI Ý -->
    <div id="obj-suggest-wrap" class="card-body" style="display:none">
      <div class="obj-gpt-header">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div class="obj-gpt-actions">
          <button id="obj-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
          <button id="obj-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="obj-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea
        id="obj-suggest-ta"
        rows="10"
        placeholder='{"main":"...","subs":["...","..."],"refs":["Tác giả… (năm). … DOI/PMID/URL"]}'></textarea>
      <div class="muted small" style="margin-top:.35rem">
        Khi chèn, chỉ lấy mục tiêu; TLTK chỉ để bạn tham khảo.
      </div>
    </div>

    <!-- Kết quả GPT – ĐÁNH GIÁ -->
    <div id="obj-eval-wrap" class="card-body" style="display:none">
      <div class="obj-gpt-header">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div class="obj-gpt-actions">
          <button id="obj-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="obj-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea
        id="obj-eval-ta"
        rows="11"
        placeholder="Đánh giá theo SMART + TLTK sẽ xuất hiện tại đây…"></textarea>
    </div>

    <div class="card-footer">
      <button id="obj-save" class="btn btn-primary" type="button">Lưu mục tiêu</button>
    </div>
  `.trim();

  // ===== Elements =====
  const mainEl     = rootEl.querySelector('#obj-main');
  const subInputEl = rootEl.querySelector('#obj-sub-input');
  const subAddBtn  = rootEl.querySelector('#obj-sub-add');
  const subListEl  = rootEl.querySelector('#obj-sub-list');

  const pdfEl      = rootEl.querySelector('#obj-pdf');

  const saveBtn    = rootEl.querySelector('#obj-save');
  const gptBtn     = rootEl.querySelector('#obj-gpt');
  const evalBtn    = rootEl.querySelector('#obj-eval');

  const sWrap  = rootEl.querySelector('#obj-suggest-wrap');
  const sTA    = rootEl.querySelector('#obj-suggest-ta');
  const sApply = rootEl.querySelector('#obj-apply');
  const sCopy  = rootEl.querySelector('#obj-copy-suggest');
  const sHide  = rootEl.querySelector('#obj-hide-suggest');

  const eWrap  = rootEl.querySelector('#obj-eval-wrap');
  const eTA    = rootEl.querySelector('#obj-eval-ta');
  const eCopy  = rootEl.querySelector('#obj-copy-eval');
  const eHide  = rootEl.querySelector('#obj-hide-eval');

  // ===== Load state =====
  mainEl.value = ctx.get('mainObjective', '') || '';

  const storedSubs = ctx.get('subObjectives', []);
  let subObjectives = Array.isArray(storedSubs) ? storedSubs.slice() : [];
  renderSubList();

  const oldEval = ctx.get('objectivesEval', '');
  if (oldEval) {
    eTA.value = String(oldEval);
    eWrap.style.display = '';
  }

  // ===== Sub objectives =====
  subAddBtn.addEventListener('click', () => {
    const v = (subInputEl.value || '').trim();
    if (!v) return;
    if (!Array.isArray(subObjectives)) subObjectives = [];
    subObjectives.push(v);
    subInputEl.value = '';
    renderSubList();
  });

  subInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      subAddBtn.click();
    }
  });

  function renderSubList() {
    subListEl.innerHTML = '';
    if (!Array.isArray(subObjectives) || subObjectives.length === 0) {
      subListEl.innerHTML = '<div class="muted">Chưa có mục tiêu phụ.</div>';
      return;
    }
    subObjectives.forEach((txt, idx) => {
      const row = document.createElement('div');
      row.className = 'obj-sub-item';

      const t = document.createElement('div');
      t.textContent = txt;

      const controls = document.createElement('div');
      controls.className = 'obj-sub-controls';

      const up = document.createElement('button');
      up.className = 'btn btn-ghost';
      up.textContent = '↑';
      up.title = 'Lên';
      up.onclick = () => {
        if (idx > 0) {
          [subObjectives[idx - 1], subObjectives[idx]] =
            [subObjectives[idx], subObjectives[idx - 1]];
          renderSubList();
        }
      };

      const down = document.createElement('button');
      down.className = 'btn btn-ghost';
      down.textContent = '↓';
      down.title = 'Xuống';
      down.onclick = () => {
        if (idx < subObjectives.length - 1) {
          [subObjectives[idx + 1], subObjectives[idx]] =
            [subObjectives[idx], subObjectives[idx + 1]];
          renderSubList();
        }
      };

      const del = document.createElement('button');
      del.className = 'btn btn-ghost';
      del.textContent = 'Xóa';
      del.onclick = () => {
        subObjectives.splice(idx, 1);
        renderSubList();
      };

      controls.append(up, down, del);
      row.append(t, controls);
      subListEl.appendChild(row);
    });
  }

  // ===== Save =====
  saveBtn.addEventListener('click', () => {
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', Array.isArray(subObjectives) ? subObjectives : []);
    ctx.toast('Đã lưu mục tiêu.');
  });

  // ===== File UI =====
  pdfEl.addEventListener('change', () => {
    pdfEl.title = pdfEl.files?.[0]?.name || '';
  });

  // ===== GPT Suggest =====
  gptBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  // Áp dụng gợi ý (chỉ lấy main/subs)
  sApply.addEventListener('click', () => {
    const obj = parseObjectives(sTA.value);
    if (!obj) {
      ctx.toast('Không nhận diện được gợi ý hợp lệ.');
      return;
    }
    if (obj.main) mainEl.value = obj.main;
    if (Array.isArray(obj.subs)) subObjectives = obj.subs.slice();
    renderSubList();
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', subObjectives);
    ctx.toast('Đã chèn gợi ý vào các ô.');
  });
  sCopy.addEventListener('click', () => copyText(sTA.value || '', ctx));
  sHide.addEventListener('click', () => (sWrap.style.display = 'none'));

  eCopy.addEventListener('click', () => copyText(eTA.value || '', ctx));
  eHide.addEventListener('click', () => (eWrap.style.display = 'none'));

  // ================= GPT – gợi ý =================
  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'Đang gợi ý...');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = typeof ctx.extractTextFromPDF === 'function'
            ? await ctx.extractTextFromPDF(f)
            : await fallbackExtractTextFromPDF(f);
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO và câu hỏi.');
        }
      }

      const today = new Date().toISOString().slice(0, 10);

      const prompt = `
Bạn là trợ lý xây dựng đề cương RCT. Dựa trên PICO, câu hỏi nghiên cứu và (nếu có) tài liệu PDF,
hãy đề xuất MỘT mục tiêu chính và 2–5 mục tiêu phụ.

YÊU CẦU NGHIÊM VỀ NGUỒN:
- Mọi gợi ý phải phù hợp bằng chứng hiện tại. KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên bài báo hoặc tác giả.
- Trả về tối đa 5 tài liệu tham khảo CÓ THẬT (ưu tiên từ PDF đính kèm). Mỗi mục gồm: Tác giả chính, năm, tiêu đề, tạp chí/sách, và DOI/PMID/URL.
- Nếu không có nguồn phù hợp, đặt: ["Không tìm thấy nguồn phù hợp để trích dẫn."].

CHỈ TRẢ VỀ 1 JSON HỢP LỆ (không kèm giải thích, không \`\`\`json):
{
  "main": "…",
  "subs": ["…","…"],
  "refs": ["Tác giả… (năm). Tiêu đề. Tạp chí… DOI/PMID/URL", "..."]
}

Ngày: ${today}

PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}

Trích lược tài liệu (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await callAI('step2.suggest', prompt, ctx);
      const parsed = parseObjectives(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về gợi ý hợp lệ.');
        console.warn('GPT raw reply (step2 suggest):', raw);
      } else {
        const lines = [];
        if (parsed.main) lines.push('Mục tiêu chính: ' + parsed.main);
        (parsed.subs || []).forEach(x => lines.push('- ' + x));
        if (parsed.refs && parsed.refs.length) {
          lines.push('', 'TLTK:');
          parsed.refs.forEach((r, i) => lines.push(`${i + 1}) ${r}`));
        }
        sTA.value = lines.join('\n');
        sWrap.style.display = '';
        ctx.toast('Đã nhận gợi ý từ GPT.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý mục tiêu');
    }
  }

  // ================= GPT – đánh giá =================
  async function onEvaluate() {
    const main = (mainEl.value || '').trim();
    const subs = Array.isArray(subObjectives) ? subObjectives : [];
    if (!main && subs.length === 0) {
      ctx.toast('Chưa có mục tiêu để đánh giá.');
      return;
    }

    try {
      toggleBusy(evalBtn, true, 'Đang đánh giá...');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      const today = new Date().toISOString().slice(0, 10);

      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy đánh giá bộ mục tiêu theo **SMART** và **trích dẫn TLTK CÓ THẬT** (nếu có).

NGUYÊN TẮC NGUỒN:
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tác giả hay tiêu đề.
- Chỉ liệt kê tối đa 5 nguồn bạn **chắc chắn ≥90%** là có thật.
- Nếu không có nguồn phù hợp, ghi chính xác câu: "Không tìm thấy nguồn phù hợp để trích dẫn."

ĐỊNH DẠNG TRẢ LỜI (không JSON):
SMART
- Specific: [điểm]/5 — …
- Measurable: [điểm]/5 — …
- Achievable: [điểm]/5 — …
- Relevant: [điểm]/5 — …
- Time-bound: [điểm]/5 — …
Kết luận (1–3 câu): …
TLTK:
1) … (DOI/PMID/URL)
2) … (DOI/PMID/URL)
(hoặc viết: "Không tìm thấy nguồn phù hợp để trích dẫn.")

Mục tiêu chính:
${main || '(chưa có)'}

Mục tiêu phụ:
${subs.length ? subs.map((s,i)=> (i+1)+'. '+s).join('\n') : '(chưa có)'}

PICO tham chiếu:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}

Ngày đánh giá: ${today}
`.trim();

      const raw = await callAI('step2.evaluate', prompt, ctx);
      const text = String(raw || '').trim();
      eTA.value = text;
      eWrap.style.display = '';
      ctx.save('objectivesEval', eTA.value);
      ctx.toast('Đã nhận đánh giá từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
    } finally {
      toggleBusy(evalBtn, false, 'GPT đánh giá mục tiêu');
    }
  }
}

// ================= Helpers =================

function toast(ctx, msg) {
  if (ctx && typeof ctx.toast === "function") ctx.toast(msg);
  else console.log("[toast]", msg);
}

function copyText(t, ctx) {
  try {
    navigator.clipboard?.writeText(t);
    toast(ctx, "Đã sao chép.");
  } catch {
    toast(ctx, "Không sao chép được.");
  }
}

function toggleBusy(btn, busy, label) {
  if (!btn) return;
  if (busy) {
    btn.disabled = true;
    btn.dataset.prev = btn.textContent || "";
    btn.textContent = "Đang xử lý...";
  } else {
    btn.disabled = false;
    btn.textContent = label || btn.dataset.prev || "";
  }
}

// Gọi GPT theo binding; fallback callGPT nếu cần
async function callAI(bindingKey, prompt, ctx) {
  if (typeof ctx.callStepGPT === "function") {
    try {
      return String((await ctx.callStepGPT(bindingKey, prompt)) ?? "");
    } catch (e) {
      if (typeof ctx.callGPT === "function") {
        return String(await ctx.callGPT(prompt));
      }
      throw e;
    }
  }
  if (typeof ctx.callGPT === "function") {
    return String(await ctx.callGPT(prompt));
  }
  throw new Error("Chưa cấu hình GPT cho step2.");
}

// Đọc PDF fallback bằng pdf.js nếu ctx chưa cung cấp
async function fallbackExtractTextFromPDF(file, maxPages = 4) {
  const pdfjs = globalThis.pdfjsLib || window.pdfjsLib;
  if (!pdfjs) throw new Error("pdfjsLib chưa được nạp");
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const n = Math.min(pdf.numPages, maxPages);
  let out = "";
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return out.trim();
}

// Phân tích JSON gợi ý mục tiêu hoặc fallback text
function parseObjectives(text) {
  const s = String(text || "").trim();
  if (!s) return null;

  const json = extractJsonCandidate(s);
  if (json) {
    try {
      const j = JSON.parse(json);
      const main = String(j?.main || "").trim();
      const subs = Array.isArray(j?.subs)
        ? j.subs.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
      const refs = Array.isArray(j?.refs)
        ? j.refs.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
      if (main || subs.length || refs.length) return { main, subs, refs };
    } catch {
      // ignore
    }
  }

  // Fallback: tách dòng; bỏ khối TLTK
  const Lraw = s.split(/\r?\n/);
  const L = [];
  let inRefs = false;
  for (const line of Lraw) {
    const trimmed = line.trim();
    if (/^(TLTK|Tham\s*khảo)\s*:?\s*$/iu.test(trimmed)) {
      inRefs = true;
      continue;
    }
    if (!inRefs) L.push(trimmed);
  }
  const filtered = L
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/u, "").trim())
    .filter(Boolean);

  if (filtered.length === 0) return null;

  let main = "";
  const subs = [];
  for (const ln of filtered) {
    const m = ln.match(/^mục\s*tiêu\s*chính\s*:\s*(.+)$/iu);
    if (m) {
      main = m[1].trim();
      continue;
    }
    if (!main) main = ln;
    else subs.push(ln);
  }
  return { main, subs, refs: [] };
}

function extractJsonCandidate(s) {
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return stripBullets(fenced[1]);
  const i1 = s.indexOf("{");
  const i2 = s.lastIndexOf("}");
  if (i1 >= 0 && i2 > i1) return stripBullets(s.slice(i1, i2 + 1));
  return "";
}

function stripBullets(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•]\s?/, ""))
    .join("\n")
    .trim();
}
