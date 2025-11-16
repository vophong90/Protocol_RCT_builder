// src/steps/step12/index.js
// Step 12 – Xử lý dữ liệu & Kế hoạch phân tích số liệu chi tiết (SAP)
// Cần ctx: get/save/toast, callStepGPT(bindingKey, prompt)

export const id = 12;
export const title = "Xử lý dữ liệu & Kế hoạch phân tích (SAP)";
export const subtitle =
  "Mô tả quy trình xử lý dữ liệu, đảm bảo chất lượng và kế hoạch phân tích số liệu chi tiết theo SAP.";
export const css = "./public/css/steps/step12.css";

export async function mount(rootEl, ctx) {
  // Scope CSS riêng cho step12
  rootEl.closest(".step")?.setAttribute("data-scope", "step12");

  // ===== Layout chính =====
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Xử lý dữ liệu & Kế hoạch phân tích (SAP)</h3>
      <div class="card-subtitle">
        Hoàn thiện hai tiểu mục quan trọng trong đề cương / SAP: (1) Xử lý dữ liệu & đảm bảo chất lượng,
        (2) Kế hoạch phân tích số liệu chi tiết.
      </div>
    </div>

    <div class="card-body grid-1">

      <!-- A. Data handling & quality -->
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">A. Xử lý dữ liệu & đảm bảo chất lượng</div>
            <div class="section-hint muted">
              Mô tả luồng dữ liệu từ CRF/phiếu thu thập vào CSDL, quy trình nhập liệu, kiểm tra logic,
              xử lý dữ liệu thiếu/sai, kiểm tra chất lượng, giám sát, khóa CSDL (database lock)...
            </div>
          </div>
          <div class="section-actions">
            <button type="button" class="btn btn-secondary" id="btn-data-suggest">
              GPT gợi ý đoạn mô tả
            </button>
            <button type="button" class="btn btn-ghost" id="btn-data-eval">
              GPT đánh giá & góp ý
            </button>
          </div>
        </div>

        <div class="grid-1 section-body">
          <div class="form-field">
            <label class="field-label">
              Đoạn mô tả của bạn
              <span class="muted">
                (sẽ lưu vào mục “Xử lý dữ liệu & đảm bảo chất lượng” trong SAP)
              </span>
            </label>
            <textarea id="data-text" placeholder="Ví dụ: Dữ liệu nghiên cứu sẽ được ghi nhận trên CRF điện tử..."></textarea>
          </div>

          <div class="form-field">
            <label class="field-label inline-row">
              Gợi ý từ GPT
              <button type="button" class="btn btn-ghost btn-xs" id="btn-data-copy-suggest">
                Sao chép vào clipboard
              </button>
            </label>
            <textarea
              id="data-suggest"
              class="feedback-area"
              placeholder="Kết quả GPT gợi ý sẽ xuất hiện ở đây. Bạn chủ động chỉnh sửa và chép sang đoạn mô tả chính."></textarea>
          </div>

          <div class="form-field">
            <label class="field-label inline-row">
              Đánh giá / góp ý của GPT
              <button type="button" class="btn btn-ghost btn-xs" id="btn-data-copy-eval">
                Sao chép vào clipboard
              </button>
            </label>
            <textarea
              id="data-eval"
              class="feedback-area"
              placeholder="Đánh giá của GPT về tính đầy đủ, rõ ràng, bám sát hướng dẫn chuẩn cho phần xử lý dữ liệu."></textarea>
          </div>
        </div>
      </div>

      <!-- B. Detailed SAP -->
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">B. Kế hoạch phân tích số liệu chi tiết (SAP)</div>
            <div class="section-hint muted">
              Mô tả chi tiết quần thể phân tích (ITT/PP/Safety), bộ biến chính/phụ, test thống kê, mô hình,
              xử lý thiếu số liệu, phân tích độ nhạy, phân tích dưới nhóm, kiểm soát đa so sánh... theo chuẩn SAP.
            </div>
          </div>
          <div class="section-actions">
            <button type="button" class="btn btn-secondary" id="btn-ana-suggest">
              GPT gợi ý SAP chi tiết
            </button>
            <button type="button" class="btn btn-ghost" id="btn-ana-eval">
              GPT đánh giá SAP
            </button>
          </div>
        </div>

        <div class="grid-1 section-body">
          <div class="form-field">
            <label class="field-label">
              Bản thảo kế hoạch phân tích số liệu (SAP)
              <span class="muted">
                Nên trình bày theo tiểu mục: quần thể phân tích, biến, phương pháp mô tả, so sánh chính/phụ,
                mô hình điều chỉnh, kiểm soát sai số loại I, phân tích độ nhạy, phân tích dưới nhóm...
              </span>
            </label>
            <textarea
              id="ana-text"
              placeholder="Ví dụ: Phân tích chính sẽ được thực hiện theo nguyên tắc ITT. Biến kết cục chính là..."></textarea>
          </div>

          <div class="form-field">
            <label class="field-label inline-row">
              Gợi ý SAP từ GPT
              <button type="button" class="btn btn-ghost btn-xs" id="btn-ana-copy-suggest">
                Sao chép vào clipboard
              </button>
            </label>
            <textarea
              id="ana-suggest"
              class="feedback-area"
              placeholder="Kết quả GPT gợi ý SAP chi tiết (có thể ở dạng đề cương các tiểu mục hoặc đoạn văn hoàn chỉnh)."></textarea>
          </div>

          <div class="form-field">
            <label class="field-label inline-row">
              Đánh giá / góp ý của GPT cho SAP
              <button type="button" class="btn btn-ghost btn-xs" id="btn-ana-copy-eval">
                Sao chép vào clipboard
              </button>
            </label>
            <textarea
              id="ana-eval"
              class="feedback-area"
              placeholder="Nhận xét về mức độ đầy đủ, tính phù hợp với mục tiêu & thiết kế, gợi ý chỉnh sửa, bổ sung."></textarea>
          </div>
        </div>
      </div>

    </div>

    <div class="card-footer">
      <button type="button" class="btn btn-primary" id="step12-save">
        Lưu nội dung Step 12
      </button>
    </div>
  `.trim();

  // ===== DOM refs =====
  const dataTextEl = rootEl.querySelector("#data-text");
  const dataSuggestEl = rootEl.querySelector("#data-suggest");
  const dataEvalEl = rootEl.querySelector("#data-eval");

  const anaTextEl = rootEl.querySelector("#ana-text");
  const anaSuggestEl = rootEl.querySelector("#ana-suggest");
  const anaEvalEl = rootEl.querySelector("#ana-eval");

  const btnDataSuggest = rootEl.querySelector("#btn-data-suggest");
  const btnDataEval = rootEl.querySelector("#btn-data-eval");
  const btnDataCopySuggest = rootEl.querySelector("#btn-data-copy-suggest");
  const btnDataCopyEval = rootEl.querySelector("#btn-data-copy-eval");

  const btnAnaSuggest = rootEl.querySelector("#btn-ana-suggest");
  const btnAnaEval = rootEl.querySelector("#btn-ana-eval");
  const btnAnaCopySuggest = rootEl.querySelector("#btn-ana-copy-suggest");
  const btnAnaCopyEval = rootEl.querySelector("#btn-ana-copy-eval");

  const btnSave = rootEl.querySelector("#step12-save");

  // ===== Load state =====
  dataTextEl.value = String(ctx.get("step12DataHandling", "") || "");
  anaTextEl.value = String(ctx.get("step12AnalysisPlan", "") || "");

  // ===== Events: Save =====
  btnSave.addEventListener("click", () => {
    ctx.save("step12DataHandling", dataTextEl.value || "");
    ctx.save("step12AnalysisPlan", anaTextEl.value || "");
    ctx.toast("Đã lưu nội dung Step 12 (Xử lý dữ liệu & Kế hoạch phân tích).");
  });

  // ===== GPT: A. Data handling & quality =====
  btnDataSuggest.addEventListener("click", () =>
    suggestDataHandling(ctx, dataSuggestEl)
  );
  btnDataEval.addEventListener("click", () =>
    evalDataHandling(ctx, dataTextEl.value || "", dataEvalEl)
  );
  btnDataCopySuggest.addEventListener("click", () =>
    copyText(dataSuggestEl.value || "", ctx)
  );
  btnDataCopyEval.addEventListener("click", () =>
    copyText(dataEvalEl.value || "", ctx)
  );

  // ===== GPT: B. SAP =====
  btnAnaSuggest.addEventListener("click", () =>
    suggestAnalysisPlan(ctx, anaSuggestEl)
  );
  btnAnaEval.addEventListener("click", () =>
    evalAnalysisPlan(ctx, anaTextEl.value || "", anaEvalEl)
  );
  btnAnaCopySuggest.addEventListener("click", () =>
    copyText(anaSuggestEl.value || "", ctx)
  );
  btnAnaCopyEval.addEventListener("click", () =>
    copyText(anaEvalEl.value || "", ctx)
  );
}

/* ==================== GPT helpers ==================== */

async function suggestDataHandling(ctx, outEl) {
  try {
    toggleBusyButton(ctx, "Đang gợi ý phần xử lý dữ liệu...");

    const pico = ctx.get("pico", {}) || {};
    const design = ctx.get("design", {}) || {};
    const dataCollection = ctx.get("step11Plan", ctx.get("dataCollection", {})) || {};

    const prompt = `
Bạn là biostatistician và data manager tham gia xây dựng SAP cho một RCT.

Hãy viết giúp "Xử lý dữ liệu và đảm bảo chất lượng" (Data handling and quality assurance) cho đề cương/SAP,
dựa trên bối cảnh dưới đây. Trả lời bằng TIẾNG VIỆT, văn phong học thuật, rõ ràng, mạch lạc.

YÊU CẦU:
- Trình bày theo các tiểu mục (có thể dùng gạch đầu dòng hoặc đoạn văn), ví dụ:
  • Nguồn dữ liệu và công cụ thu thập (CRF giấy/điện tử, hệ thống nhập liệu)
  • Quy trình nhập liệu (double entry, range check, logic check)
  • Quản lý mã hoá biến, từ điển dữ liệu (data dictionary)
  • Xử lý dữ liệu thiếu và giá trị ngoại lai (outliers)
  • Theo dõi, kiểm tra và làm sạch dữ liệu (data cleaning, query management)
  • Đảm bảo chất lượng, giám sát, audit, bảo mật và phân quyền truy cập
  • Đóng/mở cơ sở dữ liệu (database lock/unlock) trước khi phân tích
- Có thể tham khảo cấu trúc trong ICH E6(R2), ICH E9, GCP nhưng KHÔNG được bịa tên văn bản.
- Nếu trích dẫn tài liệu, ghi dạng [1], [2] trong nội dung (không cần danh mục chi tiết).

BỐI CẢNH (tóm tắt):
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

Thiết kế nghiên cứu (rút gọn JSON):
${safeJson(design)}

Thông tin lịch thu thập dữ liệu (nếu có, rút gọn JSON):
${safeJson(dataCollection)}
`.trim();

    const raw = await callAI("step12.suggest", prompt, ctx);
    outEl.value = String(raw || "").trim() || "GPT không trả về nội dung.";
    toast(ctx, "Đã nhận gợi ý cho phần Xử lý dữ liệu & đảm bảo chất lượng.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý phần xử lý dữ liệu.");
  } finally {
    toggleBusyButton(ctx, null, true);
  }
}

async function evalDataHandling(ctx, text, outEl) {
  if (!text.trim()) {
    toast(ctx, "Chưa có nội dung để đánh giá ở phần xử lý dữ liệu.");
    return;
  }
  try {
    toggleBusyButton(ctx, "Đang đánh giá phần xử lý dữ liệu...");

    const prompt = `
Bạn là chuyên gia GCP và biostatistician. Hãy ĐÁNH GIÁ đoạn "Xử lý dữ liệu & đảm bảo chất lượng"
ở dưới đây, trả lời bằng TIẾNG VIỆT:

--- BẢN THẢO CẦN ĐÁNH GIÁ ---
${text}
--- HẾT BẢN THẢO ---

YÊU CẦU:
1) Nhận xét tổng quan (3–6 câu) về:
   - Tính đầy đủ so với chuẩn GCP/SAP
   - Mức độ rõ ràng, khả thi, logic
