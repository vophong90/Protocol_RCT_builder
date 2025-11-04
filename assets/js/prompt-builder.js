// /assets/js/prompt-builder.js
// Xây câu lệnh (prompt) từ dữ liệu thu thập, giữ nguyên nội dung cũ
(function (w) {
  const Prompt = {
    buildLogicPrompt(ctx) {
      const p = (ctx.pico?.p || '');
      const i = (ctx.pico?.i || '');
      const c = (ctx.pico?.c || '');
      const o = (ctx.pico?.o || '');

      const objective    = ctx.objective || '';
      const numArms      = ctx.numArms || 'Không xác định';
      const variableList = ctx.variableList || '';
      const analysis     = ctx.analysis || '';
      const ethics       = ctx.ethics || '';

      // Bản giữ nguyên tinh thần prompt cũ, chỉ format lại gọn gàng
      const prompt = `
Bạn là chuyên gia đánh giá đề cương RCT. Hãy kiểm tra tính nhất quán và logic giữa các phần sau:

- P: ${p}
- I: ${i}
- C: ${c}
- O: ${o}
- Mục tiêu nghiên cứu: ${objective}
- Số nhóm can thiệp: ${numArms}
- Biến số đã chọn: ${variableList}
- Kế hoạch phân tích: ${analysis}
- Vấn đề đạo đức: ${ethics}

Yêu cầu:
1) Chỉ ra các điểm nhất quán/không nhất quán giữa PICO ↔ mục tiêu ↔ số nhóm ↔ biến số.
2) Gợi ý chỉnh sửa tối thiểu (không đổi bản chất can thiệp) để khắc phục các điểm chưa hợp lý.
3) Kiểm tra xem kế hoạch phân tích có phù hợp với O và số nhóm hay chưa (test/ mô hình/ xử lý thiếu số liệu).
4) Gợi ý các kiểm định thay thế nếu cần. 
Trả lời ngắn gọn, có bullet, ưu tiên hành động cụ thể.
      `.trim();

      return prompt;
    }
  };

  w.App = w.App || {};
  w.App.Prompt = Prompt;
})(window);
