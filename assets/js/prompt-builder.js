// /assets/js/prompt-builder.js
// Xây prompt gọn, sạch, có clamp chiều dài để tránh vượt token
(function (w) {
  const U = (w.App && w.App.Utils) || { collapseWsKeepNl: x=>x||'', clampLen: x=>x };

  const Prompt = {
    buildLogicPrompt(ctx) {
      const p = U.collapseWsKeepNl(ctx?.pico?.p || '');
      const i = U.collapseWsKeepNl(ctx?.pico?.i || '');
      const c = U.collapseWsKeepNl(ctx?.pico?.c || '');
      const o = U.collapseWsKeepNl(ctx?.pico?.o || '');

      const objective    = U.collapseWsKeepNl(ctx?.objective || '');
      const numArms      = String(ctx?.numArms || 'Không xác định');
      const variableList = U.collapseWsKeepNl(ctx?.variableList || '');
      const analysis     = U.collapseWsKeepNl(ctx?.analysis || '');
      const ethics       = U.collapseWsKeepNl(ctx?.ethics || '');

      // Ràng buộc chiều dài từng phần để tránh prompt quá lớn
      const MAX_PART = 4000;        // an toàn
      const MAX_VARS = 3000;        // riêng phần biến
      const prompt = `
Bạn là chuyên gia đánh giá đề cương RCT. Hãy kiểm tra tính nhất quán và logic giữa các phần sau (trả lời ngắn gọn, theo bullet, ưu tiên gợi ý hành động):

- P: ${U.clampLen(p, MAX_PART)}
- I: ${U.clampLen(i, MAX_PART)}
- C: ${U.clampLen(c, MAX_PART)}
- O: ${U.clampLen(o, MAX_PART)}
- Mục tiêu nghiên cứu: ${U.clampLen(objective, MAX_PART)}
- Số nhóm can thiệp: ${numArms}
- Biến số đã chọn: ${U.clampLen(variableList, MAX_VARS)}
- Kế hoạch phân tích: ${U.clampLen(analysis, MAX_PART)}
- Vấn đề đạo đức: ${U.clampLen(ethics, MAX_PART)}

Yêu cầu:
1) Chỉ ra các điểm nhất quán/không nhất quán giữa PICO ↔ mục tiêu ↔ số nhóm ↔ biến số.
2) Đề xuất chỉnh sửa tối thiểu (không thay đổi bản chất can thiệp) để khắc phục các điểm chưa hợp lý.
3) Đánh giá sự phù hợp của kế hoạch phân tích với O và số nhóm (tên test/mô hình, xử lý thiếu số liệu).
4) Nêu các kiểm định/thay thế nếu cần.
      `.trim();

      return prompt;
    }
  };

  w.App = w.App || {};
  w.App.Prompt = Prompt;
})(window);
