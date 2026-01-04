// Projects/todo.js
// A simple Todo and Habit Tracker application
// Made by Rezim Titoria

/* ---------- ID GENERATOR (Browser-safe) ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

let lastDeleted = null;

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- DOM ---------- */
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");

  const todoInput = document.getElementById("todoInput");
  const todoDate = document.getElementById("todoDate");
  const todoCategory = document.getElementById("todoCategory");
  const todoPriority = document.getElementById("todoPriority");
  const addTodoBtn = document.getElementById("addTodoBtn");
  const searchInput = document.getElementById("searchInput");
  const todoContainer = document.querySelector(".todo-container");
  const emptyState = document.getElementById("emptyState");

  const habitInput = document.getElementById("habitInput");
  const addHabitBtn = document.getElementById("addHabitBtn");
  const habitContainer = document.querySelector(".habit-container");

  const totalTodosEl = document.getElementById("totalTodos");
  const doneTodosEl = document.getElementById("doneTodos");
  const progressFill = document.getElementById("progressFill");

  const statsBtn = document.getElementById("statsBtn");
  const statsModal = document.getElementById("statsModal");
  const closeStats = document.getElementById("closeStats");

  /* ---------- STATE ---------- */
  let todos = JSON.parse(localStorage.getItem("todos")) || [];
  let habits = JSON.parse(localStorage.getItem("habits")) || [];
  let draggedId = null;

  /* ---------- THEME ---------- */
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
    themeToggle.textContent = "☀ Light Mode";
  }

  themeToggle.onclick = () => {
    body.classList.toggle("dark");
    localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
    themeToggle.textContent =
      body.classList.contains("dark") ? "☀ Light Mode" : "🌙 Dark Mode";
  };

  /* ---------- NOTIFICATION GUARD ---------- */
  function ensureNotificationPermission() {
    if (!("Notification" in window)) return;
    if (localStorage.getItem("notifAsked")) return;

    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        localStorage.setItem("notifAsked", "true");
      }
    });
  }

  /* ---------- TODOS ---------- */
  addTodoBtn.onclick = () => {
    if (!todoInput.value.trim() || !todoDate.value) return;

    ensureNotificationPermission();

    todos.push({
      id: generateId(),
      text: todoInput.value.trim(),
      date: todoDate.value,
      category: todoCategory.value,
      priority: todoPriority.value,
      done: false,
      notified: false
    });

    todoInput.value = "";
    todoDate.value = "";
    saveTodos();
  };

  searchInput.oninput = renderTodos;

  /* ---------- SAVE TODOS (Offline-first + Firestore) ---------- */
  async function saveTodos() {
    // 1️⃣ Save locally (offline-first)
    localStorage.setItem("todos", JSON.stringify(todos));

    // 2️⃣ Register background sync (safe even if offline)
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register("sync-todos");
      } catch (e) {
        console.warn("Background sync not available", e);
      }
    }

    // 3️⃣ Cloud sync (only if online & logged in)
    if (navigator.onLine && window.db && window.userId) {
      const { doc, setDoc } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );

      for (const t of todos) {
        await setDoc(
          doc(window.db, "users", window.userId, "todos", t.id),
          t
        );
      }
    }

    // 4️⃣ Update UI
    renderTodos();
  }


  /* ---------- RENDER TODOS ---------- */
  function renderTodos() {
    todoContainer.innerHTML = "";
    const query = searchInput.value.toLowerCase();
    const today = new Date().toISOString().split("T")[0];

    const visibleTodos = todos.filter(t =>
      t.text.toLowerCase().includes(query)
    );

    visibleTodos.forEach(t => {
      const card = document.createElement("div");
      card.className = `card priority-${t.priority} ${t.done ? "completed" : ""}`;
      card.dataset.id = t.id;
      card.draggable = true;

      // Overdue notification (ONCE)
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        !t.done &&
        !t.notified &&
        t.date < today
      ) {
        new Notification("⏰ Task Overdue", { body: t.text });
        t.notified = true;
        localStorage.setItem("todos", JSON.stringify(todos));
      }

      card.innerHTML = `
        <span>${t.text} (${t.category})</span>
        <span>${t.date}</span>
        <button class="toggle">✔</button>
        <button class="delete">🗑</button>
      `;

      todoContainer.appendChild(card);
    });

    updateDashboard();
    updateEmptyState();
  }

  /* ---------- TODO ACTIONS ---------- */
  todoContainer.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;

    const id = card.dataset.id;
    const index = todos.findIndex(t => t.id === id);

    if (e.target.classList.contains("toggle")) {
      todos[index].done = !todos[index].done;
      saveTodos();
    }

    if (e.target.classList.contains("delete")) {
      lastDeleted = { ...todos[index], index };
      todos.splice(index, 1);
      saveTodos();
      showUndo();
    }
  });

  /* ---------- DRAG & DROP (Local-only save) ---------- */
  todoContainer.addEventListener("dragstart", e => {
    draggedId = e.target.dataset.id;
    e.target.style.opacity = "0.5";
  });

  todoContainer.addEventListener("dragend", e => {
    e.target.style.opacity = "1";
    draggedId = null;
    saveTodos(); // local + background sync + Firestore
  });


  todoContainer.addEventListener("dragover", e => {
    e.preventDefault();

    const after = [...todoContainer.children].find(el =>
      e.clientY < el.offsetTop + el.offsetHeight / 2
    );

    const dragged = document.querySelector(`[data-id="${draggedId}"]`);
    if (!dragged) return;

    after
      ? todoContainer.insertBefore(dragged, after)
      : todoContainer.appendChild(dragged);

    todos = [...todoContainer.children].map(el =>
      todos.find(t => t.id === el.dataset.id)
    );
  });

  /* ---------- EMPTY STATE ---------- */
  function updateEmptyState() {
    emptyState.style.display = todos.length ? "none" : "block";
  }

  /* ---------- HABITS ---------- */
  addHabitBtn.onclick = () => {
    if (!habitInput.value.trim()) return;

    habits.push({ name: habitInput.value.trim(), streak: 0, lastDone: null });
    habitInput.value = "";
    saveHabits();
  };

  function today() {
    return new Date().toISOString().split("T")[0];
  }

  function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
    renderHabits();
  }

  function renderHabits() {
    habitContainer.innerHTML = "";
    habits.forEach((h, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.index = i;
      card.innerHTML = `
        <span>${h.name}</span>
        <span>🔥 ${h.streak} day streak</span>
        <button class="habit-done">Done</button>
        <button class="habit-delete">🗑</button>
      `;
      habitContainer.appendChild(card);
    });
  }

  habitContainer.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;
    const i = card.dataset.index;

    if (e.target.classList.contains("habit-done") &&
      habits[i].lastDone !== today()) {
      habits[i].streak++;
      habits[i].lastDone = today();
      saveHabits();
    }

    if (e.target.classList.contains("habit-delete")) {
      habits.splice(i, 1);
      saveHabits();
    }
  });

  /* ---------- UNDO ---------- */
  function showUndo() {
    const undo = document.createElement("div");
    undo.textContent = "Task deleted — Undo";
    undo.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 10px 16px;
      border-radius: 20px;
      cursor: pointer;
      z-index: 3000;
    `;

    undo.onclick = () => {
      todos.splice(lastDeleted.index, 0, lastDeleted);
      saveTodos();
      undo.remove();
    };

    document.body.appendChild(undo);
    setTimeout(() => undo.remove(), 4000);
  }

  /* ---------- DASHBOARD ---------- */
  function updateDashboard() {
    totalTodosEl.textContent = todos.length;
    const done = todos.filter(t => t.done).length;
    doneTodosEl.textContent = done;
    progressFill.style.width =
      todos.length ? (done / todos.length) * 100 + "%" : "0%";
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", e => {
      if (e.data.type === "SYNC_TODOS") {
        console.log("🔄 Background sync triggered");
        saveTodos(); // uploads to Firestore
      }
    });
  }


  /* ---------- STATS ---------- */
  statsBtn.onclick = () => {
    document.getElementById("statTotal").textContent = todos.length;
    document.getElementById("statDone").textContent =
      todos.filter(t => t.done).length;
    document.getElementById("statPending").textContent =
      todos.filter(t => !t.done).length;
    statsModal.style.display = "flex";
  };

  closeStats.onclick = () => {
    statsModal.style.display = "none";
  };

  /* ---------- LOAD TODOS FROM FIRESTORE ---------- */
  async function loadTodosFromCloud() {
    if (!window.db || !window.userId || !navigator.onLine) return;

    try {
      const { collection, getDocs } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );

      const snap = await getDocs(
        collection(window.db, "users", window.userId, "todos")
      );

      if (!snap.empty) {
        todos = snap.docs.map(d => d.data());
        localStorage.setItem("todos", JSON.stringify(todos));
        renderTodos();
        console.log("☁ Todos loaded from Firestore");
      }
    } catch (err) {
      console.error("Firestore load failed:", err);
    }
  }

  /* ---------- INIT ---------- */
  renderTodos();
  renderHabits();
  loadTodosFromCloud();
});
