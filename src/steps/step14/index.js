// src/steps/step14/index.js
// Step 14 – Kiểm tra logic tổng thể
// - Đọc bối cảnh từ state (PICO, mục tiêu, thiết kế, biến, SAP, Đạo đức)
// - GPT kiểm tra logic, trả về báo cáo vào textarea
// - Cho phép lưu + sao chép báo cáo
//
// Phụ thuộc state:
//  - pico, researchQuestion, mainObjective, subObjectives
//  - design, interventions
//  - step10Vars, dataCollection, analysisPlan, ethics

export const id = 14;
export const title = "Kiểm tra logic tổng thể";
export const subtitle =
  "Đối chiếu tính nhất quán giữa PICO, mục tiêu, thiết kế, biến số, kế hoạch phân tích và phần đạo đức.";
export const css = "./public/css/steps/step14.css";

export async function mount(rootEl, ctx) {
  // scope CSS riêng step14
  rootEl.closest(".step")?.setAttribute("data-scope", "step14");

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Kiểm tra logic tổng thể</h3>
      <div class="card-subtitle">
        Đối chiếu tính nhất quán giữa PICO, câu hỏi, mục tiêu, thiết kế/nhánh can thiệp, biến số, kế hoạch phân tích và phần đạo đức.
      </div>
    </div>

    <div class="card-body">
      <div class="muted"><strong>Tóm tắt bối cảnh:</strong></div>
      <div class="logic-context-box">
        <div id="logic-context"></div>
      </div>
    </div>

    <div class="card-body">
      <label class="logic-main-label">
        <div class="logic-main-header">Báo cáo kiểm tra logic</div>
        <textarea
          id="logic-fb"
          rows="18"
          placeholder="Kết quả GPT sẽ hiển thị ở đây. Bạn có thể chỉnh sửa rồi lưu lại để sử dụng cho đề cương."></textarea>
      </label>
    </div>

    <div class="card-footer logic-footer">
      <button id="logic-run"  type="button" class="btn btn-primary">
        GPT kiểm tra logic
      </button>
      <button id="logic-copy" type="button" class="btn btn-secondary">
        Sao chép báo cáo
      </button>
      <button id="logic-save" type="button" class="btn btn-secondary">
        Lưu báo cáo
      </button>
    </div>
  `.trim();

  // ===== Lấy bối cảnh từ state =====
  const pico           = ctx.get("pico", {}) || {};
  const rq             = ctx.get("researchQuestion", "") || "";
  const mainObjective  = (ctx.get("mainObjective", "") || "").trim();
  const subObjectives  = Array.isArray(ctx.get("subObjectives", []))
    ? ctx
        .get("subObjectives", [])
        .map((x) => String(x || "").trim())
        .filter(Boolean)
    : [];

  const design         = ctx.get("design", {}) || {};
  const interventions  = ctx.get("interventions", []) || [];

  const varsState      = ctx.get("step10Vars", {}) || {};
  const dataCollection = ctx.get("dataCollection", {}) || {};
  const analysisPlan   = ctx.get("analysisPlan", {}) || {};
  const ethics         = (ctx.get("ethics", "") || "").trim();

  // ===== DOM refs =====
  const ctxEl   = rootEl.querySelector("#logic-context");
  const fbEl    = rootEl.querySelector("#logic-fb");
  const runBtn  = rootEl.querySelector("#logic-run");
  const copyBtn = rootEl.querySelector("#logic-copy");
  const saveBtn = rootEl.querySelector("#logic-save");

  // Hiển thị bối cảnh
  ctxEl.textContent = buildContextSummary();

  // Nạp báo cáo đã lưu (nếu có)
  const saved = ctx.get("logicCheck", "");
  if (saved) fbEl.value = saved;

  // ===== Events =====
  runBtn.addEventListener("click", onRun);
  copyBtn.addEventListener("click", onCopy);
  saveBtn.addEventListener("click", onSave);

  // ===== Handlers =====
  async function onRun() {
    try {
      const prompt = buildPrompt();
      toggleBusy(runBtn, true, "Đang kiểm tra...");
      toast(ctx, "Đang gửi yêu cầu kiểm tra logic tới GPT...");

      const raw = await callAI("step14.check", prompt, ctx);
      const text = String(raw || "").trim();

      fbEl.value =
        text ||
        "GPT không trả về nội dung. Hãy thử rút gọn bối cảnh hoặc kiểm tra lại kết nối.";
      toast(ctx, "Đã nhận báo cáo kiểm tra logic.");
    } catch (e) {
      console.error(e);
      toast(ctx, "Lỗi khi GPT kiểm tra logic.");
    } finally {
      toggleBusy(runBtn, false, "GPT kiểm tra logic");
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard?.writeText(fbEl.value || "");
      toast(ctx, "Đã sao chép báo cáo vào clipboard.");
    } catch {
      toast(ctx, "Không sao chép được báo cáo.");
    }
  }

  function onSave() {
    const text = (fbEl.value || "").trim();
    ctx.save("logicCheck", text);
    toast(ctx, "Đã lưu báo cáo kiểm tra logic.");
  }

  // ===== Builders =====
  function buildContextSummary() {
    const lines = [];

    lines.push(`PICO:
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}`);

    lines.push("");
    lines.push(`Câu hỏi nghiên cứu: ${rq || "(chưa nhập)"}`);
    lines.push(`Mục tiêu chính: ${mainObjective || "(chưa nhập)"}`);
    if (subObjectives.length) {
      lines.push(
        "Mục tiêu phụ:",
        ...subObjectives.map((s, i) => `  ${i + 1}. ${s}`)
      );
    }

    const armsStr = (interventions || [])
      .map((arm, i) => `- Nhánh ${i + 1}: ${armName(arm)}`)
      .join("\n");
    lines.push("");
    lines.push(`Thiết kế (rút gọn): ${jsonSafe(design)}`);
    lines.push("Can thiệp:");
    lines.push(armsStr || "  (chưa nhập)");

    lines.push("");
    lines.push("Lịch thu thập (tóm tắt):");
    const tps = Array.isArray(dataCollection?.timepoints)
      ? dataCollection.timepoints
      : [];
    if (tps.length) {
      tps.forEach((tp) => {
        lines.push(
          `- ${tp.label || "Mốc"}: ngày ${tp.day ?? "?"}`
        );
      });
    } else {
      lines.push("- (chưa thiết lập)");
    }

    const sumVars = summarizeVars(varsState);
    lines.push("");
    lines.push("Biến quan tâm:");
    Object.entries(sumVars).forEach(([group, arr]) => {
      lines.push(
        `- ${groupLabel(group)} (${arr.length}): ${
          arr.join(", ") || "—"
        }`
      );
    });

    lines.push("");
    lines.push(
      `Kế hoạch phân tích (rút gọn): ${
        brief(analysisPlan.mainText || "", 200)
      }`
    );
    lines.push(`Đạo đức (rút gọn): ${brief(ethics, 200)}`);

    return lines.join("\n");
  }

  function buildPrompt() {
    const today = new Date().toISOString().slice(0, 10);
    const varsSummary = summarizeVars(varsState);

    return `
