// src/steps/step13/index.js
// Step 13 – Đạo đức nghiên cứu
// - Đọc bối cảnh (PICO, thiết kế, can thiệp, lịch thu thập, biến)
// - Hiển thị tóm tắt bối cảnh (read-only)
// - Textarea #ethics-desc: bản thảo phần Đạo đức (Step 14 sẽ đọc lại id này)
// - GPT: step13.suggest (gợi ý), step13.evaluate (đánh giá) qua ctx.callStepGPT
// - Lưu vào state 'ethics' + cho phép export JSON

export const id = 13;
export const title = "Đạo đức nghiên cứu";
export const subtitle =
  "Mô tả phê duyệt HĐĐĐ/IRB, đồng thuận tham gia, nguy cơ–lợi ích, bảo mật dữ liệu, AE/SAE, giám sát an toàn, đăng ký thử nghiệm và tuân thủ GCP.";
export const css = "./public/css/steps/step13.css";

export async function mount(rootEl, ctx) {
  // Scope cho CSS riêng step13
  rootEl.closest(".step")?.setAttribute("data-scope", "step13");

  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Đạo đức nghiên cứu</h3>
    </div>

    <div class="card-body">
      <!-- Tóm tắt bối cảnh -->
      <section class="eth-context">
        <div class="eth-context-title">Tóm tắt bối cảnh (tham khảo, không chỉnh sửa tại đây)</div>
        <div id="eth-context" class="eth-context-body"></div>
      </section>

      <!-- Bản thảo Đạo đức -->
      <section class="eth-main">
        <label class="form-label" for="ethics-desc">
          <span>Bản thảo phần Đạo đức</span>
        </label>
        <textarea
          id="ethics-desc"
          rows="14"
          placeholder="Mô tả chi tiết các vấn đề đạo đức (tiếng Việt)..."></textarea>

        <div class="btn-row">
          <button type="button" class="btn btn-primary" id="eth-suggest">
            GPT gợi ý
          </button>
          <button type="button" class="btn btn-secondary" id="eth-eval">
            GPT đánh giá
          </button>
        </div>
      </section>
    </div>

    <div class="card-footer">
      <button type="button" class="btn btn-primary" id="eth-save">
        Lưu phần Đạo đức
      </button>
      <button type="button" class="btn btn-secondary" id="eth-export">
        Xuất JSON
      </button>
    </div>
  `.trim();

  // --------- Lấy dữ liệu bối cảnh từ state ----------
  const pico = ctx.get("pico", {}) || {};
  const design = ctx.get("design", {}) || {};
  const interventions = ctx.get("interventions", []) || [];
  const dc = normalizeDataCollection(ctx.get("dataCollection", {})); // history step11
  const sampleSize = ctx.get("sampleSize", {}) || {};
  const variablesSel = normalizeSelected(ctx.get("selectedVariables", {})); // từ step10

  // --------- DOM refs ----------
  const ctxEl = rootEl.querySelector("#eth-context");
  const descEl = rootEl.querySelector("#ethics-desc");
  const saveBtn = rootEl.querySelector("#eth-save");
  const exportBtn = rootEl.querySelector("#eth-export");
  const suggestBtn = rootEl.querySelector("#eth-suggest");
  const evalBtn = rootEl.querySelector("#eth-eval");

  // Hiển thị tóm tắt bối cảnh
  ctxEl.textContent = makeContextSummary();

  // Nạp bản thảo đã lưu (nếu có)
  descEl.value = ctx.get("ethics", "") || "";

  // --------- Events ----------
  saveBtn.addEventListener("click", () => {
    const text = (descEl.value || "").trim();
    ctx.save("ethics", text);
    toast(ctx, "Đã lưu phần Đạo đức.");
  });

  exportBtn.addEventListener("click", () => {
    const payload = {
      ethics: (descEl.value || "").trim(),
      context: {
        pico,
        design,
        interventions,
        dataCollection: dc,
        sampleSize,
        selectedVariables: summarizeSelected(variablesSel),
      },
    };
    ctx.downloadJSON("ethics_section.json", payload);
  });

  suggestBtn.addEventListener("click", () =>
    onSuggest(ctx, {
      pico,
      design,
      interventions,
      dc,
      sampleSize,
      variablesSel,
      targetEl: descEl,
      btnEl: suggestBtn,
    })
  );

  evalBtn.addEventListener("click", () =>
    onEvaluate(ctx, {
      design,
      interventions,
      dc,
      draft: descEl.value || "",
      btnEl: evalBtn,
    })
  );

  // =================== GPT handlers ===================

  async function onSuggest(
    ctx,
    { pico, design, interventions, dc, sampleSize, variablesSel, targetEl, btnEl }
  ) {
    try {
      if (targetEl.value.trim()) {
        const ok = window.confirm(
          "Bản thảo hiện tại sẽ được thay thế bằng gợi ý mới từ GPT. Tiếp tục?"
        );
        if (!ok) return;
      }
      toggleBusy(btnEl, true, "Đang gợi ý...");

      const prompt = `
Bạn là chuyên gia đạo đức nghiên cứu lâm sàng. Hãy viết **phần Đạo đức** cho đề cương/SAP của một RCT,
TRẢ LỜI BẰNG TIẾNG VIỆT, văn phong học thuật, có thể chép trực tiếp vào đề cương.

BỐI CẢNH:
PICO:
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}

