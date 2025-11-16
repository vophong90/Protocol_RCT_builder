// Step 10 – Biến số nghiên cứu (nhập tay theo nhóm + GPT gợi ý / đánh giá)
// Cần ctx: get/save/toast, callStepGPT(bindingKey, prompt)

export const id = 10;
export const title = "Biến số nghiên cứu";
export const subtitle =
  "Khai báo biến số cho từng nhóm (kết cục chính, phụ, nền, nhiễu, an toàn, thăm dò). GPT chỉ gợi ý / đánh giá, KHÔNG tự thêm vào danh sách.";
export const css = "./public/css/steps/step10.css";

const GROUPS = [
  {
    key: "primary",
    title: "Biến kết cục chính",
    hint: "Các biến dùng để kiểm định mục tiêu chính, thường 1–2 biến.",
  },
  {
    key: "secondary",
    title: "Biến kết cục phụ",
    hint: "Biến kết cục phụ, giúp hiểu rõ hơn tác động can thiệp.",
  },
  {
    key: "baseline",
    title: "Biến nền / mô tả mẫu",
    hint: "Tuổi, giới, BMI, thời gian mắc bệnh, mức độ bệnh, v.v.",
  },
  {
    key: "confounder",
    title: "Biến nhiễu / điều chỉnh",
    hint: "Các yếu tố có thể gây nhiễu mối liên quan giữa can thiệp và kết cục.",
  },
  {
    key: "safety",
    title: "Biến an toàn / tác dụng bất lợi",
    hint: "Biến liên quan tác dụng phụ, biến cố bất lợi, xét nghiệm an toàn.",
  },
  {
    key: "exploratory",
    title: "Biến thăm dò / khám phá",
    hint: "Biến dùng cho phân tích thăm dò, cơ chế, biomarker…",
  },
];

