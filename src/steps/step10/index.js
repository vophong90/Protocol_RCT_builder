// src/steps/step10/index.js
// Step 10 – Biến số nghiên cứu (phiên bản không dùng CSV/kho biến)
// - Mỗi nhóm biến (primary, secondary, baseline, confounder, mediator, moderator, safety)
//   là một card riêng.
// - Mỗi card: danh sách biến + form "Thêm/Sửa biến" + GPT gợi ý + GPT đánh giá.
// - Lưu state: variables = {
//     primary:   [{ name, timepoint, definition, measurement, unit, datatype, notes }, ...],
//     secondary: [...],
//     ...
//   }

export const id = 10;
export const title = "Biến số nghiên cứu";
export const subtitle =
  "Xác định các biến theo nhóm (kết cục chính/phụ, nền, nhiễu, trung gian, điều biến, an toàn) và mô tả chi tiết từng biến.";
export const css = "./public/css/steps/step10.css";

const BUCKETS = [
  "primary",
  "secondary",
  "baseline",
  "confounder",
  "mediator",
  "moderator",
  "safety",
];

const BUCKET_META = {
  primary: {
    title: "Kết cục chính (Primary)",
    hint: "Biến kết cục chính, dùng để tính cỡ mẫu và trả lời câu hỏi nghiên cứu.",
  },
  secondary: {
    title: "Kết cục phụ (Secondary)",
    hint: "Biến kết cục phụ, bổ sung và giải thích thêm cho kết quả.",
  },
  baseline: {
    title: "Biến nền (Baseline)",
    hint: "Đặc điểm ban đầu của người tham gia, mô tả dân số và so sánh nhóm.",
  },
  confounder: {
    title: "Nhiễu (Confounder)",
    hint: "Yếu tố có thể gây nhiễu mối liên hệ giữa can thiệp và kết cục, cần điều chỉnh.",
  },
  mediator: {
    title: "Trung gian (Mediator)",
    hint: "Biến nằm trên đường dẫn cơ chế giữa can thiệp và kết cục (nếu phù hợp giả thuyết).",
  },
  moderator: {
    title: "Điều biến (Moderator)",
    hint: "Biến làm thay đổi cường độ/hướng tác động của can thiệp (nếu phù hợp giả thuyết).",
  },
  safety: {
    title: "An toàn (Safety)",
    hint: "Biến cố bất lợi, AE/SAE và các chỉ số an toàn khác.",
  },
};

