// src/steps/step10/index.js
// Step 10 – Biến số nghiên cứu (phiên bản mới)
// - Mỗi nhóm biến là 1 card full-width, xếp dọc.
// - Mỗi card có 3 nút: "Thêm biến" (mở/đóng form), "GPT gợi ý biến", "GPT đánh giá nhóm".
// - Form thêm biến chỉ hiện khi nhấn "Thêm biến".
// - Lưu state: variablesByGroup = { primary:[{...}], secondary:[{...}], ... }

export const id = 10;
export const title = "Biến số nghiên cứu";
export const subtitle =
  "Xây dựng danh mục biến cho từng nhóm (kết cục chính/phụ, nền, nhiễu...) bám sát mục tiêu nghiên cứu.";
export const css = "./public/css/steps/step10.css";

const BUCKETS = {
  primary: {
    title: "Kết cục chính (Primary)",
    hint: "Thường 1 kết cục chính hoặc rất ít; phải phù hợp mục tiêu chính."
  },
  secondary: {
    title: "Kết cục phụ (Secondary)",
    hint: "Các kết cục bổ sung để mở rộng giải thích kết quả."
  },
  baseline: {
    title: "Biến nền (Baseline)",
    hint: "Đặc điểm ban đầu để mô tả dân số và so sánh cân bằng giữa nhóm."
  },
  confounder: {
    title: "Biến gây nhiễu (Confounder)",
    hint: "Yếu tố liên quan cả với can thiệp và kết cục; cần điều chỉnh trong phân tích."
  },
  mediator: {
    title: "Biến trung gian (Mediator)",
    hint: "Biến trên đường dẫn cơ chế giữa can thiệp và kết cục (nếu phù hợp giả thuyết)."
  },
  moderator: {
    title: "Biến điều biến (Moderator)",
    hint: "Biến làm thay đổi cường độ/hướng tác động của can thiệp (nếu phù hợp giả thuyết)."
  },
  safety: {
    title: "An toàn (Safety)",
    hint: "Biến cố bất lợi, AE/SAE, thông số an toàn cần theo dõi."
  }
};