Thiết kế (JSON rút gọn):
${jsonSafe(design)}

Can thiệp (các nhánh):
${jsonSafe(interventions)}

Cỡ mẫu (nếu có):
${jsonSafe(sampleSize)}

Lịch thu thập dữ liệu:
${dc.timepoints.length} mốc: ${
        dc.timepoints.length
          ? dc.timepoints.map((t) => t.label).join(", ")
          : "(chưa thiết lập)"
      }

Biến quan tâm (tóm tắt theo nhóm):
${JSON.stringify(summarizeSelected(variablesSel), null, 2).slice(0, 1600)}

YÊU CẦU NỘI DUNG (NHƯ MỘT ĐOẠN/MỘT MỤC TRONG ĐỀ CƯƠNG):
1) Phê duyệt HĐĐĐ/IRB và tuân thủ GCP/Declaration of Helsinki (mô tả nguyên tắc chung, không bịa tên cơ quan cụ thể).
2) Đồng thuận tham gia: quy trình cung cấp thông tin, quyền từ chối/ rút lui, cách lưu trữ văn bản đồng thuận.
3) Phân tích nguy cơ–lợi ích: theo tính chất can thiệp trên; biện pháp giảm thiểu nguy cơ, xử trí khi xảy ra biến cố.
4) Bảo mật & riêng tư dữ liệu: ẩn danh/giả danh, lưu trữ dữ liệu, phân quyền truy cập, thời gian lưu trữ.
5) Báo cáo và xử trí AE/SAE: định nghĩa chung, quy trình ghi nhận, thẩm quyền và thời hạn báo cáo, xử trí khẩn cấp, unblinding nếu có che giấu.
6) Giám sát an toàn (DSMB hoặc cơ chế tương đương) và tiêu chí dừng sớm (nếu phù hợp với thiết kế).
7) Đối tượng dễ tổn thương (nếu có): biện pháp bảo vệ bổ sung.
8) Bồi hoàn/bảo hiểm cho người tham gia (nếu áp dụng) và chi phí khi tham gia.
9) Đăng ký thử nghiệm lâm sàng và quyền tiếp cận kết quả; chia sẻ dữ liệu (nếu có chính sách).

Viết mạch lạc, chia thành các đoạn/mục nhỏ rõ ràng, tránh gạch đầu dòng khô cứng.
Không dùng placeholder kiểu [tên cơ quan], không bịa số văn bản, không bịa registry cụ thể.
`.trim();

      const raw = await callAI("step13.suggest", prompt, ctx);
      const text = String(raw || "").trim() || "GPT không trả về nội dung.";
      targetEl.value = text;
      toast(ctx, "Đã chèn gợi ý phần Đạo đức vào ô nội dung.");
    } catch (e) {
      console.error(e);
      toast(ctx, "Lỗi khi GPT gợi ý phần Đạo đức.");
    } finally {
      toggleBusy(btnEl, false, "GPT gợi ý");
    }
  }

  async function onEvaluate(ctx, { design, interventions, dc, draft, btnEl }) {
    if (!draft.trim()) {
      toast(ctx, "Chưa có nội dung để đánh giá.");
      return;
    }

    try {
      toggleBusy(btnEl, true, "Đang đánh giá...");

      const prompt = `
Bạn là phản biện đạo đức nghiên cứu. Hãy **ĐÁNH GIÁ** đoạn "Đạo đức nghiên cứu" dưới đây,
TRẢ LỜI BẰNG TIẾNG VIỆT.

BỐI CẢNH RÚT GỌN:
- Thiết kế: ${jsonSafe(design)}
- Can thiệp: ${jsonSafe(interventions)}
- Số mốc thu thập dữ liệu: ${dc.timepoints.length}

BẢN THẢO CẦN ĐÁNH GIÁ:
---
${draft.slice(0, 6000)}
---

YÊU CẦU:
1) Nhận xét tổng quan (3–6 câu) về tính đầy đủ, rõ ràng, phù hợp chuẩn GCP/Helsinki.
2) Đánh giá theo các trục sau (mỗi trục 1–3 câu): 
   - IRB/HĐĐĐ & chuẩn mực GCP/Helsinki
   - Đồng thuận tham gia (thông tin, quyền rút lui)
   - Nguy cơ–lợi ích & biện pháp giảm thiểu
   - Bảo mật/riêng tư & quản trị dữ liệu
   - AE/SAE: định nghĩa, ghi nhận, báo cáo, xử trí khẩn
   - Giám sát an toàn/DSMB & tiêu chí dừng sớm (nếu phù hợp thiết kế)
   - Đối tượng dễ tổn thương, bồi hoàn/bảo hiểm, đăng ký thử nghiệm & công bố kết quả