2) Liệt kê các điểm mạnh và điểm cần chỉnh sửa (dạng gạch đầu dòng).
3) Gợi ý chỉnh sửa cụ thể (có thể đề xuất cấu trúc lại các tiểu mục).
4) Nếu cần trích dẫn, ghi dạng [1], [2] (không cần liệt kê đầy đủ tài liệu).

Đừng viết lại nguyên văn toàn bộ đoạn; chỉ nhận xét và gợi ý.
`.trim();

    const raw = await callAI("step12.evaluate", prompt, ctx);
    outEl.value = String(raw || "").trim() || "GPT không trả về nội dung.";
    toast(ctx, "Đã nhận đánh giá cho phần Xử lý dữ liệu & đảm bảo chất lượng.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá phần xử lý dữ liệu.");
  } finally {
    toggleBusyButton(ctx, null, true);
  }
}

async function suggestAnalysisPlan(ctx, outEl) {
  try {
    toggleBusyButton(ctx, "Đang gợi ý SAP chi tiết...");

    const pico = ctx.get("pico", {}) || {};
    const mainObj = (ctx.get("mainObjective", "") || "").trim();
    const subs = Array.isArray(ctx.get("subObjectives", []))
      ? ctx
          .get("subObjectives", [])
          .map((x) => String(x || "").trim())
          .filter(Boolean)
      : [];
    const design = ctx.get("design", {}) || {};
    const vars = ctx.get("step10Vars", {}) || {};
    const dataCollection = ctx.get("step11Plan", ctx.get("dataCollection", {})) || {};

    const prompt = `
