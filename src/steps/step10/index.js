// src/steps/step10/index.js
// Step 10 – Biến số nghiên cứu (phiên bản mới)
// - Mỗi nhóm biến là 1 card full-width, xếp dọc:
//   primary, secondary, baseline, confounder, mediator, moderator, safety
// - Mỗi card có:
//    + Nút "Thêm biến" → click mới hiện form nhập biến mới
//    + Nút "GPT gợi ý biến" → gợi ý dựa trên PICO + Mục tiêu (step2) + thiết kế, can thiệp
//    + Nút "GPT đánh giá nhóm biến" → đánh giá nhóm hiện tại theo chuẩn quốc tế (CONSORT/SPIRIT...)
// - Biến gồm các trường: name, timepoint, definition, measurement, unit
// - Lưu state: variablesByGroup = { primary: Var[], secondary: Var[], ... }

export const id = 10;
export const title = "Biến số nghiên cứu";
export const subtitle =
  "Đặt và quản lý biến theo nhóm: kết cục chính, kết cục phụ, nền, nhiễu, trung gian, điều biến, an toàn.";
export const css = "./public/css/steps/step10.css";

const GROUP_CONFIG = {
  primary: {
    title: "Kết cục chính (Primary)",
    hint: "1–2 biến kết cục chính, bám sát mục tiêu chính.",
  },
  secondary: {
    title: "Kết cục phụ (Secondary)",
    hint: "Các kết cục bổ sung, giúp hiểu sâu hơn hiệu quả can thiệp.",
  },
  baseline: {
    title: "Biến nền (Baseline)",
    hint: "Đặc điểm ban đầu để mô tả quần thể và kiểm tra cân bằng giữa các nhánh.",
  },
  confounder: {
    title: "Nhiễu (Confounder)",
    hint: "Yếu tố có thể gây nhiễu mối liên hệ giữa can thiệp và kết cục.",
  },
  mediator: {
    title: "Trung gian (Mediator)",
    hint: "Biến trung gian giả định trong cơ chế tác động (nếu phù hợp).",
  },
  moderator: {
    title: "Điều biến (Moderator)",
    hint: "Biến điều biến hiệu quả can thiệp giữa các phân nhóm (nếu phù hợp).",
  },
  safety: {
    title: "An toàn (Safety)",
    hint: "Biến cố bất lợi, AE/SAE, chỉ số an toàn quan trọng.",
  },
};

const GROUP_KEYS = Object.keys(GROUP_CONFIG);

