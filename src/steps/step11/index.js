// src/steps/step11_data_collection.js
// Step 11 – Quy trình thu thập dữ liệu (narrative + bảng tóm tắt từ Step 10)
//
// - Đọc biến đã khai báo ở Step 10: ctx.get('step10Vars')
// - Tự dựng bảng tóm tắt "thời điểm / biến được thu thập (theo nhóm)" – chỉ đọc, không chỉnh ở đây
// - Textarea để viết đoạn văn mô tả quy trình thu thập dữ liệu cho đề cương
// - GPT gợi ý đoạn mô tả & GPT đánh giá đoạn mô tả
// - Lưu state vào 'dataCollectionNarrative'

export const id = 11;
export const title = "Quy trình thu thập dữ liệu";
export const subtitle =
  "Tóm tắt lịch thu thập từ các biến đã khai báo (Step 10) và viết đoạn mô tả quy trình thu thập dữ liệu theo chuẩn RCT.";
export const css = "./public/css/steps/step11.css";

export async function mount(rootEl, ctx) {
  // Gắn scope CSS riêng cho step11
  rootEl.closest(".step")?.setAttribute("data-scope", "step11");

  // Lấy narrative đã lưu (nếu có)
  const saved = ctx.get("dataCollectionNarrative", {}) || {};
  const initialText = typeof saved.text === "string" ? saved.text : "";

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Quy trình thu thập dữ liệu</h3>
      <div class="card-subtitle">
        Dựa trên biến số và thời điểm thu thập ở <strong>Step 10</strong>, hãy mô tả rõ ràng quy trình thu thập dữ liệu, lịch thăm khám, ai thu thập và tại thời điểm nào.
      </div>
    </div>

    <div class="card-body">
      <p class="muted">
        Phần này tương ứng với mục <em>Data collection methods and schedule of assessments</em> trong đề cương RCT chuẩn (SPIRIT/CONSORT):<br/>
        – Ai thu thập dữ liệu, ở đâu, bằng công cụ gì;<br/>
        – Lịch thăm khám (screening, baseline, follow-up), các đánh giá thực hiện ở từng lần;<br/>
        – Cách kiểm soát chất lượng dữ liệu (huấn luyện, chuẩn hóa, kiểm tra, nhập liệu...).
      </p>
    </div>

    <div class="card-body dc-summary-card">
      <h4 class="dc-section-title">Tóm tắt lịch thu thập (tự động từ Step 10, chỉ đọc)</h4>
      <p class="muted dc-summary-hint">
        Dựa trên trường <strong>“Thời điểm thu thập”</strong> đã khai báo cho từng biến ở Step 10, hệ thống gom lại theo mốc. 
        Nếu muốn chỉnh sửa lịch, hãy quay lại Step 10 cập nhật thời điểm thu thập của biến.
      </p>
      <div id="dc-summary"></div>
    </div>

    <div class="card-body">
      <label class="field-label" for="dc-text">
        Đoạn mô tả quy trình thu thập dữ liệu
        <span class="muted" style="font-weight:400;">
          (viết dạng văn bản hoàn chỉnh để chép vào đề cương: mô tả ai thu thập, khi nào, ở đâu, làm những đánh giá gì tại mỗi lần thăm khám...)
        </span>
      </label>
      <textarea id="dc-text" rows="10" placeholder="Ví dụ: 
Người bệnh sau khi đủ tiêu chuẩn sẽ được mời tham gia nghiên cứu và thực hiện đánh giá ban đầu tại thời điểm Baseline (ngày 0)..."></textarea>

      <div class="btn-row dc-btn-row">
        <button id="dc-gpt-suggest" type="button" class="btn btn-primary">
          GPT gợi ý mô tả
        </button>
        <button id="dc-gpt-eval" type="button" class="btn btn-secondary">
          GPT đánh giá mô tả
        </button>
      </div>
    </div>

    <div class="card-footer">
      <button id="dc-save" type="button" class="btn btn-primary">Lưu mô tả quy trình</button>
    </div>
  `.trim();

  // ===== DOM refs =====
  const summaryEl = rootEl.querySelector("#dc-summary");
  const textEl = rootEl.querySelector("#dc-text");
  const btnSuggest = rootEl.querySelector("#dc-gpt-suggest");
  const btnEval = rootEl.querySelector("#dc-gpt-eval");
  const btnSave = rootEl.querySelector("#dc-save");

  // Gán giá trị đã lưu
  textEl.value = initialText;

  // ===== Build & render summary from Step 10 =====
  const step10Vars = ctx.get("step10Vars", {}) || {};
  const summary = buildVisitSummary(step10Vars);
  renderSummary(summaryEl, summary);

  // ===== Events =====
  btnSave.addEventListener("click", () => {
    const text = (textEl.value || "").trim();
    ctx.save("dataCollectionNarrative", { text });
    toast(ctx, "Đã lưu mô tả quy trình thu thập dữ liệu (Step 11).");
  });

  btnSuggest.addEventListener("click", () =>
    onSuggest(ctx, textEl, summary)
  );

  btnEval.addEventListener("click", () =>
    onEvaluate(ctx, textEl, summary)
  );
}

/* ===================== SUMMARY FROM STEP 10 ===================== */

/**
 * Từ step10Vars:
 * {
 *   primary: [ {name, time, ...}, ... ],
 *   baseline: [ ... ],
 *   ...
 * }
 * → gom thành mảng các mốc:
 * [
 *   {
 *     label: "Baseline, tuần 4",
 *     groups: {
 *       primary: ["VAS đau", "WOMAC"],
 *       baseline: ["Tuổi", "Giới"],
 *       ...
 *     }
 *   },
 *   ...
 * ]
 */
function buildVisitSummary(step10Vars) {
  const GROUP_ORDER = ["primary", "secondary", "baseline", "confounder", "safety", "exploratory"];
  const timeMap = new Map(); // label → { groupKey: [varNames] }

  if (!step10Vars || typeof step10Vars !== "object") return [];

  Object.entries(step10Vars).forEach(([groupKey, arr]) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((v) => {
      const name = String(v?.name || "").trim();
      if (!name) return;

      let timeStr = String(v?.time || "").trim();
      if (!timeStr) {
        timeStr = "Chưa xác định rõ thời điểm";
      }

      // Tách nhiều mốc: ngăn bởi , ; /
      let labels = timeStr
        .split(/[,;/]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (!labels.length) {
        labels = ["Chưa xác định rõ thời điểm"];
      }

      labels.forEach((label) => {
        if (!timeMap.has(label)) timeMap.set(label, {});
        const bucket = timeMap.get(label);
        if (!bucket[groupKey]) bucket[groupKey] = [];
        bucket[groupKey].push(name);
      });
    });
  });

  // Chuyển thành mảng để render; có thể sort theo label
  const rows = Array.from(timeMap.entries()).map(([label, groups]) => ({
    label,
    groups,
  }));

  // Sắp xếp: Baseline/Screening trước, còn lại theo alphabet
  rows.sort((a, b) => {
    const score = (label) => {
      const l = label.toLowerCase();
      if (l.includes("screen") || l.includes("sàng lọc") || l.includes("sơ tuyển")) return 0;
      if (l.includes("baseline") || l.includes("ban đầu") || l.includes("ngày 0")) return 1;
      return 2;
    };
    const sa = score(a.label);
    const sb = score(b.label);
    if (sa !== sb) return sa - sb;
    return a.label.localeCompare(b.label, "vi");
  });

  // Trong mỗi bucket, sort group theo nhóm chuẩn, còn lại phía sau
  rows.forEach((row) => {
    const ordered = {};
    GROUP_ORDER.forEach((g) => {
      if (row.groups[g]) ordered[g] = dedupe(row.groups[g]);
    });
    Object.keys(row.groups).forEach((g) => {
      if (!ordered[g]) ordered[g] = dedupe(row.groups[g]);
    });
    row.groups = ordered;
  });

  return rows;
}

function renderSummary(container, rows) {
  container.innerHTML = "";

  if (!rows || !rows.length) {
    container.innerHTML = `
      <div class="muted">
        Chưa có thông tin thời điểm thu thập từ Step 10. 
        Hãy quay lại Step 10 và điền trường <strong>"Thời điểm thu thập"</strong> cho các biến để xem tóm tắt tại đây.
      </div>
    `.trim();
    return;
  }

  const table = document.createElement("table");
  table.className = "dc-summary-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th style="width: 28%;">Thời điểm / Mốc</th>
      <th>Biến được thu thập (theo nhóm)</th>
    </tr>
  `.trim();
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const tdLabel = document.createElement("td");
    tdLabel.className = "dc-summary-label";
    tdLabel.textContent = row.label;
    tr.appendChild(tdLabel);

    const tdVars = document.createElement("td");
    tdVars.className = "dc-summary-vars";

    const groups = row.groups || {};
    const entries = Object.entries(groups);

    if (!entries.length) {
      tdVars.innerHTML = `<span class="muted">Chưa có biến được gán cho mốc này.</span>`;
    } else {
      entries.forEach(([gKey, vars]) => {
        if (!vars || !vars.length) return;
        const wrap = document.createElement("div");
        wrap.className = "dc-summary-group";

        const lbl = document.createElement("div");
        lbl.className = "dc-summary-group-label";
        lbl.textContent = groupLabel(gKey) + ":";
        wrap.appendChild(lbl);

        const list = document.createElement("div");
        list.className = "dc-summary-group-vars";
        list.textContent = vars.join("; ");
        wrap.appendChild(list);

        tdVars.appendChild(wrap);
      });
    }

    tr.appendChild(tdVars);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/* ===================== GPT HANDLERS ===================== */

async function onSuggest(ctx, textEl, summaryRows) {
  try {
    toggleBusy(textEl, true); // dùng tạm: disable textarea trong lúc chờ
    const pico = ctx.get("pico", {}) || {};
    const design = ctx.get("design", {}) || {};
    const interventions = ctx.get("interventions", []) || [];
    const mainObj = (ctx.get("mainObjective", "") || "").trim();
    const subs = Array.isArray(ctx.get("subObjectives", []))
      ? ctx
          .get("subObjectives", [])
          .map((s) => String(s || "").trim())
          .filter(Boolean)
      : [];

    const summaryText = summaryToPlain(summaryRows);

    const prompt = `
Bạn là chuyên gia thiết kế RCT, cần viết mục "Quy trình thu thập dữ liệu" cho đề cương nghiên cứu.

YÊU CẦU:
- Viết bằng tiếng Việt, văn phong học thuật, rõ ràng, dễ copy vào đề cương.
- Cấu trúc tối thiểu:
  1. Đoạn mở đầu (1–2 đoạn): mô tả chung cách tuyển chọn, thời điểm baseline, lịch theo dõi tổng quát, địa điểm & người phụ trách thu thập dữ liệu.
  2. Đoạn mô tả chi tiết theo từng mốc: với mỗi thời điểm (Screening, Baseline, tuần X, tháng Y...), nêu rõ:
     - Bệnh nhân được đánh giá gì (các biến/ thang điểm/ xét nghiệm),
     - Ai thực hiện (bác sĩ nghiên cứu, điều dưỡng được huấn luyện, evaluator mù can thiệp...),
     - Hình thức thu thập (khám trực tiếp, xét nghiệm tại labo, gọi điện thoại...),
     - Nếu phù hợp, nêu "cửa sổ thời gian" (ví dụ: tuần 4 ± 3 ngày).
  3. Đoạn về kiểm soát chất lượng dữ liệu (training, quy trình chuẩn hóa, nhập liệu, kiểm tra logic/range, bảo mật và lưu trữ).

- Không bịa thêm biến mới; chỉ sử dụng các biến và mốc thời gian đã tóm tắt.
- Có thể gợi ý chung về thực hành tốt (Good Clinical Practice), nhưng không được bịa DOI/PMID/URL cụ thể.

THÔNG TIN BỐI CẢNH:

PICO:
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

Mục tiêu chính: ${mainObj || "(chưa nhập)"}
Mục tiêu phụ:
${subs.length ? subs.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(chưa nhập)"}

Thiết kế nghiên cứu (tóm tắt): ${jsonSafe(design)}
Can thiệp (tóm tắt): ${jsonSafe(interventions)}

TÓM TẮT LỊCH THU THẬP (từ Step 10):
${summaryText || "(chưa có thông tin rõ về lịch thu thập; bạn có thể gợi ý một lịch hợp lý dựa trên RCT điển hình cho lĩnh vực tương ứng)"}
`.trim();

    toast(ctx, "Đang để GPT gợi ý đoạn mô tả quy trình thu thập dữ liệu...");
    const raw = await callAI("step11.suggest", prompt, ctx);
    const text = String(raw || "").trim();
    textEl.value = text || "GPT không trả về nội dung.";
    toast(ctx, "Đã chèn gợi ý đoạn mô tả quy trình thu thập dữ liệu.");
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT gợi ý đoạn mô tả.");
  } finally {
    toggleBusy(textEl, false);
  }
}

async function onEvaluate(ctx, textEl, summaryRows) {
  const current = (textEl.value || "").trim();
  if (!current) {
    toast(ctx, "Chưa có đoạn mô tả nào để đánh giá.");
    return;
  }

  try {
    toggleBusy(textEl, true);
    const pico = ctx.get("pico", {}) || {};
    const design = ctx.get("design", {}) || {};
    const interventions = ctx.get("interventions", []) || [];
    const mainObj = (ctx.get("mainObjective", "") || "").trim();
    const subs = Array.isArray(ctx.get("subObjectives", []))
      ? ctx
          .get("subObjectives", [])
          .map((s) => String(s || "").trim())
          .filter(Boolean)
      : [];

    const summaryText = summaryToPlain(summaryRows);

    const prompt = `
Bạn là phản biện phương pháp của một đề cương RCT. Hãy ĐÁNH GIÁ đoạn mô tả "Quy trình thu thập dữ liệu" dưới đây.

YÊU CẦU:
1. Nhận xét tổng quan (5–10 câu) về:
   - Tính rõ ràng, mạch lạc
   - Mức độ đầy đủ so với thông tin về biến và lịch thu thập
   - Tính phù hợp với PICO, thiết kế và mục tiêu
2. Chỉ ra cụ thể:
   - Những điểm còn thiếu (ví dụ: thiếu mô tả ai thu thập, thiếu cửa sổ thời gian, thiếu cách xử lý mất theo dõi...)
   - Chỗ mơ hồ, khó hiểu, có thể gây sai lệch
3. Đề xuất chỉnh sửa:
   - Gợi ý những nội dung nên bổ sung/ rút gọn/ sắp xếp lại
   - Có thể đưa ví dụ 1–2 câu sửa mẫu
4. Nếu có thể, liên hệ ngắn gọn với khuyến cáo của SPIRIT/CONSORT (nhưng KHÔNG bịa DOI/PMID/URL cụ thể).

THÔNG TIN BỐI CẢNH:

PICO:
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

Mục tiêu chính: ${mainObj || "(chưa nhập)"}
Mục tiêu phụ:
${subs.length ? subs.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(chưa nhập)"}

Thiết kế nghiên cứu (tóm tắt): ${jsonSafe(design)}
Can thiệp (tóm tắt): ${jsonSafe(interventions)}

TÓM TẮT LỊCH THU THẬP (từ Step 10):
${summaryText || "(chưa có tóm tắt rõ, có thể nhận xét ở mức tổng quát)"}

ĐOẠN MÔ TẢ CẦN ĐÁNH GIÁ:
----------------------------------------
${current}
----------------------------------------
`.trim();

    toast(ctx, "Đang để GPT đánh giá đoạn mô tả quy trình thu thập...");
    const raw = await callAI("step11.evaluate", prompt, ctx);
    const text = String(raw || "").trim() || "GPT không trả về nội dung.";
    showFeedbackDialog(text);
  } catch (e) {
    console.error(e);
    toast(ctx, "Lỗi khi GPT đánh giá đoạn mô tả.");
  } finally {
    toggleBusy(textEl, false);
  }
}

/* ===================== HELPERS ===================== */

function groupLabel(g) {
  switch ((g || "").toLowerCase()) {
    case "primary":
      return "Kết cục chính";
    case "secondary":
      return "Kết cục phụ";
    case "baseline":
      return "Biến nền / mô tả mẫu";
    case "confounder":
      return "Biến nhiễu / điều chỉnh";
    case "mediator":
      return "Trung gian";
    case "moderator":
      return "Điều biến";
    case "safety":
      return "Biến an toàn / tác dụng bất lợi";
    case "exploratory":
      return "Biến thăm dò / khám phá";
    default:
      return g || "Nhóm khác";
  }
}

function dedupe(arr) {
  const seen = new Set();
  const out = [];
  (arr || []).forEach((x) => {
    if (seen.has(x)) return;
    seen.add(x);
    out.push(x);
  });
  return out;
}

function summaryToPlain(rows) {
  if (!rows || !rows.length) return "";
  const lines = [];
  rows.forEach((row) => {
    lines.push(`- Mốc: ${row.label}`);
    const groups = row.groups || {};
    Object.entries(groups).forEach(([gKey, vars]) => {
      if (!vars || !vars.length) return;
      lines.push(`  • ${groupLabel(gKey)}: ${vars.join("; ")}`);
    });
  });
  return lines.join("\n");
}

function toast(ctx, msg) {
  if (ctx && typeof ctx.toast === "function") ctx.toast(msg);
  else console.log("[toast]", msg);
}

/**
 * Dùng tạm để disable/enable textarea trong lúc chờ GPT
 */
function toggleBusy(el, busy) {
  if (!el) return;
  if (busy) {
    el.dataset.prevDisabled = el.disabled ? "1" : "0";
    el.disabled = true;
  } else {
    if (el.dataset.prevDisabled === "0") el.disabled = false;
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
  throw new Error("Chưa cấu hình GPT cho step11.");
}

function jsonSafe(x) {
  try {
    return JSON.stringify(x || {}, null, 2).slice(0, 800);
  } catch {
    return String(x || "");
  }
}

function showFeedbackDialog(text) {
  const id = "dc11-fb-dialog";
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
      <div class="dc-fb-modal">
        <div class="dc-fb-header">
          <div class="dc-fb-title">Đánh giá đoạn mô tả quy trình thu thập dữ liệu</div>
        </div>
        <div id="dc11-fb-text" class="dc-fb-body"></div>
        <div class="dc-fb-footer">
          <button id="dc11-fb-close" type="button" class="btn btn-primary">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector("#dc11-fb-close").addEventListener("click", () => dlg.remove());
  }
  dlg.querySelector("#dc11-fb-text").textContent = text;
}
