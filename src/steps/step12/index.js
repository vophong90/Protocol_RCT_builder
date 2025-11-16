// src/steps/step12/index.js
// Step 12 – Xử lý dữ liệu & Kế hoạch phân tích (SAP)
// Cần ctx: get/save/toast, callStepGPT(bindingKey, prompt)

export const id = 12;
export const title = "Xử lý dữ liệu & Kế hoạch phân tích (SAP)";
export const subtitle =
  "Hoàn thiện phần xử lý dữ liệu, đảm bảo chất lượng và kế hoạch phân tích số liệu chi tiết cho RCT.";
export const css = "./public/css/steps/step12.css";

export async function mount(rootEl, ctx) {
  // Scope CSS riêng cho step12
  rootEl.closest(".step")?.setAttribute("data-scope", "step12");

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Xử lý dữ liệu & Kế hoạch phân tích (SAP)</h3>
      <div class="card-subtitle">
        Viết đoạn mô tả hoàn chỉnh cho hai mục: 
        (A) Xử lý dữ liệu & đảm bảo chất lượng và (B) Kế hoạch phân tích số liệu chi tiết (SAP).
      </div>
    </div>

    <div class="card-body">

      <!-- A. Xử lý dữ liệu & đảm bảo chất lượng -->
      <section class="form-section">
        <label class="form-label">
          A. Xử lý dữ liệu & đảm bảo chất lượng
        </label>
        <textarea
          id="data-main"
          placeholder="Ví dụ: Dữ liệu nghiên cứu sẽ được ghi nhận trên CRF điện tử, sau đó được nhập vào hệ thống ..."></textarea>

        <div class="btn-row">
          <button type="button" class="btn btn-primary" id="btn-data-suggest">
            GPT gợi ý mô tả A
          </button>
          <button type="button" class="btn btn-secondary" id="btn-data-eval">
            GPT đánh giá mô tả A
          </button>
        </div>
      </section>

      <!-- B. Kế hoạch phân tích số liệu chi tiết (SAP) -->
      <section class="form-section">
        <label class="form-label">
          B. Kế hoạch phân tích số liệu chi tiết (SAP)
        </label>
        <textarea
          id="sap-main"
          placeholder="Ví dụ: Phân tích chính được thực hiện theo nguyên tắc ITT. Biến kết cục chính là..., so sánh bằng..."></textarea>

        <div class="btn-row">
          <button type="button" class="btn btn-primary" id="btn-sap-suggest">
            GPT gợi ý mô tả B
          </button>
          <button type="button" class="btn btn-secondary" id="btn-sap-eval">
            GPT đánh giá mô tả B
          </button>
        </div>
      </section>

    </div>

    <div class="card-footer">
      <button type="button" class="btn btn-primary" id="step12-save">
        Lưu mô tả
      </button>
    </div>
  `.trim();

  // ===== DOM refs =====
  const dataMainEl = rootEl.querySelector("#data-main");
  const sapMainEl = rootEl.querySelector("#sap-main");

  const btnDataSuggest = rootEl.querySelector("#btn-data-suggest");
  const btnDataEval = rootEl.querySelector("#btn-data-eval");
  const btnSapSuggest = rootEl.querySelector("#btn-sap-suggest");
  const btnSapEval = rootEl.querySelector("#btn-sap-eval");
  const btnSave = rootEl.querySelector("#step12-save");

  // ===== Load state =====
  dataMainEl.value = String(ctx.get("step12DataHandling", "") || "");
  sapMainEl.value = String(ctx.get("step12AnalysisPlan", "") || "");

  // ===== Save =====
  btnSave.addEventListener("click", () => {
    ctx.save("step12DataHandling", dataMainEl.value || "");
    ctx.save("step12AnalysisPlan", sapMainEl.value || "");
    ctx.toast("Đã lưu nội dung Step 12 (Xử lý dữ liệu & SAP).");
  });

  // ===== GPT: A. Data handling =====
  btnDataSuggest.addEventListener("click", () =>
    suggestDataHandling(ctx, dataMainEl, btnDataSuggest)
  );
  btnDataEval.addEventListener("click", () =>
    evalDataHandling(ctx, dataMainEl.value || "", btnDataEval)
  );

  // ===== GPT: B. SAP =====
  btnSapSuggest.addEventListener("click", () =>
    suggestSAP(ctx, sapMainEl, btnSapSuggest)
  );
  btnSapEval.addEventListener("click", () =>
    evalSAP(ctx, sapMainEl.value || "", btnSapEval)
  );
}

/* ================= GPT helpers ================= */

// Gợi ý đoạn A – ghi thẳng vào textarea (có hỏi nếu đang có nội dung)
async function suggestDataHandling(ctx, targetEl, btnEl) {
  try {
    if (targetEl.value.trim()) {
      const ok = window.confirm(
        "Đoạn mô tả hiện tại sẽ được thay thế bằng gợi ý mới từ GPT. Tiếp tục?"
      );
      if (!ok) return;
    }
    toggleBusy(btnEl, true, "Đang gợi ý...");

    const pico = ctx.get("pico", {}) || {};
    const design = ctx.get("design", {}) || {};
    const dataCollection = ctx.get("step11Plan", ctx.get("dataCollection", {})) || {};

    const prompt = `
Bạn là biostatistician và data manager xây dựng SAP cho một RCT.

Hãy viết mục "Xử lý dữ liệu và đảm bảo chất lượng" (Data handling and quality assurance)
cho đề cương/SAP, TRẢ LỜI BẰNG TIẾNG VIỆT, văn phong học thuật, rõ ràng.

YÊU CẦU:
- Trình bày dạng đoạn văn hoàn chỉnh, có thể dùng ngay cho đề cương, bao gồm (nếu phù hợp):
  • Nguồn dữ liệu và công cụ thu thập (CRF giấy/điện tử, hệ thống nhập liệu)
  • Quy trình nhập liệu, kiểm tra logic, kiểm tra phạm vi giá trị
  • Làm sạch dữ liệu, xử lý dữ liệu thiếu, xử lý giá trị ngoại lai
  • Đảm bảo chất lượng, giám sát, audit, bảo mật, phân quyền truy cập
  • Đóng/mở cơ sở dữ liệu (database lock/unlock) trước phân tích
- Có thể nhắc ICH-GCP, CONSORT, SPIRIT..., nhưng KHÔNG bịa mã tài liệu cụ thể.

BỐI CẢNH (tóm tắt):
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

Thiết kế (JSON rút gọn):
${safeJson(design)}

Lịch thu thập dữ liệu (JSON rút gọn, nếu có):
${safeJson(dataCollection)}
`.trim();

    const raw = await callAI("step12.suggest", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    targetEl.value = text;
    toast(ctx, "Đã chèn gợi ý mô tả A vào ô nội dung.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý mô tả A.");
  } finally {
    toggleBusy(btnEl, false, "GPT gợi ý mô tả A");
  }
}

async function evalDataHandling(ctx, draft, btnEl) {
  if (!draft.trim()) {
    toast(ctx, "Chưa có nội dung để đánh giá ở phần A.");
    return;
  }
  try {
    toggleBusy(btnEl, true, "Đang đánh giá...");

    const prompt = `
Bạn là chuyên gia GCP và biostatistician. Hãy ĐÁNH GIÁ đoạn "Xử lý dữ liệu & đảm bảo chất lượng" dưới đây,
TRẢ LỜI BẰNG TIẾNG VIỆT:

--- BẢN THẢO CẦN ĐÁNH GIÁ ---
${draft}
--- HẾT BẢN THẢO ---

YÊU CẦU:
1) Nhận xét tổng quan (3–6 câu) về:
   - Tính đầy đủ so với chuẩn thực hành tốt (GCP) và SAP
   - Mức độ rõ ràng, khả thi, logic
