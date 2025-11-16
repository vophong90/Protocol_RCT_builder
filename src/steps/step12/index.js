// src/steps/step12/index.js
// Step 12 – Xử lý dữ liệu & Kế hoạch phân tích số liệu (SAP)
// Cần ctx: get/save/toast, callStepGPT(bindingKey, prompt)

export const id = 12;
export const title = "Xử lý dữ liệu & Kế hoạch phân tích (SAP)";
export const subtitle =
  "Mô tả quy trình xử lý & đảm bảo chất lượng dữ liệu, cùng kế hoạch phân tích số liệu chi tiết.";
export const css = "./public/css/steps/step12.css";

export async function mount(rootEl, ctx) {
  // Scope CSS riêng cho step12
  rootEl.closest(".step")?.setAttribute("data-scope", "step12");

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Xử lý dữ liệu & Kế hoạch phân tích (SAP)</h3>
      <div class="card-subtitle">
        Hoàn thiện hai phần quan trọng trong đề cương/SAP: 
        (A) Xử lý dữ liệu & đảm bảo chất lượng và (B) Kế hoạch phân tích số liệu chi tiết.
      </div>
    </div>

    <div class="card-body grid-1">

      <!-- A. Xử lý dữ liệu & đảm bảo chất lượng -->
      <section class="section">
        <div class="section-header">
          <div>
            <div class="section-title">A. Xử lý dữ liệu & đảm bảo chất lượng</div>
            <p class="section-hint muted">
              Mô tả luồng dữ liệu từ CRF/phiếu thu thập vào CSDL, quy trình nhập liệu, kiểm tra logic, 
              xử lý dữ liệu thiếu/sai, kiểm tra chất lượng, giám sát, khóa/mở CSDL trước phân tích...
            </p>
          </div>
          <div class="section-actions">
            <button type="button" class="btn btn-secondary" id="btn-data-suggest">
              GPT gợi ý đoạn mô tả
            </button>
            <button type="button" class="btn btn-ghost" id="btn-data-eval">
              GPT đánh giá đoạn mô tả
            </button>
          </div>
        </div>

        <div class="section-body">
          <!-- Ô chính do người dùng viết -->
          <div class="form-field">
            <label class="field-label">
              Đoạn mô tả của bạn
              <span class="muted">
                (sẽ dùng cho mục “Xử lý dữ liệu & đảm bảo chất lượng” trong đề cương/SAP)
              </span>
            </label>
            <textarea
              id="data-main"
              placeholder="Ví dụ: Dữ liệu nghiên cứu sẽ được ghi nhận trên CRF điện tử, sau đó được nhập vào hệ thống REDCap..."></textarea>
          </div>

          <!-- GPT gợi ý (ẩn mặc định) -->
          <div class="gpt-wrap hidden" id="data-suggest-wrap">
            <div class="gpt-header">
              <div class="gpt-title">GPT – Gợi ý đoạn mô tả xử lý dữ liệu</div>
              <div class="gpt-actions">
                <button type="button" class="btn btn-ghost btn-xs" id="btn-data-copy-suggest">
                  Sao chép
                </button>
                <button type="button" class="btn btn-ghost btn-xs" id="btn-data-hide-suggest">
                  Ẩn
                </button>
              </div>
            </div>
            <textarea
              id="data-suggest"
              class="gpt-textarea"
              placeholder="Kết quả GPT gợi ý sẽ hiển thị tại đây. Bạn tự chọn, chỉnh sửa và chép vào đoạn chính."></textarea>
          </div>

          <!-- GPT đánh giá (ẩn mặc định) -->
          <div class="gpt-wrap hidden" id="data-eval-wrap">
            <div class="gpt-header">
              <div class="gpt-title">GPT – Đánh giá đoạn xử lý dữ liệu</div>
              <div class="gpt-actions">
                <button type="button" class="btn btn-ghost btn-xs" id="btn-data-copy-eval">
                  Sao chép
                </button>
                <button type="button" class="btn btn-ghost btn-xs" id="btn-data-hide-eval">
                  Ẩn
                </button>
              </div>
            </div>
            <textarea
              id="data-eval"
              class="gpt-textarea"
              placeholder="Nhận xét và góp ý của GPT về tính đầy đủ, rõ ràng, bám chuẩn GCP/SAP..."></textarea>
          </div>
        </div>
      </section>

      <!-- B. Kế hoạch phân tích số liệu chi tiết (SAP) -->
      <section class="section">
        <div class="section-header">
          <div>
            <div class="section-title">B. Kế hoạch phân tích số liệu chi tiết (SAP)</div>
            <p class="section-hint muted">
              Mô tả chi tiết quần thể phân tích (ITT/PP/Safety), bộ biến chính/phụ, test thống kê, mô hình,
              xử lý missing data, phân tích độ nhạy, phân tích dưới nhóm, kiểm soát đa so sánh... theo chuẩn SAP.
            </p>
          </div>
          <div class="section-actions">
            <button type="button" class="btn btn-secondary" id="btn-sap-suggest">
              GPT gợi ý SAP chi tiết
            </button>
            <button type="button" class="btn btn-ghost" id="btn-sap-eval">
              GPT đánh giá SAP
            </button>
          </div>
        </div>

        <div class="section-body">
          <!-- Ô chính do người dùng viết -->
          <div class="form-field">
            <label class="field-label">
              Bản thảo Kế hoạch phân tích số liệu (SAP)
              <span class="muted">
                Nên trình bày theo các tiểu mục: quần thể phân tích, phân tích mô tả, phân tích chính/phụ,
                xử lý thiếu số liệu, phân tích độ nhạy, dưới nhóm, kiểm soát đa so sánh...
              </span>
            </label>
            <textarea
              id="sap-main"
              placeholder="Ví dụ: Phân tích chính sẽ được thực hiện theo nguyên tắc ITT. Biến kết cục chính là..., được so sánh bằng..."></textarea>
          </div>

          <!-- GPT gợi ý SAP (ẩn mặc định) -->
          <div class="gpt-wrap hidden" id="sap-suggest-wrap">
            <div class="gpt-header">
              <div class="gpt-title">GPT – Gợi ý Kế hoạch phân tích (SAP)</div>
              <div class="gpt-actions">
                <button type="button" class="btn btn-ghost btn-xs" id="btn-sap-copy-suggest">
                  Sao chép
                </button>
                <button type="button" class="btn btn-ghost btn-xs" id="btn-sap-hide-suggest">
                  Ẩn
                </button>
              </div>
            </div>
            <textarea
              id="sap-suggest"
              class="gpt-textarea"
              placeholder="Đề cương SAP chi tiết do GPT gợi ý (cấu trúc + đoạn văn). Bạn chọn phần phù hợp để đưa vào bản chính."></textarea>
          </div>

          <!-- GPT đánh giá SAP (ẩn mặc định) -->
          <div class="gpt-wrap hidden" id="sap-eval-wrap">
            <div class="gpt-header">
              <div class="gpt-title">GPT – Đánh giá Kế hoạch phân tích (SAP)</div>
              <div class="gpt-actions">
                <button type="button" class="btn btn-ghost btn-xs" id="btn-sap-copy-eval">
                  Sao chép
                </button>
                <button type="button" class="btn btn-ghost btn-xs" id="btn-sap-hide-eval">
                  Ẩn
                </button>
              </div>
            </div>
            <textarea
              id="sap-eval"
              class="gpt-textarea"
              placeholder="Nhận xét của GPT về mức độ đầy đủ, rõ ràng, bám mục tiêu & thiết kế, gợi ý chỉnh sửa SAP."></textarea>
          </div>
        </div>
      </section>

    </div>

    <div class="card-footer">
      <button type="button" class="btn btn-primary" id="step12-save">
        Lưu nội dung Step 12
      </button>
    </div>
  `.trim();

  // ===== DOM refs =====
  const dataMainEl = rootEl.querySelector("#data-main");
  const dataSuggestWrap = rootEl.querySelector("#data-suggest-wrap");
  const dataSuggestEl = rootEl.querySelector("#data-suggest");
  const dataEvalWrap = rootEl.querySelector("#data-eval-wrap");
  const dataEvalEl = rootEl.querySelector("#data-eval");

  const sapMainEl = rootEl.querySelector("#sap-main");
  const sapSuggestWrap = rootEl.querySelector("#sap-suggest-wrap");
  const sapSuggestEl = rootEl.querySelector("#sap-suggest");
  const sapEvalWrap = rootEl.querySelector("#sap-eval-wrap");
  const sapEvalEl = rootEl.querySelector("#sap-eval");

  const btnDataSuggest = rootEl.querySelector("#btn-data-suggest");
  const btnDataEval = rootEl.querySelector("#btn-data-eval");
  const btnDataCopySuggest = rootEl.querySelector("#btn-data-copy-suggest");
  const btnDataHideSuggest = rootEl.querySelector("#btn-data-hide-suggest");
  const btnDataCopyEval = rootEl.querySelector("#btn-data-copy-eval");
  const btnDataHideEval = rootEl.querySelector("#btn-data-hide-eval");

  const btnSapSuggest = rootEl.querySelector("#btn-sap-suggest");
  const btnSapEval = rootEl.querySelector("#btn-sap-eval");
  const btnSapCopySuggest = rootEl.querySelector("#btn-sap-copy-suggest");
  const btnSapHideSuggest = rootEl.querySelector("#btn-sap-hide-suggest");
  const btnSapCopyEval = rootEl.querySelector("#btn-sap-copy-eval");
  const btnSapHideEval = rootEl.querySelector("#btn-sap-hide-eval");

  const btnSave = rootEl.querySelector("#step12-save");

  // ===== Load state =====
  dataMainEl.value = String(ctx.get("step12DataHandling", "") || "");
  sapMainEl.value = String(ctx.get("step12AnalysisPlan", "") || "");

  // ===== Save =====
  btnSave.addEventListener("click", () => {
    ctx.save("step12DataHandling", dataMainEl.value || "");
    ctx.save("step12AnalysisPlan", sapMainEl.value || "");
    ctx.toast("Đã lưu nội dung Step 12 (Xử lý dữ liệu & Kế hoạch phân tích).");
  });

  // ===== GPT: A. Data handling =====
  btnDataSuggest.addEventListener("click", () =>
    suggestDataHandling(ctx, dataSuggestWrap, dataSuggestEl, btnDataSuggest)
  );
  btnDataEval.addEventListener("click", () =>
    evalDataHandling(ctx, dataMainEl.value || "", dataEvalWrap, dataEvalEl, btnDataEval)
  );
  btnDataCopySuggest.addEventListener("click", () =>
    copyText(dataSuggestEl.value || "", ctx)
  );
  btnDataHideSuggest.addEventListener("click", () =>
    dataSuggestWrap.classList.add("hidden")
  );
  btnDataCopyEval.addEventListener("click", () =>
    copyText(dataEvalEl.value || "", ctx)
  );
  btnDataHideEval.addEventListener("click", () =>
    dataEvalWrap.classList.add("hidden")
  );

  // ===== GPT: B. SAP =====
  btnSapSuggest.addEventListener("click", () =>
    suggestSAP(ctx, sapSuggestWrap, sapSuggestEl, btnSapSuggest)
  );
  btnSapEval.addEventListener("click", () =>
    evalSAP(ctx, sapMainEl.value || "", sapEvalWrap, sapEvalEl, btnSapEval)
  );
  btnSapCopySuggest.addEventListener("click", () =>
    copyText(sapSuggestEl.value || "", ctx)
  );
  btnSapHideSuggest.addEventListener("click", () =>
    sapSuggestWrap.classList.add("hidden")
  );
  btnSapCopyEval.addEventListener("click", () =>
    copyText(sapEvalEl.value || "", ctx)
  );
  btnSapHideEval.addEventListener("click", () =>
    sapEvalWrap.classList.add("hidden")
  );
}

/* ================= GPT helpers ================= */

async function suggestDataHandling(ctx, wrapEl, taEl, btnEl) {
  try {
    toggleBusy(btnEl, true, "Đang gợi ý...");
    const pico = ctx.get("pico", {}) || {};
    const design = ctx.get("design", {}) || {};
    const dataCollection = ctx.get("step11Plan", ctx.get("dataCollection", {})) || {};

    const prompt = `
Bạn là biostatistician và data manager tham gia xây dựng SAP cho một RCT.

Hãy viết giúp mục "Xử lý dữ liệu và đảm bảo chất lượng" (Data handling and quality assurance)
cho đề cương/SAP, TRẢ LỜI BẰNG TIẾNG VIỆT, văn phong học thuật, rõ ràng.

YÊU CẦU:
- Trình bày theo tiểu mục hoặc đoạn văn, bao gồm (nếu phù hợp):
  • Nguồn dữ liệu và công cụ thu thập (CRF giấy/điện tử, hệ thống nhập liệu)
  • Quy trình nhập liệu (double entry, range check, logic check)
  • Quản lý mã hoá biến, từ điển dữ liệu (data dictionary)
  • Xử lý dữ liệu thiếu, giá trị ngoại lai (outliers)
  • Theo dõi, kiểm tra và làm sạch dữ liệu (data cleaning, query management)
  • Đảm bảo chất lượng, giám sát, audit, bảo mật, phân quyền truy cập
  • Đóng/mở cơ sở dữ liệu (database lock/unlock) trước phân tích
- Có thể nhắc đến ICH-GCP, ICH E6/E9, CONSORT, nhưng KHÔNG bịa mã tài liệu cụ thể.
- Nếu muốn trích dẫn, chỉ ghi dạng [1], [2] trong nội dung (không cần danh mục chi tiết).

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
    taEl.value = text;
    wrapEl.classList.remove("hidden");
    toast(ctx, "Đã nhận gợi ý cho phần Xử lý dữ liệu & đảm bảo chất lượng.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý phần xử lý dữ liệu.");
  } finally {
    toggleBusy(btnEl, false, "GPT gợi ý đoạn mô tả");
  }
}

