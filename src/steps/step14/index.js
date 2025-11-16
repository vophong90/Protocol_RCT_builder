// src/steps/step14/index.js
// Step 14 – Kiểm tra logic tổng thể
// - Đọc PICO, Câu hỏi, Mục tiêu, Thiết kế/nhánh can thiệp, Biến, Kế hoạch phân tích, Đạo đức
// - Gửi prompt chuẩn cho GPT qua binding "step14.logic"
// - Hiển thị kết quả, cho phép lưu / sao chép / xuất JSON

export const id = 14;
export const title = "Kiểm tra logic tổng thể";
export const subtitle =
  "Đối chiếu tính nhất quán giữa PICO, câu hỏi, mục tiêu, thiết kế, biến, kế hoạch phân tích và phần đạo đức.";
export const css = "./public/css/steps/step14.css";

export async function mount(rootEl, ctx) {
  // Scope riêng cho step14
  rootEl.closest(".step")?.setAttribute("data-scope", "step14");

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Kiểm tra logic tổng thể</h3>
      <div class="card-subtitle">
        Đối chiếu tính nhất quán giữa PICO, câu hỏi nghiên cứu, mục tiêu, thiết kế/nhánh can thiệp,
        biến đã chọn, kế hoạch phân tích và phần đạo đức.
      </div>
    </div>

    <div class="card-body lc-layout">
      <section class="lc-context card-nested">
        <div class="lc-context-title">
          <strong>Bối cảnh (tự động tạo từ các bước)</strong>
        </div>
        <pre id="logic-context" class="lc-context-pre"></pre>
      </section>

      <section class="lc-main">
        <div class="lc-actions">
          <button id="logic-run"   type="button" class="btn btn-primary">GPT kiểm tra logic</button>
          <button id="logic-copy"  type="button" class="btn btn-secondary">Sao chép</button>
          <button id="logic-export" type="button" class="btn btn-secondary">Xuất JSON</button>
        </div>

        <label class="lc-result">
          <div class="lc-result-label">
            <strong>Kết quả kiểm tra logic</strong>
          </div>
          <textarea
            id="logic-fb"
            rows="18"
            placeholder="Kết quả GPT sẽ hiển thị ở đây: các mâu thuẫn, thiếu sót và đề xuất chỉnh sửa cụ thể..."></textarea>
        </label>
      </section>
    </div>

    <div class="card-footer lc-footer">
      <button id="logic-save" type="button" class="btn btn-primary">
        Lưu báo cáo kiểm tra
      </button>
    </div>
  `.trim();

  // --------- Lấy dữ liệu bối cảnh từ state / DOM ---------
  const pico       = ctx.get("pico", {}) || {};
  const rq         = ctx.get("researchQuestion", "") || "";
  const objective  = ctx.get("mainObjective", "") || "";
  const design     = ctx.get("design", {}) || {};
  const arms       = Array.isArray(ctx.get("interventions", []))
    ? ctx.get("interventions", [])
    : [];

  const numArmsLS  =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("num-arms") || ""
      : "";
  const numArms =
    arms.length > 0 ? String(arms.length) : numArmsLS || "Không xác định";

  // Biến đã chọn (step 10)
  const selected = normalizeSelected(ctx.get("selectedVariables", {}));

  // Kế hoạch phân tích (Step 12) – ưu tiên state mới analysisPlan.mainText
  const analysisPlan = ctx.get("analysisPlan", {}) || {};
  const analysisDom  =
    document.getElementById("an-main") ||
    document.getElementById("analysis-desc");
  const analysis =
    (analysisDom?.value ??
      analysisPlan.mainText ??
      ctx.get("analysis", "") ??
      ""
    ).toString().trim();

  // Đạo đức (Step 13)
  const ethicsDom = document.getElementById("ethics-desc");
  const ethics =
    (ethicsDom?.value ?? ctx.get("ethics", "") ?? "").toString().trim();

  // --------- DOM refs ----------
  const ctxEl     = rootEl.querySelector("#logic-context");
  const runBtn    = rootEl.querySelector("#logic-run");
  const saveBtn   = rootEl.querySelector("#logic-save");
  const copyBtn   = rootEl.querySelector("#logic-copy");
  const exportBtn = rootEl.querySelector("#logic-export");
  const fbEl      = rootEl.querySelector("#logic-fb");

  // Hiển thị bối cảnh tóm tắt
  ctxEl.textContent = buildContextSummary();

  // Nạp báo cáo đã lưu (nếu có)
  const savedReport = ctx.get("logicCheck", "");
  if (savedReport) fbEl.value = savedReport;

  // --------- Events ----------
  runBtn.addEventListener("click", onRun);
  saveBtn.addEventListener("click", onSave);
  copyBtn.addEventListener("click", onCopy);
  exportBtn.addEventListener("click", onExport);

  // =================== Handlers ===================
  async function onRun() {
    const prompt = buildPrompt();
    try {
      toggleBusy(runBtn, true, "Đang kiểm tra...");
      ctx.toast("Đang kiểm tra logic tổng thể...");
      const res = await callAI("step14.logic", prompt, ctx);
      const text = (res || "").toString().trim();
      fbEl.value =
        text ||
        "GPT không trả về nội dung. Hãy thử rút gọn bối cảnh hoặc kiểm tra lại cấu hình GPT.";
      ctx.toast("Đã nhận kết quả kiểm tra logic.");
    } catch (e) {
      console.error(e);
      ctx.toast("Lỗi khi gọi GPT để kiểm tra logic.");
    } finally {
      toggleBusy(runBtn, false, "GPT kiểm tra logic");
    }
  }

  function onSave() {
    const text = (fbEl.value || "").trim();
    ctx.save("logicCheck", text);
    ctx.toast("Đã lưu báo cáo kiểm tra logic.");
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(fbEl.value || "");
      ctx.toast("Đã sao chép vào clipboard.");
    } catch {
      ctx.toast("Sao chép không thành công.");
    }
  }

  function onExport() {
    const payload = {
      context: {
        pico,
        researchQuestion: rq,
        mainObjective: objective,
        design,
        interventions: arms,
        numArms,
        selectedVariables: summarizeSelected(selected),
        analysis,
        ethics,
      },
      report: (fbEl.value || "").trim(),
      generated_at: new Date().toISOString(),
    };
    ctx.downloadJSON("logic_check_report.json", payload);
  }

  // =================== Builders ===================
  function buildContextSummary() {
    const lines = [];

    lines.push(`PICO:
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}`);

    lines.push("");
    lines.push(`Câu hỏi nghiên cứu: ${rq || "(chưa nhập)"}`);
    lines.push(`Mục tiêu chính: ${objective || "(chưa nhập)"}`);

    const armStr = arms
      .map((x, i) => `Nhánh ${i + 1}: ${armName(x)}`)
      .join(" | ");
    lines.push(`Thiết kế (tóm tắt): ${jsonSafe(design)}`);
    lines.push(`Số nhóm can thiệp: ${numArms}`);
    lines.push(`Can thiệp: ${armStr || "(chưa nhập)"}`);

    lines.push("");
    lines.push("Biến đã chọn:");
    const sum = summarizeSelected(selected);
    Object.entries(sum).forEach(([role, arr]) => {
      lines.push(`- ${roleLabel(role)} (${arr.length}): ${arr.join(", ") || "—"}`);
    });

    lines.push("");
    lines.push(`Kế hoạch phân tích (rút gọn): ${brief(analysis)}`);
    lines.push(`Đạo đức (rút gọn): ${brief(ethics)}`);
    return lines.join("\n");
  }

  function buildPrompt() {
    const variableList = Object.entries(selected)
      .flatMap(([role, arr]) =>
        arr.map((v) => `${v.name} (${roleLabel(role)})`),
      )
      .join(", ");

    return `
