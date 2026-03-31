// --- State ---
let currentDate = todayStr();

// --- Helpers ---
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(date) {
  return `baby-${date}`;
}

function getData(date) {
  const raw = localStorage.getItem(storageKey(date));
  return raw ? JSON.parse(raw) : { sleeps: [], feeds: [] };
}

function setData(date, data) {
  localStorage.setItem(storageKey(date), JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // overnight
  return diff;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

// --- Tab Switching ---
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");

    if (tab.dataset.tab === "today") renderToday();
    if (tab.dataset.tab === "trends" && typeof renderCharts === "function") renderCharts();
  });
});

// --- Date Navigation ---
const dateInput = document.getElementById("log-date");
dateInput.value = currentDate;

dateInput.addEventListener("change", () => {
  currentDate = dateInput.value;
  renderLog();
});

document.getElementById("date-prev").addEventListener("click", () => {
  const d = new Date(currentDate);
  d.setDate(d.getDate() - 1);
  currentDate = d.toISOString().slice(0, 10);
  dateInput.value = currentDate;
  renderLog();
});

document.getElementById("date-next").addEventListener("click", () => {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + 1);
  currentDate = d.toISOString().slice(0, 10);
  dateInput.value = currentDate;
  renderLog();
});

// --- Sleep CRUD ---
const sleepForm = document.getElementById("sleep-form");
const sleepList = document.getElementById("sleep-list");

document.getElementById("add-sleep-btn").addEventListener("click", () => {
  resetSleepForm();
  sleepForm.classList.remove("hidden");
});

document.getElementById("sleep-cancel").addEventListener("click", () => {
  sleepForm.classList.add("hidden");
});

sleepForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = getData(currentDate);
  const editId = document.getElementById("sleep-edit-id").value;
  const entry = {
    id: editId || uid(),
    start: document.getElementById("sleep-start").value,
    end: document.getElementById("sleep-end").value,
    note: document.getElementById("sleep-note").value.trim(),
  };

  if (editId) {
    const idx = data.sleeps.findIndex((s) => s.id === editId);
    if (idx !== -1) data.sleeps[idx] = entry;
  } else {
    data.sleeps.push(entry);
  }

  setData(currentDate, data);
  sleepForm.classList.add("hidden");
  renderLog();
});

function resetSleepForm() {
  document.getElementById("sleep-edit-id").value = "";
  document.getElementById("sleep-start").value = "";
  document.getElementById("sleep-end").value = "";
  document.getElementById("sleep-note").value = "";
}

function editSleep(id) {
  const data = getData(currentDate);
  const entry = data.sleeps.find((s) => s.id === id);
  if (!entry) return;
  document.getElementById("sleep-edit-id").value = entry.id;
  document.getElementById("sleep-start").value = entry.start;
  document.getElementById("sleep-end").value = entry.end;
  document.getElementById("sleep-note").value = entry.note || "";
  sleepForm.classList.remove("hidden");
}

function deleteSleep(id) {
  const data = getData(currentDate);
  data.sleeps = data.sleeps.filter((s) => s.id !== id);
  setData(currentDate, data);
  renderLog();
}

// --- Feed CRUD ---
const feedForm = document.getElementById("feed-form");
const feedList = document.getElementById("feed-list");

document.getElementById("add-feed-btn").addEventListener("click", () => {
  resetFeedForm();
  feedForm.classList.remove("hidden");
});

document.getElementById("feed-cancel").addEventListener("click", () => {
  feedForm.classList.add("hidden");
});

feedForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = getData(currentDate);
  const editId = document.getElementById("feed-edit-id").value;
  const entry = {
    id: editId || uid(),
    time: document.getElementById("feed-time").value,
    volume: parseInt(document.getElementById("feed-volume").value, 10),
    note: document.getElementById("feed-note").value.trim(),
  };

  if (editId) {
    const idx = data.feeds.findIndex((f) => f.id === editId);
    if (idx !== -1) data.feeds[idx] = entry;
  } else {
    data.feeds.push(entry);
  }

  setData(currentDate, data);
  feedForm.classList.add("hidden");
  renderLog();
});

function resetFeedForm() {
  document.getElementById("feed-edit-id").value = "";
  document.getElementById("feed-time").value = "";
  document.getElementById("feed-volume").value = "";
  document.getElementById("feed-note").value = "";
}