export async function mount(root, ctx) {
  // Scope CSS riêng cho step 10
  const stepEl = root.closest(".step");
  stepEl?.setAttribute("data-scope", "step10");

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Biến số nghiên cứu</h3>
        <div class="card-subtitle">
          Xác định rõ các biến cho từng nhóm và mô tả chi tiết (thời điểm thu thập, định nghĩa,
          cách đo lường, đơn vị...). GPT có thể gợi ý danh mục biến và đánh giá tính đầy đủ
          theo chuẩn quốc tế (CONSORT, SPIRIT, ICH E9...).
        </div>
      </div>

      <div class="card-body var-grid">
        ${renderBucketsHTML()}
      </div>

      <div class="card-footer var-footer">
        <button id="vars-save" class="btn btn-secondary" type="button">Lưu tất cả biến</button>
      </div>
    </div>
  `.trim();

  // ---------- State ----------
  let variables = normalizeVariables(ctx.get("variables", {}));
  // Lưu trạng thái đang sửa cho mỗi bucket (index hoặc null)
  const editIndex = {};
  BUCKETS.forEach((b) => (editIndex[b] = null));

  // ---------- DOM ----------
  const saveBtn = root.querySelector("#vars-save");

  // Render lần đầu
  renderAll();

  // Gắn sự kiện cho từng bucket
  BUCKETS.forEach((bucket) => bindBucket(bucket));

  saveBtn?.addEventListener("click", () => {
    ctx.save("variables", variables);
    ctx.toast("Đã lưu tất cả biến nghiên cứu.");
  });

  // ========================= Render =========================
  function renderAll() {
    BUCKETS.forEach((bucket) => renderBucket(bucket));
  }

  function renderBucket(bucket) {
    const listEl = root.querySelector(
      `#bucket-${bucket} .bucket-list`
    );
    if (!listEl) return;

    const items = variables[bucket] || [];
    if (!items.length) {
      listEl.innerHTML = `<div class="muted">Chưa có biến nào trong nhóm này.</div>`;
      return;
    }

    listEl.innerHTML = "";
    items.forEach((v, idx) => {
      const div = document.createElement("div");
      div.className = "var-item";
      div.dataset.bucket = bucket;
      div.dataset.index = String(idx);

      const metaParts = [];
      if (v.timepoint) metaParts.push(`Thời điểm: ${v.timepoint}`);
      if (v.unit) metaParts.push(`Đơn vị: ${v.unit}`);
      if (v.datatype) metaParts.push(`Loại: ${v.datatype}`);

      const defShort = v.definition
        ? truncateOneLine(v.definition, 120)
        : "";

      div.innerHTML = `
        <div class="var-item-main">
          <div class="var-item-name">${escapeHtml(v.name || "(Chưa đặt tên)")}</div>
          ${
            metaParts.length
              ? `<div class="var-item-meta muted">${escapeHtml(
                  metaParts.join(" • ")
                )}</div>`
              : ""
          }
          ${
            defShort
              ? `<div class="var-item-def muted">Định nghĩa: ${escapeHtml(
                  defShort
                )}</div>`
              : ""
          }
        </div>
        <div class="var-item-actions">
          <button type="button" class="btn btn-ghost var-edit">Sửa</button>
          <button type="button" class="btn btn-ghost var-delete">Xoá</button>
        </div>
      `;
      listEl.appendChild(div);
    });

    // Gắn sự kiện Sửa / Xoá
    listEl.querySelectorAll(".var-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const parent = btn.closest(".var-item");
        if (!parent) return;
        const b = parent.dataset.bucket;
        const i = Number(parent.dataset.index ?? "-1");
        if (!Number.isInteger(i) || i < 0) return;
        openEditor(b, i);
      });
    });

    listEl.querySelectorAll(".var-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const parent = btn.closest(".var-item");
        if (!parent) return;
        const b = parent.dataset.bucket;
        const i = Number(parent.dataset.index ?? "-1");
        if (!Number.isInteger(i) || i < 0) return;
        variables[b] = (variables[b] || []).filter((_, idx) => idx !== i);
        editIndex[b] = null;
        closeEditor(b);
        renderBucket(b);
      });
    });
  }

  // ========================= Per-bucket binding =========================
  function bindBucket(bucket) {
    const addBtn = root.querySelector(
      `[data-bucket="${bucket}"][data-role="add"]`
    );
    const suggestBtn = root.querySelector(
      `[data-bucket="${bucket}"][data-role="gpt-suggest"]`
    );
    const evalBtn = root.querySelector(
      `[data-bucket="${bucket}"][data-role="gpt-eval"]`
    );

    const editorEl = root.querySelector(
      `#bucket-${bucket}-editor`
    );
    const saveVarBtn = root.querySelector(
      `[data-bucket="${bucket}"][data-role="editor-save"]`
    );
    const cancelVarBtn = root.querySelector(
      `[data-bucket="${bucket}"][data-role="editor-cancel"]`
    );

    const fbWrap = root.querySelector(
      `#bucket-${bucket}-feedback-wrap`
    );
    const fbBox = root.querySelector(
      `#bucket-${bucket}-feedback`
    );

    // Thêm biến mới
    addBtn?.addEventListener("click", () => {
      openEditor(bucket, null);
    });

    // Lưu biến trong editor
    saveVarBtn?.addEventListener("click", () => {
      const data = readEditor(bucket);
      if (!data.name) {
        ctx.toast("Tên biến là bắt buộc.");
        return;
      }
      const idx = editIndex[bucket];
      if (idx == null || idx < 0) {
        variables[bucket].push(data);
      } else {
        variables[bucket][idx] = data;
      }
      editIndex[bucket] = null;
      closeEditor(bucket);
      renderBucket(bucket);
    });

    // Hủy editor
    cancelVarBtn?.addEventListener("click", () => {
      editIndex[bucket] = null;
      closeEditor(bucket);
    });

    // GPT gợi ý biến cho nhóm
    suggestBtn?.addEventListener("click", async () => {
      const pico = ctx.get("pico", {}) || {};
      const mainObj = ctx.get("mainObjective", "") || "";
      const otherObjs =
        ctx.get("otherObjectives", []) ||
        ctx.get("secondaryObjectives", []) ||
        [];

      const groupVars = (variables[bucket] || []).map(viewVar);
      const allVars = {};
      BUCKETS.forEach((b) => {
        allVars[b] = (variables[b] || []).map(viewVar);
      });

      const meta = BUCKET_META[bucket] || {};
      const prompt = `
Bạn là chuyên gia thiết kế RCT và báo cáo theo CONSORT, SPIRIT và ICH E9.

Nhiệm vụ: **đề xuất danh mục biến cho nhóm "${meta.title ||
        bucket}"** trong một thử nghiệm lâm sàng ngẫu nhiên, dựa trên:
- PICO và mục tiêu nghiên cứu.
- Nhóm biến đang xét (primary / secondary / baseline / confounder / mediator / moderator / safety).
- Các biến đã có sẵn (nếu có).

Hãy:
1. Đề xuất các biến phù hợp cho nhóm này, với các trường:
   - name: tên biến rõ ràng, dễ dùng trên CRF.
   - timepoint: thời điểm/visit thu thập (baseline, tuần 4, tuần 12, follow-up...).
   - definition: định nghĩa vận hành (operational definition) đủ chi tiết để người khác hiểu và tái lập.
   - measurement: cách đo lường (thang đo, công cụ, thiết bị, cách tính điểm hoặc cách tính chỉ số).
   - unit: đơn vị đo (mm, điểm, kg, %, lần/tuần...).
   - datatype: kiểu biến (continuous, ordinal, binary, time-to-event...).
   - notes: ghi chú thêm (mã hoá, cách nhập liệu, cắt ngưỡng lâm sàng, xử lý khi thiếu dữ liệu...).

2. Đảm bảo các biến gợi ý thực sự liên quan đến:
   - Câu hỏi/mục tiêu chính của nghiên cứu.
   - Nhóm biến tương ứng (ví dụ: primary: kết cục chính; baseline: đặc điểm ban đầu; safety: biến cố bất lợi...).

3. Kết quả trả về phải là **một JSON duy nhất** với cấu trúc:
{
  "variables": [
    {
      "name": "...",
      "timepoint": "...",
      "definition": "...",
      "measurement": "...",
      "unit": "...",
      "datatype": "...",
      "notes": "..."
    },
    ...
  ],
  "note": "Giải thích ngắn gọn logic chọn biến, kèm 3–8 tài liệu tham khảo có thật (CONSORT, SPIRIT, ICH E9, GCP, hoặc các hướng dẫn liên quan) trình bày theo chuẩn AMA 11."
}

4. Không trả lời giải thích bên ngoài JSON. Toàn bộ giải thích và tài liệu tham khảo phải nằm trong trường "note".

Ngữ cảnh nghiên cứu:
- P: ${pico.p || "(chưa ghi rõ)"}
- I: ${pico.i || "(chưa ghi rõ)"}
- C: ${pico.c || "(chưa ghi rõ)"}
- O: ${pico.o || "(chưa ghi rõ)"}

Mục tiêu chính: ${mainObj || "(chưa ghi rõ)"}
Các mục tiêu khác (nếu có): ${JSON.stringify(otherObjs).slice(0, 800)}

Nhóm biến đang xét: ${bucket}

Biến đã có trong nhóm này (rút gọn):
${JSON.stringify(groupVars, null, 2).slice(0, 1200)}

Tổng quan các nhóm biến khác (tên + loại):
${JSON.stringify(allVars, null, 2).slice(0, 1200)}
      `.trim();

      ctx.toast(`Đang để GPT gợi ý biến cho nhóm "${meta.title || bucket}"...`);
      const raw = await ctx.callStepGPT("step10.suggest", prompt);
      const j = safeParse(raw);
      if (!j || typeof j !== "object" || !Array.isArray(j.variables)) {
        ctx.toast("GPT không trả về JSON hợp lệ (không có trường variables).");
        return;
      }

      const existingNames = new Set(
        (variables[bucket] || []).map((v) => (v.name || "").trim())
      );

      const newVars = j.variables
        .map((x) => normVar(x))
        .filter((v) => v.name);

      newVars.forEach((v) => {
        const key = v.name.trim();
        if (!existingNames.has(key)) {
          variables[bucket].push(v);
          existingNames.add(key);
        }
      });

      renderBucket(bucket);

      // hiển thị note + TLTK nếu có
      if (fbWrap && fbBox) {
        if (j.note) {
          fbBox.textContent = j.note;
          fbWrap.classList.remove("hidden");
        } else {
          fbBox.textContent = "";
          fbWrap.classList.add("hidden");
        }
      }

      ctx.toast("Đã chèn thêm biến được GPT gợi ý cho nhóm này.");
    });

    // GPT đánh giá nhóm biến
    evalBtn?.addEventListener("click", async () => {
      const pico = ctx.get("pico", {}) || {};
      const mainObj = ctx.get("mainObjective", "") || "";
      const otherObjs =
        ctx.get("otherObjectives", []) ||
        ctx.get("secondaryObjectives", []) ||
        [];

      const groupVars = (variables[bucket] || []).map(viewVar);
      if (!groupVars.length) {
        ctx.toast("Nhóm này chưa có biến nào để đánh giá.");
        return;
      }

      const meta = BUCKET_META[bucket] || {};
      const prompt = `
Bạn là phản biện phương pháp cho một thử nghiệm lâm sàng ngẫu nhiên (RCT), tuân theo CONSORT, SPIRIT và ICH E9.

Hãy **đánh giá nhóm biến "${meta.title || bucket}"** dưới đây, bao gồm:
1) Mức độ phù hợp của các biến với:
   - PICO
   - Mục tiêu nghiên cứu
   - Vai trò của nhóm biến (primary / secondary / baseline / confounder / mediator / moderator / safety).
2) Các biến quan trọng còn thiếu trong nhóm này (gợi ý cụ thể tên và lý do).
3) Các biến thừa, trùng lặp, khó thu thập hoặc không phù hợp (nêu rõ).
4) Đề xuất chỉnh sửa cụ thể (nên xem xét đổi tên, làm rõ định nghĩa, thêm thời điểm đo, chuẩn hoá cách đo, đơn vị, loại biến, quy tắc mã hoá...).

YÊU CẦU:
- Trả lời bằng văn xuôi, có thể dùng gạch đầu dòng.
- Tham chiếu rõ ràng đến các hướng dẫn/hướng dẫn thực hành (ví dụ CONSORT 2010, SPIRIT 2013, ICH E9, GCP...), có 3–8 tài liệu tham khảo có thật.
- Trình bày tài liệu tham khảo ở cuối dưới tiêu đề "References", chuẩn AMA 11.

Ngữ cảnh:
- P: ${pico.p || "(chưa ghi rõ)"}
- I: ${pico.i || "(chưa ghi rõ)"}
- C: ${pico.c || "(chưa ghi rõ)"}
- O: ${pico.o || "(chưa ghi rõ)"}

Mục tiêu chính: ${mainObj || "(chưa ghi rõ)"}
Các mục tiêu khác: ${JSON.stringify(otherObjs).slice(0, 800)}

Nhóm biến đang đánh giá: ${meta.title || bucket}
Danh sách biến trong nhóm (JSON rút gọn):
${JSON.stringify(groupVars, null, 2).slice(0, 3000)}
      `.trim();

      ctx.toast(
        `Đang để GPT đánh giá nhóm biến "${meta.title || bucket}"...`
      );
      const fb = await ctx.callStepGPT("step10.evaluate", prompt);
      if (fbWrap && fbBox) {
        fbBox.textContent = fb || "Không nhận được phản hồi.";
        fbWrap.classList.remove("hidden");
      } else {
        ctx.toast("Không tìm thấy vùng hiển thị feedback.");
      }
    });
  }

  // ========================= Editor helpers =========================
  function openEditor(bucket, indexOrNull) {
    const editor = root.querySelector(
      `#bucket-${bucket}-editor`
    );
    if (!editor) return;
    editIndex[bucket] =
      indexOrNull == null || indexOrNull < 0 ? null : indexOrNull;

    const v =
      indexOrNull == null || indexOrNull < 0
        ? blankVar()
        : variables[bucket][indexOrNull] || blankVar();

    // Điền dữ liệu vào form
    editor.querySelector(".field-name")      .value = v.name || "";
    editor.querySelector(".field-timepoint") .value = v.timepoint || "";
    editor.querySelector(".field-definition").value = v.definition || "";
    editor.querySelector(".field-measurement").value = v.measurement || "";
    editor.querySelector(".field-unit")      .value = v.unit || "";
    editor.querySelector(".field-datatype")  .value = v.datatype || "";
    editor.querySelector(".field-notes")     .value = v.notes || "";

    editor.classList.remove("hidden");
  }

  function closeEditor(bucket) {
    const editor = root.querySelector(
      `#bucket-${bucket}-editor`
    );
    if (!editor) return;
    editor.classList.add("hidden");
  }

  function readEditor(bucket) {
    const editor = root.querySelector(
      `#bucket-${bucket}-editor`
    );
    if (!editor) return blankVar();
    return normVar({
      name: editor.querySelector(".field-name")?.value || "",
      timepoint: editor.querySelector(".field-timepoint")?.value || "",
      definition: editor.querySelector(".field-definition")?.value || "",
      measurement: editor.querySelector(".field-measurement")?.value || "",
      unit: editor.querySelector(".field-unit")?.value || "",
      datatype: editor.querySelector(".field-datatype")?.value || "",
      notes: editor.querySelector(".field-notes")?.value || "",
    });
  }

  // ========================= Data helpers =========================
  function normalizeVariables(raw) {
    const out = {};
    BUCKETS.forEach((b) => {
      const arr = Array.isArray(raw?.[b]) ? raw[b] : [];
      out[b] = arr.map((v) => normVar(v)).filter((v) => v.name);
    });
    return out;
  }

  function blankVar() {
    return {
      name: "",
      timepoint: "",
      definition: "",
      measurement: "",
      unit: "",
      datatype: "",
      notes: "",
    };
  }

  function normVar(v) {
    if (!v || typeof v !== "object") {
      const s = (v ?? "").toString().trim();
      return s ? { ...blankVar(), name: s } : blankVar();
    }
    return {
      name: (v.name ?? "").toString().trim(),
      timepoint: cleanStr(v.timepoint),
      definition: cleanStr(v.definition),
      measurement: cleanStr(v.measurement),
      unit: cleanStr(v.unit),
      datatype: cleanStr(v.datatype),
      notes: cleanStr(v.notes),
    };
  }

  function cleanStr(x) {
    const s = (x ?? "").toString().trim();
    return s || "";
  }

  function viewVar(v) {
    return {
      name: v.name,
      timepoint: v.timepoint,
      definition: v.definition,
      measurement: v.measurement,
      unit: v.unit,
      datatype: v.datatype,
      notes: v.notes,
    };
  }

  function safeParse(s) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  function truncateOneLine(s, maxLen) {
    const str = String(s || "").replace(/\s+/g, " ").trim();
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + "…";
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

// ---------- Markup helper ----------
function renderBucketsHTML() {
  return BUCKETS.map((b) => {
    const meta = BUCKET_META[b] || { title: b, hint: "" };
    return `
      <div id="bucket-${b}" class="card var-bucket">
        <div class="card-header">
          <div class="bucket-title">${meta.title}</div>
          ${
            meta.hint
              ? `<div class="bucket-hint muted">${meta.hint}</div>`
              : ""
          }
        </div>

        <div class="card-body">
          <div class="bucket-list"></div>

          <div class="bucket-editor hidden" id="bucket-${b}-editor">
            <div class="bucket-editor-grid">
              <div class="form-group">
                <label>Tên biến <span class="required">*</span></label>
                <input type="text" class="field-name" placeholder="Ví dụ: VAS đau gối lúc nghỉ" />
              </div>
              <div class="form-group">
                <label>Thời điểm thu thập</label>
                <input type="text" class="field-timepoint" placeholder="Baseline, tuần 4, tuần 12, follow-up 6 tháng..." />
              </div>
              <div class="form-group full-span">
                <label>Định nghĩa biến (operational definition)</label>
                <textarea class="field-definition" rows="3"
                  placeholder="Mô tả cụ thể điều gì được đo, cách phân loại, ngưỡng cắt lâm sàng, cách xử lý trường hợp đặc biệt..."></textarea>
              </div>
              <div class="form-group full-span">
                <label>Cách đo lường / công cụ</label>
                <textarea class="field-measurement" rows="3"
                  placeholder="Thang đo, thiết bị, quy trình đo, ai thực hiện, số lần đo, cách tính trung bình/điểm số..."></textarea>
              </div>
              <div class="form-group">
                <label>Đơn vị</label>
                <input type="text" class="field-unit" placeholder="mm, điểm, kg, %, lần/tuần..." />
              </div>
              <div class="form-group">
                <label>Loại biến (data type)</label>
                <input type="text" class="field-datatype" placeholder="continuous, ordinal, binary, time-to-event..." />
              </div>
              <div class="form-group full-span">
                <label>Ghi chú</label>
                <textarea class="field-notes" rows="2"
                  placeholder="Mã hoá dữ liệu, quy tắc xử lý giá trị ngoại lai/thiếu, cách tổng hợp..."></textarea>
              </div>
            </div>
            <div class="bucket-editor-footer">
              <button type="button" class="btn btn-primary" data-bucket="${b}" data-role="editor-save">Lưu biến</button>
              <button type="button" class="btn btn-secondary" data-bucket="${b}" data-role="editor-cancel">Hủy</button>
            </div>
          </div>
        </div>

        <div class="card-footer bucket-footer">
          <button type="button" class="btn btn-secondary" data-bucket="${b}" data-role="add">+ Thêm biến</button>
          <button type="button" class="btn btn-primary"  data-bucket="${b}" data-role="gpt-suggest">GPT gợi ý biến</button>
          <button type="button" class="btn btn-primary"  data-bucket="${b}" data-role="gpt-eval">GPT đánh giá nhóm</button>
        </div>

        <div class="card-body bucket-feedback hidden" id="bucket-${b}-feedback-wrap">
          <div class="bucket-feedback-title">Nhận xét / tài liệu tham khảo</div>
          <div id="bucket-${b}-feedback" class="muted"></div>
        </div>
      </div>
    `;
  }).join("");
}