2) Liệt kê điểm mạnh và điểm hạn chế (dạng gạch đầu dòng).
3) Gợi ý chỉnh sửa cụ thể (có thể đề xuất tái cấu trúc các tiểu mục).
4) Không cần viết lại toàn bộ đoạn, chỉ nhận xét và gợi ý cải thiện.
`.trim();

    const raw = await callAI("step12.evaluate", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    showFeedbackDialog("Đánh giá mô tả A – Xử lý dữ liệu & đảm bảo chất lượng", text);
    toast(ctx, "Đã nhận đánh giá cho mô tả A.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá mô tả A.");
  } finally {
    toggleBusy(btnEl, false, "GPT đánh giá mô tả A");
  }
}

// Gợi ý SAP – ghi thẳng vào textarea B
async function suggestSAP(ctx, targetEl, btnEl) {
  try {
    if (targetEl.value.trim()) {
      const ok = window.confirm(
        "Đoạn SAP hiện tại sẽ được thay thế bằng gợi ý mới từ GPT. Tiếp tục?"
      );
      if (!ok) return;
    }
    toggleBusy(btnEl, true, "Đang gợi ý...");

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
cho một RCT. Hãy viết mục "Phân tích số liệu" trong SAP, TRẢ LỜI BẰNG TIẾNG VIỆT.

BỐI CẢNH:
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

- Mục tiêu chính: ${mainObj || "(chưa nhập)"}
- Mục tiêu phụ:
${subs.length ? subs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa nhập)"}

- Thiết kế (JSON rút gọn):
${safeJson(design)}

- Nhóm biến (Step 10 – JSON rút gọn):
${safeJson(vars)}

- Lịch thu thập dữ liệu (Step 11 – JSON rút gọn):
${safeJson(dataCollection)}

YÊU CẦU:
- Trình bày có cấu trúc, bao gồm:
  • Quần thể phân tích (ITT, PP, Safety)
  • Phân tích mô tả cho biến nền và biến kết cục
  • Phân tích chính cho kết cục chính (test/mô hình, điều chỉnh biến nhiễu nếu có)
  • Phân tích cho kết cục phụ
  • Xử lý thiếu số liệu (missing data) và phân tích độ nhạy
  • Phân tích dưới nhóm (nếu có)
  • Kiểm soát đa so sánh / điều chỉnh sai số loại I (nếu phù hợp)
- Văn phong học thuật, rõ ràng, có thể đưa thẳng vào SAP.
`.trim();

    const raw = await callAI("step12.suggest", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    targetEl.value = text;
    toast(ctx, "Đã chèn gợi ý mô tả B (SAP) vào ô nội dung.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý mô tả B.");
  } finally {
    toggleBusy(btnEl, false, "GPT gợi ý mô tả B");
  }
}