export async function mount(rootEl, ctx) {
  // scope CSS riêng cho step 10
  rootEl.closest(".step")?.setAttribute("data-scope", "step10");

  // ---------- Khung chung ----------
  rootEl.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Biến số nghiên cứu</h3>
        <div class="card-subtitle">
          Thiết kế và quản lý biến số theo từng nhóm chức năng. Mỗi nhóm có thể nhờ GPT
          gợi ý hoặc đánh giá dựa trên PICO, mục tiêu nghiên cứu và hướng dẫn quốc tế
          (CONSORT, SPIRIT, ICH E9...).
        </div>
      </div>

      <div class="card-body">
        <div class="muted">
          Gợi ý: với mỗi biến, nên ghi rõ <strong>tên biến, thời điểm thu thập, cách đo lường/định nghĩa và đơn vị</strong>,
          để đảm bảo khả năng tái lập và phân tích thống nhất.
        </div>
      </div>

      ${GROUP_KEYS.map((k) => renderGroupCard(k)).join("")}

      <div class="card-footer">
        <button id="vars-save-all" class="btn btn-primary" type="button">
          Lưu tất cả nhóm biến
        </button>
      </div>
    </div>
  `.trim();

  // ---------- State ----------
  const stored = ctx.get("variablesByGroup", {}) || {};
  let groups = {};
  GROUP_KEYS.forEach((k) => {
    const arr = Array.isArray(stored[k]) ? stored[k] : [];
    groups[k] = arr.map(normVar).filter((v) => v.name);
  });

  // ---------- DOM refs ----------
  const saveAllBtn = rootEl.querySelector("#vars-save-all");

  // render danh sách lần đầu
  GROUP_KEYS.forEach((k) => renderGroupList(k));

  // Wire nút Thêm / Lưu / Hủy form cho từng nhóm
  GROUP_KEYS.forEach((groupKey) => {
    const addBtn = rootEl.querySelector(`[data-add-var="${groupKey}"]`);
    const formWrap = rootEl.querySelector(`[data-form="${groupKey}"]`);
    const saveBtn = rootEl.querySelector(`[data-save-var="${groupKey}"]`);
    const cancelBtn = rootEl.querySelector(`[data-cancel-var="${groupKey}"]`);

    addBtn?.addEventListener("click", () => {
      // mở form, reset field
      resetForm(groupKey);
      formWrap?.classList.remove("hidden");
      // scroll cho dễ thấy
      formWrap?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    cancelBtn?.addEventListener("click", () => {
      formWrap?.classList.add("hidden");
      resetForm(groupKey);
    });

    saveBtn?.addEventListener("click", () => {
      const values = readForm(groupKey);
      if (!values.name) {
        ctx.toast("Tên biến là bắt buộc.");
        return;
      }
      groups[groupKey].push(values);
      renderGroupList(groupKey);
      formWrap?.classList.add("hidden");
      resetForm(groupKey);
      ctx.toast(`Đã thêm biến vào nhóm: ${GROUP_CONFIG[groupKey].title}.`);
    });
  });

  // ---------- GPT: gợi ý & đánh giá theo từng nhóm ----------
  const suggestButtons = rootEl.querySelectorAll("[data-gpt-suggest]");
  suggestButtons.forEach((btn) => {
    const groupKey = btn.getAttribute("data-gpt-suggest");
    if (!groupKey) return;
    btn.addEventListener("click", () => onSuggestGroup(groupKey));
  });

  const evalButtons = rootEl.querySelectorAll("[data-gpt-eval]");
  evalButtons.forEach((btn) => {
    const groupKey = btn.getAttribute("data-gpt-eval");
    if (!groupKey) return;
    btn.addEventListener("click", () => onEvaluateGroup(groupKey));
  });

  // ---------- Lưu tất cả ----------
  saveAllBtn?.addEventListener("click", () => {
    ctx.save("variablesByGroup", groups);
    ctx.toast("Đã lưu toàn bộ các nhóm biến.");
  });

  // ============================================================
  // ===============  FUNCTIONS – RENDER UI  ====================
  // ============================================================

  function renderGroupList(groupKey) {
    const listEl = rootEl.querySelector(`[data-list="${groupKey}"]`);
    if (!listEl) return;

    const arr = groups[groupKey] || [];
    listEl.innerHTML = "";

    if (!arr.length) {
      listEl.innerHTML =
        '<div class="muted">Chưa có biến trong nhóm này. Nhấn "Thêm biến" hoặc dùng GPT để gợi ý.</div>';
      return;
    }

    arr.forEach((v, idx) => {
      const item = document.createElement("div");
      item.className = "var-item";

      item.innerHTML = `
        <div class="var-item-header">
          <div class="var-item-title">${idx + 1}. ${escapeHtml(v.name)}</div>
          <button type="button" class="btn btn-ghost var-item-delete">Xoá</button>
        </div>
        <div class="var-item-meta">
          ${
            v.timepoint
              ? `<span>Thời điểm: ${escapeHtml(v.timepoint)}</span>`
              : ""
          }
          ${v.unit ? `<span>Đơn vị: ${escapeHtml(v.unit)}</span>` : ""}
        </div>
        ${
          v.definition || v.measurement
            ? `<div class="var-item-def"><strong>Đo lường:</strong> ${escapeHtml(
                [v.definition, v.measurement].filter(Boolean).join(" — ")
              )}</div>`
            : ""
        }
      `.trim();

      const delBtn = item.querySelector(".var-item-delete");
      delBtn?.addEventListener("click", () => {
        groups[groupKey].splice(idx, 1);
        renderGroupList(groupKey);
      });

      listEl.appendChild(item);
    });
  }

  function resetForm(groupKey) {
    const fields = rootEl.querySelectorAll(
      `[data-group="${groupKey}"][data-field]`
    );
    fields.forEach((el) => {
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        el.value = "";
      }
    });
  }

  function readForm(groupKey) {
    const obj = {
      name: "",
      timepoint: "",
      definition: "",
      measurement: "",
      unit: "",
    };

    const fields = rootEl.querySelectorAll(
      `[data-group="${groupKey}"][data-field]`
    );
    fields.forEach((el) => {
      const key = el.getAttribute("data-field");
      if (!key) return;
      const val = (el.value || "").trim();
      if (key in obj) obj[key] = val;
    });

    return normVar(obj);
  }

  // ============================================================
  // ===============  GPT – GỢI Ý VÀ ĐÁNH GIÁ  ==================
  // ============================================================

  async function onSuggestGroup(groupKey) {
    const cfg = GROUP_CONFIG[groupKey];
    if (!cfg) return;

    const btn = rootEl.querySelector(`[data-gpt-suggest="${groupKey}"]`);
    toggleBusy(btn, true, "Đang gợi ý...");

    try {
      const pico = ctx.get("pico", {}) || {};
      const mainObj = (ctx.get("mainObjective", "") || "").trim();
      const subObjs =
        (Array.isArray(ctx.get("subObjectives"))
          ? ctx.get("subObjectives")
          : []
        ).map((s) => String(s || "").trim());
      const design = ctx.get("design", {}) || {};
      const interventions = ctx.get("interventions", []) || [];

      const now = new Date().toISOString().slice(0, 10);

      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy đề xuất các biến cho NHÓM "${cfg.title}"
trong nghiên cứu dưới đây, bám sát mục tiêu và hướng dẫn quốc tế (CONSORT, SPIRIT, ICH E9,…).

YÊU CẦU NGHIÊM VỀ NGUỒN:
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên tác giả hoặc tiêu đề bài báo.
- Chỉ liệt kê tối đa 10 nguồn bạn chắc chắn ≥90% là có thật (ưu tiên guideline, consensus, trial lớn).
- Nếu không tìm được nguồn phù hợp, hãy ghi đúng câu:
  "Không tìm thấy nguồn phù hợp để trích dẫn."

YÊU CẦU ĐỊNH DẠNG (CHỈ TRẢ VỀ 1 JSON HỢP LỆ, KHÔNG GIẢI THÍCH THÊM):
{
  "variables": [
    {
      "name": "Tên biến rõ ràng, bám PICO/mục tiêu",
      "timepoint": "Thời điểm thu thập (ví dụ: Baseline, tuần 4, tuần 12)",
      "definition": "Định nghĩa/diễn giải biến, tiêu chuẩn phân loại nếu có",
      "measurement": "Cách đo lường / công cụ / thang điểm / phép đo",
      "unit": "Đơn vị (mm, điểm, ml, kg, ... hoặc 'không đơn vị')"
    }
  ],
  "refs": [
    "Tác giả. Năm. Tiêu đề. Tạp chí/Sách. DOI/PMID/URL",
    "..."
  ]
}

Ngữ cảnh nghiên cứu:
Ngày: ${now}

PICO:
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

Mục tiêu chính:
${mainObj || "(chưa nhập)"}

Mục tiêu phụ:
${subObjs.length ? subObjs.map((x, i) => (i + 1) + ". " + x).join("\\n") : "(chưa có)"}

Thiết kế (JSON rút gọn):
${jsonSafe(design)}

Can thiệp (JSON rút gọn):
${jsonSafe(interventions)}

Các biến hiện đã có trong nhóm "${cfg.title}":
${jsonSafe(groups[groupKey] || [])}
`.trim();

      const raw = await callAI("step10.suggest", prompt, ctx);
      const j = safeParse(raw);
      if (!j || !Array.isArray(j.variables)) {
        ctx.toast("GPT không trả về JSON biến hợp lệ.");
        console.warn("step10.suggest raw:", raw);
        return;
      }

      const vars = j.variables.map(normVar).filter((v) => v.name);
      if (!vars.length) {
        ctx.toast("Không có biến nào được gợi ý.");
        return;
      }

      // gộp thêm vào nhóm hiện tại
      const existingNames = new Set(
        (groups[groupKey] || []).map((v) => v.name)
      );
      vars.forEach((v) => {
        if (!existingNames.has(v.name)) {
          groups[groupKey].push(v);
          existingNames.add(v.name);
        }
      });

      renderGroupList(groupKey);
      ctx.toast(`Đã chèn gợi ý biến cho nhóm "${cfg.title}".`);
    } catch (e) {
      console.error(e);
      ctx.toast("Lỗi khi gọi GPT gợi ý biến.");
    } finally {
      toggleBusy(btn, false, "GPT gợi ý biến");
    }
  }

  async function onEvaluateGroup(groupKey) {
    const cfg = GROUP_CONFIG[groupKey];
    if (!cfg) return;

    const arr = groups[groupKey] || [];
    if (!arr.length) {
      ctx.toast(`Nhóm "${cfg.title}" chưa có biến để đánh giá.`);
      return;
    }

    const btn = rootEl.querySelector(`[data-gpt-eval="${groupKey}"]`);
    toggleBusy(btn, true, "Đang đánh giá...");

    try {
      const pico = ctx.get("pico", {}) || {};
      const mainObj = (ctx.get("mainObjective", "") || "").trim();
      const subObjs =
        (Array.isArray(ctx.get("subObjectives"))
          ? ctx.get("subObjectives")
          : []
        ).map((s) => String(s || "").trim());
      const design = ctx.get("design", {}) || {};
      const interventions = ctx.get("interventions", []) || [];

      const now = new Date().toISOString().slice(0, 10);

      const variablesText = arr
        .map(
          (v, i) =>
            `${i + 1}. ${v.name} — Thời điểm: ${
              v.timepoint || "(chưa ghi)"
            }; Đo lường: ${
              v.measurement || v.definition || "(chưa ghi)"
            }; Đơn vị: ${v.unit || "(chưa ghi)"}`
        )
        .join("\n");

      const prompt = `
Bạn là chuyên gia phương pháp và báo cáo RCT (CONSORT/SPIRIT/ICH E9,...).
Hãy ĐÁNH GIÁ NHÓM BIẾN "${cfg.title}" trong nghiên cứu dưới đây.

MỤC TIÊU:
- Nhận xét nhóm biến đã đủ/thiếu/thừa so với mục tiêu và PICO?
- Biến nào nên là primary/secondary/safety/... (nếu đặt nhầm nhóm thì góp ý).
- Gợi ý thêm các biến quan trọng còn thiếu (nếu có).
- Nêu các lưu ý về cách đo lường, định nghĩa, thời điểm thu thập để đảm bảo chuẩn mực quốc tế.

YÊU CẦU NGUỒN:
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên tác giả hoặc bài báo.
- Nếu dùng guideline (CONSORT, SPIRIT, ICH E9, ...), hãy trích dẫn với thông tin thật.
- Tối đa 10 nguồn. Nếu không có nguồn phù hợp, hãy ghi đúng câu:
  "Không tìm thấy nguồn phù hợp để trích dẫn."

ĐỊNH DẠNG TRẢ LỜI (không JSON):
1) Nhận xét tổng quan nhóm biến (1–2 đoạn).
2) Danh sách góp ý chi tiết dạng gạch đầu dòng (mỗi dòng 1 góp ý cụ thể).
3) Kết luận ngắn (1 đoạn).
4) Mục "TLTK" liệt kê các tài liệu tham khảo (hoặc câu "Không tìm thấy nguồn phù hợp để trích dẫn.").

Ngữ cảnh:
Ngày đánh giá: ${now}

PICO:
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

Mục tiêu chính:
${mainObj || "(chưa nhập)"}

Mục tiêu phụ:
${subObjs.length ? subObjs.map((x, i) => (i + 1) + ". " + x).join("\\n") : "(chưa có)"}

Thiết kế (JSON rút gọn):
${jsonSafe(design)}

Can thiệp (JSON rút gọn):
${jsonSafe(interventions)}

Nhóm biến "${cfg.title}" hiện tại:
${variablesText}
`.trim();

      const raw = await callAI("step10.evaluate", prompt, ctx);
      const text = String(raw || "").trim() || "Không nhận được phản hồi.";
      showFeedbackDialog(
        `Đánh giá nhóm biến – ${cfg.title}`,
        text
      );
    } catch (e) {
      console.error(e);
      ctx.toast("Lỗi khi gọi GPT đánh giá nhóm biến.");
    } finally {
      toggleBusy(btn, false, "GPT đánh giá nhóm");
    }
  }

  // ============================================================
  // ================== Helpers – dữ liệu, GPT ===================
  // ============================================================

  function normVar(v) {
    if (!v || typeof v !== "object") {
      const s = String(v ?? "").trim();
      return s ? { name: s, timepoint: "", definition: "", measurement: "", unit: "" } : { name: "" };
    }
    return {
      name: (v.name ?? "").toString().trim(),
      timepoint: (v.timepoint ?? "").toString().trim(),
      definition: (v.definition ?? "").toString().trim(),
      measurement: (v.measurement ?? "").toString().trim(),
      unit: (v.unit ?? "").toString().trim(),
    };
  }

  function safeParse(s) {
    try {
      return JSON.parse(String(s));
    } catch {
      return null;
    }
  }

  function jsonSafe(x) {
    try {
      const s = JSON.stringify(x);
      return s.length > 2000 ? s.slice(0, 2000) + "...[cắt bớt]" : s;
    } catch {
      return String(x);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === "function") {
      try {
        return String((await ctx_.callStepGPT(bindingKey, prompt)) ?? "");
      } catch (e) {
        if (typeof ctx_.callGPT === "function") {
          return String((await ctx_.callGPT(prompt)) ?? "");
        }
        throw e;
      }
    }
    if (typeof ctx_.callGPT === "function") {
      return String((await ctx_.callGPT(prompt)) ?? "");
    }
    throw new Error("Chưa cấu hình GPT cho step10.");
  }

  function toggleBusy(btn, busy, labelWhenIdle) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset.prev = btn.textContent || "";
      btn.textContent = "Đang xử lý...";
    } else {
      btn.disabled = false;
      btn.textContent = labelWhenIdle || btn.dataset.prev || "";
    }
  }

  function showFeedbackDialog(title, text) {
    const id = "step10-vars-feedback-dialog";
    let dlg = document.getElementById(id);
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.id = id;
      dlg.style.position = "fixed";
      dlg.style.inset = "0";
      dlg.style.background = "rgba(0,0,0,.4)";
      dlg.style.zIndex = "60";
      dlg.style.display = "flex";
      dlg.style.alignItems = "center";
      dlg.style.justifyContent = "center";
      dlg.innerHTML = `
        <div class="vars-dialog">
          <div class="vars-dialog-header">
            <div class="vars-dialog-title"></div>
            <button type="button" class="btn btn-ghost vars-dialog-close">✕</button>
          </div>
          <div class="vars-dialog-body" id="step10-vars-fb-text"></div>
          <div class="vars-dialog-footer">
            <button type="button" class="btn btn-primary vars-dialog-close">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(dlg);
      dlg.querySelectorAll(".vars-dialog-close").forEach((b) =>
        b.addEventListener("click", () => dlg.remove())
      );
    }
    const titleEl = dlg.querySelector(".vars-dialog-title");
    const bodyEl = dlg.querySelector("#step10-vars-fb-text");
    if (titleEl) titleEl.textContent = title || "Đánh giá nhóm biến";
    if (bodyEl) {
      bodyEl.textContent = text;
      bodyEl.style.whiteSpace = "pre-wrap";
    }
  }
}

// ---------- Markup helper: mỗi nhóm = 1 card full-width ----------
function renderGroupCard(key) {
  const cfg = GROUP_CONFIG[key];
  return `
    <div class="card var-group-card" data-group-card="${key}">
      <div class="card-header var-group-header">
        <div class="var-group-titles">
          <div class="var-group-title">${cfg.title}</div>
          <div class="var-group-hint muted">${cfg.hint}</div>
        </div>
        <div class="var-group-actions">
          <button type="button" class="btn btn-secondary" data-gpt-suggest="${key}">
            GPT gợi ý biến
          </button>
          <button type="button" class="btn btn-secondary" data-gpt-eval="${key}">
            GPT đánh giá nhóm
          </button>
          <button type="button" class="btn btn-primary" data-add-var="${key}">
            + Thêm biến
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Form thêm biến (ẩn cho tới khi bấm Thêm) -->
        <div class="var-form hidden" data-form="${key}">
          <div class="var-form-row grid-2">
            <label class="form-field">
              <span class="field-label">
                Tên biến <span class="required">*</span>
              </span>
              <input
                type="text"
                data-group="${key}"
                data-field="name"
                placeholder="Ví dụ: Thay đổi điểm VAS đau từ ban đầu đến tuần 12" />
            </label>

            <label class="form-field">
              <span class="field-label">Thời điểm thu thập</span>
              <input
                type="text"
                data-group="${key}"
                data-field="timepoint"
                placeholder="Ví dụ: Baseline, tuần 4, tuần 12" />
            </label>
          </div>

          <div class="var-form-row grid-2">
            <label class="form-field">
              <span class="field-label">Cách đo lường / định nghĩa biến</span>
              <textarea
                rows="3"
                data-group="${key}"
                data-field="definition"
                placeholder="Mô tả rõ cách tính/đánh giá biến, tiêu chuẩn chẩn đoán/thang điểm, cách tổng hợp..."></textarea>
            </label>

            <label class="form-field">
              <span class="field-label">Đơn vị</span>
              <input
                type="text"
                data-group="${key}"
                data-field="unit"
                placeholder="mm, điểm, %, ml, kg, lần/tuần, ..." />
            </label>
          </div>

          <div class="var-form-row">
            <label class="form-field">
              <span class="field-label">Cách đo lường (công cụ/thang đo cụ thể)</span>
              <input
                type="text"
                data-group="${key}"
                data-field="measurement"
                placeholder="Ví dụ: Thang VAS 0–100 mm, WOMAC tổng điểm, SF-36 PF, EMG RMS cơ tứ đầu..." />
            </label>
          </div>

          <div class="var-form-actions">
            <button type="button" class="btn btn-primary" data-save-var="${key}">
              Lưu biến vào nhóm
            </button>
            <button type="button" class="btn btn-ghost" data-cancel-var="${key}">
              Hủy
            </button>
          </div>
        </div>

        <!-- Danh sách biến trong nhóm -->
        <div class="var-list-wrap">
          <div class="var-list-title">Danh sách biến trong nhóm</div>
          <div class="var-list" data-list="${key}"></div>
        </div>
      </div>
    </div>
  `;
}