Bạn là biostatistician xây dựng Kế hoạch phân tích số liệu chi tiết (Statistical Analysis Plan – SAP)
cho một RCT. Hãy gợi ý đoạn mô tả chi tiết phần "Phân tích số liệu" cho đề cương/SAP, bằng TIẾNG VIỆT.

BỐI CẢNH:
- PICO:
  • P: ${pico.p || "(chưa nhập)"}
  • I: ${pico.i || "(chưa nhập)"}
  • C: ${pico.c || "(chưa nhập)"}
  • O: ${pico.o || "(chưa nhập)"}

- Mục tiêu chính: ${mainObj || "(chưa nhập)"}
- Mục tiêu phụ:
${subs.length ? subs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa nhập)"}

- Thiết kế (JSON rút gọn):
${safeJson(design)}

- Nhóm biến (Step 10 – JSON rút gọn):
${safeJson(vars)}

- Lịch thu thập dữ liệu (Step 11 – JSON rút gọn):
${safeJson(dataCollection)}

YÊU CẦU NỘI DUNG:
- Trình bày theo cấu trúc SAP tiêu chuẩn, ví dụ:
  1) Quần thể phân tích (ITT, PP, Safety)
  2) Nguyên tắc mã hoá và xử lý biến (ví dụ: biến nhị phân, biến liên tục, chuyển đổi log, tính điểm)
  3) Phân tích mô tả cho biến nền và biến kết cục
  4) Phân tích chính cho kết cục chính (nêu rõ test/mô hình, điều chỉnh biến nhiễu nếu cần)
  5) Phân tích cho kết cục phụ
  6) Xử lý số liệu thiếu (missing data) và phân tích độ nhạy
  7) Phân tích dưới nhóm (nếu có)
  8) Kiểm soát đa so sánh / điều chỉnh sai số loại I (nếu phù hợp)
