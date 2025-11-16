// src/steps/step9/index.js
// Step 9 – Mô tả can thiệp
// - Lấy nhánh từ design.arms (bước 6). Nếu thiếu → ['Arm A','Arm B']
// - Mỗi nhánh có textarea mô tả + upload PDF (để trích text)
// - GPT gợi ý mô tả (PICO + thiết kế + PDF nếu có)
// - GPT đánh giá mô tả (theo CONSORT)
// - Lưu state: interventions: [{ name, description, pdfText?, feedback? }, ... ]

export const id = 9;
export const title = "Mô tả can thiệp";
export const subtitle =
  "Nhập mô tả chi tiết cho từng nhánh; có thể tải PDF để GPT dùng làm tư liệu gợi ý / đánh giá.";
export const css = "./public/css/steps/step9.css";

export async function mount(root, ctx) {
  // gắn scope cho CSS riêng step 9
  root.closest(".step")?.setAttribute("data-scope", "step9");

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Mô tả can thiệp</h3>
        <div class="card-subtitle">
          Nhập mô tả chi tiết cho từng nhánh can thiệp/đối chứng. Bạn có thể tải PDF liên quan
          để hệ thống trích văn bản hỗ trợ GPT.
        </div>
      </div>

      <div id="intv-list" class="card-body intv-list"></div>

      <div class="card-footer">
        <button id="intv-save" class="btn btn-primary">Lưu tất cả mô tả</button>
      </div>
    </div>
  `.trim();

  const listEl = root.querySelector("#intv-list");
  const saveBtn = root.querySelector("#intv-save");

  // ---- Lấy arms từ bước 6 – Thiết kế
  const design = ctx.get("design", {}) || {};
  const arms = Array.isArray(design.arms) && design.arms.length
    ? design.arms
        .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
        .filter(Boolean)
    : ["Arm A", "Arm B"];

  // ---- Khôi phục mô tả đã lưu (nếu có)
  const saved = ctx.get("interventions", []);
  const savedByName = new Map();
  if (Array.isArray(saved)) {
    saved.forEach((it) => {
      if (it && it.name) savedByName.set(it.name, it);
    });
  }

  // ---- Render từng nhánh
  listEl.innerHTML = "";
  arms.forEach((armName, idx) => {
    const prev = savedByName.get(armName) || {};

    const block = document.createElement("div");
    block.className = "intv-card";

    block.innerHTML = `
      <div class="card-header">
        <h4 class="card-title">Nhánh: ${escapeHtml(armName)}</h4>
      </div>

      <div class="card-body grid-2">
        <label class="full-span">
          Mô tả chi tiết
          <textarea
            id="intv-desc-${idx}"
            rows="7"
            placeholder="Ví dụ: thành phần/chế phẩm; liều lượng; đường dùng; tần suất; thời lượng; đồng can thiệp; can thiệp cấm; theo dõi tuân thủ; quy trình chuẩn hóa..."></textarea>
        </label>

        <label>
          <input id="intv-pdf-${idx}" type="file" accept="application/pdf" />
        </label>
      </div>

      <div class="card-footer intv-footer">
        <button id="intv-suggest-${idx}" class="btn btn-primary">GPT gợi ý mô tả</button>
        <button id="intv-eval-${idx}" class="btn btn-secondary">GPT đánh giá mô tả</button>
      </div>

      <div class="card-body intv-feedback hidden" id="intv-fbwrap-${idx}">
        <div class="intv-fb-title">Phản hồi đánh giá</div>
        <div id="intv-feedback-${idx}" class="muted"></div>
      </div>
    `;

    listEl.appendChild(block);

    // fill nội dung đã lưu
    const ta = block.querySelector(`#intv-desc-${idx}`);
    ta.value = prev.description || "";

    // wire buttons
    const pdfInput = block.querySelector(`#intv-pdf-${idx}`);
    const suggestBtn = block.querySelector(`#intv-suggest-${idx}`);
    const evalBtn = block.querySelector(`#intv-eval-${idx}`);
    const fbWrap = block.querySelector(`#intv-fbwrap-${idx}`);
    const fbBox = block.querySelector(`#intv-feedback-${idx}`);

    // ---- GPT gợi ý mô tả
    suggestBtn.addEventListener("click", async () => {
      const pdfText = await tryExtractPdf(pdfInput, ctx);
      const pico = ctx.get("pico", {}) || {};
      const rq = ctx.get("researchQuestion", "") || "";
      const obj = ctx.get("mainObjective", "") || "";

      const prompt = `
Bạn là chuyên gia xây dựng đề cương RCT. Hãy soạn **mô tả can thiệp** cho nhánh "${armName}"
(văn phong học thuật, rõ ràng, có thể dùng gạch đầu dòng khi phù hợp), dựa trên:

PICO:
- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}

Thiết kế nghiên cứu (JSON): ${JSON.stringify(design)}
Câu hỏi nghiên cứu: ${rq || "(chưa ghi rõ)"}
Mục tiêu chính: ${obj || "(chưa ghi rõ)"}

Tài liệu tham chiếu trích từ PDF (nếu có, có thể dùng để lấy tên chế phẩm, liều, quy trình...):
${pdfText ? pdfText.slice(0, 4000) : "(không có)"}

YÊU CẦU NỘI DUNG (theo khuyến cáo CONSORT khi phù hợp):
- Tên can thiệp/chế phẩm; thành phần/chủng loại; nhà sản xuất (nếu có)
- Liều lượng, đường dùng, tần suất, thời lượng; lịch tăng/giảm liều (nếu có)
- Quy trình chuẩn hoá áp dụng (SOP tóm tắt)
- Đồng can thiệp cho phép; can thiệp/cấm dùng đi kèm
- Theo dõi và tăng cường tuân thủ (adherence)
- Biện pháp giảm sai lệch/ô nhiễm (contamination)
- Biến cố bất lợi cần theo dõi và cách xử trí
- Cách xử trí khi bỏ liều/thoát nghiên cứu (nếu áp dụng)
`.trim();

      ctx.toast(`Đang gợi ý mô tả cho "${armName}"...`);
      // ✅ dùng binding step9.suggest
      const content = await ctx.callStepGPT("step9.suggest", prompt);
      if (content && content.trim()) {
        ta.value = content.trim();
        ctx.toast("Đã chèn gợi ý vào ô mô tả.");
      } else {
        ctx.toast("GPT không trả về nội dung hợp lệ.");
      }
    });

    // ---- GPT đánh giá mô tả
    evalBtn.addEventListener("click", async () => {
      const cur = (ta.value || "").trim();
      if (!cur) {
        ctx.toast("Chưa có mô tả để đánh giá.");
        return;
      }

      const pdfText = await tryExtractPdf(pdfInput, ctx);
      const prompt = `
Bạn là phản biện đề cương lâm sàng. Hãy **đánh giá tính đầy đủ, rõ ràng và khả năng tái lập**
của mô tả can thiệp dưới đây theo CONSORT/tiêu chuẩn báo cáo RCT.

1) Nêu ngắn gọn điểm mạnh.
2) Chỉ ra các nội dung còn thiếu hoặc mơ hồ (thành phần, liều, đường dùng, tần suất, thời lượng,
   đồng can thiệp, cấm kèm, tuân thủ, quy trình chuẩn hoá, xử trí biến cố...).
3) Đề xuất chỉnh sửa/bổ sung cụ thể (dạng gạch đầu dòng).

— Bối cảnh tham chiếu từ PDF (nếu có): ${pdfText ? pdfText.slice(0, 2000) : "(không có)"}
— Mô tả cần đánh giá:
${cur}
`.trim();

      ctx.toast(`Đang đánh giá mô tả nhánh "${armName}"...`);
      // ✅ dùng binding step9.evaluate
      const fb = await ctx.callStepGPT("step9.evaluate", prompt);
      fbBox.textContent = fb || "Không nhận được phản hồi.";
      fbWrap.classList.remove("hidden");
    });
  });

  // ---- Lưu tất cả mô tả
  saveBtn.addEventListener("click", () => {
    const out = arms.map((name, idx) => {
      const desc =
        (root.querySelector(`#intv-desc-${idx}`)?.value || "").trim();
      const fb =
        (root.querySelector(`#intv-feedback-${idx}`)?.textContent || "").trim();
      return { name, description: desc, feedback: fb || undefined };
    });

    ctx.save("interventions", out);
    ctx.toast("Đã lưu mô tả can thiệp cho tất cả nhánh.");
  });

  // ---- helpers
  async function tryExtractPdf(input, ctx) {
    const f = input?.files?.[0];
    if (!f) return "";
    try {
      const txt = await ctx.extractTextFromPDF(f);
      return txt || "";
    } catch {
      return "";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, '&quot;')
      .replace(/'/g, "&#39;");
  }
}
