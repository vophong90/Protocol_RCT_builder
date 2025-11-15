// src/steps/step10/index.js
// Step 10 – Biến số nghiên cứu (phiên bản mới)
// - Không dùng CSV/kho biến.
// - Mỗi nhóm biến (primary, secondary, baseline, confounder, mediator, moderator, safety)
//   là 1 card full width, xếp dọc.
// - Trong mỗi card:
//   + Nút "Thêm biến" → khi click mới hiện form nhập biến.
//   + Form nhập: name (bắt buộc), timepoint, definition, unit, note.
//   + Danh sách biến đã thêm, có nút Xoá từng biến.
//   + Nút "GPT gợi ý biến" & "GPT đánh giá nhóm biến" cho riêng nhóm đó.
// - Lưu state vào ctx.save('selectedVariables', selected);
//   selected = { primary:[{...}], secondary:[...], ... }.

export const id = 10;
export const title = "Biến số nghiên cứu";
export const subtitle =
  "Phân nhóm các biến (kết cục chính/phụ, nền, nhiễu...) và mô tả rõ cách đo lường.";
export const css = "./public/css/steps/step10.css";

const BUCKETS = [
  {
    key: "primary",
    title: "Kết cục chính (Primary)",
    hint: "Biến kết cục chính duy nhất hoặc rất ít; dùng để tính cỡ mẫu và trả lời câu hỏi chính."
  },
  {
    key: "secondary",
    title: "Kết cục phụ (Secondary)",
    hint: "Các kết cục bổ sung giúp hiểu rõ hơn hiệu quả can thiệp."
  },
  {
    key: "baseline",
    title: "Biến nền (Baseline)",
    hint: "Đặc điểm ban đầu của đối tượng, dùng mô tả dân số và cân bằng nhóm."
  },
  {
    key: "confounder",
    title: "Nhiễu (Confounder)",
    hint: "Các yếu tố có thể gây nhiễu, cần thu thập để điều chỉnh trong phân tích."
  },
  {
    key: "mediator",
    title: "Trung gian (Mediator)",
    hint: "Biến nằm trên đường dẫn cơ chế giữa can thiệp và kết cục (nếu phù hợp giả thuyết)."
  },
  {
    key: "moderator",
    title: "Điều biến (Moderator)",
    hint: "Biến có thể làm thay đổi hướng/độ lớn hiệu quả can thiệp (subgroup/interaction)."
  },
  {
    key: "safety",
    title: "An toàn (Safety)",
    hint: "Biến cố bất lợi (AE/SAE), xét nghiệm an toàn, chỉ số theo dõi độc tính."
  }
];