Bạn là chuyên gia đánh giá đề cương RCT. Hãy kiểm tra **tính nhất quán và logic tổng thể** của đề cương dưới đây.

NGỮ CẢNH:

1) PICO
- P: ${pico.p || "(chưa nhập)"}
- I: ${pico.i || "(chưa nhập)"}
- C: ${pico.c || "(chưa nhập)"}
- O: ${pico.o || "(chưa nhập)"}

2) Câu hỏi & mục tiêu
- Câu hỏi nghiên cứu: ${rq || "(chưa nhập)"}
- Mục tiêu chính: ${mainObjective || "(chưa nhập)"}
- Mục tiêu phụ:
${subObjectives.length ? subObjectives.map((s,i)=>`  ${i+1}. ${s}`).join("\n") : "  (chưa nhập)"}

3) Thiết kế & can thiệp
- Thiết kế (JSON rút gọn): ${jsonSafe(design)}
- Các nhánh can thiệp:
${(interventions || []).map((arm,i)=>`  - Nhánh ${i+1}: ${armName(arm)}`).join("\n") || "  (chưa nhập)"}

4) Biến số (từ Step 10)
${Object.entries(varsSummary).map(
  ([g, arr]) => `- ${groupLabel(g)} (${arr.length}): ${arr.join(", ") || "—"}`
).join("\n") || "(chưa khai báo)"}

