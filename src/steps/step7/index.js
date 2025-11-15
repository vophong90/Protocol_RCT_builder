// src/steps/step7/index.js
// Step 7 – Tiêu chí vào/loại

export const id = 7;
export const title = "Tiêu chí chọn/loại";
export const subtitle =
  "Xác định tiêu chí chọn và loại cho RCT; có thể đọc PDF, nhờ GPT gợi ý/đánh giá và lưu lại kèm tài liệu tham khảo.";
export const css = "./public/css/steps/step7.css";

export async function mount(rootEl, ctx) {
  // Gắn scope cho CSS
  rootEl.closest(".step")?.setAttribute("data-scope", "step7");

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Tiêu chí chọn/loại</h3>
      <div class="card-subtitle">
        Mỗi dòng là một tiêu chí. Có thể đọc PDF để lấy bối cảnh, nhờ GPT gợi ý/đánh giá và lưu lại kèm tài liệu tham khảo.
      </div>
    </div>

    <div id="crit">
      <!-- Inclusion / Exclusion -->
      <div class="card-body grid-2">
        <label>
          <div class="inline-row" style="justify-content:space-between">
            <span class="nowrap" style="font-weight:700">Tiêu chí chọn</span>
            <span class="muted">Mỗi dòng 1 tiêu chí</span>
          </div>
          <textarea id="crit-inc" class="form-input" rows="12" placeholder="- Tuổi 40–75
- Chẩn đoán THK gối theo ACR
- Đồng ý tham gia và ký consent"></textarea>
        </label>

        <label>
          <div class="inline-row" style="justify-content:space-between">
            <span class="nowrap" style="font-weight:700">Tiêu chí loại</span>
            <span class="muted">Mỗi dòng 1 tiêu chí</span>
          </div>
          <textarea id="crit-exc" class="form-input" rows="12" placeholder="- Phẫu thuật khớp gối gần đây
- Bệnh kèm theo nặng (suy tim, suy thận giai đoạn cuối)
- Phụ nữ có thai/cho con bú"></textarea>
        </label>
      </div>

      <!-- Notes -->
      <div class="card-body">
        <label>Ghi chú (tuỳ chọn)
          <textarea id="crit-notes" class="form-input" rows="4" placeholder="Ví dụ: Quy trình sàng lọc, kiểm tra tiêu chí tại lần khám 0..."></textarea>
        </label>
      </div>

      <!-- PDF helper – KHÔNG còn nút Đọc PDF, chọn file là tự đọc -->
      <div class="card-body">
        <div class="control-row">
          <input id="crit-pdf" type="file" accept="application/pdf" />
          <span class="muted" id="crit-pdfhint">Chưa có nội dung PDF</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-body inline-row">
        <button id="crit-suggest" class="btn btn-primary" type="button">GPT gợi ý tiêu chí</button>
        <button id="crit-eval"    class="btn btn-primary" type="button">GPT đánh giá tiêu chí hiện có</button>
        <button id="crit-save"    class="btn btn-secondary" type="button">Lưu</button>
      </div>

      <!-- GPT Suggest Box -->
      <div id="crit-sugg-box" class="card crit-gpt-card hidden">
        <div class="card-header crit-gpt-header">
          <strong>Kết quả GPT – Gợi ý tiêu chí</strong>
          <div class="inline-row">
            <button id="crit-apply-sugg" class="btn btn-primary" type="button">Áp dụng JSON vào ô</button>
            <button id="crit-copy-sugg"  class="btn btn-ghost"   type="button">Sao chép</button>
            <button id="crit-hide-sugg"  class="btn btn-ghost"   type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="crit-sugg-ta" class="form-input" rows="12"
            placeholder='Dòng đầu là JSON:
{"inclusion":["..."],"exclusion":["..."]}

Sau đó là giải thích ngắn và mục "Tài liệu tham khảo (AMA 11th): ..."'></textarea>
          <div class="muted">
            Dòng đầu phải là JSON hợp lệ để nút “Áp dụng JSON” hoạt động. Phần TLTK phía dưới chỉ để tham khảo, không dùng để parse.
          </div>
        </div>
      </div>

      <!-- GPT Evaluation Box -->
      <div id="crit-eval-box" class="card crit-gpt-card hidden">
        <div class="card-header crit-gpt-header">
          <strong>Kết quả GPT – Đánh giá tiêu chí</strong>
          <div class="inline-row">
            <button id="crit-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
            <button id="crit-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="crit-eval-ta" class="form-input" rows="12"
            placeholder="Nhận xét tổng quát, điểm thiếu/mơ hồ, gợi ý tinh chỉnh...
Cuối cùng phải có mục 'Tài liệu tham khảo (AMA 11th):' với danh sách TLTK."></textarea>
        </div>
      </div>
    </div>
  `.trim();

  // --- elements
  const fileEl   = rootEl.querySelector("#crit-pdf");
  const hintEl   = rootEl.querySelector("#crit-pdfhint");

  const incTA    = rootEl.querySelector("#crit-inc");
  const excTA    = rootEl.querySelector("#crit-exc");
  const notesTA  = rootEl.querySelector("#crit-notes");

  const suggestBtn = rootEl.querySelector("#crit-suggest");
  const evalBtn    = rootEl.querySelector("#crit-eval");
  const saveBtn    = rootEl.querySelector("#crit-save");

  const suggBox  = rootEl.querySelector("#crit-sugg-box");
  const sTA      = rootEl.querySelector("#crit-sugg-ta");
  const applySugg = rootEl.querySelector("#crit-apply-sugg");
  const copySugg = rootEl.querySelector("#crit-copy-sugg");
  const hideSugg = rootEl.querySelector("#crit-hide-sugg");

  const evalBox  = rootEl.querySelector("#crit-eval-box");
  const eTA      = rootEl.querySelector("#crit-eval-ta");
  const copyEval = rootEl.querySelector("#crit-copy-eval");
  const hideEval = rootEl.querySelector("#crit-hide-eval");

  // ---- restore state
  const st = ctx.get("criteria", {}) || {};
  incTA.value   = Array.isArray(st.inclusion) ? st.inclusion.join("\n") : (st.inclusion || "");
  excTA.value   = Array.isArray(st.exclusion) ? st.exclusion.join("\n") : (st.exclusion || "");
  notesTA.value = st.notes || "";

  let pdfContext = st.sources || "";
  if (pdfContext && pdfContext.length > 0) {
    hintEl.textContent = `Đã nạp PDF (${pdfContext.length.toLocaleString()} ký tự)`;
  }
  if (st.evaluation) {
    eTA.value = st.evaluation;
    evalBox.classList.remove("hidden");
  }

  // ---- helpers
  function linesToArray(s) {
    return String(s || "")
      .split(/\r?\n/)
      .map((x) => x.replace(/^[\s\-•\*]+/, "").trim())
      .filter(Boolean);
  }
  function arrToText(a) {
    return (a || [])
      .map((x) => (x || "").trim())
      .filter(Boolean)
      .join("\n");
  }
  function safeSlice(s, max = 10000) {
    return s ? String(s).slice(0, max) : "";
  }
  function dedup(arr) {
    const seen = new Set();
    const out = [];
    for (const x of arr) {
      const k = x.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(x);
      }
    }
    return out;
  }
  function copyText(t) {
    try {
      navigator.clipboard?.writeText(t);
      ctx.toast("Đã sao chép.");
    } catch {
      ctx.toast("Không sao chép được.");
    }
  }
  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset.prev = btn.textContent || "";
      btn.textContent = label || "Đang xử lý...";
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.prev || "";
    }
  }
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === "function") return ctx_.callStepGPT(bindingKey, prompt);
    if (typeof ctx_.callGPT === "function") return ctx_.callGPT(prompt);
    throw new Error("Chưa cấu hình GPT binding cho step 7");
  }

  // ---- auto-read PDF khi chọn file (không cần nút)
  fileEl?.addEventListener("change", async () => {
    try {
      const f = fileEl.files && fileEl.files[0];
      if (!f) return;
      hintEl.textContent = "Đang đọc PDF…";
      const text = await ctx.extractTextFromPDF(f);
      pdfContext = safeSlice(text, 20000);
      hintEl.textContent = `Đã nạp PDF (${pdfContext.length.toLocaleString()} ký tự)`;
      ctx.toast("Đã đọc PDF.");
    } catch (e) {
      console.error(e);
      hintEl.textContent = "Không đọc được PDF";
      ctx.toast("Không đọc được PDF.");
    }
  });

  // ---- GPT suggest (kèm TLTK AMA 11th)
  suggestBtn.addEventListener("click", async () => {
    try {
      toggleBusy(suggestBtn, true, "Đang gợi ý…");

      const pico   = ctx.get("pico", {}) || {};
      const design = ctx.get("design", {}) || {};
      const rq     = ctx.get("researchQuestion", "") || "";
      const obj    = ctx.get("mainObjective", "") || "";

      const prompt = `
Bạn là trợ lý phương pháp RCT. Dựa vào thông tin sau, hãy GỢI Ý bộ tiêu chí vào và loại cho thử nghiệm lâm sàng:

PICO:
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}

