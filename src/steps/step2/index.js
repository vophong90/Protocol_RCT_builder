// src/steps/step12/index.js
// Step 12 – Kế hoạch phân tích số liệu (SAP tóm tắt)
// - Đọc PICO, mục tiêu, thiết kế, can thiệp, biến (step10), lịch thu thập (step11)
// - Người dùng tự viết kế hoạch phân tích trong textarea chính
// - GPT gợi ý một SAP gợi ý riêng (textarea riêng) để tham khảo, KHÔNG tự ghi đè
// - GPT đánh giá đoạn kế hoạch anh đã viết (textarea riêng kết quả đánh giá)
// - Lưu state vào 'analysisPlan'

export const id = 12;
export const title = "Kế hoạch phân tích số liệu";
export const subtitle =
  "Phác thảo kế hoạch phân tích (SAP tóm tắt) dựa trên mục tiêu, biến số và lịch thu thập.";
export const css = "./public/css/steps/step12.css";

export async function mount(rootEl, ctx) {
  // scope CSS riêng cho step12
  rootEl.closest(".step")?.setAttribute("data-scope", "step12");

  // ===== Layout card chuẩn =====
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Kế hoạch phân tích số liệu</h3>
      <div class="card-subtitle">
        Mô tả cách phân tích biến kết cục chính/phụ, xử lý số liệu, phân tích độ nhạy, phân tích dưới nhóm...
      </div>
    </div>

    <div class="card-body">
      <p class="muted small">
        Gợi ý: kế hoạch nên bám sát mục tiêu nghiên cứu, loại thiết kế, số nhánh can thiệp, biến kết cục và lịch thu thập.
        GPT chỉ đóng vai trò <strong>gợi ý</strong> và <strong>phản biện</strong>, không tự động thay anh viết SAP.
      </p>

      <div class="an-layout">
        <!-- Cột trái: nội dung chính do anh viết -->
        <div class="an-main">
          <div class="card card-nested">
            <div class="card-header">
              <strong>Kế hoạch phân tích do bạn soạn</strong>
            </div>
            <div class="card-body">
              <textarea id="an-main" class="an-ta" rows="18"
                placeholder="Ví dụ cấu trúc:
1. Nguyên tắc phân tích (ITT/PP)
2. Mô tả mẫu & so sánh ban đầu
3. Phân tích biến kết cục chính
4. Phân tích biến kết cục phụ
5. Xử lý số liệu thiếu
6. Phân tích dưới nhóm
7. Phân tích độ nhạy
8. Phần mềm & mức ý nghĩa thống kê..."></textarea>
            </div>
          </div>

          <div class="card card-nested">
            <div class="card-header">
              <strong>Ghi chú nội bộ (tuỳ chọn)</strong>
            </div>
            <div class="card-body">
              <textarea id="an-notes" class="an-ta small" rows="6"
                placeholder="Ghi chú thêm: lưu ý về MCID, các biến cần chuẩn hoá, biến chuyển đổi log, v.v. (không in vào SAP chính)."></textarea>
            </div>
          </div>
        </div>

        <!-- Cột phải: GPT gợi ý & đánh giá -->
        <div class="an-side">
          <div class="card card-nested">
            <div class="card-header an-side-header">
              <strong>GPT – Gợi ý SAP</strong>
              <button id="an-gpt-suggest" class="btn btn-secondary" type="button">
                GPT gợi ý kế hoạch
              </button>
            </div>
            <div class="card-body">
              <textarea id="an-suggest" class="an-ta small" rows="12"
                placeholder="Kết quả GPT gợi ý sẽ xuất hiện ở đây. Bạn tự đọc và trích ý phù hợp sang kế hoạch của mình."></textarea>
              <div class="an-side-actions">
                <button id="an-copy-suggest" type="button" class="btn btn-ghost tiny">
                  Sao chép gợi ý
                </button>
                <span class="muted tiny">GPT không tự chèn vào kế hoạch chính.</span>
              </div>
            </div>
          </div>

          <div class="card card-nested">
            <div class="card-header an-side-header">
              <strong>GPT – Đánh giá kế hoạch</strong>
              <button id="an-gpt-eval" class="btn btn-secondary" type="button">
                GPT đánh giá kế hoạch
              </button>
            </div>
            <div class="card-body">
              <textarea id="an-eval" class="an-ta small" rows="10"
                placeholder="Nhận xét của GPT về điểm mạnh, điểm yếu, phần thiếu, và gợi ý chỉnh sửa sẽ xuất hiện ở đây."></textarea>
              <div class="an-side-actions">
                <button id="an-copy-eval" type="button" class="btn btn-ghost tiny">
                  Sao chép đánh giá
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> <!-- .an-layout -->
    </div>

    <div class="card-footer">
      <button id="an-save" class="btn btn-primary" type="button">Lưu kế hoạch</button>
    </div>
  `.trim();

  // ======= State =======
  let state = ctx.get("analysisPlan", {}) || {};
  if (typeof state !== "object") state = {};
  state.mainText = state.mainText || "";
  state.notes = state.notes || "";

  // DOM
  const mainTa = rootEl.querySelector("#an-main");
  const notesTa = rootEl.querySelector("#an-notes");
  const suggestTa = rootEl.querySelector("#an-suggest");
  const evalTa = rootEl.querySelector("#an-eval");

  const btnSave = rootEl.querySelector("#an-save");
  const btnSuggest = rootEl.querySelector("#an-gpt-suggest");
  const btnEval = rootEl.querySelector("#an-gpt-eval");
  const btnCopySuggest = rootEl.querySelector("#an-copy-suggest");
  const btnCopyEval = rootEl.querySelector("#an-copy-eval");

  // fill state vào UI
  mainTa.value = state.mainText || "";
  notesTa.value = state.notes || "";

  // ======= Events =======

  btnSave.addEventListener("click", () => {
    state.mainText = mainTa.value || "";
    state.notes = notesTa.value || "";
    ctx.save("analysisPlan", state);
    toast(ctx, "Đã lưu kế hoạch phân tích (Step 12).");
  });

  btnCopySuggest.addEventListener("click", () => {
    copyText(suggestTa.value || "", ctx);
  });

  btnCopyEval.addEventListener("click", () => {
    copyText(evalTa.value || "", ctx);
  });

  btnSuggest.addEventListener("click", () => onSuggest(ctx, suggestTa));
  btnEval.addEventListener("click", () => onEvaluate(ctx, mainTa, evalTa));

  // ================= GPT – gợi ý =================

  async function onSuggest(ctx, targetTa) {
    try {
      toggleBusy(btnSuggest, true, "Đang gợi ý...");
      const pico = ctx.get("pico", {}) || {};
      const mainObj = (ctx.get("mainObjective", "") || "").trim();
      const subs = Array.isArray(ctx.get("subObjectives", []))
        ? ctx
            .get("subObjectives", [])
            .map((x) => String(x || "").trim())
            .filter(Boolean)
        : [];
      const design = ctx.get("design", {}) || {};
      const interventions = ctx.get("interventions", []) || {};
      const vars = ctx.get("step10Vars", {}) || {};
      const dataCollection = ctx.get("dataCollection", {}) || {};

      const today = new Date().toISOString().slice(0, 10);

      const prompt = `
Bạn là chuyên gia thống kê lâm sàng. Hãy đề xuất một **kế hoạch phân tích số liệu (SAP tóm tắt)** cho thử nghiệm dưới đây.

YÊU CẦU CHUNG:
- Trả lời bằng **văn bản thường (Markdown cũng được), KHÔNG JSON**.
- Cấu trúc gợi ý (có thể điều chỉnh linh hoạt tuỳ tình huống nhưng nên đầy đủ):
  1. Nguyên tắc phân tích (ITT/PP, cách xử lý vi phạm protocol)
  2. Mô tả mẫu & so sánh ban đầu giữa các nhánh
  3. Phân tích biến kết cục chính
  4. Phân tích biến kết cục phụ
  5. Phân tích an toàn
  6. Xử lý số liệu thiếu
  7. Phân tích dưới nhóm (nếu cần)
  8. Phân tích độ nhạy
  9. Phần mềm & mức ý nghĩa thống kê
- Chỉ nêu **loại mô hình/phép kiểm** (t-test, chi-square, hồi quy tuyến tính/hồi quy logistic, mô hình hỗn hợp, GEE, v.v.) và khi nào dùng; không cần viết công thức quá nặng.
- Ưu tiên bám sát chuẩn CONSORT, SPIRIT, ICH-GCP và các guideline phân tích hiện hành, nhưng KHÔNG bịa tài liệu tham khảo.
- Nếu muốn trích tài liệu tham khảo, chỉ nêu tên guideline/hiệp hội chung chung, không bịa DOI/PMID.

NGỮ CẢNH:
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

- Mục tiêu chính: ${mainObj || "(chưa nhập)"}
- Mục tiêu phụ:
${subs.length ? subs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa nhập)"}

THIẾT KẾ:
${jsonSafe(design)}

CAN THIỆP:
${jsonSafe(interventions)}

BIẾN (tóm tắt từ Step 10):
${jsonSafe(vars).slice(0, 2000)}

LỊCH THU THẬP (tóm tắt từ Step 11):
${jsonSafe(dataCollection).slice(0, 2000)}

Ngày yêu cầu gợi ý: ${today}
`.trim();

      const raw = await callAI("step12.suggest", prompt, ctx);
      const text = String(raw || "").trim();
      targetTa.value =
        text ||
        "GPT không trả về nội dung. Hãy thử rút gọn PICO/mục tiêu hoặc kiểm tra lại kết nối GPT.";
      toast(ctx, "Đã nhận gợi ý kế hoạch phân tích.");
    } catch (e) {
      console.error(e);
      toast(ctx, "Lỗi khi GPT gợi ý kế hoạch phân tích.");
    } finally {
      toggleBusy(btnSuggest, false, "GPT gợi ý kế hoạch");
    }
  }

  // ================= GPT – đánh giá =================

  async function onEvaluate(ctx, sourceTa, targetTa) {
    const content = (sourceTa.value || "").trim();
    if (!content) {
      toast(ctx, "Chưa có nội dung kế hoạch để đánh giá.");
      return;
    }

    try {
      toggleBusy(btnEval, true, "Đang đánh giá...");
      const pico = ctx.get("pico", {}) || {};
      const mainObj = (ctx.get("mainObjective", "") || "").trim();
      const subs = Array.isArray(ctx.get("subObjectives", []))
        ? ctx
            .get("subObjectives", [])
            .map((x) => String(x || "").trim())
            .filter(Boolean)
        : [];
      const design = ctx.get("design", {}) || {};

      const today = new Date().toISOString().slice(0, 10);

      const prompt = `
Bạn là phản biện thống kê của một tạp chí y học lâm sàng. Hãy ĐÁNH GIÁ kế hoạch phân tích số liệu (SAP tóm tắt) sau:

--- KẾ HOẠCH HIỆN TẠI ---
${content}
-------------------------

VUI LÒNG:
1. Nhận xét tổng quan: điểm mạnh, điểm yếu, mức độ rõ ràng, tính phù hợp với thiết kế.
2. Chỉ ra các phần còn thiếu hoặc cần chi tiết hơn (ví dụ: xử lý số liệu thiếu, kiểm định giả định mô hình, phân tích phụ, v.v.).
3. Đề xuất các chỉnh sửa cụ thể (có thể liệt kê dạng gạch đầu dòng).
4. Nếu thấy cần, gợi ý cấu trúc lại thứ tự trình bày cho logic hơn.

NGỮ CẢNH:
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

- Mục tiêu chính: ${mainObj || "(chưa nhập)"}
- Mục tiêu phụ:
${subs.length ? subs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa nhập)"}

- Thiết kế (tóm tắt): ${jsonSafe(design)}

ĐỊNH DẠNG TRẢ LỜI:
- Viết bằng tiếng Việt, văn phong chuyên môn nhưng dễ hiểu.
- Dạng đoạn văn + gạch đầu dòng, KHÔNG cần JSON.

Ngày đánh giá: ${today}
`.trim();

      const raw = await callAI("step12.evaluate", prompt, ctx);
      const text = String(raw || "").trim();
      targetTa.value =
        text ||
        "GPT không trả về nội dung đánh giá. Hãy thử rút gọn kế hoạch hoặc kiểm tra lại kết nối.";
      toast(ctx, "Đã nhận đánh giá kế hoạch phân tích.");
    } catch (e) {
      console.error(e);
      toast(ctx, "Lỗi khi GPT đánh giá kế hoạch phân tích.");
    } finally {
      toggleBusy(btnEval, false, "GPT đánh giá kế hoạch");
    }
  }
}

// =============== COMMON HELPERS (giống style step10/11) ===============

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

function jsonSafe(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj || "");
  }
}