5) Lịch thu thập (từ Step 11, JSON rút gọn)
${jsonSafe(dataCollection).slice(0, 2000)}

6) Kế hoạch phân tích (SAP tóm tắt – Step 12)
${(analysisPlan.mainText || "").slice(0, 3500) || "(chưa có)"}

7) Phần Đạo đức (Step 13)
${ethics.slice(0, 3500) || "(chưa có)"}

YÊU CẦU TRẢ LỜI:
- Viết bằng tiếng Việt, cấu trúc rõ ràng với các mục:
  1. Nhận xét tổng quan về sự nhất quán giữa PICO – mục tiêu – thiết kế – biến – phân tích – đạo đức.
  2. Liệt kê CỤ THỂ các mâu thuẫn hoặc thiếu sót (mỗi mục 1–3 câu), ví dụ:
     • Mục tiêu không bám sát PICO; 
     • Biến kết cục không phù hợp mục tiêu; 
     • Thiết kế/nhánh can thiệp không tương thích với phân tích; 
     • Phần đạo đức bỏ sót điểm quan trọng, v.v.
  3. Đề xuất chỉnh sửa cụ thể cho từng vấn đề (viết sao cho tác giả có thể sửa trực tiếp vào đề cương).
  4. Kết luận chung: mức rủi ro logic (thấp/vừa/cao) và 3 hành động ưu tiên cần làm ngay.

- KHÔNG bịa số liệu, KHÔNG thêm thông tin mới ngoài bối cảnh.
- Không dùng placeholder như [tên bệnh viện] hay [số hiệu quyết định].

Ngày đánh giá: ${today}.
`.trim();
  }

  // ===== Helpers =====
  function summarizeVars(v) {
    const groups = [
      "primary",
      "secondary",
      "baseline",
      "confounder",
      "mediator",
      "moderator",
      "safety",
    ];
    const out = {};
    groups.forEach((g) => {
      const arr = Array.isArray(v?.[g]) ? v[g] : [];
      out[g] = arr
        .map((x) => String(x?.name || "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "vi"));
    });
    return out;
  }

  function groupLabel(g) {
    switch ((g || "").toLowerCase()) {
      case "primary": return "Kết cục chính";
      case "secondary": return "Kết cục phụ";
      case "baseline": return "Biến nền";
      case "confounder": return "Nhiễu";
      case "mediator": return "Trung gian";
      case "moderator": return "Điều biến";
      case "safety": return "An toàn";
      default: return g;
    }
  }

  function armName(x) {
    if (typeof x === "string") return x;
    const n = x?.name || x?.label || "";
    return String(n || "").trim() || "Arm";
  }

  function brief(s, n = 200) {
    const t = String(s || "").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n) + "…" : t || "—";
  }

  function jsonSafe(obj) {
    try {
      return JSON.stringify(obj);
    } catch {
      return String(obj || "");
    }
  }
}

// ==== COMMON UTILS (giống các step khác) ====
function toast(ctx, msg) {
  if (ctx && typeof ctx.toast === "function") ctx.toast(msg);
  else console.log("[toast]", msg);
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
  throw new Error("Chưa cấu hình GPT cho step14.");
}