function editFeed(id) {
  const data = getData(currentDate);
  const entry = data.feeds.find((f) => f.id === id);
  if (!entry) return;
  document.getElementById("feed-edit-id").value = entry.id;
  document.getElementById("feed-time").value = entry.time;
  document.getElementById("feed-volume").value = entry.volume;
  document.getElementById("feed-note").value = entry.note || "";
  feedForm.classList.remove("hidden");
}

function deleteFeed(id) {
  const data = getData(currentDate);
  data.feeds = data.feeds.filter((f) => f.id !== id);
  setData(currentDate, data);
  renderLog();
}

// --- Render Log Tab ---
function renderLog() {
  const data = getData(currentDate);

  // Sleeps
  let totalSleepMin = 0;
  sleepList.innerHTML = data.sleeps
    .map((s) => {
      const dur = minutesBetween(s.start, s.end);
      totalSleepMin += dur;
      const noteHtml = s.note ? `<div class="entry-note">${escHtml(s.note)}</div>` : "";
      return `
        <div class="entry-item">
          <div class="entry-info">
            <div class="entry-time">${formatTime12(s.start)}${s.end ? " - " + formatTime12(s.end) : " (ongoing)"}</div>
            <div class="entry-detail">${s.end ? formatDuration(dur) : "In progress"}</div>
            ${noteHtml}
          </div>
          <div class="entry-actions">
            <button class="btn-edit" onclick="editSleep('${s.id}')" aria-label="Edit">&#9998;</button>
            <button class="btn-delete" onclick="deleteSleep('${s.id}')" aria-label="Delete">&times;</button>
          </div>
        </div>`;
    })
    .join("");

  document.getElementById("sleep-total").textContent = totalSleepMin > 0 ? formatDuration(totalSleepMin) : "";

  // Feeds
  let totalFeedMl = 0;
  feedList.innerHTML = data.feeds
    .map((f) => {
      totalFeedMl += f.volume;
      const noteHtml = f.note ? `<div class="entry-note">${escHtml(f.note)}</div>` : "";
      return `
        <div class="entry-item">
          <div class="entry-info">
            <div class="entry-time">${formatTime12(f.time)}</div>
            <div class="entry-detail">${f.volume} mL</div>
            ${noteHtml}
          </div>
          <div class="entry-actions">
            <button class="btn-edit" onclick="editFeed('${f.id}')" aria-label="Edit">&#9998;</button>
            <button class="btn-delete" onclick="deleteFeed('${f.id}')" aria-label="Delete">&times;</button>
          </div>
        </div>`;
    })
    .join("");

  document.getElementById("feed-total").textContent = totalFeedMl > 0 ? `${totalFeedMl} mL` : "";
}

// --- Render Today Tab ---
function renderToday() {
  const date = todayStr();
  const data = getData(date);

  // Totals
  let totalSleepMin = 0;
  data.sleeps.forEach((s) => { totalSleepMin += minutesBetween(s.start, s.end); });
  let totalFeedMl = 0;
  data.feeds.forEach((f) => { totalFeedMl += f.volume; });

  document.getElementById("today-sleep-total").textContent = formatDuration(totalSleepMin);
  document.getElementById("today-feed-total").textContent = `${totalFeedMl} mL`;

  // Timeline
  const items = [];
  data.sleeps.forEach((s) => {
    items.push({ type: "sleep", sortTime: s.start, html: buildTimelineItem(s, "sleep") });
  });
  data.feeds.forEach((f) => {
    items.push({ type: "feed", sortTime: f.time, html: buildTimelineItem(f, "feed") });
  });
  items.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

  const timeline = document.getElementById("timeline");
  if (items.length === 0) {
    timeline.innerHTML = '<div class="timeline-empty">No entries yet today</div>';
  } else {
    timeline.innerHTML = items.map((i) => i.html).join("");
  }
}

function buildTimelineItem(entry, type) {
  let desc, time;
  if (type === "sleep") {
    time = formatTime12(entry.start);
    const dur = minutesBetween(entry.start, entry.end);
    desc = `Sleep${entry.end ? " — " + formatDuration(dur) : " (ongoing)"}`;
  } else {
    time = formatTime12(entry.time);
    desc = `Feed — ${entry.volume} mL`;
  }
  const noteHtml = entry.note ? `<div class="timeline-note">${escHtml(entry.note)}</div>` : "";
  return `
    <div class="timeline-item ${type}">
      <div class="timeline-time">${time}</div>
      <div>
        <div class="timeline-desc">${desc}</div>
        ${noteHtml}
      </div>
    </div>`;
}

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Init ---
renderLog();

// --- Service Worker Registration ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
