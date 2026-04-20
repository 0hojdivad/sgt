import { useState, useEffect, useRef } from "react";

// ─── Persistent Storage ──────────────────────────────────────────────────────
// ─── IndexedDB Storage (reliable on iOS PWA home screen) ─────────────────────
const DB_NAME = "sgt_db";
const DB_STORE = "data";
const DB_KEY = "appstate";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function loadData() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(DB_KEY);
      req.onsuccess = e => resolve(e.target.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function saveData(data) {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(data, DB_KEY);
  } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);

const EXERCISE_LIBRARY = [
  "Bench Press","Incline Bench","Overhead Press","Push-Up",
  "Squat","Leg Press","Romanian Deadlift","Lunges",
  "Deadlift","Barbell Row","Pull-Up","Lat Pulldown",
  "Bicep Curl","Hammer Curl","Tricep Pushdown","Skull Crusher",
  "Lateral Raise","Face Pull","Cable Fly","Dumbbell Fly",
  "Leg Curl","Leg Extension","Calf Raise","Hip Thrust",
  "Arnold Press","Shrug","Plank","Ab Wheel Rollout",
];

const CARDIO_LIBRARY = [
  "Running","Treadmill","Cycling","Stationary Bike","Rowing Machine",
  "Elliptical","Stair Climber","Jump Rope","Swimming","Walking",
  "HIIT","Battle Ropes","Assault Bike","Ski Erg","CrossTrainer",
];

function getSuggestion(history, exerciseName) {
  const sessions = [...history].reverse();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.name === exerciseName && ex.type !== "cardio" && ex.sets?.length > 0) {
        const lastSets = ex.sets.filter(s => s.weight && s.reps);
        if (lastSets.length > 0) {
          const maxWeight = Math.max(...lastSets.map(s => parseFloat(s.weight) || 0));
          const avgReps = Math.round(lastSets.reduce((a,b) => a + (parseInt(b.reps)||0), 0) / lastSets.length);
          return { weight: maxWeight, reps: avgReps, date: s.date };
        }
      }
    }
  }
  return null;
}

