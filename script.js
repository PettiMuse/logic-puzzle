window.addEventListener("DOMContentLoaded", () => {
  const s = document.getElementById("saveStatus");
  if (s) s.textContent = "JS RUNNING ✅";
});
// =====================
// PUZZLE DATA
// =====================
const NAMES = ["Isla", "Kaleb", "Madeline", "Philip", "Rebecca"];
const FLAVOURS = ["Apple", "Apricot", "Bacon", "Lemon", "Spinach"];
const TREATS   = ["Eclair", "Pie", "Quiche", "Tart", "Turnover"];
const PASTRIES = ["Choux", "Filo", "Flaky", "Puff", "Shortcrust"];

// Unique ID so this puzzle saves separately
const PUZZLE_ID = "logic_puzzle_v1";
const STORAGE_KEY = `logic_puzzle_state_${PUZZLE_ID}`;

const saveStatusEl = document.getElementById("saveStatus");
const clearBtn = document.getElementById("btnClear");

// =====================
// UTILITIES
// =====================
function flashSaved(text = "Saved") {
  if (!saveStatusEl) return;
  saveStatusEl.textContent = text;
  saveStatusEl.classList.add("flash");
  setTimeout(() => saveStatusEl.classList.remove("flash"), 400);
}

function nextState(current) {
  return current === "" ? "x" : current === "x" ? "check" : "";
}

function makeCell(text, classes) {
  const d = document.createElement("div");
  d.className = classes.join(" ");
  d.textContent = text;
  return d;
}

// =====================
// GRID BUILDER
// =====================
function buildMatrixGrid({
  mountId,
  rowLabels,
  colLabels,
  bandTitleLeft = "",
  bandTitleTop = "",
  labelWidth = 14