3) Đề xuất chỉnh sửa cụ thể (gạch đầu dòng), tập trung vào những chỗ cần bổ sung hoặc rõ hơn.
Không cần viết lại toàn bộ; chỉ nhận xét và gợi ý cải thiện.
`.trim();

      const raw = await callAI("step13.evaluate", prompt, ctx);
      const text = String(raw || "").trim() || "GPT không trả về nội dung.";
      showFeedbackDialog(text);
      toast(ctx, "Đã nhận đánh giá phần Đạo đức.");
    } catch (e) {
      console.error(e);
      toast(ctx, "Lỗi khi GPT đánh giá phần Đạo đức.");
    } finally {
      toggleBusy(btnEl, false, "GPT đánh giá");
    }
  }

  // =================== Helpers ===================

  function makeContextSummary() {
    const lines = [];
    lines.push(`PICO:
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}`);

    lines.push("");
    lines.push(`Thiết kế (rút gọn): ${jsonSafe(design)}`);

    const arms = (interventions || [])
      .map((x, i) =>
        typeof x === "string" ? x : x?.name || `Nhánh ${i + 1}`
      )
      .join(" | ");
    lines.push(`Can thiệp: ${arms || "(chưa nhập)"}`);

    lines.push("");
    lines.push(`Lịch thu thập: ${dc.timepoints.length} mốc`);
    if (dc.timepoints.length) {
      lines.push(
        "  " +
          dc.timepoints
            .map((tp) => `${tp.label} (ngày ${tp.day})`)
            .join(" • ")
      );
    }

    const varSum = summarizeSelected(variablesSel);
    lines.push("");
    lines.push("Biến quan tâm:");
    Object.entries(varSum).forEach(([g, arr]) => {
      lines.push(
        `- ${groupLabel(g)} (${arr.length}): ${arr.join(", ") || "—"}`
      );
    });

    return lines.join("\n");
  }

  function normalizeSelected(sel) {
    const keys = [
      "primary",
      "secondary",
      "baseline",
      "confounder",
      "mediator",
      "moderator",
      "safety",
    ];
    const out = {};
    keys.forEach((k) => {
      out[k] = Array.isArray(sel?.[k])
        ? sel[k]
            .map((v) => ({ name: String(v.name || "").trim() }))
            .filter((x) => x.name)
        : [];
    });
    return out;
  }

  function summarizeSelected(sel) {
    const obj = {};
    Object.keys(sel).forEach((k) => {
      obj[k] = (sel[k] || [])
        .map((v) => v.name)
        .filter(Boolean)
        .sort(alpha);
    });
    return obj;
  }

  function normalizeDataCollection(x) {
    const timepoints = Array.isArray(x?.timepoints)
      ? x.timepoints
          .map((tp) => ({
            id: String(tp.id || "").trim() || makeId(tp.label, tp.day),
            label: String(tp.label || "").trim() || "Mốc",
            day: num(tp.day),
          }))
          .filter((tp) => tp.id && !Number.isNaN(tp.day))
      : [];

    const assignments = {};
    if (x && typeof x.assignments === "object") {
      Object.entries(x.assignments).forEach(([name, arr]) => {
        if (!name) return;
        assignments[name] = Array.isArray(arr) ? arr.map(String) : [];
      });
    }
    return { timepoints, assignments };
  }

  function groupLabel(g) {
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

  function alpha(a, b) {
    a = (typeof a === "object" ? a?.name : a) ?? "";
    b = (typeof b === "object" ? b?.name : b) ?? "";
    a = a.toString().toLowerCase();
    b = b.toString().toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  }

  function makeId(label, day) {
    const d = num(day);
    const slug = String(label || "")
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_");
    return `${slug || "tp"}_d${Number.isNaN(d) ? "x" : d}`;
  }

  function jsonSafe(x) {
    try {
      return JSON.stringify(x ?? {}, null, 2).slice(0, 1200);
    } catch {
      return String(x);
    }
  }

  function toast(ctx, msg) {
    if (ctx && typeof ctx.toast === "function") ctx.toast(msg);
    else console.log("[toast]", msg);
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
    throw new Error("Chưa cấu hình GPT cho step13.");
  }

  function showFeedbackDialog(text) {
    const id = "eth-fb-dialog";
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
        <div style="background:#fff; max-width:780px; width:92vw; padding:18px; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.24)">
          <div style="font-weight:700; margin-bottom:8px;">Đánh giá phần Đạo đức</div>
          <div id="eth-fb-text" style="white-space:pre-wrap; line-height:1.4; max-height:60vh; overflow:auto;"></div>
          <div style="display:flex; justify-content:flex-end; margin-top:12px;">
            <button id="eth-fb-close" class="btn btn-primary">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(dlg);
      dlg
        .querySelector("#eth-fb-close")
        .addEventListener("click", () => dlg.remove());
    }
    dlg.querySelector("#eth-fb-text").textContent = text || "";
  }
}