function getCardioSuggestion(history, name) {
  const sessions = [...history].reverse();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.name === name && ex.type === "cardio" && ex.duration) {
        return { duration: ex.duration, distance: ex.distance || "", date: s.date };
      }
    }
  }
  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "1rem",
    background: "#0a0a0a",
    color: "#e8e0d0",
    minHeight: "100vh",
    maxWidth: 430,
    margin: "0 auto",
    position: "relative",
    overflowX: "hidden",
  },
  header: {
    padding: "1.25rem 1.25rem 0",
    borderBottom: "2px solid #1e1e1e",
    background: "#0a0a0a",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#e8e0d0",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoAccent: { color: "#ff4d1c" },
  nav: {
    display: "flex",
    gap: 0,
    marginTop: "1rem",
  },
  navBtn: (active) => ({
    flex: 1,
    padding: "0.6rem 0.25rem",
    background: "none",
    border: "none",
    borderBottom: active ? "3px solid #ff4d1c" : "3px solid transparent",
    color: active ? "#ff4d1c" : "#555",
    fontSize: "0.7rem",
    fontFamily: "inherit",
    fontWeight: 700,
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "all 0.15s",
    textTransform: "uppercase",
  }),
  screen: {
    padding: "1.25rem 1.25rem 6rem",
    minHeight: "calc(100vh - 100px)",
  },
  sectionTitle: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    color: "#555",
    textTransform: "uppercase",
    marginBottom: "0.75rem",
    marginTop: "1.5rem",
  },
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 4,
    padding: "0.875rem 1rem",
    marginBottom: "0.5rem",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  cardActive: {
    background: "#111",
    border: "1px solid #ff4d1c",
    borderRadius: 4,
    padding: "0.875rem 1rem",
    marginBottom: "0.5rem",
    cursor: "pointer",
  },
  cardTitle: { fontSize: "1rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.125rem" },
  cardSub: { fontSize: "0.7rem", color: "#555", letterSpacing: "0.05em" },
  btn: {
    background: "#ff4d1c",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    padding: "0.75rem 1.25rem",
    fontSize: "0.75rem",
    fontFamily: "inherit",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  btnGhost: {
    background: "none",
    color: "#e8e0d0",
    border: "1px solid #333",
    borderRadius: 3,
    padding: "0.625rem 1rem",
    fontSize: "0.7rem",
    fontFamily: "inherit",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  btnDanger: {
    background: "none",
    color: "#555",
    border: "1px solid #222",
    borderRadius: 3,
    padding: "0.375rem 0.75rem",
    fontSize: "0.65rem",
    fontFamily: "inherit",
    fontWeight: 700,
    letterSpacing: "0.1em",
    cursor: "pointer",
  },
  input: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 3,
    color: "#e8e0d0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  inputSmall: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 3,
    color: "#e8e0d0",
    padding: "0.5rem 0.625rem",
    fontSize: "0.85rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    textAlign: "center",
  },
  tag: {
    display: "inline-block",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 2,
    padding: "0.2rem 0.5rem",
    fontSize: "0.65rem",
    color: "#777",
    letterSpacing: "0.08em",
    marginRight: "0.25rem",
    marginBottom: "0.25rem",
  },
  tagAccent: {
    display: "inline-block",
    background: "#1a0a05",
    border: "1px solid #ff4d1c44",
    borderRadius: 2,
    padding: "0.2rem 0.5rem",
    fontSize: "0.65rem",
    color: "#ff4d1c",
    letterSpacing: "0.08em",
    marginRight: "0.25rem",
    marginBottom: "0.25rem",
  },
  suggestion: {
    background: "#0d1a0d",
    border: "1px solid #1a4a1a",
    borderRadius: 3,
    padding: "0.375rem 0.625rem",
    fontSize: "0.65rem",
    color: "#4caf50",
    letterSpacing: "0.05em",
    marginBottom: "0.25rem",
  },
  fab: {
    position: "fixed",
    bottom: "5.5rem",
    right: "1.5rem",
    width: "3.375rem",
    height: "3.375rem",
    borderRadius: 3,
    background: "#ff4d1c",
    border: "none",
    color: "#fff",
    fontSize: "1.625rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 24px #ff4d1c44",
    zIndex: 50,
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "#000000cc",
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  modalContent: {
    background: "#0f0f0f",
    border: "1px solid #1e1e1e",
    borderRadius: "6px 6px 0 0",
    padding: "1.5rem 1.25rem 2.5rem",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "1.25rem",
    color: "#e8e0d0",
  },
  row: { display: "flex", gap: "0.5rem", alignItems: "center" },
  divider: { borderColor: "#1e1e1e", margin: "1rem 0" },
  badge: {
    background: "#ff4d1c22",
    color: "#ff4d1c",
    borderRadius: 2,
    padding: "0.125rem 0.4rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
};

// ─── RollingSelector ──────────────────────────────────────────────────────────────────────────────
function RollingSelector({ value, onChange, step = 1, min = 0, placeholder = "0" }) {
  const num = parseFloat(value) || 0;
  const hasValue = value !== "" && value !== undefined && value !== null;

  const startYRef = useRef(null);
  const accRef = useRef(0);

  function snap(raw) {
    const clamped = Math.max(min, raw);
    return Math.round(Math.round(clamped / step) * step * 100) / 100;
  }
  function decrement() { onChange(String(snap(num - step))); }
  function increment() { onChange(String(snap(num + step))); }

  function onTouchStart(e) {
    startYRef.current = e.touches[0].clientY;
    accRef.current = 0;
  }
  function onTouchMove(e) {
    e.preventDefault();
    const dy = startYRef.current - e.touches[0].clientY;
    accRef.current += dy;
    startYRef.current = e.touches[0].clientY;
    const threshold = 16;
    if (accRef.current > threshold) { accRef.current = 0; increment(); }
    else if (accRef.current < -threshold) { accRef.current = 0; decrement(); }
  }

  const prevVal = hasValue ? snap(num - step) : null;
  const nextVal = hasValue ? snap(num + step) : null;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        userSelect: "none", WebkitUserSelect: "none", touchAction: "none",
      }}
    >
      <div onClick={increment} style={{ color: "#3a3a3a", fontSize: "0.65rem", padding: "0.15rem 1rem", cursor: "pointer", lineHeight: 1 }}>▲</div>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "inherit", color: "#2a2a2a", lineHeight: 1, padding: "0.1rem 0", minHeight: "0.9rem", textAlign: "center" }}>
        {prevVal !== null ? prevVal : ""}
      </div>
      <div
        style={{
          background: "#1a1a1a", border: "1px solid #ff4d1c55", borderRadius: 3,
          padding: "0.4rem 0.5rem", fontSize: "1rem", fontWeight: 700, fontFamily: "inherit",
          color: hasValue ? "#e8e0d0" : "#333", minWidth: "3rem", textAlign: "center", lineHeight: 1.2,
        }}
      >
        {hasValue ? num : placeholder}
      </div>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "inherit", color: "#2a2a2a", lineHeight: 1, padding: "0.1rem 0", minHeight: "0.9rem", textAlign: "center" }}>
        {nextVal !== null ? nextVal : ""}
      </div>
      <div onClick={decrement} style={{ color: "#3a3a3a", fontSize: "0.65rem", padding: "0.15rem 1rem", cursor: "pointer", lineHeight: 1 }}>▼</div>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function ExercisePicker({ selected, onToggle, onDone, customExercises, onAddCustom, onDeleteCustom }) {
  const [pickerTab, setPickerTab] = useState("exercises");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const allExercises = [...EXERCISE_LIBRARY, ...(customExercises || []).filter(e => !e.startsWith("__cardio__"))];
  const allCardio = [...CARDIO_LIBRARY, ...(customExercises || []).filter(e => e.startsWith("__cardio__")).map(e => e.replace("__cardio__",""))];

  const isCardioTab = pickerTab === "cardio";
  const library = isCardioTab ? allCardio : allExercises;
  const filtered = library.filter(e => e.toLowerCase().includes(search.toLowerCase()));

  // Cardio items are stored with a prefix in the selected array to distinguish them
  const cardioKey = (name) => `__cardio__${name}`;
  const isSelected = (name) => isCardioTab ? selected.includes(cardioKey(name)) : selected.includes(name);
  const handleToggle = (name) => isCardioTab ? onToggle(cardioKey(name)) : onToggle(name);
  const isCustom = (name) => isCardioTab
    ? (customExercises||[]).includes(cardioKey(name))
    : (customExercises||[]).filter(e => !e.startsWith("__cardio__")).includes(name);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const key = isCardioTab ? cardioKey(trimmed) : trimmed;
    const allKeys = [...(customExercises||[]), ...EXERCISE_LIBRARY, ...CARDIO_LIBRARY.map(c => cardioKey(c))];
    if (allKeys.map(e => e.toLowerCase()).includes(key.toLowerCase())) {
      setNewName(""); setCreating(false); return;
    }
    onAddCustom(key);
    onToggle(key);
    setNewName(""); setCreating(false);
  }

  const selectedCount = selected.length;

  return (
    <div style={S.modal}>
      <div style={S.modalContent}>
        <div style={S.modalTitle}>Add to Workout</div>

        {/* Tab switcher */}
        <div style={{ display: "flex", marginBottom: "0.75rem", border: "1px solid #2a2a2a", borderRadius: 3, overflow: "hidden" }}>
          {["exercises","cardio"].map(t => (
            <button key={t} onClick={() => { setPickerTab(t); setSearch(""); setCreating(false); }} style={{
              flex: 1, padding: "0.5rem", background: pickerTab === t ? "#ff4d1c" : "none",
              border: "none", color: pickerTab === t ? "#fff" : "#555",
              fontFamily: "inherit", fontWeight: 700, fontSize: "0.7rem",
              letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            }}>{t === "exercises" ? "⚡ Weights" : "🏃 Cardio"}</button>
          ))}
        </div>

        <input
          style={{ ...S.input, marginBottom: "0.625rem" }}
          placeholder={`Search ${isCardioTab ? "cardio" : "exercises"}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {!creating ? (
          <button
            style={{ ...S.btnGhost, width: "100%", marginBottom: "0.625rem", fontSize: "0.7rem" }}
            onClick={() => setCreating(true)}
          >
            ＋ Create New {isCardioTab ? "Cardio" : "Exercise"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.625rem" }}>
            <input
              style={{ ...S.input, flex: 1 }}
              placeholder={`${isCardioTab ? "Cardio" : "Exercise"} name...`}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
              autoFocus
            />
            <button style={{ ...S.btn, padding: "0.625rem 0.875rem", fontSize: "0.75rem" }} onClick={handleCreate}>Add</button>
            <button style={{ ...S.btnGhost, padding: "0.625rem 0.75rem" }} onClick={() => { setCreating(false); setNewName(""); }}>✕</button>
          </div>
        )}

        <div style={{ maxHeight: "18rem", overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ color: "#444", fontSize: "0.75rem", textAlign: "center", padding: "1.25rem 0" }}>
              No results. Create one above.
            </div>
          )}
          {filtered.map(name => {
            const active = isSelected(name);
            const custom = isCustom(name);
            return (
              <div key={name} style={{
                padding: "0.7rem 0.875rem", marginBottom: "0.25rem", borderRadius: 3,
                background: active ? (isCardioTab ? "#0a1a0a" : "#1a0a05") : "#141414",
                border: active ? `1px solid ${isCardioTab ? "#4caf5044" : "#ff4d1c44"}` : "1px solid #1e1e1e",
                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: "0.85rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }} onClick={() => handleToggle(name)}>
                  <span>{name}</span>
                  {custom && (
                    <span style={{
                      fontSize: "0.6rem", letterSpacing: "0.1em",
                      color: isCardioTab ? "#4caf50" : "#ff4d1c",
                      background: isCardioTab ? "#0a1a0a" : "#1a0a05",
                      border: `1px solid ${isCardioTab ? "#4caf5033" : "#ff4d1c33"}`,
                      borderRadius: 2, padding: "1px 5px"
                    }}>CUSTOM</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {active && <span style={{ color: isCardioTab ? "#4caf50" : "#ff4d1c", fontSize: "1rem" }}>✓</span>}
                  {custom && (
                    <button
                      style={{ ...S.btnDanger, padding: "0.2rem 0.45rem", fontSize: "0.7rem" }}
                      onClick={e => { e.stopPropagation(); onDeleteCustom(isCardioTab ? cardioKey(name) : name); }}
                    >✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button style={{ ...S.btn, flex: 1 }} onClick={onDone}>
            Done ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Workouts Tab ─────────────────────────────────────────────────────────────
function WorkoutsTab({ data, setData, setActiveSession, setTab }) {
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [picking, setPicking] = useState(false);
  const [selectedEx, setSelectedEx] = useState([]);

  function openCreate() { setName(""); setSelectedEx([]); setEditId(null); setCreating(true); }
  function openEdit(w) { setName(w.name); setSelectedEx([...w.exercises]); setEditId(w.id); setCreating(true); }

  function saveWorkout() {
    if (!name.trim() || selectedEx.length === 0) return;
    const workout = { id: editId || uid(), name: name.trim(), exercises: selectedEx };
    const updated = editId
      ? data.workouts.map(w => w.id === editId ? workout : w)
      : [...data.workouts, workout];
    const next = { ...data, workouts: updated };
    setData(next); saveData(next);
    setCreating(false);
  }

  function deleteWorkout(id) {
    const next = { ...data, workouts: data.workouts.filter(w => w.id !== id) };
    setData(next); saveData(next);
  }

  function startWorkout(w) {
    const session = {
      id: uid(),
      workoutId: w.id,
      workoutName: w.name,
      date: today(),
      exercises: w.exercises.map(key => {
        const isCardio = key.startsWith("__cardio__");
        const name = isCardio ? key.replace("__cardio__", "") : key;
        return isCardio
          ? { name, type: "cardio", duration: "", distance: "" }
          : { name, sets: [{ weight: "", reps: "" }] };
      }),
      startedAt: Date.now(),
      finished: false,
    };
    const next = { ...data, activeSession: session };
    setData(next); saveData(next);
    setActiveSession(session);
    setTab("log");
  }

  return (
    <div style={S.screen}>
      <div style={S.sectionTitle}>My Workouts</div>
      {data.workouts.length === 0 && (
        <div style={{ color: "#333", fontSize: "0.85rem", textAlign: "center", padding: "2.5rem 0" }}>
          No workouts yet.<br />Hit + to build your first.
        </div>
      )}
      {data.workouts.map(w => (
        <div key={w.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={S.cardTitle}>{w.name}</div>
              <div style={{ marginTop: "0.375rem" }}>
                {w.exercises.map(e => {
                  const isCardio = e.startsWith("__cardio__");
                  const label = isCardio ? `🏃 ${e.replace("__cardio__","")}` : e;
                  return <span key={e} style={isCardio ? { ...S.tag, color: "#4caf50", borderColor: "#1a4a1a" } : S.tag}>{label}</span>;
                })}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 10 }}>
              <button style={S.btn} onClick={() => startWorkout(w)}>Start</button>
              <button style={S.btnGhost} onClick={() => openEdit(w)}>Edit</button>
              <button style={S.btnDanger} onClick={() => deleteWorkout(w.id)}>Del</button>
            </div>
          </div>
        </div>
      ))}

      <button style={S.fab} onClick={openCreate}>＋</button>

      {creating && (
        <div style={S.modal}>
          <div style={S.modalContent}>
            <div style={S.modalTitle}>{editId ? "Edit Workout" : "New Workout"}</div>
            <input
              style={{ ...S.input, marginBottom: 12 }}
              placeholder="Workout name (e.g. Push Day)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div style={S.sectionTitle}>Exercises</div>
            <div style={{ marginBottom: 8 }}>
              {selectedEx.map(e => <span key={e} style={S.tagAccent}>{e} ×</span>)}
              {selectedEx.length === 0 && <span style={{ color: "#333", fontSize: "0.75rem" }}>None selected</span>}
            </div>
            <button style={{ ...S.btnGhost, width: "100%", marginBottom: 16 }} onClick={() => setPicking(true)}>
              + Choose Exercises
            </button>
            <div style={S.row}>
              <button style={{ ...S.btn, flex: 1 }} onClick={saveWorkout}>Save</button>
              <button style={{ ...S.btnGhost }} onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {picking && (
        <ExercisePicker
          selected={selectedEx}
          onToggle={ex => setSelectedEx(s => s.includes(ex) ? s.filter(x => x !== ex) : [...s, ex])}
          onDone={() => setPicking(false)}
          customExercises={data.customExercises || []}
          onAddCustom={name => {
            const next = { ...data, customExercises: [...(data.customExercises || []), name] };
            setData(next); saveData(next);
          }}
          onDeleteCustom={name => {
            const next = { ...data, customExercises: (data.customExercises || []).filter(e => e !== name) };
            setData(next); saveData(next);
            setSelectedEx(s => s.filter(e => e !== name));
          }}
        />
      )}
    </div>
  );
}

// ─── Active Log Tab ───────────────────────────────────────────────────────────
function LogTab({ data, setData }) {
  const session = data.activeSession;
  const [picking, setPicking] = useState(false);
  const [pickerSelected, setPickerSelected] = useState([]);

  if (!session) {
    return (
      <div style={{ ...S.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏋️</div>
        <div style={{ color: "#333", fontSize: "0.85rem", textAlign: "center" }}>
          No active session.<br />Start a workout from the Workouts tab.
        </div>
      </div>
    );
  }

  function updateSet(exIdx, setIdx, field, val) {
    const next = { ...data };
    const s = { ...next.activeSession };
    s.exercises = s.exercises.map((ex, ei) =>
      ei !== exIdx ? ex : {
        ...ex,
        sets: ex.sets.map((set, si) => si !== setIdx ? set : { ...set, [field]: val })
      }
    );
    next.activeSession = s;
    setData(next); saveData(next);
  }

  function addSet(exIdx) {
    const next = { ...data };
    const s = { ...next.activeSession };
    s.exercises = s.exercises.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      const prevWeight = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].weight : "";
      return { ...ex, sets: [...ex.sets, { weight: prevWeight, reps: "" }] };
    });
    next.activeSession = s;
    setData(next); saveData(next);
  }

  function removeSet(exIdx, setIdx) {
    const next = { ...data };
    const s = { ...next.activeSession };
    s.exercises = s.exercises.map((ex, ei) =>
      ei !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) }
    );
    next.activeSession = s;
    setData(next); saveData(next);
  }

  function finishSession() {
    const finished = { ...session, finished: true, finishedAt: Date.now() };
    const next = {
      ...data,
      activeSession: null,
      history: [finished, ...data.history],
    };
    setData(next); saveData(next);
  }

  function openPicker() {
    setPickerSelected(session.exercises.map(e =>
      e.type === "cardio" ? `__cardio__${e.name}` : e.name
    ));
    setPicking(true);
  }

  function applyPickerSelection(newSelected) {
    const existing = session.exercises.map(e => e.type === "cardio" ? `__cardio__${e.name}` : e.name);
    const toAdd = newSelected.filter(n => !existing.includes(n));
    const next = { ...data };
    const s = { ...next.activeSession };
    s.exercises = [
      ...s.exercises,
      ...toAdd.map(key => {
        const isCardio = key.startsWith("__cardio__");
        const name = isCardio ? key.replace("__cardio__", "") : key;
        return isCardio
          ? { name, type: "cardio", duration: "", distance: "", addedMidSession: true }
          : { name, sets: [{ weight: "", reps: "" }], addedMidSession: true };
      }),
    ];
    next.activeSession = s;
    setData(next); saveData(next);
    setPicking(false);
  }

  const elapsed = Math.floor((Date.now() - session.startedAt) / 60000);

  return (
    <div style={S.screen}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "0.08em" }}>{session.workoutName}</div>
          <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "0.125rem" }}>{session.date} · {elapsed}m elapsed</div>
        </div>
        <button style={{ ...S.btn, fontSize: "0.7rem" }} onClick={finishSession}>Finish</button>
      </div>
      <hr style={S.divider} />

      {session.exercises.map((ex, ei) => {
        const isCardio = ex.type === "cardio";
        const suggestion = isCardio ? getCardioSuggestion(data.history, ex.name) : getSuggestion(data.history, ex.name);

        return (
          <div key={ei} style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem" }}>{isCardio ? "🏃" : "⚡"}</span>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.06em" }}>{ex.name}</div>
              {ex.addedMidSession && (
                <span style={{
                  fontSize: "0.6rem", letterSpacing: "0.1em", color: "#4caf50",
                  background: "#0d1a0d", border: "1px solid #1a4a1a",
                  borderRadius: 2, padding: "1px 5px"
                }}>+ ADDED</span>
              )}
            </div>

            {isCardio ? (
              <>
                {suggestion && (
                  <div style={S.suggestion}>
                    ↑ Last: {suggestion.duration}min{suggestion.distance ? ` · ${suggestion.distance}km` : ""} — {suggestion.date}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.65rem", color: "#444", textAlign: "center", marginBottom: "0.25rem" }}>DURATION (min)</div>
                    <RollingSelector
                      value={ex.duration}
                      step={5}
                      placeholder={suggestion ? String(suggestion.duration) : "0"}
                      onChange={val => {
                        const next = { ...data };
                        const s = { ...next.activeSession };
                        s.exercises = s.exercises.map((x, i) => i !== ei ? x : { ...x, duration: val });
                        next.activeSession = s;
                        setData(next); saveData(next);
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.65rem", color: "#444", textAlign: "center", marginBottom: "0.25rem" }}>DISTANCE (km)</div>
                    <RollingSelector
                      value={ex.distance}
                      step={0.5}
                      placeholder={suggestion ? String(suggestion.distance) : "0"}
                      onChange={val => {
                        const next = { ...data };
                        const s = { ...next.activeSession };
                        s.exercises = s.exercises.map((x, i) => i !== ei ? x : { ...x, distance: val });
                        next.activeSession = s;
                        setData(next); saveData(next);
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {suggestion && (
                  <div style={S.suggestion}>
                    ↑ Last: {suggestion.weight}kg × {suggestion.reps}r — {suggestion.date}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "2rem 1fr 1fr 2rem", gap: "0.375rem", alignItems: "center", marginBottom: "0.25rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#444", textAlign: "center" }}>#</div>
                  <div style={{ fontSize: "0.65rem", color: "#444", textAlign: "center" }}>KG</div>
                  <div style={{ fontSize: "0.65rem", color: "#444", textAlign: "center" }}>REPS</div>
                  <div />
                </div>
                {ex.sets.map((set, si) => (
                  <div key={si} style={{ display: "grid", gridTemplateColumns: "2rem 1fr 1fr 2rem", gap: "0.375rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "#444", textAlign: "center" }}>{si + 1}</div>
                    <RollingSelector
                      value={set.weight}
                      step={2.5}
                      placeholder={suggestion ? String(suggestion.weight) : "0"}
                      onChange={val => updateSet(ei, si, "weight", val)}
                    />
                    <RollingSelector
                      value={set.reps}
                      step={1}
                      placeholder={suggestion ? String(suggestion.reps) : "0"}
                      onChange={val => updateSet(ei, si, "reps", val)}
                    />
                    <button
                      style={{ ...S.btnDanger, padding: "0.375rem 0.5rem", fontSize: "0.85rem", lineHeight: 1 }}
                      onClick={() => removeSet(ei, si)}
                    >×</button>
                  </div>
                ))}
                <button style={{ ...S.btnGhost, fontSize: "0.65rem", marginTop: "0.25rem" }} onClick={() => addSet(ei)}>
                  + Add Set
                </button>
              </>
            )}
            <hr style={S.divider} />
          </div>
        );
      })}

      {/* Add Exercise button */}
      <button
        style={{ ...S.btnGhost, width: "100%", marginTop: "0.25rem", padding: "0.875rem", fontSize: "0.75rem" }}
        onClick={openPicker}
      >
        ＋ Add Exercise
      </button>

      {picking && (
        <ExercisePicker
          selected={pickerSelected}
          onToggle={ex => setPickerSelected(s => s.includes(ex) ? s.filter(x => x !== ex) : [...s, ex])}
          onDone={() => applyPickerSelection(pickerSelected)}
          customExercises={data.customExercises || []}
          onAddCustom={name => {
            const next = { ...data, customExercises: [...(data.customExercises || []), name] };
            setData(next); saveData(next);
          }}
          onDeleteCustom={name => {
            const next = { ...data, customExercises: (data.customExercises || []).filter(e => e !== name) };
            setData(next); saveData(next);
            setPickerSelected(s => s.filter(e => e !== name));
          }}
        />
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ data, setData }) {
  const [expanded, setExpanded] = useState(null);

  function deleteSession(id) {
    const next = { ...data, history: data.history.filter(s => s.id !== id) };
    setData(next); saveData(next);
  }

  if (data.history.length === 0) {
    return (
      <div style={{ ...S.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📋</div>
        <div style={{ color: "#333", fontSize: "0.85rem", textAlign: "center" }}>No history yet.<br />Complete a session to see it here.</div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.sectionTitle}>Session History</div>
      {data.history.map(s => {
        const isOpen = expanded === s.id;
        const totalSets = s.exercises.reduce((a, ex) => a + ex.sets.filter(st => st.weight || st.reps).length, 0);
        const duration = s.finishedAt ? Math.round((s.finishedAt - s.startedAt) / 60000) : null;
        return (
          <div key={s.id} style={{ ...S.card, cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
              onClick={() => setExpanded(isOpen ? null : s.id)}>
              <div style={{ cursor: "pointer" }}>
                <div style={S.cardTitle}>{s.workoutName}</div>
                <div style={{ fontSize: "0.7rem", color: "#444", marginTop: "0.125rem" }}>
                  {s.date} · {s.exercises.length} exercises · {totalSets} sets{duration ? ` · ${duration}m` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                <button style={{ ...S.btnDanger }} onClick={() => deleteSession(s.id)}>Del</button>
                <span style={{ color: "#444", fontSize: "1rem", cursor: "pointer" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ marginTop: "0.875rem" }}>
                <hr style={S.divider} />
                {s.exercises.map((ex, ei) => (
                  <div key={ei} style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>
                      {ex.type === "cardio" ? "🏃 " : "⚡ "}{ex.name}
                    </div>
                    {ex.type === "cardio" ? (
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>
                        {ex.duration ? `${ex.duration} min` : "—"}
                        {ex.distance ? ` · ${ex.distance} km` : ""}
                      </div>
                    ) : (
                      ex.sets.map((set, si) => (
                        <div key={si} style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "#888", marginBottom: "0.2rem" }}>
                          <span style={{ color: "#444" }}>Set {si + 1}</span>
                          <span>{set.weight || "—"} kg</span>
                          <span>× {set.reps || "—"} reps</span>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  workouts: [],
  history: [],
  activeSession: null,
  customExercises: [],
};

const TABS = ["workouts", "log", "history"];
const TAB_LABELS = ["Workouts", "Active", "History"];
const TAB_ICONS = ["⚡", "🔥", "📋"];

const FONT_SIZES = [1, 1.5, 2];
const FONT_SIZE_KEY = "sgt_fontsize";

export default function App() {
  const [data, setData] = useState(null); // null = loading
  const [tab, setTab] = useState("workouts");
  const [activeSession, setActiveSession] = useState(null);
  const [fontIdx, setFontIdx] = useState(() => {
    try { return parseInt(localStorage.getItem(FONT_SIZE_KEY) || "0"); } catch { return 0; }
  });

  const scale = FONT_SIZES[fontIdx] || 1;

  // Load from IndexedDB on mount
  useEffect(() => {
    loadData().then(saved => {
      const d = saved || DEFAULT_DATA;
      setData(d);
      if (d.activeSession) setActiveSession(d.activeSession);
    });
  }, []);

  // Apply scale to html root so every element in the page inherits it
  useEffect(() => {
    document.documentElement.style.fontSize = `${scale * 20}px`;
    return () => { document.documentElement.style.fontSize = ""; };
  }, [scale]);

  function decreaseFont() {
    const next = Math.max(0, fontIdx - 1);
    setFontIdx(next);
    try { localStorage.setItem(FONT_SIZE_KEY, String(next)); } catch {}
  }
  function increaseFont() {
    const next = Math.min(FONT_SIZES.length - 1, fontIdx + 1);
    setFontIdx(next);
    try { localStorage.setItem(FONT_SIZE_KEY, String(next)); } catch {}
  }

  // Show loading screen while IndexedDB loads
  if (!data) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "#333", fontSize: "0.8rem", letterSpacing: "0.2em" }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={S.app}>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; background: #111; }
        ::-webkit-scrollbar-thumb { background: #222; }
        body { margin: 0; background: #0a0a0a; }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={S.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L4 7V17C4 23.5 9.5 29 16 30C22.5 29 28 23.5 28 17V7L16 2Z" fill="#1a1a1a" stroke="#ff4d1c" strokeWidth="1.5"/>
              <polyline points="9,13 16,9 23,13" fill="none" stroke="#ff4d1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9,17 16,13 23,17" fill="none" stroke="#ff4d1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9,21 16,17 23,21" fill="none" stroke="#ff4d1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>SGT</span>
                {data.activeSession && <span style={S.badge}>LIVE</span>}
              </div>
              <div style={{ fontSize: "0.55rem", fontWeight: 400, letterSpacing: "0.18em", color: "#444", marginTop: "0.1rem" }}>
                SIMPLE GYM TRACKER
              </div>
            </div>
          </div>

          {/* Font size controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <button
              onClick={decreaseFont}
              disabled={fontIdx === 0}
              aria-label="Decrease font size"
              style={{
                background: "none",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                color: fontIdx === 0 ? "#333" : "#888",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.75rem",
                width: "2rem",
                height: "2rem",
                cursor: fontIdx === 0 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >A−</button>
            <div style={{ display: "flex", gap: "0.2rem" }}>
              {FONT_SIZES.map((_, i) => (
                <div key={i} style={{
                  width: "0.3rem", height: "0.3rem", borderRadius: "50%",
                  background: i === fontIdx ? "#ff4d1c" : "#2a2a2a",
                  transition: "background 0.15s",
                }} />
              ))}
            </div>
            <button
              onClick={increaseFont}
              disabled={fontIdx === FONT_SIZES.length - 1}
              aria-label="Increase font size"
              style={{
                background: "none",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                color: fontIdx === FONT_SIZES.length - 1 ? "#333" : "#e8e0d0",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.85rem",
                width: "2rem",
                height: "2rem",
                cursor: fontIdx === FONT_SIZES.length - 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >A+</button>
          </div>
        </div>

        <div style={S.nav}>
          {TABS.map((t, i) => (
            <button key={t} style={S.navBtn(tab === t)} onClick={() => setTab(t)}>
              {TAB_ICONS[i]} {TAB_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Screens */}
      {tab === "workouts" && (
        <WorkoutsTab data={data} setData={setData} setActiveSession={setActiveSession} setTab={setTab} />
      )}
      {tab === "log" && <LogTab data={data} setData={setData} />}
      {tab === "history" && <HistoryTab data={data} setData={setData} />}
    </div>
  );
}
