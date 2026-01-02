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
  labelWidth = 140,
  exclusive = true,
  addSeparatorsAtColIndex = [],
  onAnyChange = () => {}
}) {
  const state = Array.from({ length: rowLabels.length }, () =>
    Array.from({ length: colLabels.length }, () => "")
  );

  const mount = document.getElementById(mountId);
  mount.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.gridTemplateColumns =
    `${labelWidth}px repeat(${colLabels.length}, var(--cell))`;

  // Category band
  if (bandTitleTop || bandTitleLeft) {
    grid.appendChild(makeCell(bandTitleLeft, ["cell", "band", "rowlabel"]));
    const bandTop = makeCell(bandTitleTop, ["cell", "band"]);
    bandTop.style.gridColumn = `span ${colLabels.length}`;
    grid.appendChild(bandTop);
  }

  // Column headers
  grid.appendChild(makeCell("", ["cell", "header", "rowlabel"]));
  colLabels.forEach((label, c) => {
    const h = makeCell(label, ["cell", "header"]);
    if (addSeparatorsAtColIndex.includes(c)) h.classList.add("separator");
    grid.appendChild(h);
  });

  // Rows
  rowLabels.forEach((rowLabel, r) => {
    grid.appendChild(makeCell(rowLabel, ["cell", "rowlabel"]));

    colLabels.forEach((_, c) => {
      const cell = makeCell("", ["cell", "clickable"]);
      cell.dataset.r = r;
      cell.dataset.c = c;

      if (addSeparatorsAtColIndex.includes(c)) cell.classList.add("separator");

      cell.addEventListener("click", () => {
        const current = state[r][c];
        const next = nextState(current);

        if (exclusive && next === "check") {
          // Clear other checks in row/col
          for (let cc = 0; cc < colLabels.length; cc++)
            if (state[r][cc] === "check") state[r][cc] = "";

          for (let rr = 0; rr < rowLabels.length; rr++)
            if (state[rr][c] === "check") state[rr][c] = "";

          // Set this check
          state[r][c] = "check";

          // X out rest
          for (let cc = 0; cc < colLabels.length; cc++)
            if (cc !== c) state[r][cc] = "x";

          for (let rr = 0; rr < rowLabels.length; rr++)
            if (rr !== r) state[rr][c] = "x";
        } else {
          state[r][c] = next;
        }

        render();
        onAnyChange();
      });

      grid.appendChild(cell);
    });
  });

  mount.appendChild(grid);

  function render() {
    grid.querySelectorAll(".cell.clickable").forEach(cell => {
      const r = cell.dataset.r;
      const c = cell.dataset.c;
      const val = state[r][c];

      cell.classList.remove("x", "check");
      cell.textContent = "";

      if (val === "x") {
        cell.textContent = "✕";
        cell.classList.add("x");
      }
      if (val === "check") {
        cell.textContent = "✓";
        cell.classList.add("check");
      }
    });
  }

  function clear() {
    for (let r = 0; r < state.length; r++)
      for (let c = 0; c < state[r].length; c++)
        state[r][c] = "";
    render();
  }

  render();
  return { state, render, clear };
}

// =====================
// SAVE / LOAD
// =====================
function saveAll() {
  const data = {
    main: grids.main.state,
    pastryTreat: grids.pastryTreat.state,
    treatFlavour: grids.treatFlavour.state
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  flashSaved("Saved");
}

function loadAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    copy(data.main, grids.main.state);
    copy(data.pastryTreat, grids.pastryTreat.state);
    copy(data.treatFlavour, grids.treatFlavour.state);

    grids.main.render();
    grids.pastryTreat.render();
    grids.treatFlavour.render();
    flashSaved("Restored");
  } catch {}
}

function copy(from, to) {
  if (!from || !to) return;
  for (let r = 0; r < to.length; r++)
    for (let c = 0; c < to[r].length; c++)
      to[r][c] = from[r]?.[c] || "";
}

// =====================
// BUILD GRIDS
// =====================
const grids = {};

const mainCols = [...FLAVOURS, ...TREATS, ...PASTRIES];
const sep1 = FLAVOURS.length;               // BEFORE Eclair (after Spinach)
const sep2 = FLAVOURS.length + TREATS.length; // BEFORE Choux (after Turnover)


grids.main = buildMatrixGrid({
  mountId: "mainGrid",
  rowLabels: NAMES,
  colLabels: mainCols,
  bandTitleTop: "Flavour        Treat        Pastry",
  addSeparatorsAtColIndex: [sep1, sep2],
  onAnyChange: saveAll
});

grids.pastryTreat = buildMatrixGrid({
  mountId: "pastryTreatGrid",
  rowLabels: PASTRIES,
  colLabels: TREATS,
  bandTitleLeft: "Pastry",
  bandTitleTop: "Treat",
  labelWidth: 120,
  onAnyChange: saveAll
});

grids.treatFlavour = buildMatrixGrid({
  mountId: "treatFlavourGrid",
  rowLabels: TREATS,
  colLabels: FLAVOURS,
  bandTitleLeft: "Treat",
  bandTitleTop: "Flavour",
  labelWidth: 120,
  onAnyChange: saveAll
});

// Restore saved state
loadAll();

// Clear button
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (!confirm("Clear the entire puzzle?")) return;
    grids.main.clear();
    grids.pastryTreat.clear();
    grids.treatFlavour.clear();
    localStorage.removeItem(STORAGE_KEY);
    flashSaved("Cleared");
  });
}



