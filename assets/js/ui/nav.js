// ui/nav.js
export function goToStep(idx) {
  const steps = Array.from(document.querySelectorAll(".step"));
  const navs  = Array.from(document.querySelectorAll(".steps-nav button"));
  steps.forEach((el, i) => el.classList.toggle("active", i === idx));
  navs.forEach((el, i)  => el.classList.toggle("active", i === idx));
  sessionStorage.setItem("rctWizardStep", String(idx));
}

export function bootNav() {
  const step = Number(sessionStorage.getItem("rctWizardStep") || "0");
  goToStep(Number.isFinite(step) ? step : 0);
}
