function nextState(current) {
  return current === "" ? "check" : current === "check" ? "x" : "";
}
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
const  = document.getElementById("btnClear");
console.log("clearBtn found?", !!clearBtn);

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
  return current === "" ? "check" : current === "check" ? "x" : "";
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
  exclusiveGroups = null,   // ✅ NEW
  showColHeaders = true,
  addSeparatorsAtColIndex = [],
  onAnyChange = () => {}
}) {

  const state = Array.from({ length: rowLabels.length }, () =>
    Array.from({ length: colLabels.length }, () => "")
  );
// --- NEW: optional section ranges for "exclusive" logic (inclusive indexes) ---
function getGroupRange(colIndex) {
  // If no section ranges provided, treat whole grid as one group
  if (!Array.isArray(exclusiveGroups) || exclusiveGroups.length === 0) {
    return { start: 0, end: colLabels.length - 1 };
  }
  // Find the group this column belongs to
  for (const g of exclusiveGroups) {
    if (colIndex >= g.start && colIndex <= g.end) return g;
  }
  // Fallback
  return { start: 0, end: colLabels.length - 1 };
}

  const mount = document.getElementById(mountId);
  mount.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.gridTemplateColumns =
    `${labelWidth}px repeat(${colLabels.length}, var(--cell))`;

  // Category band (can be one string or 3 section titles)
if (bandTitleTop || bandTitleLeft) {
  grid.appendChild(makeCell(bandTitleLeft, ["cell", "band", "rowlabel"]));

  // If bandTitleTop is an array like ["Flavour","Treat","Pastry"]
  if (Array.isArray(bandTitleTop)) {
    const sections = bandTitleTop.length;                 // 3
    const per = Math.floor(colLabels.length / sections);  // 15/3 = 5

    bandTitleTop.forEach((t, i) => {
      const band = makeCell(t, ["cell", "band"]);
      band.style.gridColumn = `span ${per}`;
      // add divider after Flavour and Treat
      if (i < sections - 1) band.classList.add("band-divider");
      grid.appendChild(band);
    });

  } else {
    // Single title spanning all columns
    const bandTop = makeCell(bandTitleTop, ["cell", "band"]);
    bandTop.style.gridColumn = `span ${colLabels.length}`;
    grid.appendChild(bandTop);
  }
}


 // Column headers
if (showColHeaders) {
  grid.appendChild(makeCell("", ["cell", "header", "rowlabel"]));
  colLabels.forEach((label, c) => {
    const h = makeCell(label, ["cell", "header"]);
    if (addSeparatorsAtColIndex.includes(c)) h.classList.add("separator");
    grid.appendChild(h);
  });
}



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
  const { start, end } = getGroupRange(c);

  // Clear other checks ONLY inside this group (row + column)
  for (let cc = start; cc <= end; cc++) {
    if (state[r][cc] === "check") state[r][cc] = "";
  }
  for (let rr = 0; rr < rowLabels.length; rr++) {
    if (state[rr][c] === "check") state[rr][c] = "";
  }

  // Set this check
  state[r][c] = "check";

  // X out rest of the row ONLY inside this group
  for (let cc = start; cc <= end; cc++) {
    if (cc !== c) state[r][cc] = "x";
  }

  // X out the same column for other rows (same column is already in this group)
  for (let rr = 0; rr < rowLabels.length; rr++) {
    if (rr !== r) state[rr][c] = "x";
  }
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
    main: grids.main?.state || null,
    pastryGrid: grids.pastryGrid?.state || null,
    pastryTreatExtra: grids.pastryTreatExtra?.state || null,
    treatGrid: grids.treatGrid?.state || null,
    treatFlavour: grids.treatFlavour?.state || null
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  flashSaved("Saved");
}

function loadAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    copy(data.main, grids.main?.state);
    copy(data.pastryGrid, grids.pastryGrid?.state);
    copy(data.pastryTreatExtra, grids.pastryTreatExtra?.state);
    copy(data.treatGrid, grids.treatGrid?.state);
    copy(data.treatFlavour, grids.treatFlavour?.state);

    grids.main?.render();
    grids.pastryGrid?.render();
    grids.pastryTreatExtra?.render();
    grids.treatGrid?.render();
    grids.treatFlavour?.render();

    flashSaved("Restored");
  } catch (e) {
    console.warn("Load failed:", e);
  }
}

function copy(from, to) {
  if (!from || !to) return;
  for (let r = 0; r < to.length; r++) {
    for (let c = 0; c < to[r].length; c++) {
      to[r][c] = from[r]?.[c] || "";
    }
  }
}

// =====================
// BUILD GRIDS
// =====================
const grids = {};

const mainCols = [...FLAVOURS, ...TREATS, ...PASTRIES];

// groups for exclusive behaviour inside the MAIN grid only
const groupsMain = [
  { start: 0, end: FLAVOURS.length - 1 },                               // Apple..Spinach
  { start: FLAVOURS.length, end: FLAVOURS.length + TREATS.length - 1 }, // Eclair..Turnover
  { start: FLAVOURS.length + TREATS.length, end: mainCols.length - 1 }  // Choux..Shortcrust
];

// thick dividers AFTER Spinach and AFTER Turnover
const sep1 = FLAVOURS.length - 1;
const sep2 = FLAVOURS.length + TREATS.length - 1;

// MAIN GRID
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

// LEFT (BLUE): Treat rows (Eclair..Turnover) × Flavour columns (Apple..Spinach)
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

// LEFT (YELLOW): Pastry rows (Choux..Shortcrust) × 5 blank columns (aligned under Apple..Spinach)
grids.pastryTreatGrid = buildMatrixGrid({
  mountId: "pastryTreatGrid",                 // ✅ MUST match HTML id
  rowLabels: PASTRIES,                        // Choux..Shortcrust only
  colLabels: Array(FLAVOURS.length).fill(""), // 5 columns wide
  bandTitleLeft: "",
  bandTitleTop: "",
  showColHeaders: false,
  labelWidth: 140,
  exclusive: true,
  onAnyChange: saveAll
});



// EXTRA 5x5 (RIGHT of pastry grid): Pastry rows × Treat columns
grids.pastryTreatExtra = buildMatrixGrid({
  mountId: "pastryTreatExtraGrid",
  rowLabels: PASTRIES,
  colLabels: TREATS,
  bandTitleLeft: "",
  bandTitleTop: "",
  showColHeaders: false,
  labelWidth: 0,     // no label column in this block
  exclusive: true,
  onAnyChange: saveAll
});


// Restore saved state
loadAll();

// Clear button clears EVERYTHING
// Clear button
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (!confirm("Clear the entire puzzle?")) return;

    grids.main.clear();
    grids.pastryTreatGrid?.clear?.(); // if you named it pastryTreat, use that name
    grids.pastryTreatExtra?.clear();
    grids.treatGrid?.clear();
    grids.treatFlavour?.clear();

    localStorage.removeItem(STORAGE_KEY);
    flashSaved("Cleared");
  });
}