export async function mount(root, ctx) {
  // scope CSS
  root.closest(".step")?.setAttribute("data-scope", "step10");

  // khung chung
  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Biến số nghiên cứu</h3>
        <div class="card-subtitle">
          Phân nhóm biến theo vai trò (kết cục chính/phụ, nền, nhiễu, an toàn...).
          Mỗi biến cần ghi rõ thời điểm thu thập, định nghĩa và cách đo lường.
        </div>
      </div>

      <div class="card-body">
        <div id="var-buckets" class="var-buckets"></div>
      </div>

      <div class="card-footer">
        <button id="vars-save-all" class="btn btn-primary" type="button">
          Lưu tất cả nhóm biến
        </button>
      </div>
    </div>
  `.trim();

  const bucketsWrap = root.querySelector("#var-buckets");
  const saveAllBtn = root.querySelector("#vars-save-all");

  // ======= Load & chuẩn hóa state =======
  let selected = normalizeSelected(ctx.get("selectedVariables", {}));

  // ======= Render các card nhóm biến =======
  const bucketDom = {}; // key -> { card, listEl, form, evalBox }

  BUCKETS.forEach((cfg) => {
    const card = document.createElement("div");
    card.className = "card var-bucket-card";
    card.dataset.bucket = cfg.key;

    card.innerHTML = `
      <div class="card-header var-bucket-header">
        <div>
          <div class="card-title">${escapeHtml(cfg.title)}</div>
          <div class="card-subtitle">${escapeHtml(cfg.hint)}</div>
        </div>
        <div class="var-bucket-header-actions">
          <button type="button" class="btn btn-secondary var-add-btn">+ Thêm biến</button>
        </div>
      </div>

      <div class="card-body var-form hidden">
        <div class="var-form-grid">
          <label>
            Tên biến <span class="required">*</span>
            <input type="text" class="var-input-name"
              placeholder="Ví dụ: Thay đổi điểm VAS đau từ ban đầu đến tuần 12" />
          </label>
          <label>
            Thời điểm thu thập
            <input type="text" class="var-input-timepoint"
              placeholder="Ví dụ: Baseline, tuần 4, tuần 12" />
          </label>
          <label class="full-span">
            Định nghĩa / Đo lường
            <textarea rows="3" class="var-input-definition"
              placeholder="Mô tả cách đo, thang điểm, công thức tính, nguồn hướng dẫn chuẩn (nếu có)…"></textarea>
          </label>
          <label>
            Đơn vị
            <input type="text" class="var-input-unit"
              placeholder="Ví dụ: điểm, mmHg, kg/m²" />
          </label>
          <label>
            Ghi chú (tuỳ chọn)
            <input type="text" class="var-input-note"
              placeholder="Ví dụ: do bệnh nhân tự báo cáo; đo bởi điều dưỡng; đo buổi sáng nhịn đói…" />
          </label>
        </div>
        <div class="var-form-actions">
          <button type="button" class="btn btn-primary var-save-one">Lưu biến</button>
          <button type="button" class="btn btn-ghost var-cancel-one">Hủy</button>
        </div>
      </div>

      <div class="card-body">
        <div class="var-list-title">Danh sách biến trong nhóm</div>
        <div class="var-list" id="var-list-${cfg.key}"></div>
      </div>

      <div class="card-footer var-bucket-footer">
        <button type="button" class="btn btn-primary var-gpt-suggest">GPT gợi ý biến</button>
        <button type="button" class="btn btn-secondary var-gpt-evaluate">GPT đánh giá nhóm biến</button>
      </div>

      <div class="card-body var-eval hidden">
        <div class="var-eval-title">Kết quả đánh giá nhóm biến</div>
        <div class="var-eval-text"></div>
      </div>
    `;

    bucketsWrap.appendChild(card);

    bucketDom[cfg.key] = {
      card,
      cfg,
      formWrap: card.querySelector(".var-form"),
      listEl: card.querySelector(`#var-list-${cfg.key}`),
      evalWrap: card.querySelector(".var-eval"),
      evalText: card.querySelector(".var-eval-text")
    };

    // nút Thêm biến
    const addBtn = card.querySelector(".var-add-btn");
    const saveOneBtn = card.querySelector(".var-save-one");
    const cancelBtn = card.querySelector(".var-cancel-one");

    const nameInput = card.querySelector(".var-input-name");
    const timeInput = card.querySelector(".var-input-timepoint");
    const defInput = card.querySelector(".var-input-definition");
    const unitInput = card.querySelector(".var-input-unit");
    const noteInput = card.querySelector(".var-input-note");

    addBtn.addEventListener("click", () => {
      bucketDom[cfg.key].formWrap.classList.remove("hidden");
      nameInput.focus();
    });

    cancelBtn.addEventListener("click", () => {
      clearForm();
      bucketDom[cfg.key].formWrap.classList.add("hidden");
    });

    saveOneBtn.addEventListener("click", () => {
      const v = {
        name: (nameInput.value || "").trim(),
        timepoint: (timeInput.value || "").trim(),
        definition: (defInput.value || "").trim(),
        unit: (unitInput.value || "").trim(),
        note: (noteInput.value || "").trim()
      };
      if (!v.name) {
        ctx.toast("Tên biến là bắt buộc.");
        nameInput.focus();
        return;
      }
      selected[cfg.key].push(v);
      clearForm();
      bucketDom[cfg.key].formWrap.classList.add("hidden");
      renderBucketList(cfg.key);
      ctx.toast("Đã thêm biến vào nhóm.");
    });

    function clearForm() {
      nameInput.value = "";
      timeInput.value = "";
      defInput.value = "";
      unitInput.value = "";
      noteInput.value = "";
    }

    // nút GPT gợi ý
    const gptSuggestBtn = card.querySelector(".var-gpt-suggest");
    gptSuggestBtn.addEventListener("click", () =>
      onSuggestGroup(cfg.key, ctx)
    );

    // nút GPT đánh giá
    const gptEvalBtn = card.querySelector(".var-gpt-evaluate");
    gptEvalBtn.addEventListener("click", () =>
      onEvaluateGroup(cfg.key, ctx)
    );
  });

  // render lần đầu danh sách
  BUCKETS.forEach((b) => renderBucketList(b.key));

  // ======= Save all =======
  saveAllBtn.addEventListener("click", () => {
    ctx.save("selectedVariables", selected);
    ctx.toast("Đã lưu tất cả nhóm biến.");
  });

  // ================== RENDER LIST ==================
  function renderBucketList(bucketKey) {
    const dom = bucketDom[bucketKey];
    if (!dom) return;
    const listEl = dom.listEl;
    const arr = selected[bucketKey] || [];

    listEl.innerHTML = "";
    if (!arr.length) {
      listEl.innerHTML =
        '<div class="muted">Chưa có biến nào trong nhóm này.</div>';
      return;
    }

    arr.forEach((v, idx) => {
      const row = document.createElement("div");
      row.className = "var-item";

      row.innerHTML = `
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
          v.definition
            ? `<div class="var-item-def"><strong>Đo lường:</strong> ${escapeHtml(
                v.definition
              )}</div>`
            : ""
        }
        ${
          v.note
            ? `<div class="var-item-note muted">${escapeHtml(v.note)}</div>`
            : ""
        }
      `;

      const delBtn = row.querySelector(".var-item-delete");
      delBtn.addEventListener("click", () => {
        selected[bucketKey].splice(idx, 1);
        renderBucketList(bucketKey);
      });

      listEl.appendChild(row);
    });
  }

  // ================== GPT: GỢI Ý BIẾN ==================
  async function onSuggestGroup(bucketKey, ctx_) {
    const cfg = BUCKETS.find((b) => b.key === bucketKey);
    if (!cfg) return;

    const pico = ctx_.get("pico", {}) || {};
    const mainObj = ctx_.get("mainObjective", "") || "";
    const subObjs = Array.isArray(ctx_.get("subObjectives", []))
      ? ctx_.get("subObjectives", [])
      : [];
    const design = ctx_.get("design", {}) || {};
    const interventions = ctx_.get("interventions", []) || [];

    const existing = (selected[bucketKey] || []).map((v) => v.name);

    const today = new Date().toISOString().slice(0, 10);

    const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy gợi ý các **biến thuộc nhóm "${cfg.title}"**
cho một thử nghiệm lâm sàng ngẫu nhiên, dựa trên PICO, mục tiêu nghiên cứu, thiết kế và mô tả can thiệp.

YÊU CẦU VỀ NGUỒN:
- Mọi gợi ý phải bám theo hướng dẫn/quy trình chuẩn quốc tế (ví dụ: CONSORT, SPIRIT, ICH E9, hướng dẫn của FDA/EMA, guideline chuyên ngành).
- Chỉ liệt kê tối đa 5 tài liệu tham khảo CÓ THẬT mà bạn chắc chắn ≥90% (ưu tiên guideline, consensus).
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên tác giả hay tên tạp chí.
- Nếu không tìm được nguồn phù hợp, đặt: ["Không tìm thấy nguồn phù hợp để trích dẫn."].

ĐỊNH DẠNG TRẢ LỜI – CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG GIẢI THÍCH:
{
  "variables": [
    {
      "name": "Tên biến",
      "timepoint": "Thời điểm thu thập (ví dụ: Baseline, tuần 4, tuần 12)",
      "definition": "Định nghĩa/đo lường chi tiết (thang điểm, công thức, ai đo, trong điều kiện nào...)",
      "unit": "Đơn vị đo (ví dụ: điểm, mmHg, kg/m²)",
      "note": "Ghi chú tuỳ chọn"
    }
  ],
  "refs": [
    "Họ Tên. Năm. Tiêu đề. Tạp chí/Sách. DOI/PMID/URL",
    "..."
  ]
}

CHỈ GỢI Ý CÁC BIẾN CHƯA CÓ trong nhóm này (hiện tại: ${JSON.stringify(
      existing
    )}).

Ngày: ${today}

PICO:
- P: ${pico.p || "(chưa có)"}
- I: ${pico.i || "(chưa có)"}
- C: ${pico.c || "(chưa có)"}
- O: ${pico.o || "(chưa có)"}

Mục tiêu chính:
${mainObj || "(chưa có)"}

Mục tiêu phụ:
${subObjs.length ? subObjs.join("; ") : "(chưa có)"}

Thiết kế (JSON rút gọn):
${jsonSafe(design)}

Mô tả can thiệp (JSON rút gọn):
${jsonSafe(interventions)}
`.trim();

    try {
      const label =
        cfg.key === "primary"
          ? "GPT gợi ý biến (primary)"
          : `GPT gợi ý biến (${cfg.key})`;
      ctx_.toast(`Đang gợi ý biến cho nhóm "${cfg.title}"...`);
      const raw = await callAI("step10.suggest", prompt, ctx_);
      const j = safeParse(raw);
      if (!j || !Array.isArray(j.variables)) {
        ctx_.toast("GPT không trả về JSON biến hợp lệ.");
        console.warn("step10.suggest raw:", raw);
        return;
      }

      const newVars = j.variables
        .map(normVar)
        .filter((v) => v.name && !existing.includes(v.name));

      if (!newVars.length) {
        ctx_.toast("Không có biến mới được gợi ý (có thể đã trùng với danh sách hiện tại).");
        return;
      }

      selected[bucketKey].push(...newVars);
      renderBucketList(bucketKey);
      ctx_.toast(
        `Đã thêm ${newVars.length} biến gợi ý vào nhóm "${cfg.title}".`
      );

      // nếu có refs, log ra console cho bạn xem (tạm thời chưa có UI riêng)
      if (Array.isArray(j.refs) && j.refs.length) {
        console.log("TLTK gợi ý cho", bucketKey, ":", j.refs);
      }
    } catch (e) {
      console.error(e);
      ctx_.toast("Lỗi khi gọi GPT gợi ý biến.");
    }
  }

  // ================== GPT: ĐÁNH GIÁ NHÓM ==================
  async function onEvaluateGroup(bucketKey, ctx_) {
    const cfg = BUCKETS.find((b) => b.key === bucketKey);
    if (!cfg) return;

    const arr = selected[bucketKey] || [];
    if (!arr.length) {
      ctx_.toast("Nhóm này chưa có biến để đánh giá.");
      return;
    }

    const pico = ctx_.get("pico", {}) || {};
    const mainObj = ctx_.get("mainObjective", "") || "";
    const subObjs = Array.isArray(ctx_.get("subObjectives", []))
      ? ctx_.get("subObjectives", [])
      : [];
    const design = ctx_.get("design", {}) || {};
    const interventions = ctx_.get("interventions", []) || [];
    const today = new Date().toISOString().slice(0, 10);

    const payload = arr.map((v, i) => ({
      index: i + 1,
      name: v.name,
      timepoint: v.timepoint,
      definition: v.definition,
      unit: v.unit,
      note: v.note
    }));

    const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy **đánh giá riêng nhóm biến "${cfg.title}"**
về mức độ phù hợp với PICO, mục tiêu nghiên cứu và guideline quốc tế (CONSORT, SPIRIT, ICH E9…).

YÊU CẦU:
1) Nhận xét chung (1–2 đoạn) về nhóm biến này: ưu điểm, hạn chế.
2) Liệt kê rõ:
   - Biến quan trọng còn thiếu (nếu có) và nên bổ sung vào đâu, đo thế nào.
   - Biến trùng lặp/không cần thiết (nếu có).
   - Gợi ý cải thiện định nghĩa, thời điểm thu thập, đơn vị đo để dễ so sánh với nghiên cứu khác.
3) Đưa ra khuyến nghị tổng thể (1 đoạn ngắn).

VỀ TÀI LIỆU THAM KHẢO:
- Nếu có guideline/khuyến cáo chuẩn thật sự liên quan, liệt kê tối đa 5 nguồn CÓ THẬT (không bịa).
- Nếu không có nguồn chắc chắn, ghi chính xác câu: "Không tìm thấy nguồn phù hợp để trích dẫn."

ĐỊNH DẠNG TRẢ LỜI (không JSON):
- Nhận xét chi tiết (có thể gạch đầu dòng).
- Đoạn kết luận.
- Mục "TLTK:" ở cuối, đánh số 1),2),… (hoặc câu trên nếu không có nguồn).

Ngày đánh giá: ${today}

PICO:
P: ${pico.p || "(chưa có)"}
I: ${pico.i || "(chưa có)"}
C: ${pico.c || "(chưa có)"}
O: ${pico.o || "(chưa có)"}

Mục tiêu chính: ${mainObj || "(chưa có)"}
Mục tiêu phụ: ${subObjs.length ? subObjs.join("; ") : "(chưa có)"}

Thiết kế (JSON rút gọn):
${jsonSafe(design)}

Mô tả can thiệp (JSON rút gọn):
${jsonSafe(interventions)}

Nhóm biến cần đánh giá (JSON):
${JSON.stringify(payload, null, 2).slice(0, 4000)}
`.trim();

    try {
      ctx_.toast(`Đang đánh giá nhóm biến "${cfg.title}"...`);
      const raw = await callAI("step10.evaluate", prompt, ctx_);
      const text = String(raw || "").trim() || "Không nhận được phản hồi.";
      const dom = bucketDom[bucketKey];
      dom.evalText.textContent = text;
      dom.evalWrap.classList.remove("hidden");
    } catch (e) {
      console.error(e);
      ctx_.toast("Lỗi khi gọi GPT đánh giá nhóm biến.");
    }
  }

  // ================== Helpers ==================
  function normalizeSelected(sel) {
    const out = {};
    BUCKETS.forEach((b) => {
      const arr = Array.isArray(sel?.[b.key]) ? sel[b.key] : [];
      out[b.key] = arr.map(normVar).filter((v) => !!v.name);
    });
    return out;
  }

  function normVar(v) {
    if (!v || typeof v !== "object") {
      const s = String(v ?? "").trim();
      return s ? { name: s } : { name: "" };
    }
    return {
      name: (v.name ?? "").toString().trim(),
      timepoint: (v.timepoint ?? "").toString().trim(),
      definition: (v.definition ?? "").toString().trim(),
      unit: (v.unit ?? "").toString().trim(),
      note: (v.note ?? "").toString().trim()
    };
  }

  function safeParse(s) {
    try {
      return JSON.parse(String(s || ""));
    } catch {
      return null;
    }
  }

  function jsonSafe(x) {
    try {
      return JSON.stringify(x).slice(0, 2000);
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

  // dùng binding nếu có, fallback callGPT
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
}