async function evalDataHandling(ctx, draft, wrapEl, taEl, btnEl) {
  if (!draft.trim()) {
    toast(ctx, "Chưa có nội dung để đánh giá ở phần xử lý dữ liệu.");
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
2) Liệt kê các điểm mạnh và điểm hạn chế (dạng gạch đầu dòng).
3) Gợi ý chỉnh sửa cụ thể (có thể đề xuất tái cấu trúc các tiểu mục).
4) Nếu cần trích dẫn, dùng dạng [1], [2] trong nội dung (không cần danh mục chi tiết).

Không viết lại toàn bộ đoạn, chỉ nhận xét và gợi ý cải thiện.
`.trim();

    const raw = await callAI("step12.evaluate", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    taEl.value = text;
    wrapEl.classList.remove("hidden");
    toast(ctx, "Đã nhận đánh giá cho phần Xử lý dữ liệu & đảm bảo chất lượng.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá phần xử lý dữ liệu.");
  } finally {
    toggleBusy(btnEl, false, "GPT đánh giá đoạn mô tả");
  }
}

async function suggestSAP(ctx, wrapEl, taEl, btnEl) {
  try {
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
cho một RCT. Hãy gợi ý mục "Phân tích số liệu" trong SAP, TRẢ LỜI BẰNG TIẾNG VIỆT.

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

YÊU CẦU NỘI DUNG:
- Trình bày có cấu trúc (có thể đánh số/heading), bao gồm:
  1) Quần thể phân tích (ITT, PP, Safety)
  2) Nguyên tắc mã hoá và xử lý biến (biến nhị phân, liên tục, chuyển đổi log, tính điểm...)
  3) Phân tích mô tả cho biến nền và biến kết cục
  4) Phân tích chính cho kết cục chính (nêu rõ test/mô hình, điều chỉnh biến nhiễu nếu có)
  5) Phân tích cho kết cục phụ
  6) Xử lý số liệu thiếu (missing data) và phân tích độ nhạy
  7) Phân tích dưới nhóm (nếu có)
  8) Kiểm soát đa so sánh / điều chỉnh sai số loại I (nếu phù hợp)
- Văn phong học thuật, rõ ràng, có thể đưa thẳng vào SAP.
- Nếu nhắc guideline (ICH E9, CONSORT, SPIRIT...), chỉ nói chung, không bịa chi tiết tài liệu.

Trả lời bằng VĂN BẢN THUẦN (có thể dùng gạch đầu dòng/heading).
`.trim();

    const raw = await callAI("step12.suggest", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    taEl.value = text;
    wrapEl.classList.remove("hidden");
    toast(ctx, "Đã nhận gợi ý Kế hoạch phân tích số liệu chi tiết (SAP).");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý SAP.");
  } finally {
    toggleBusy(btnEl, false, "GPT gợi ý SAP chi tiết");
  }
}

