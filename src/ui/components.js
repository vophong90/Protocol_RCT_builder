export function CardHeader(title, subtitle=''){ return `
  <div class="card-header">
    <h3 class="card-title">${title}</h3>
    ${subtitle ? `<div class="card-subtitle">${subtitle}</div>` : ''}
  </div>`; }

export function Button({ id, kind='primary', text }){
  return `<button id="${id}" class="btn btn-${kind}" type="button">${text}</button>`;
}

export const TwoColGrid = (inner) => `<div class="card-body grid-2">${inner}</div>`;
export const ControlRow = (inner) => `<div class="card-body inline-row">${inner}</div>`;
export const LabeledTextarea = (id, label, rows=6, placeholder='') =>
  `<label>${label}<textarea id="${id}" rows="${rows}" placeholder="${placeholder}"></textarea></label>`;