Bạn là chuyên gia đánh giá đề cương thử nghiệm lâm sàng ngẫu nhiên (RCT). Hãy kiểm tra **tính nhất quán và logic** giữa các phần của đề cương dưới đây.

THÔNG TIN ĐẦU VÀO
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}
- Câu hỏi nghiên cứu: ${rq || ""}
- Mục tiêu nghiên cứu (chính): ${objective || ""}
- Thiết kế (tóm tắt): ${jsonSafe(design)}
- Số nhóm can thiệp: ${numArms}
- Danh sách nhánh: ${
      arms.length
        ? arms.map((x, i) => `Nhánh ${i + 1}: ${armName(x)}`).join(" | ")
        : "(chưa nhập)"
    }
- Biến đã chọn: ${variableList || "(chưa chọn biến ở Step 10)"}

TÓM TẮT NỘI DUNG
- Kế hoạch phân tích (Step 12, rút gọn):
${analysis || "(chưa nhập)"}

- Phần đạo đức nghiên cứu (Step 13, rút gọn):
${ethics || "(chưa nhập)"}

YÊU CẦU TRẢ LỜI
1) Liệt kê những điểm **mâu thuẫn hoặc không khớp** giữa:
   - PICO ↔ Câu hỏi ↔ Mục tiêu
   - Thiết kế/nhánh can thiệp ↔ Mục tiêu ↔ Biến kết cục
   - Kế hoạch phân tích ↔ Biến & thiết kế
   - Phần đạo đức ↔ Thiết kế & can thiệp
   Mỗi mâu thuẫn nêu rõ: (a) phần liên quan, (b) vì sao chưa hợp lý.