async function evalSAP(ctx, draft, wrapEl, taEl, btnEl) {
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
   - Tính đầy đủ so với SAP chuẩn (quần thể phân tích, phân tích chính/phụ, xử lý missing, v.v.)
   - Mức độ rõ ràng, khả thi, có nêu rõ test/mô hình và cách trình bày kết quả hay chưa
2) Liệt kê các điểm mạnh và điểm hạn chế (dạng gạch đầu dòng).
3) Đề xuất chỉnh sửa cụ thể: cần bổ sung/giảm bớt những phần nào, chỗ nào cần cụ thể hơn.
4) Nếu phù hợp, gợi ý một cấu trúc/mục lục ngắn gọn cho phần SAP.

Không cần viết lại toàn bộ SAP; tập trung đánh giá và gợi ý cải thiện.
`.trim();

    const raw = await callAI("step12.evaluate", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    taEl.value = text;
    wrapEl.classList.remove("hidden");
    toast(ctx, "Đã nhận đánh giá cho Kế hoạch phân tích số liệu (SAP).");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá SAP.");
  } finally {
    toggleBusy(btnEl, false, "GPT đánh giá SAP");
  }
}

/* ================= Common helpers ================= */

function toast(ctx, msg) {
  if (ctx && typeof ctx.toast === "function") ctx.toast(msg);
  else console.log("[toast]", msg);
}

function copyText(t, ctx) {
  try {
    navigator.clipboard?.writeText(t || "");
    toast(ctx, "Đã sao chép.");
  } catch {
    toast(ctx, "Không sao chép được nội dung.");
  }
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