Thiết kế: ${JSON.stringify(design)}
Câu hỏi nghiên cứu: ${rq || "(chưa có)"}
Mục tiêu chính: ${obj || "(chưa có)"}

Bối cảnh trích từ PDF (nếu có, có thể bỏ qua nếu không liên quan):
"""${safeSlice(pdfContext, 6000)}"""

YÊU CẦU ĐẦU RA (rất quan trọng – phải đúng định dạng):
1) Dòng đầu tiên của câu trả lời phải là JSON THUẦN, không có ký tự nào khác trên cùng dòng, ví dụ:
{"inclusion":["..."],"exclusion":["..."]}
Trong đó "inclusion" và "exclusion" là mảng các chuỗi tiêu chí, viết rõ ràng, ngắn gọn, dễ đưa vào đề cương.

2) Sau JSON đó, để một dòng trống, rồi viết các phần giải thích ngắn gọn nếu cần.

3) CUỐI CÙNG phải có mục:
"Tài liệu tham khảo (AMA 11th):"
với ít nhất 3 tài liệu tham khảo, trình bày theo phong cách AMA 11th (tác giả. Tựa bài. Tên tạp chí. Năm;Tập(Số):trang.).
Có thể dùng guideline CONSORT, sách/y văn chuẩn, nhưng KHÔNG cần URL.
`.trim();

      const raw = await callAI("step7.suggest", prompt, ctx);
      const txt = String(raw || "").trim();
      if (!txt) {
        ctx.toast("GPT không trả về nội dung.");
        return;
      }

      sTA.value = txt;
      suggBox.classList.remove("hidden");
      ctx.toast("Đã nhận gợi ý tiêu chí (kèm TLTK).");
    } catch (e) {
      console.error(e);
      ctx.toast("Lỗi khi gọi GPT gợi ý.");
    } finally {
      toggleBusy(suggestBtn, false, "GPT gợi ý tiêu chí");
    }
  });

  // Áp dụng JSON gợi ý vào 2 ô
  applySugg?.addEventListener("click", () => {
    try {
      const raw = sTA.value || "";

      // Tách đoạn JSON đầu tiên (từ dấu { đầu tiên đến dấu } khớp)
      const match = raw.match(/\{[\s\S]*?\}/);
      if (!match) {
        ctx.toast("Không tìm thấy JSON hợp lệ trong kết quả GPT.");
        return;
      }

      const j = JSON.parse(match[0]);
      let inclusion = Array.isArray(j?.inclusion)
        ? j.inclusion.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
      let exclusion = Array.isArray(j?.exclusion)
        ? j.exclusion.map((x) => String(x || "").trim()).filter(Boolean)
        : [];

      const curInc = linesToArray(incTA.value);
      const curExc = linesToArray(excTA.value);
      incTA.value = arrToText(dedup([...curInc, ...inclusion]));
      excTA.value = arrToText(dedup([...curExc, ...exclusion]));
      ctx.toast("Đã áp dụng JSON vào ô tiêu chí.");
    } catch {
      ctx.toast("JSON không hợp lệ. Hãy kiểm tra lại phần đầu kết quả GPT.");
    }
  });

  copySugg?.addEventListener("click", () => copyText(sTA.value || ""));
  hideSugg?.addEventListener("click", () => suggBox.classList.add("hidden"));

  // ---- GPT eval (kèm TLTK AMA 11th)
  evalBtn.addEventListener("click", async () => {
    try {
      toggleBusy(evalBtn, true, "Đang đánh giá…");

      const pico   = ctx.get("pico", {}) || {};
      const design = ctx.get("design", {}) || {};
      const incArr = linesToArray(incTA.value);
      const excArr = linesToArray(excTA.value);

      if (!incArr.length && !excArr.length) {
        ctx.toast("Chưa có tiêu chí để đánh giá.");
        return;
      }

      const prompt = `