2) Chỉ ra những **phần còn thiếu hoặc quá mơ hồ** (ví dụ: xử lý số liệu thiếu, phân tích dưới nhóm, quản lý AE/SAE...).

3) Đề xuất **các chỉnh sửa cụ thể** (gạch đầu dòng), gợi ý nên sửa ở đâu
   (PICO, câu hỏi, mục tiêu, thiết kế, biến, kế hoạch phân tích, đạo đức).

4) Đưa ra **đánh giá tổng thể**:
   - Mức rủi ro logic: thấp / vừa / cao (giải thích ngắn gọn).
   - 3 việc quan trọng nhất cần làm ngay (Next actions 1–3).

Trả lời bằng tiếng Việt, rõ ràng, cấu trúc thành các mục và gạch đầu dòng dễ theo dõi. Không bịa số liệu nghiên cứu.
`.trim();
  }
}

// =================== Helpers ===================

function normalizeSelected(sel) {
  const roles = [
    "primary",
    "secondary",
    "baseline",
    "confounder",
    "mediator",
    "moderator",
    "safety",
  ];
  const out = {};
  roles.forEach((r) => {
    out[r] = Array.isArray(sel?.[r])
      ? sel[r]
          .map((v) => ({ name: String(v?.name || "").trim() }))
          .filter((x) => x.name)
      : [];
  });
  return out;
}

function summarizeSelected(sel) {
  const obj = {};
  Object.keys(sel).forEach((k) => {
    obj[k] = (sel[k] || []).map((v) => v.name).sort(alpha);
  });
  return obj;
}

function roleLabel(g) {
  switch ((g || "").toLowerCase()) {
    case "primary":
      return "Kết cục chính";
    case "secondary":
      return "Kết cục phụ";
    case "baseline":
      return "Biến nền";
    case "confounder":
      return "Nhiễu";
    case "mediator":
      return "Trung gian";
    case "moderator":
      return "Điều biến";
    case "safety":
      return "An toàn";
    default:
      return g;
  }
}

function armName(x) {
  if (typeof x === "string") return x;
  const n = x?.name || x?.label || "";
  return String(n || "").trim() || "Arm";
}

function alpha(a, b) {
  a = (typeof a === "object" ? a?.name : a) ?? "";
  b = (typeof b === "object" ? b?.name : b) ?? "";
  a = a.toString().toLowerCase();
  b = b.toString().toLowerCase();
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function brief(s, n = 200) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t || "—";
}

function jsonSafe(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj || "");
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

// Gọi GPT qua binding; fallback callGPT nếu chưa cấu hình binding
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
  throw new Error("Chưa cấu hình GPT cho step14.");
}