export async function mount(rootEl, ctx) {
  // Scope cho CSS riêng step10
  rootEl.closest(".step")?.setAttribute("data-scope", "step10");

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Biến số nghiên cứu</h3>
      <div class="card-subtitle">
        Khai báo biến cho từng nhóm. GPT có thể gợi ý và đánh giá, nhưng bạn chủ động chọn biến đưa vào danh sách.
      </div>
    </div>

    <div class="card-body">
      <p class="muted">
        Các nhóm biến được sắp xếp từ trên xuống. Mỗi nhóm có nút <strong>+ Thêm biến</strong> để nhập tay,
        nút <strong>GPT gợi ý biến</strong> để tham khảo thêm theo mục tiêu nghiên cứu (Step 2),
        và nút <strong>GPT đánh giá</strong> để kiểm tra tính hợp lý so với chuẩn quốc tế.
      </p>
    </div>

    <div class="card-body" id="var-groups"></div>

    <div class="card-footer">
      <button id="vars-save" type="button" class="btn btn-primary">Lưu tất cả nhóm biến</button>
    </div>
  `.trim();

  const container = rootEl.querySelector("#var-groups");

  // ===== State =====
  let state = ctx.get("step10Vars", {});
  if (!state || typeof state !== "object") state = {};
  GROUPS.forEach((g) => {
    if (!Array.isArray(state[g.key])) state[g.key] = [];
  });

  // Render từng card nhóm
  GROUPS.forEach((group) => {
    const card = renderGroupCard(group, state[group.key], ctx, (vars) => {
      state[group.key] = vars;
    });
    container.appendChild(card);
  });

  // Lưu toàn bộ
  rootEl.querySelector("#vars-save").addEventListener("click", () => {
    ctx.save("step10Vars", state);
    ctx.toast("Đã lưu tất cả nhóm biến (Step 10).");
  });
}

/**
 * Tạo card cho một nhóm biến
 */
function renderGroupCard(group, varsArray, ctx, onChange) {
  const vars = Array.isArray(varsArray) ? varsArray.slice() : [];

  const card = document.createElement("div");
  card.className = "card var-group-card";
  card.dataset.groupKey = group.key;

  card.innerHTML = `
    <div class="card-body">
      <div class="var-group-header">
        <div class="var-group-titles">
          <div class="var-group-title">${group.title}</div>
          <div class="var-group-hint muted">${group.hint || ""}</div>
        </div>
        <div class="var-group-actions">
          <button type="button" class="btn btn-primary btn-gpt-suggest">
            GPT gợi ý biến
          </button>
          <button type="button" class="btn btn-secondary btn-gpt-eval">
            GPT đánh giá
          </button>
          <button type="button" class="btn btn-primary btn-toggle-form">
            + Thêm biến
          </button>
        </div>
      </div>

      <!-- Form thêm biến (ẩn mặc định, chỉ hiện khi bấm + Thêm biến) -->
      <div class="var-form-wrap hidden">
        <div class="var-form grid-2">
          <!-- Tên biến -->
          <div class="form-field">
            <label class="field-label">
              Tên biến
            </label>
            <input
              type="text"
              class="input-var-name"
              placeholder="Ví dụ: Thay đổi điểm VAS đau từ ban đầu đến tuần 12"
            />
          </div>

          <!-- Thời điểm thu thập -->
          <div class="form-field">
            <label class="field-label">Thời điểm thu thập</label>
            <input
              type="text"
              class="input-var-time"
              placeholder="Ví dụ: Baseline, tuần 4, tuần 12"
            />
          </div>

          <!-- Đo lường / định nghĩa -->
          <div class="form-field full-span">
            <label class="field-label">Đo lường / định nghĩa</label>
            <textarea
              class="input-var-measure"
              placeholder="Mô tả cách đo, thang điểm, điểm cắt, phương pháp tính..."></textarea>
          </div>

          <!-- Đơn vị -->
          <div class="form-field">
            <label class="field-label">Đơn vị</label>
            <input
              type="text"
              class="input-var-unit"
              placeholder="mm, kg, điểm, %, mL/phút... (nếu có)"
            />
          </div>

          <!-- Công cụ / thang đo -->
          <div class="form-field">
            <label class="field-label">Công cụ / thang đo</label>
            <input
              type="text"
              class="input-var-instrument"
              placeholder="Ví dụ: Thang VAS 100 mm, WOMAC, SF-36,..."
            />
          </div>

          <!-- Ghi chú bổ sung -->
          <div class="form-field full-span">
            <label class="field-label">Ghi chú bổ sung</label>
            <textarea
              class="input-var-notes"
              placeholder="Phương pháp xử lý số liệu đặc biệt, xử lý mất mẫu, v.v. (tuỳ chọn)"></textarea>
          </div>
        </div>

        <div class="var-form-actions">
          <button type="button" class="btn btn-ghost btn-cancel-var">Hủy</button>
          <button type="button" class="btn btn-primary btn-save-var">Lưu biến vào nhóm</button>
        </div>
      </div>

      <!-- Danh sách biến trong nhóm -->
      <div class="var-list-wrap">
        <div class="var-list-title">Danh sách biến trong nhóm</div>
        <div class="var-list"></div>
      </div>
    </div>

    <!-- Kết quả GPT gợi ý (CHỈ hiển thị text, KHÔNG tự thêm biến) -->
    <div class="card-body vars-suggest-wrap hidden">
      <div class="var-group-header">
        <strong>GPT – Gợi ý biến cho nhóm ${group.title.toLowerCase()}</strong>
        <div class="var-group-actions">
          <button type="button" class="btn btn-ghost btn-copy-suggest">Sao chép</button>
          <button type="button" class="btn btn-ghost btn-hide-suggest">Ẩn</button>
        </div>
      </div>
      <textarea
        class="vars-suggest-ta"
        rows="8"
        placeholder="Kết quả GPT gợi ý biến sẽ xuất hiện ở đây. Bạn tự chọn biến phù hợp và nhập tay vào nhóm."></textarea>
    </div>

    <!-- Kết quả GPT đánh giá nhóm biến -->
    <div class="card-body vars-eval-wrap hidden">
      <div class="var-group-header">
        <strong>GPT – Đánh giá nhóm biến ${group.title.toLowerCase()}</strong>
        <div class="var-group-actions">
          <button type="button" class="btn btn-ghost btn-copy-eval">Sao chép</button>
          <button type="button" class="btn btn-ghost btn-hide-eval">Ẩn</button>
        </div>
      </div>
      <textarea
        class="vars-eval-ta"
        rows="8"
        placeholder="Đánh giá của GPT về tính đầy đủ, phù hợp, tuân thủ chuẩn quốc tế của nhóm biến sẽ xuất hiện ở đây."></textarea>
    </div>
  `.trim();

  // ===== Lấy element =====
  const formWrap = card.querySelector(".var-form-wrap");
  const listEl = card.querySelector(".var-list");

  const nameInput = card.querySelector(".input-var-name");
  const timeInput = card.querySelector(".input-var-time");
  const measInput = card.querySelector(".input-var-measure");
  const unitInput = card.querySelector(".input-var-unit");
  const instrInput = card.querySelector(".input-var-instrument");
  const notesInput = card.querySelector(".input-var-notes");

  const btnToggleForm = card.querySelector(".btn-toggle-form");
  const btnSaveVar = card.querySelector(".btn-save-var");
  const btnCancelVar = card.querySelector(".btn-cancel-var");

  const suggestWrap = card.querySelector(".vars-suggest-wrap");
  const suggestTA = card.querySelector(".vars-suggest-ta");
  const btnSuggest = card.querySelector(".btn-gpt-suggest");
  const btnCopySuggest = card.querySelector(".btn-copy-suggest");
  const btnHideSuggest = card.querySelector(".btn-hide-suggest");

  const evalWrap = card.querySelector(".vars-eval-wrap");
  const evalTA = card.querySelector(".vars-eval-ta");
  const btnEval = card.querySelector(".btn-gpt-eval");
  const btnCopyEval = card.querySelector(".btn-copy-eval");
  const btnHideEval = card.querySelector(".btn-hide-eval");

  // ==== Form thêm biến ====
  btnToggleForm.addEventListener("click", () => {
    formWrap.classList.toggle("hidden");
  });

  btnCancelVar.addEventListener("click", () => {
    clearForm();
    formWrap.classList.add("hidden");
  });

  btnSaveVar.addEventListener("click", () => {
    const name = (nameInput.value || "").trim();
    const time = (timeInput.value || "").trim();
    const meas = (measInput.value || "").trim();
    const unit = (unitInput.value || "").trim();
    const instr = (instrInput.value || "").trim();
    const notes = (notesInput.value || "").trim();

    if (!name) {
      toast(ctx, "Tên biến là bắt buộc.");
      return;
    }

    vars.push({
      name,
      time,
      measure: meas,
      unit,
      instrument: instr,
      notes,
    });
    onChange(vars.slice());
    renderList();

    clearForm();
    formWrap.classList.add("hidden");
    toast(ctx, "Đã thêm biến vào nhóm.");
  });

  function clearForm() {
    nameInput.value = "";
    timeInput.value = "";
    measInput.value = "";
    unitInput.value = "";
    instrInput.value = "";
    notesInput.value = "";
  }

  // ==== Danh sách biến ====
  function renderList() {
    listEl.innerHTML = "";
    if (!vars.length) {
      listEl.innerHTML = `<div class="muted">Chưa có biến nào trong nhóm này.</div>`;
      return;
    }
    vars.forEach((v, idx) => {
      const item = document.createElement("div");
      item.className = "var-item";

      item.innerHTML = `
        <div class="var-item-header">
          <div class="var-item-title">${idx + 1}. ${escapeHtml(v.name || "")}</div>
          <button type="button" class="btn btn-ghost btn-del-var">Xoá</button>
        </div>
        <div class="var-item-meta">
          ${v.time ? `<span>Thời điểm: ${escapeHtml(v.time)}</span>` : ""}
          ${v.unit ? `<span>Đơn vị: ${escapeHtml(v.unit)}</span>` : ""}
          ${v.instrument ? `<span>Công cụ: ${escapeHtml(v.instrument)}</span>` : ""}
        </div>
        ${
          v.measure
            ? `<div class="var-item-def"><strong>Đo lường:</strong> ${escapeHtml(
                v.measure
              )}</div>`
            : ""
        }
        ${
          v.notes
            ? `<div class="var-item-def"><strong>Ghi chú:</strong> ${escapeHtml(
                v.notes
              )}</div>`
            : ""
        }
      `.trim();

      item.querySelector(".btn-del-var").addEventListener("click", () => {
        vars.splice(idx, 1);
        onChange(vars.slice());
        renderList();
      });

      listEl.appendChild(item);
    });
  }

  renderList();

  // ==== GPT gợi ý – chỉ hiển thị vào textarea ====
  btnSuggest.addEventListener("click", () =>
    onSuggestGroup(group, ctx, suggestWrap, suggestTA, btnSuggest)
  );
  btnCopySuggest.addEventListener("click", () => {
    copyText(suggestTA.value || "", ctx);
  });
  btnHideSuggest.addEventListener("click", () => {
    suggestWrap.classList.add("hidden");
  });

  // ==== GPT đánh giá nhóm ====
  btnEval.addEventListener("click", () =>
    onEvaluateGroup(group, vars, ctx, evalWrap, evalTA, btnEval)
  );
  btnCopyEval.addEventListener("click", () => {
    copyText(evalTA.value || "", ctx);
  });
  btnHideEval.addEventListener("click", () => {
    evalWrap.classList.add("hidden");
  });

  return card;
}

// ================= GPT HELPERS =================

async function onSuggestGroup(group, ctx, wrapEl, taEl, btnEl) {
  try {
    toggleBusy(btnEl, true, "Đang gợi ý...");
    const mainObj = (ctx.get("mainObjective", "") || "").trim();
    const subs = Array.isArray(ctx.get("subObjectives", []))
      ? ctx
          .get("subObjectives", [])
          .map((x) => String(x || "").trim())
          .filter(Boolean)
      : [];

    const today = new Date().toISOString().slice(0, 10);

    const prompt = `
Bạn là chuyên gia phương pháp RCT. Dựa trên MỤC TIÊU NGHIÊN CỨU dưới đây, hãy GỢI Ý CÁC BIẾN cho nhóm:
"${group.title}" (${group.key}).

YÊU CẦU:
- Gợi ý các biến phù hợp với mục tiêu, phù hợp chuẩn quốc tế và các guideline mới nhất (CONSORT, SPIRIT, ICH… nếu liên quan).
- Với mỗi biến, ghi rõ:
  + Tên biến
  + Thời điểm thu thập
  + Đo lường/định nghĩa (cách đo, thang điểm, điểm cắt, cách tính)
  + Đơn vị (nếu có)
  + Công cụ/thang đo
- ƯU TIÊN trích dẫn TLTK CÓ THẬT (không bịa). Tối đa 5 tài liệu tham khảo tổng quát cho cả nhóm biến.

NGUYÊN TẮC NGUỒN:
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tác giả hay tiêu đề.
- Chỉ liệt kê nguồn mà bạn chắc chắn ≥90% là có thật.
- Nếu không chắc chắn, hãy ghi rõ: "Không tìm thấy nguồn phù hợp để trích dẫn."

ĐỊNH DẠNG TRẢ LỜI (TEXT THUẦN, KHÔNG JSON):
Biến 1:
- Tên biến: ...
- Thời điểm thu thập: ...
- Đo lường/định nghĩa: ...
- Đơn vị: ...
- Công cụ/thang đo: ...

Biến 2:
...

TLTK:
1) ...
2) ...
(hoặc: "Không tìm thấy nguồn phù hợp để trích dẫn.")