Bạn là chuyên gia thử nghiệm lâm sàng. Hãy ĐÁNH GIÁ bộ tiêu chí vào/loại sau, và gợi ý chỉnh sửa.

PICO:
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}

Thiết kế: ${JSON.stringify(design)}

TIÊU CHÍ VÀO:
${incArr.map((x) => "- " + x).join("\n")}

TIÊU CHÍ LOẠI:
${excArr.map((x) => "- " + x).join("\n")}

YÊU CẦU ĐẦU RA:
1) Nhận xét tổng quát (3–6 gạch đầu dòng) về tính rõ ràng, khả thi, và mức độ khớp với PICO/thiết kế.
2) Chỉ ra các tiêu chí mơ hồ, trùng lặp hoặc có nguy cơ gây thiên lệch (selection bias) và đề nghị chỉnh lại.
3) Gợi ý bộ tiêu chí đã hiệu chỉnh (liệt kê lại, có thể nhóm thành khối: dân số, bệnh kèm, điều trị trước đó, yếu tố logistic...).
4) CUỐI CÙNG phải có mục:
"Tài liệu tham khảo (AMA 11th):"
với tối thiểu 3 tài liệu tham khảo (guideline, sách, bài báo) trình bày theo AMA 11th. Không cần URL.
`.trim();

      const res = await callAI("step7.evaluate", prompt, ctx);
      const text = String(res || "").trim();
      if (!text) {
        ctx.toast("GPT không trả về đánh giá.");
        return;
      }

      eTA.value = text;
      evalBox.classList.remove("hidden");

      const current = ctx.get("criteria", {}) || {};
      ctx.save("criteria", {
        ...current,
        evaluation: text,
        lastEvaluatedAt: new Date().toISOString(),
      });

      ctx.toast("Đã nhận đánh giá tiêu chí (kèm TLTK).");
    } catch (e) {
      console.error(e);
      ctx.toast("Lỗi khi gọi GPT đánh giá.");
    } finally {
      toggleBusy(evalBtn, false, "GPT đánh giá tiêu chí hiện có");
    }
  });

  copyEval?.addEventListener("click", () => copyText(eTA.value || ""));
  hideEval?.addEventListener("click", () => evalBox.classList.add("hidden"));

  // ---- save
  saveBtn.addEventListener("click", () => {
    const inclusion = linesToArray(incTA.value);
    const exclusion = linesToArray(excTA.value);
    const current   = ctx.get("criteria", {}) || {};

    ctx.save("criteria", {
      ...current, // giữ evaluation nếu đã có
      inclusion,
      exclusion,
      notes: (notesTA.value || "").trim(),
      sources: pdfContext || "",
      savedAt: new Date().toISOString(),
    });

    ctx.toast("Đã lưu tiêu chí vào/loại.");
  });
}
