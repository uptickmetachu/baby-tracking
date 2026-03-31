// --- Charts (Trends Tab) ---
let sleepChart = null;
let feedChart = null;
let currentRange = 7;

// Range picker
document.querySelectorAll(".range-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentRange = parseInt(btn.dataset.days, 10);
    renderCharts();
  });
});

function getDateRange(days) {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function renderCharts() {
  const dates = getDateRange(currentRange);
  const labels = dates.map((d) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  });

  const sleepData = [];
  const feedData = [];

  dates.forEach((date) => {
    const data = getData(date);
    let sleepMin = 0;
    data.sleeps.forEach((s) => { sleepMin += minutesBetween(s.start, s.end); });
    sleepData.push(+(sleepMin / 60).toFixed(1));

    let feedMl = 0;
    data.feeds.forEach((f) => { feedMl += f.volume; });
    feedData.push(feedMl);
  });

  // Sleep chart
  const sleepCtx = document.getElementById("sleep-chart").getContext("2d");
  if (sleepChart) sleepChart.destroy();
  sleepChart = new Chart(sleepCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Sleep (hours)",
        data: sleepData,
        backgroundColor: "#8b6fc0",
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Hours" } },
        x: { ticks: { maxRotation: 45 } },
      },
    },
  });

  // Feed chart
  const feedCtx = document.getElementById("feed-chart").getContext("2d");
  if (feedChart) feedChart.destroy();
  feedChart = new Chart(feedCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Feeds (mL)",
        data: feedData,
        backgroundColor: "#e8913a",
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "mL" } },
        x: { ticks: { maxRotation: 45 } },
      },
    },
  });
}