Ngày: ${today}

MỤC TIÊU NGHIÊN CỨU:
- Mục tiêu chính: ${mainObj || "(chưa nhập)"}
- Mục tiêu phụ:
${subs.length ? subs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa nhập)"}
`.trim();

    const raw = await callAI("step10.suggest", prompt, ctx);
    const text = String(raw || "").trim();

    taEl.value = text || "GPT không trả về nội dung.";
    wrapEl.classList.remove("hidden");
    toast(ctx, `Đã nhận gợi ý biến cho nhóm ${group.title}.`);
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý biến.");
  } finally {
    toggleBusy(btnEl, false, "GPT gợi ý biến");
  }
}

async function onEvaluateGroup(group, vars, ctx, wrapEl, taEl, btnEl) {
  if (!Array.isArray(vars) || vars.length === 0) {
    toast(ctx, "Chưa có biến nào trong nhóm để đánh giá.");
    return;
  }

  try {
    toggleBusy(btnEl, true, "Đang đánh giá...");
    const mainObj = (ctx.get("mainObjective", "") || "").trim();
    const subs = Array.isArray(ctx.get("subObjectives", []))
      ? ctx
          .get("subObjectives", [])
          .map((x) => String(x || "").trim())
          .filter(Boolean)
      : [];

    const today = new Date().toISOString().slice(0, 10);

    const varsText = vars
      .map((v, i) => {
        return [
          `${i + 1}. ${v.name || ""}`,
          v.time ? `  - Thời điểm: ${v.time}` : "",
          v.measure ? `  - Đo lường/định nghĩa: ${v.measure}` : "",
          v.unit ? `  - Đơn vị: ${v.unit}` : "",
          v.instrument ? `  - Công cụ/thang đo: ${v.instrument}` : "",
          v.notes ? `  - Ghi chú: ${v.notes}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const prompt = `
Bạn là chuyên gia thiết kế thử nghiệm lâm sàng (RCT). Hãy ĐÁNH GIÁ nhóm biến "${group.title}" (${group.key})
dưới đây về các tiêu chí:
- Mức độ bao phủ mục tiêu nghiên cứu (đủ/thiếu/ thừa?)
- Tính đo lường được (measurement validity, reliability)
- Tính phù hợp với chuẩn quốc tế (CONSORT/SPIRIT/ICH, nếu liên quan)
- Mức độ chồng lắp, trùng lặp không cần thiết
- Gợi ý chỉnh sửa / bổ sung / lược bỏ.

YÊU CẦU NGUỒN:
- Nếu có thể, trích dẫn tối đa 5 tài liệu/khuyến cáo CÓ THẬT.
- Không bịa DOI/PMID/URL.
- Nếu không có nguồn phù hợp, ghi rõ: "Không tìm thấy nguồn phù hợp để trích dẫn."

ĐỊNH DẠNG TRẢ LỜI (TEXT THUẦN):
1. Nhận xét tổng quan (5–10 câu)
2. Nhận xét từng biến (nếu cần) – liệt kê theo số thứ tự
3. Đề xuất chỉnh sửa cụ thể
4. TLTK (nếu có)

NGỮ CẢNH:
- Mục tiêu chính: ${mainObj || "(chưa nhập)"}
- Mục tiêu phụ:
${subs.length ? subs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa nhập)"}

DANH SÁCH BIẾN TRONG NHÓM:
${varsText}

Ngày đánh giá: ${today}
`.trim();

    const raw = await callAI("step10.evaluate", prompt, ctx);
    const text = String(raw || "").trim();
    taEl.value = text || "GPT không trả về nội dung.";
    wrapEl.classList.remove("hidden");
    toast(ctx, `Đã nhận đánh giá cho nhóm ${group.title}.`);
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá nhóm biến.");
  } finally {
    toggleBusy(btnEl, false, "GPT đánh giá");
  }
}

// ================= COMMON HELPERS =================

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
  throw new Error("Chưa cấu hình GPT cho step10.");
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
