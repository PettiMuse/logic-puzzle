// =====================
// PUZZLE DATA
// =====================
const NAMES = ["Isla", "Kaleb", "Madeline", "Philip", "Rebecca"];
const FLAVOURS = ["Apple", "Apricot", "Bacon", "Lemon", "Spinach"];
const TREATS = ["Eclair", "Pie", "Quiche", "Tart", "Turnover"];
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

// Click cycle: blank -> x -> check -> blank
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
  exclusiveGroups = null, // [{start,end}, ...] optional
  showColHeaders = true,
  addSeparatorsAtColIndex = [],
  onAnyChange = () => {}
}) {
  const state = Array.from({ length: rowLabels.length }, () =>
    Array.from({ length: colLabels.length }, () => "")
  );

  function getGroupRange(colIndex) {
    if (!Array.isArray(exclusiveGroups) || exclusiveGroups.length === 0) {
      return { start: 0, end: colLabels.length - 1 };
    }
    for (const g of exclusiveGroups) {
      if (colIndex >= g.start && colIndex <= g.end) return g;
    }
    return { start: 0, end: colLabels.length - 1 };
  }

  const mount = document.getElementById(mountId);
  if (!mount) {
    console.error(`Mount element not found: #${mountId}`);
    return { state, render: () => {}, clear: () => {} };
  }
  mount.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.gridTemplateColumns = `${labelWidth}px repeat(${colLabels.length}, var(--cell))`;

  // --- Band row (optional) ---
  if (bandTitleTop || bandTitleLeft) {
    grid.appendChild(makeCell(bandTitleLeft, ["cell", "band", "rowlabel"]));

    if (Array.isArray(bandTitleTop)) {
      const sections = bandTitleTop.length;
      const per = Math.floor(colLabels.length / sections);

      bandTitleTop.forEach((t, i) => {
        const band = makeCell(t, ["cell", "band"]);
        band.style.gridColumn = `span ${per}`;
        if (i < sections - 1) band.classList.add("band-divider");
        grid.appendChild(band);
      });
    } else {
      const bandTop = makeCell(bandTitleTop, ["cell", "band"]);
      bandTop.style.gridColumn = `span ${colLabels.length}`;
      grid.appendChild(bandTop);
    }
  }

  // --- Column headers (optional) ---
  if (showColHeaders) {
    grid.appendChild(makeCell("", ["cell", "header", "rowlabel"]));
    colLabels.forEach((label, c) => {
      const h = makeCell(label, ["cell", "header"]);
      if (addSeparatorsAtColIndex.includes(c)) h.classList.add("separator");
      grid.appendChild(h);
    });
  }

  // --- Rows ---
  rowLabels.forEach((rowLabel, r) => {
    grid.appendChild(makeCell(rowLabel, ["cell", "rowlabel"]));

    colLabels.forEach((_, c) => {
      const cell = makeCell("", ["cell", "clickable"]);
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);

      if (addSeparatorsAtColIndex.includes(c)) cell.classList.add("separator");

      cell.addEventListener("click", () => {
        const current = state[r][c];
        const next = nextState(current);

        // Exclusive behaviour: when setting ✓, auto-fill Xs
        if (exclusive && next === "check") {
          const { start, end } = getGroupRange(c);

          // Clear other checks in SAME ROW within the group
          for (let cc = start; cc <= end; cc++) {
            if (state[r][cc] === "check") state[r][cc] = "";
          }

          // Clear other checks in SAME COLUMN (all rows)
          for (let rr = 0; rr < rowLabels.length; rr++) {
            if (state[rr][c] === "check") state[rr][c] = "";
          }

          // Set this check
          state[r][c] = "check";

          // X out rest of row within the group
          for (let cc = start; cc <= end; cc++) {
            if (cc !== c) state[r][cc] = "x";
          }

          // X out same column for other rows
          for (let rr = 0; rr < rowLabels.length; rr++) {
            if (rr !== r) state[rr][c] = "x";
          }
        } else {
          // normal cycling
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
      const r = Number(cell.dataset.r);
      const c = Number(cell.dataset.c);
      const val = state[r][c];

      cell.classList.remove("x", "check");
      cell.textContent = "";

      if (val === "x") {
        cell.textContent = "✕";
        cell.classList.add("x");
      } else if (val === "check") {
        cell.textContent = "✓";
        cell.classList.add("check");
      }
    });
  }

  function clear() {
    for (let r = 0; r < state.length; r++) {
      for (let c = 0; c < state[r].length; c++) state[r][c] = "";
    }
    render();
  }

  render();
  return { state, render, clear };
}

// =====================
// BUILD GRIDS
// =====================
const grids = {};

const mainCols = [...FLAVOURS, ...TREATS, ...PASTRIES];

const groupsMain = [
  { start: 0, end: FLAVOURS.length - 1 },
  { start: FLAVOURS.length, end: FLAVOURS.length + TREATS.length - 1 },
  { start: FLAVOURS.length + TREATS.length, end: mainCols.length - 1 }
];

// thick dividers AFTER Spinach (index 4) and AFTER Turnover (index 9)
const sep1 = 4;  // Spinach
const sep2 = 9;  // Turnover


function saveAll() {
  const data = {
    main: grids.main?.state || null,
    pastryTreatGrid: grids.pastryTreatGrid?.state || null,
    pastryTreatExtra: grids.pastryTreatExtra?.state || null,
    treatGrid: grids.treatGrid?.state || null,
    treatFlavour: grids.treatFlavour?.state || null
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  flashSaved("Saved");
}

function copy(from, to) {
  if (!from || !to) return;
  for (let r = 0; r < to.length; r++) {
    for (let c = 0; c < to[r].length; c++) {
      to[r][c] = from[r]?.[c] || "";
    }
  }
}

function loadAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);

    copy(data.main, grids.main?.state);
    copy(data.pastryTreatGrid, grids.pastryTreatGrid?.state);
    copy(data.pastryTreatExtra, grids.pastryTreatExtra?.state);
    copy(data.treatGrid, grids.treatGrid?.state);
    copy(data.treatFlavour, grids.treatFlavour?.state);

    grids.main?.render();
    grids.pastryTreatGrid?.render();
    grids.pastryTreatExtra?.render();
    grids.treatGrid?.render();
    grids.treatFlavour?.render();

    flashSaved("Restored");
  } catch (e) {
    console.warn("Load failed:", e);
  }
}

// Main
grids.main = buildMatrixGrid({
  mountId: "mainGrid",
  rowLabels: NAMES,
  colLabels: mainCols,
  bandTitleTop: ["Flavour", "Treat", "Pastry"],
  addSeparatorsAtColIndex: [sep1, sep2],
  exclusiveGroups: groupsMain,
  exclusive: true,
  onAnyChange: saveAll
});

// Pastry (Choux..Shortcrust) x 5 blank columns
grids.pastryTreatGrid = buildMatrixGrid({
  mountId: "pastryTreatGrid",
  rowLabels: PASTRIES,
  colLabels: Array(FLAVOURS.length).fill(""),
  bandTitleLeft: "",
  bandTitleTop: "",
  showColHeaders: false,
  labelWidth: 140,
  exclusive: true,
  onAnyChange: saveAll
});

// Extra 5x5 to the right (Pastry x Treat)
grids.pastryTreatExtra = buildMatrixGrid({
  mountId: "pastryTreatExtraGrid",
  rowLabels: PASTRIES,
  colLabels: TREATS,
  bandTitleLeft: "",
  bandTitleTop: "",
  showColHeaders: false,
  labelWidth: 0,
  exclusive: true,
  onAnyChange: saveAll
});

// Treat list grid (Eclair..Turnover) x 5 blank columns
grids.treatGrid = buildMatrixGrid({
  mountId: "treatGrid",
  rowLabels: TREATS,
  colLabels: Array(FLAVOURS.length).fill(""),
  bandTitleLeft: "",
  bandTitleTop: "",
  showColHeaders: false,
  labelWidth: 140,
  exclusive: true,
  onAnyChange: saveAll
});

// Treat x Flavour summary (right)
grids.treatFlavour = buildMatrixGrid({
  mountId: "treatFlavourGrid",
  rowLabels: TREATS,
  colLabels: FLAVOURS,
  bandTitleLeft: "Treat",
  bandTitleTop: "Flavour",
  labelWidth: 120,
  exclusive: true,
  onAnyChange: saveAll
});

// Restore saved state
loadAll();

// Clear button
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (!confirm("Clear the entire puzzle?")) return;

    grids.main?.clear();
    grids.pastryTreatGrid?.clear();
    grids.pastryTreatExtra?.clear();
    grids.treatGrid?.clear();
    grids.treatFlavour?.clear();

    localStorage.removeItem(STORAGE_KEY);
    flashSaved("Cleared");
  });
}