export async function mount(rootEl, ctx) {
  // Gắn scope cho CSS riêng step 10
  rootEl.closest(".step")?.setAttribute("data-scope", "step10");

  // ===== Khung chính =====
  rootEl.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Biến số nghiên cứu</h3>
        <div class="card-subtitle">
          Xây dựng danh mục biến cho từng nhóm (kết cục chính, phụ, nền, nhiễu, trung gian, điều biến, an toàn)
          bám sát PICO và mục tiêu nghiên cứu. Mỗi biến cần ghi rõ định nghĩa, cách đo lường và thời điểm thu thập.
        </div>
      </div>

      <div class="card-body var-groups" id="var-groups"></div>

      <div class="card-footer var-footer-main">
        <button id="var-save" class="btn btn-primary" type="button">Lưu toàn bộ nhóm biến</button>
      </div>
    </div>
  `.trim();

  const groupsWrap = rootEl.querySelector("#var-groups");
  const saveBtn = rootEl.querySelector("#var-save");

  // ===== Load & chuẩn hóa state =====
  let variablesByGroup = normalizeVariablesByGroup(
    ctx.get("variablesByGroup", {})
  );

  // ===== Render các card nhóm biến =====
  groupsWrap.innerHTML = "";
  Object.entries(BUCKETS).forEach(([key, meta]) => {
    const section = document.createElement("section");
    section.className = "var-card";
    section.dataset.bucket = key;

    section.innerHTML = `
      <div class="var-card-header">
        <div class="var-card-title-wrap">
          <div class="var-card-title">${escapeHtml(meta.title)}</div>
          <div class="var-card-hint muted">${escapeHtml(meta.hint || "")}</div>
        </div>
        <div class="var-card-actions">
          <button id="var-toggle-${key}" class="btn btn-secondary" type="button">
            Thêm biến
          </button>
          <button id="var-suggest-${key}" class="btn btn-primary" type="button">
            GPT gợi ý biến
          </button>
          <button id="var-eval-${key}" class="btn btn-secondary" type="button">
            GPT đánh giá nhóm
          </button>
        </div>
      </div>

      <div class="var-card-body">
        <div class="var-form hidden" id="var-form-${key}">
          <div class="var-form-grid">
            <label>
              Tên biến <span class="required">*</span>
              <input id="var-name-${key}" type="text"
                placeholder="Ví dụ: Thay đổi điểm VAS đau từ ban đầu đến tuần 12" />
            </label>
            <label>
              Thời điểm thu thập
              <input id="var-time-${key}" type="text"
                placeholder="Ví dụ: Baseline, tuần 4, tuần 12" />
            </label>
            <label class="full-span">
              Định nghĩa biến
              <textarea id="var-def-${key}" rows="2"
                placeholder="Mô tả rõ ràng biến là gì, cách tính, điều kiện áp dụng (theo chuẩn hướng dẫn)."></textarea>
            </label>
            <label class="full-span">
              Cách đo lường / công cụ
              <textarea id="var-meas-${key}" rows="2"
                placeholder="Ví dụ: Thang VAS 0–100 mm; SF-36 bản đã thẩm định; xét nghiệm; thiết bị đo cụ thể."></textarea>
            </label>
            <label>
              Đơn vị
              <input id="var-unit-${key}" type="text" placeholder="mm, điểm, %, mg/dL, ..." />
            </label>
            <label>
              Ghi chú
              <input id="var-note-${key}" type="text"
                placeholder="Quy tắc làm tròn, xử lý giá trị ngoại lai..." />
            </label>
          </div>
          <div class="var-form-actions">
            <button id="var-add-${key}" class="btn btn-primary" type="button">
              Lưu biến này
            </button>
          </div>
        </div>

        <div class="var-list-wrap">
          <div class="var-list-title">Danh sách biến trong nhóm</div>
          <div id="var-list-${key}" class="var-list"></div>
        </div>

        <div class="var-eval-wrap hidden" id="var-eval-wrap-${key}">
          <div class="var-eval-title">Nhận xét GPT về nhóm biến</div>
          <div id="var-eval-text-${key}" class="var-eval-text"></div>
        </div>
      </div>
    `;

    groupsWrap.appendChild(section);

    // ========== Wiring cho nhóm này ==========
    const toggleBtn = section.querySelector(`#var-toggle-${key}`);
    const addBtn = section.querySelector(`#var-add-${key}`);
    const suggestBtn = section.querySelector(`#var-suggest-${key}`);
    const evalBtn = section.querySelector(`#var-eval-${key}`);

    const formEl = section.querySelector(`#var-form-${key}`);
    const nameInput = section.querySelector(`#var-name-${key}`);
    const timeInput = section.querySelector(`#var-time-${key}`);
    const defTA = section.querySelector(`#var-def-${key}`);
    const measTA = section.querySelector(`#var-meas-${key}`);
    const unitInput = section.querySelector(`#var-unit-${key}`);
    const noteInput = section.querySelector(`#var-note-${key}`);

    const listEl = section.querySelector(`#var-list-${key}`);
    const evalWrap = section.querySelector(`#var-eval-wrap-${key}`);
    const evalText = section.querySelector(`#var-eval-text-${key}`);

    // Render lần đầu danh sách biến cho nhóm
    renderGroupList(key, listEl);

    // --- Nút toggle form thêm biến ---
    toggleBtn.addEventListener("click", () => {
      const isHidden = formEl.classList.contains("hidden");
      if (isHidden) {
        formEl.classList.remove("hidden");
        toggleBtn.textContent = "Ẩn form thêm biến";
        // Focus vào tên biến cho tiện nhập
        nameInput?.focus();
      } else {
        formEl.classList.add("hidden");
        toggleBtn.textContent = "Thêm biến";
      }
    });

    // --- Thêm biến thủ công ---
    addBtn.addEventListener("click", () => {
      const v = {
        name: (nameInput.value || "").trim(),
        timepoint: (timeInput.value || "").trim(),
        definition: (defTA.value || "").trim(),
        measurement: (measTA.value || "").trim(),
        unit: (unitInput.value || "").trim(),
        note: (noteInput.value || "").trim()
      };
      if (!v.name) {
        ctx.toast("Tên biến là bắt buộc.");
        nameInput.focus();
        return;
      }
      variablesByGroup[key] = [...(variablesByGroup[key] || []), normVar(v)];
      // Clear form sau khi thêm
      nameInput.value = "";
      timeInput.value = "";
      defTA.value = "";
      measTA.value = "";
      unitInput.value = "";
      noteInput.value = "";
      renderGroupList(key, listEl);
      ctx.toast("Đã thêm biến vào nhóm.");
    });

    // --- GPT gợi ý biến cho nhóm ---
    suggestBtn.addEventListener("click", async () => {
      try {
        toggleBusy(suggestBtn, true, "Đang gợi ý...");
        const pico = ctx.get("pico", {}) || {};
        const mainObj = ctx.get("mainObjective", "") || "";
        const subsRaw = ctx.get("subObjectives", []);
        const subObjs = Array.isArray(subsRaw) ? subsRaw : [];
        const design = ctx.get("design", {}) || {};
        const interventions = ctx.get("interventions", []) || [];

        const existingVars = (variablesByGroup[key] || []).map(viewVar);

        const prompt = `
Bạn là chuyên gia phương pháp luận RCT. Hãy đề xuất **các biến cho nhóm "${BUCKETS[key].title}"**
dựa trên PICO, mục tiêu nghiên cứu và thiết kế/can thiệp hiện có.

YÊU CẦU VỀ NGUỒN:
- Mọi gợi ý phải bám theo các hướng dẫn/quy trình được công nhận (ví dụ: CONSORT, SPIRIT, hướng dẫn chuyên ngành).
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên tác giả hay tên bài báo.
- Chỉ liệt kê tối đa 5 tài liệu tham khảo bạn CHẮC CHẮN (≥90%) là có thật; nếu không có nguồn phù hợp, ghi đúng câu:
  "Không tìm thấy nguồn phù hợp để trích dẫn."

ĐỊNH DẠNG TRẢ VỀ – CHỈ MỘT JSON HỢP LỆ, KHÔNG THÊM GIẢI THÍCH:
{
  "variables": [
    {
      "name": "Tên biến (ngắn gọn, cụ thể, bám mục tiêu)",
      "timepoint": "Thời điểm thu thập (baseline, tuần X, tháng Y…) nếu có",
      "definition": "Định nghĩa hoạt động của biến, theo chuẩn hoặc hướng dẫn rõ ràng",
      "measurement": "Cách đo lường / công cụ / quy trình",
      "unit": "Đơn vị đo (nếu áp dụng)",
      "note": "Ghi chú bổ sung (quy tắc làm tròn, xử lý giá trị ngoại lai, quy ước lâm sàng...)"
    }
  ],
  "refs": [
    "Tác giả chính… (năm). Tiêu đề. Tạp chí/sách. DOI/PMID/URL",
    "..."
  ]
}

Ngữ cảnh:
PICO:
- P: ${pico.p || "(chưa có)"}
- I: ${pico.i || "(chưa có)"}
- C: ${pico.c || "(chưa có)"}
- O: ${pico.o || "(chưa có)"}

Mục tiêu chính:
${mainObj || "(chưa có)"}

Các mục tiêu phụ:
${subObjs.length ? subObjs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa có)"}

Thiết kế nghiên cứu (JSON rút gọn):
${jsonSafe(design)}

Can thiệp (JSON rút gọn):
${jsonSafe(interventions)}

Các biến hiện đang có trong nhóm "${BUCKETS[key].title}":
${JSON.stringify(existingVars, null, 2).slice(0, 2000)}
`.trim();

        const raw = await callAI("step10.suggest", prompt, ctx);
        const parsed = safeParse(raw);
        if (!parsed || !Array.isArray(parsed.variables)) {
          ctx.toast("GPT không trả về JSON hợp lệ cho nhóm biến.");
          console.warn("step10 suggest raw:", raw);
          return;
        }

        const suggested = parsed.variables
          .map(normVar)
          .filter((v) => v.name);

        if (!suggested.length) {
          ctx.toast("Không có biến nào được gợi ý hợp lệ.");
          return;
        }

        // Gộp vào nhóm, tránh trùng tên
        const existingNames = new Set(
          (variablesByGroup[key] || []).map((v) => v.name)
        );
        const merged = [...(variablesByGroup[key] || [])];
        suggested.forEach((v) => {
          if (!existingNames.has(v.name)) {
            merged.push(v);
            existingNames.add(v.name);
          }
        });
        variablesByGroup[key] = merged;
        renderGroupList(key, listEl);

        // Nếu có refs, hiển thị kèm trong eval box như phần tham khảo
        if (Array.isArray(parsed.refs) && parsed.refs.length) {
          const refsText = parsed.refs
            .map((r, i) => `${i + 1}) ${r}`)
            .join("\n");
          evalText.textContent = `TLTK gợi ý:\n${refsText}`;
          evalWrap.classList.remove("hidden");
        }

        ctx.toast("Đã chèn biến được GPT gợi ý vào nhóm.");
      } catch (e) {
        console.error(e);
        ctx.toast("Lỗi khi gọi GPT gợi ý biến.");
      } finally {
        toggleBusy(suggestBtn, false, "GPT gợi ý biến");
      }
    });

    // --- GPT đánh giá nhóm biến ---
    evalBtn.addEventListener("click", async () => {
      const groupVars = (variablesByGroup[key] || []).map(viewVar);
      if (!groupVars.length) {
        ctx.toast("Nhóm này chưa có biến nào để đánh giá.");
        return;
      }

      try {
        toggleBusy(evalBtn, true, "Đang đánh giá...");
        const pico = ctx.get("pico", {}) || {};
        const mainObj = ctx.get("mainObjective", "") || "";
        const subsRaw = ctx.get("subObjectives", []);
        const subObjs = Array.isArray(subsRaw) ? subsRaw : [];
        const design = ctx.get("design", {}) || {};
        const interventions = ctx.get("interventions", []) || [];

        const prompt = `
Bạn là chuyên gia phương pháp và báo cáo RCT. Hãy **đánh giá nhóm biến "${BUCKETS[key].title}"**
về các khía cạnh:
- Phù hợp với PICO và mục tiêu (đặc biệt nhóm này).
- Đầy đủ so với khuyến cáo quốc tế (CONSORT, SPIRIT, guideline chuyên ngành).
- Có biến nào trùng lặp, không cần thiết hoặc khó đo trên thực tế?
- Gợi ý bổ sung / chỉnh sửa cụ thể.

ĐỊNH DẠNG TRẢ LỜI (không JSON):
1) Tóm tắt chung (2–4 câu).
2) Điểm mạnh (gạch đầu dòng).
3) Hạn chế / rủi ro (gạch đầu dòng).
4) Đề xuất chỉnh sửa / bổ sung (gạch đầu dòng).
5) (Tuỳ chọn) Gợi ý tài liệu tham khảo CÓ THẬT (tối đa 5 dòng, dạng: Tác giả. Tiêu đề. Tạp chí. Năm. DOI/PMID/URL).
   KHÔNG bịa nguồn; nếu không có nguồn phù hợp, ghi chính xác câu:
   "Không tìm thấy nguồn phù hợp để trích dẫn."

Ngữ cảnh:
PICO:
- P: ${pico.p || "(chưa có)"}
- I: ${pico.i || "(chưa có)"}
- C: ${pico.c || "(chưa có)"}
- O: ${pico.o || "(chưa có)"}

Mục tiêu chính:
${mainObj || "(chưa có)"}

Các mục tiêu phụ:
${subObjs.length ? subObjs.map((s, i) => (i + 1) + ". " + s).join("\n") : "(chưa có)"}

Nhóm biến đang đánh giá (${BUCKETS[key].title}) – JSON:
${JSON.stringify(groupVars, null, 2).slice(0, 4000)}

Thiết kế nghiên cứu (rút gọn):
${jsonSafe(design)}

Can thiệp (rút gọn):
${jsonSafe(interventions)}
`.trim();

        const fb = await callAI("step10.evaluate", prompt, ctx);
        evalText.textContent = String(fb || "Không nhận được phản hồi.").trim();
        evalWrap.classList.remove("hidden");
        ctx.toast("Đã nhận đánh giá nhóm biến.");
      } catch (e) {
        console.error(e);
        ctx.toast("Lỗi khi gọi GPT đánh giá nhóm biến.");
      } finally {
        toggleBusy(evalBtn, false, "GPT đánh giá nhóm");
      }
    });
  });

  // ===== Nút Lưu toàn bộ =====
  saveBtn.addEventListener("click", () => {
    ctx.save("variablesByGroup", variablesByGroup);
    ctx.toast("Đã lưu toàn bộ nhóm biến.");
  });

  // ========== Helpers: state & UI ==========

  function normalizeVariablesByGroup(raw) {
    const base = {};
    Object.keys(BUCKETS).forEach((k) => (base[k] = []));
    if (!raw || typeof raw !== "object") return base;

    Object.keys(BUCKETS).forEach((k) => {
      const arr = Array.isArray(raw[k]) ? raw[k] : [];
      base[k] = arr.map(normVar).filter((v) => v.name);
    });
    return base;
  }

  function normVar(v) {
    if (!v || typeof v !== "object") {
      const s = (v ?? "").toString().trim();
      return s ? { name: s } : { name: "" };
    }
    return {
      name: (v.name ?? "").toString().trim(),
      timepoint: cleanStr(v.timepoint),
      definition: cleanStr(v.definition),
      measurement: cleanStr(v.measurement),
      unit: cleanStr(v.unit),
      note: cleanStr(v.note)
    };
  }

  function cleanStr(x) {
    const s = (x ?? "").toString().trim();
    return s || undefined;
  }

  function viewVar(v) {
    return {
      name: v.name,
      timepoint: v.timepoint,
      definition: v.definition,
      measurement: v.measurement,
      unit: v.unit,
      note: v.note
    };
  }

  function renderGroupList(bucketKey, listEl) {
    const arr = variablesByGroup[bucketKey] || [];
    listEl.innerHTML = "";
    if (!arr.length) {
      listEl.innerHTML = `<div class="muted">Chưa có biến nào trong nhóm này.</div>`;
      return;
    }
    arr.forEach((v, idx) => {
      const row = document.createElement("div");
      row.className = "var-item";
      row.innerHTML = `
        <div class="var-item-main">
          <span class="var-item-index">${idx + 1}.</span>
          <span class="var-item-name">${escapeHtml(v.name)}</span>
        </div>
        <div class="var-item-meta">
          ${v.timepoint ? `<span>Thời điểm: ${escapeHtml(v.timepoint)}</span>` : ""}
          ${v.unit ? `<span>Đơn vị: ${escapeHtml(v.unit)}</span>` : ""}
        </div>
        ${
          v.definition || v.measurement || v.note
            ? `<div class="var-item-detail">
                 ${
                   v.definition
                     ? `<div><strong>Định nghĩa:</strong> ${escapeHtml(v.definition)}</div>`
                     : ""
                 }
                 ${
                   v.measurement
                     ? `<div><strong>Đo lường:</strong> ${escapeHtml(v.measurement)}</div>`
                     : ""
                 }
                 ${v.note ? `<div><strong>Ghi chú:</strong> ${escapeHtml(v.note)}</div>` : ""}
               </div>`
            : ""
        }
        <div class="var-item-actions">
          <button class="btn btn-ghost" type="button" title="Xoá biến này">Xoá</button>
        </div>
      `;
      const delBtn = row.querySelector(".var-item-actions button");
      delBtn.addEventListener("click", () => {
        variablesByGroup[bucketKey].splice(idx, 1);
        renderGroupList(bucketKey, listEl);
      });
      listEl.appendChild(row);
    });
  }

  // ========== Helpers: GPT & tiện ích ==========
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === "function") {
      try {
        const r = await ctx_.callStepGPT(bindingKey, prompt);
        return String(r ?? "");
      } catch (e) {
        console.warn("callStepGPT error, fallback callGPT:", e);
        if (typeof ctx_.callGPT === "function") {
          const r2 = await ctx_.callGPT(prompt);
          return String(r2 ?? "");
        }
        throw e;
      }
    }
    if (typeof ctx_.callGPT === "function") {
      const r = await ctx_.callGPT(prompt);
      return String(r ?? "");
    }
    throw new Error("Chưa cấu hình GPT cho step10.");
  }

  function toggleBusy(btn, busy, labelWhenDone) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset.prev = btn.textContent || "";
      btn.textContent = "Đang xử lý...";
    } else {
      btn.disabled = false;
      btn.textContent = labelWhenDone || btn.dataset.prev || "";
    }
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
}