- Văn phong học thuật, rõ ràng, có thể đưa thẳng vào phần SAP của đề cương.
- Nếu trích dẫn guideline (ICH E9, CONSORT, SPIRIT...), chỉ ghi chung chung, không bịa mã tài liệu.
- Có thể dùng đánh số hoặc heading nhỏ, không cần bảng.

Trả lời bằng VĂN BẢN THUẦN (có thể có gạch đầu dòng/heading), không dùng JSON.
`.trim();

    const raw = await callAI("step12.suggest", prompt, ctx);
    outEl.value = String(raw || "").trim() || "GPT không trả về nội dung.";
    toast(ctx, "Đã nhận gợi ý Kế hoạch phân tích số liệu chi tiết (SAP).");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý SAP.");
  } finally {
    toggleBusyButton(ctx, null, true);
  }
}

async function evalAnalysisPlan(ctx, text, outEl) {
  if (!text.trim()) {
    toast(ctx, "Chưa có nội dung SAP để đánh giá.");
    return;
  }
  try {
    toggleBusyButton(ctx, "Đang đánh giá SAP...");

    const prompt = `
Bạn là biostatistician giàu kinh nghiệm trong thiết kế RCT và viết SAP.

Hãy ĐÁNH GIÁ đoạn Kế hoạch phân tích số liệu (SAP) dưới đây, bằng TIẾNG VIỆT:

