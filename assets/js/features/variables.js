// features/variables.js
import { setState, getState, saveData } from "../core/state.js";

export const variableRoles = [
  { key: "primary",   name: "Kết cục chính",  required: true,  description: "Biến số chính để đánh giá hiệu quả can thiệp. Bắt buộc có." },
  { key: "secondary", name: "Kết cục phụ",    required: false, description: "Biến bổ sung để đánh giá các khía cạnh khác của can thiệp." },
  { key: "baseline",  name: "Biến nền",       required: true,  description: "Đặc điểm ban đầu của người bệnh dùng để mô tả & phân tích." },
  { key: "confounder",name: "Biến nhiễu",     required: false, description: "Biến có thể ảnh hưởng kết quả nếu không kiểm soát." },
  { key: "mediator",  name: "Biến trung gian",required: false, description: "Biến giải thích cơ chế tác động của can thiệp." },
  { key: "moderator", name: "Biến điều biến", required: false, description: "Biến làm thay đổi mối liên hệ can thiệp–kết quả." },
  { key: "safety",    name: "Biến an toàn",   required: false, description: "Biến phản ánh tác dụng phụ/biến cố bất lợi." }
];

let allVariables = [];
let selectedVariables = {};  // { role: Array<var> }

export function getSelectedVariables() { return selectedVariables; }

export function createVariableDragUI() {
  const container = document.getElementById("variable-groups");
  if (!container) return;
  container.innerHTML = "";

  variableRoles.forEach(role => {
    const availableList = (allVariables || []).filter(v => v.role === role.key);
    const selectedList  = selectedVariables[role.key] || [];

    const block = document.createElement("div");
    block.className = "variable-group";
    block.innerHTML = `
      <h4>${role.name}</h4>
      <div class="description">${role.description}</div>
      <div class="variable-lists">
        <ul class="variable-list variable-available" data-role="${role.key}"></ul>
        <ul class="variable-list variable-selected"  data-role="${role.key}"></ul>
      </div>
      <label>📂 Tải tài liệu PDF hỗ trợ:</label>
      <input type="file" id="file-variable-${role.key}" accept=".pdf"><br>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button id="btn-suggest-${role.key}">🧠 GPT gợi ý biến</button>
        <button id="btn-eval-${role.key}">🧐 GPT đánh giá biến</button>
      </div>
      <div id="suggest-variable-${role.key}" style="margin-top:10px;background:#eef;padding:10px;border:1px solid #99c;white-space:pre-wrap;"></div>
      <div id="eval-variable-${role.key}"    style="margin-top:10px;background:#efe;padding:10px;border:1px solid #9c9;white-space:pre-wrap;"></div>
    `;
    container.appendChild(block);

    const availUl = block.querySelector(".variable-available");
    const selUl   = block.querySelector(".variable-selected");

    [availUl, selUl].forEach(ul => {
      ul.ondragover = e => e.preventDefault();
      ul.ondrop = e => drop(e, ul);
    });

    availableList.forEach(v => availUl.appendChild(renderLi(v)));
    selectedList.forEach(v  => selUl.appendChild(renderLi(v, true)));
  });
}

function renderLi(v, removable = false) {
  const li = document.createElement("li");
  li.draggable = true;
  li.dataset.name = v.name;
  li.dataset.role = v.role || "";
  li.dataset.type = v.type || "";
  li.dataset.unit = v.unit || "";
  li.dataset.time = v.time || "";
  li.dataset.measure = v.measure || "";
  li.dataset.definition = v.definition || "";
  li.dataset.source = v.source || "";
  li.dataset.format = v.format || "";
  li.dataset.range = v.range || "";
  li.dataset.mcid = v.mcid_or_cutoff || "";
  li.textContent = `${v.name} (${v.type || ""})`;

  const info = `Tên: ${v.name}
Vai trò: ${v.role}
Kiểu dữ liệu: ${v.type}
Đơn vị: ${v.unit}
Thời điểm đo: ${v.time}
Cách đo: ${v.measure}
Định nghĩa: ${v.definition}
Nguồn: ${v.source}
Định dạng: ${v.format}
Khoảng giá trị: ${v.range}
MCID/Ngưỡng: ${v.mcid_or_cutoff}`.trim();
  li.title = info;

  li.ondragstart = e => {
    e.dataTransfer.setData("name", v.name);
    e.dataTransfer.setData("role", v.role);
  };

  if (removable) {
    const btn = document.createElement("button");
    btn.innerText = "🗑";
    btn.style.cssText = "position:absolute;top:4px;right:6px;background:none;border:none;color:red;cursor:pointer;font-size:16px";
    btn.onclick = (evt) => {
      evt.stopPropagation();
      removeVariable(v.name, v.role);
    };
    li.style.position = "relative";
    li.appendChild(btn);
  }
  return li;
}

function drop(e, targetUl) {
  e.preventDefault();
  const name = e.dataTransfer.getData("name");
  const fromRole = e.dataTransfer.getData("role");
  const toRole = targetUl.dataset.role;

  const v = (allVariables || []).find(x => x.name === name && (x.role === fromRole || x.role === toRole));
  if (!v) return;

  // ✔ chỉnh role theo danh sách đích (sửa lỗi cũ)
  v.role = toRole;

  // loại trùng trong ul đích
  if ([...targetUl.querySelectorAll("li")].some(el => el.dataset.name === name)) return;

  targetUl.appendChild(renderLi(v, true));

  // cập nhật selectedVariables
  const selAll = targetUl.closest(".variable-group")?.querySelector(".variable-selected");
  if (selAll) {
    selectedVariables[toRole] = [...selAll.querySelectorAll("li")].map(el => ({
      name: el.dataset.name, role: toRole, type: el.dataset.type || "",
      unit: el.dataset.unit || "", time: el.dataset.time || "", measure: el.dataset.measure || "",
      definition: el.dataset.definition || "", source: el.dataset.source || "", format: el.dataset.format || "",
      range: el.dataset.range || "", mcid_or_cutoff: el.dataset.mcid || ""
    }));
  }
  setState({ selectedVariables });
  saveData();

  // nếu kéo từ available → xóa ở available
  const fromAvail = document.querySelector(`.variable-available[data-role="${fromRole}"] li[data-name="${name}"]`);
  if (fromAvail && fromRole !== toRole) fromAvail.remove();
}

function removeVariable(name, role) {
  const selUl = document.querySelector(`.variable-selected[data-role="${role}"]`);
  if (!selUl) return;
  const li = selUl.querySelector(`li[data-name="${name}"]`);
  if (li) li.remove();
  selectedVariables[role] = [...selUl.querySelectorAll("li")].map(el => ({ name: el.dataset.name, role }));
  setState({ selectedVariables });
}

export function bootVariables() {
  // Khởi tạo từ localStorage (nếu có)
  const st = getState();
  selectedVariables = st?.selectedVariables || {};
  // Gắn listener CSV sau khi DOM sẵn sàng
  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("variable-file");
    if (!input) return;
    input.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
      allVariables = result.data.map(row => ({
        name: row.name?.trim() || "", role: row.role?.trim() || "", type: row.type?.trim() || "",
        unit: row.unit || "", time: row.time || "", measure: row.measure || "", definition: row.definition || "",
        source: row.source || "", format: row.format || "", range: row.range || "", mcid_or_cutoff: row.mcid_or_cutoff || ""
      }));
      createVariableDragUI();
    });
    // Render lần đầu (nếu có selectedVariables)
    if (document.getElementById("variable-groups")) createVariableDragUI();
  });
}