async function evalSAP(ctx, draft, btnEl) {
  if (!draft.trim()) {
    toast(ctx, "Chưa có nội dung SAP để đánh giá.");
    return;
  }
  try {
    toggleBusy(btnEl, true, "Đang đánh giá...");

    const prompt = `
Bạn là biostatistician nhiều kinh nghiệm trong thiết kế RCT và viết SAP.

Hãy ĐÁNH GIÁ đoạn Kế hoạch phân tích số liệu (SAP) dưới đây, TRẢ LỜI BẰNG TIẾNG VIỆT:

--- BẢN THẢO SAP CẦN ĐÁNH GIÁ ---
${draft}
--- HẾT BẢN THẢO ---

YÊU CẦU:
1) Nhận xét tổng quan (5–10 câu) về:
   - Tính đầy đủ so với SAP chuẩn
   - Mức độ rõ ràng, khả thi, có nêu rõ test/mô hình và cách trình bày kết quả hay chưa
2) Liệt kê điểm mạnh và điểm hạn chế (dạng gạch đầu dòng).
3) Đề xuất chỉnh sửa cụ thể: cần bổ sung/giảm bớt những phần nào, chỗ nào cần cụ thể hơn.
4) Nếu phù hợp, gợi ý một cấu trúc/mục lục ngắn gọn cho phần SAP.

Không cần viết lại toàn bộ SAP; tập trung đánh giá và gợi ý cải thiện.
`.trim();

    const raw = await callAI("step12.evaluate", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    showFeedbackDialog("Đánh giá mô tả B – Kế hoạch phân tích số liệu (SAP)", text);
    toast(ctx, "Đã nhận đánh giá cho mô tả B (SAP).");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá mô tả B.");
  } finally {
    toggleBusy(btnEl, false, "GPT đánh giá mô tả B");
  }
}

/* ================= Common helpers ================= */

function toast(ctx, msg) {
  if (ctx && typeof ctx.toast === "function") ctx.toast(msg);
  else console.log("[toast]", msg);
}

function toggleBusy(btn, busy, labelWhenDone) {
  if (!btn) return;
  if (busy) {
    btn.disabled = true;
    btn.dataset.prevText = btn.textContent || "";
    btn.textContent = "Đang xử lý...";
  } else {
    btn.disabled = false;
    btn.textContent = labelWhenDone || btn.dataset.prevText || "";
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

// Popup hiển thị kết quả đánh giá (giống kiểu Step 11)
function showFeedbackDialog(title, text) {
  const id = "step12-fb-dialog";
  let dlg = document.getElementById(id);
  if (!dlg) {
    dlg = document.createElement("div");
    dlg.id = id;
    dlg.style.position = "fixed";
    dlg.style.inset = "0";
    dlg.style.background = "rgba(0,0,0,.45)";
    dlg.style.zIndex = "60";
    dlg.style.display = "flex";
    dlg.style.alignItems = "center";
    dlg.style.justifyContent = "center";
    dlg.innerHTML = `
      <div style="background:#fff; max-width:780px; width:92vw; padding:18px 20px; border-radius:12px; box-shadow:0 18px 60px rgba(0,0,0,.28)">
        <div style="font-weight:700; margin-bottom:6px;" id="step12-fb-title"></div>
        <div id="step12-fb-text" style="white-space:pre-wrap; line-height:1.45; max-height:65vh; overflow:auto; font-size:0.92rem;"></div>
        <div style="display:flex; justify-content:flex-end; margin-top:12px;">
          <button id="step12-fb-close" class="btn btn-primary">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector("#step12-fb-close").addEventListener("click", () => dlg.remove());
  }
  dlg.querySelector("#step12-fb-title").textContent = title || "Đánh giá";
  dlg.querySelector("#step12-fb-text").textContent = text || "";
}