--- BẢN THẢO SAP CẦN ĐÁNH GIÁ ---
${text}
--- HẾT BẢN THẢO ---

YÊU CẦU:
1) Nhận xét tổng quan (5–10 câu) về:
   - Tính đầy đủ so với chuẩn SAP (có đủ: quần thể phân tích, phân tích chính/phụ, xử lý missing, under/over-specification?)
   - Mức độ rõ ràng, khả thi, có nêu rõ test/mô hình và cách trình bày kết quả không.
2) Liệt kê các điểm mạnh và điểm hạn chế (dạng gạch đầu dòng).
3) Đề xuất chỉnh sửa chi tiết: những tiểu mục cần thêm/bớt, bổ sung thông tin nào, chỗ nào cần cụ thể hơn.
4) Nếu cần, gợi ý một cấu trúc/mục lục ngắn cho phần SAP của đề cương.

Không cần viết lại toàn văn SAP; chỉ tập trung đánh giá và gợi ý cải thiện.
`.trim();

    const raw = await callAI("step12.evaluate", prompt, ctx);
    outEl.value = String(raw || "").trim() || "GPT không trả về nội dung.";
    toast(ctx, "Đã nhận đánh giá cho Kế hoạch phân tích số liệu (SAP).");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá SAP.");
  } finally {
    toggleBusyButton(ctx, null, true);
  }
}

/* ==================== Common helpers ==================== */

function toast(ctx, msg) {
  if (ctx && typeof ctx.toast === "function") ctx.toast(msg);
  else console.log("[toast]", msg);
}

function copyText(t, ctx) {
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(t || "");
      toast(ctx, "Đã sao chép vào clipboard.");
    } else {
      throw new Error("Clipboard API không hỗ trợ.");
    }
  } catch {
    toast(ctx, "Không sao chép được nội dung.");
  }
}

// Ở đây mình dùng 1 "global" đơn giản để tránh truyền button; nếu anh muốn tinh vi hơn có thể sửa sau
let busyMessageEl = null;
function toggleBusyButton(ctx, msg, resetOnly = false) {
  if (!busyMessageEl) {
    busyMessageEl = document.getElementById("global-busy-msg");
  }
  if (!busyMessageEl) {
    // không có UI riêng cho busy, ta chỉ dùng toast ngắn
    if (msg && !resetOnly) toast(ctx, msg);
    return;
  }
  if (resetOnly) {
    busyMessageEl.textContent = "";
    busyMessageEl.classList.add("hidden");
  } else if (msg) {
    busyMessageEl.textContent = msg;
    busyMessageEl.classList.remove("hidden");
  }
}

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
  throw new Error("Chưa cấu hình GPT cho step12.");
}

function safeJson(obj) {
  try {
    return JSON.stringify(obj ?? {}, null, 2).slice(0, 1200);
  } catch {
    return "{}";
  }
}
