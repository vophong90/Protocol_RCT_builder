// features/logic.js
import { getState } from "../core/state.js";
import { gptCall } from "../services/gpt.js";
import { getSelectedVariables } from "./variables.js";

export async function checkLogic() {
  const saved = getState();
  const pico = saved.pico || {};
  const objective = saved.mainObjective || "";
  const numArms = localStorage.getItem("num-arms") || "Không xác định";
  const selected = getSelectedVariables() || {};

  const variableList = Object.entries(selected)
    .flatMap(([role, vars]) => (vars || []).map(v => `${v.name} (${role})`))
    .join(", ");

  const analysis = saved.analysis || "";
  const ethics = saved.ethics || "";

  const prompt = `
Bạn là chuyên gia đánh giá đề cương RCT. Hãy kiểm tra tính nhất quán và logic giữa các phần sau:

- P: ${pico.p || ""}
- I: ${pico.i || ""}
- C: ${pico.c || ""}
- O: ${pico.o || ""}
- Mục tiêu nghiên cứu: ${objective}
- Số nhóm can thiệp: ${numArms}
- Danh sách biến đã chọn: ${variableList || "(chưa chọn)"}
- Kế hoạch phân tích: ${analysis || "(chưa nhập)"}
- Đạo đức nghiên cứu: ${ethics || "(chưa nhập)"}

Yêu cầu đầu ra:
1) Chỉ ra các mâu thuẫn, thiếu sót, phần chưa đo lường được hoặc không gắn kết PICO.
2) Kiểm tra xem biến số đã đủ để đo các mục tiêu chưa (thiếu biến chính/phụ/safety?).
3) Gợi ý chỉnh từng mục theo format: [Mục] → [Vấn đề] → [Đề xuất sửa].
4) Kết luận mức sẵn sàng nộp HĐĐĐ (1–5) với lý do ngắn gọn.`;

  const out = document.getElementById("logic-check-result");
  if (out) out.textContent = "⏳ GPT đang kiểm tra...";
  const res = await gptCall(prompt);
  if (out) out.textContent = res;
}
