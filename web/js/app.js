const API = "/api";
const TOKEN_KEY = "medibook_token";
const USER_KEY = "medibook_user";

const GUEST_VIEWS = ["login", "register"];
const AUTH_VIEWS = ["home", "book", "appointments", "about"];

let doctors = [];
let capacityPerSlot = 3;
let selectedSlot = null;
let ws = null;
let wsReconnectTimer = null;

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  disconnectRealtime();
}

function isLoggedIn() {
  return Boolean(getToken());
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearSession();
    updateAuthUI();
    navigate("login", { silent: true });
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function formatDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(slot) {
  const [h] = slot.split(":");
  const hour = parseInt(h, 10);
  const h12 = hour % 12 || 12;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${h12}:00 ${ampm}`;
}

function escapeHtml(str) {
  const el = document.createElement("div");
  el.textContent = str;
  return el.innerHTML;
}

function getDoctorById(id) {
  return doctors.find((d) => d.id === id);
}

function isDateValidForDoctor(doctorId, dateStr) {
  const doctor = getDoctorById(doctorId);
  if (!doctor || !dateStr) return false;
  const day = new Date(dateStr + "T12:00:00").getDay();
  return doctor.workingDays.includes(day);
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add("hidden"), 4500);
}

function setFormMessage(el, text, type) {
  if (!el) return;
  el.textContent = text || "";
  el.className = `form-message ${type || ""}`.trim();
}

function applyAuthGate() {
  const loggedIn = isLoggedIn();
  document.querySelectorAll(".auth-only-view").forEach((el) => {
    el.classList.toggle("guest-blocked", !loggedIn);
  });
  document.getElementById("live-sync-badge")?.classList.toggle("hidden", !loggedIn);
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const user = getUser();

  applyAuthGate();
  document.querySelectorAll(".nav-guest").forEach((el) => el.classList.toggle("hidden", loggedIn));
  document.querySelectorAll(".nav-auth").forEach((el) => el.classList.toggle("hidden", !loggedIn));

  const headerUser = document.getElementById("header-user");
  const greeting = document.getElementById("user-greeting");
  if (loggedIn && user) {
    headerUser?.classList.remove("hidden");
    if (greeting) greeting.textContent = `Hi, ${user.name.split(" ")[0]}`;
    const bookName = document.getElementById("book-user-name");
    if (bookName) bookName.textContent = user.name;
    connectRealtime();
  } else {
    headerUser?.classList.add("hidden");
    disconnectRealtime();
  }
}

function resolveView(viewId) {
  if (!isLoggedIn()) {
    return GUEST_VIEWS.includes(viewId) ? viewId : "login";
  }
  if (GUEST_VIEWS.includes(viewId)) return "home";
  return AUTH_VIEWS.includes(viewId) ? viewId : "home";
}

function navigate(viewId, { replaceHash = true, silent = false } = {}) {
  const target = resolveView(viewId);

  if (!silent && AUTH_VIEWS.includes(viewId) && !isLoggedIn()) {
    showToast("Please login or register to continue", "error");
  }

  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const el = document.getElementById(`view-${target}`);
  el?.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === target);
  });

  document.querySelector(".main-nav")?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (replaceHash && isLoggedIn()) {
    history.replaceState(null, "", `#${target}`);
  } else if (replaceHash && !isLoggedIn()) {
    history.replaceState(null, "", target === "register" ? "#register" : "#login");
  }

  if (target === "appointments") loadAppointments();
  if (target === "book") {
    resetBookingForm();
    onDoctorChange();
  }
  if (target === "home" && doctors.length === 0) loadDoctors();
}

function connectRealtime() {
  if (!isLoggedIn() || ws) return;

  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${proto}//${location.host}/api/ws`);

  ws.onopen = () => {
    document.getElementById("live-sync-badge")?.classList.add("connected");
  };

  ws.onmessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.data);
      handleRealtimeEvent(type, payload);
    } catch {
      /* ignore */
    }
  };

  ws.onclose = () => {
    ws = null;
    document.getElementById("live-sync-badge")?.classList.remove("connected");
    if (isLoggedIn()) {
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = setTimeout(connectRealtime, 3000);
    }
  };
}

function disconnectRealtime() {
  clearTimeout(wsReconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
  document.getElementById("live-sync-badge")?.classList.remove("connected");
}

function handleRealtimeEvent(type, payload) {
  const onBook = document.getElementById("view-book")?.classList.contains("active");
  const doctorId = document.getElementById("doctor-select")?.value;
  const date = document.getElementById("appointment-date")?.value;

  if (type === "slots_updated" || type === "queue_updated") {
    if (onBook && doctorId && date && payload?.doctorId === doctorId && payload?.date === date) {
      loadSlots();
      loadLiveQueue();
    } else if (onBook && doctorId && date) {
      loadSlots();
    }
  }

  if (type === "appointments_updated") {
    if (document.getElementById("view-appointments")?.classList.contains("active")) {
      loadAppointments();
    }
    if (onBook) loadLiveQueue();
  }
}

async function loadDoctors() {
  const data = await api("/doctors");
  doctors = data.doctors;
  capacityPerSlot = data.capacityPerSlot || 3;
  renderDoctorCards(document.getElementById("doctor-cards-preview"));
  populateDoctorSelect();
}

function renderDoctorCards(container) {
  if (!container) return;
  container.innerHTML = doctors
    .map(
      (d) => `
    <article class="doctor-card">
      <p class="dept">${escapeHtml(d.department)}</p>
      <h3>${escapeHtml(d.name)}</h3>
      <p class="doctor-days">Available: ${escapeHtml(d.availableDays || "")}</p>
      <p class="doctor-days">${capacityPerSlot} patients per hour</p>
    </article>`
    )
    .join("");
}

function populateDoctorSelect() {
  const select = document.getElementById("doctor-select");
  if (!select) return;
  const current = select.value;
  select.innerHTML =
    '<option value="">Choose a specialist…</option>' +
    doctors
      .map(
        (d) =>
          `<option value="${d.id}">${d.name} — ${d.department} (${d.availableDays})</option>`
      )
      .join("");
  if (current) select.value = current;
}

function setMinDate() {
  const input = document.getElementById("appointment-date");
  if (!input) return;
  const t = new Date();
  input.min = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function onDoctorChange() {
  const doctorId = document.getElementById("doctor-select")?.value;
  const info = document.getElementById("doctor-availability-info");
  const dateInput = document.getElementById("appointment-date");

  document.getElementById("date-availability-hint")?.classList.add("hidden");
  document.getElementById("queue-live-panel")?.classList.add("hidden");

  if (!doctorId) {
    info?.classList.add("hidden");
    return;
  }

  const doctor = getDoctorById(doctorId);
  if (doctor && info) {
    info.classList.remove("hidden");
    info.innerHTML = `<strong>${escapeHtml(doctor.name)}</strong> works on <em>${escapeHtml(doctor.availableDays)}</em>. Up to <strong>${capacityPerSlot} patients</strong> per hourly slot.`;
  }

  if (dateInput?.value && !isDateValidForDoctor(doctorId, dateInput.value)) {
    dateInput.value = "";
  }
  loadSlots();
}

function onDateChange() {
  const doctorId = document.getElementById("doctor-select")?.value;
  const date = document.getElementById("appointment-date")?.value;
  const dateHint = document.getElementById("date-availability-hint");

  if (!doctorId || !date) {
    dateHint?.classList.add("hidden");
    loadSlots();
    return;
  }

  const doctor = getDoctorById(doctorId);
  const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long" });

  if (!isDateValidForDoctor(doctorId, date)) {
    dateHint?.classList.remove("hidden");
    dateHint.className = "date-hint error";
    dateHint.textContent = `${dayName} is not a working day. Available: ${doctor?.availableDays}.`;
    loadSlots();
    return;
  }

  dateHint?.classList.remove("hidden");
  dateHint.className = "date-hint ok";
  dateHint.textContent = `${dayName} — pick a slot (${capacityPerSlot} patients max per hour).`;
  loadSlots();
}

function resetBookingForm() {
  selectedSlot = null;
  document.getElementById("selected-slot").value = "";
  document.getElementById("btn-confirm-booking").disabled = true;
  document.getElementById("suggestions-panel")?.classList.add("hidden");
  document.getElementById("queue-live-panel")?.classList.add("hidden");
  setFormMessage(document.getElementById("form-message"), "", "");
}

function renderSlotButton(s) {
  const label = formatTime(s.time);
  const countLabel = `${s.booked}/${s.capacity}`;

  if (s.reason === "not_working_day") {
    return `<button type="button" class="slot-btn off-day" disabled>${label}<span>Off day</span></button>`;
  }
  if (!s.available && s.reason === "full") {
    return `<button type="button" class="slot-btn full" disabled>${label}<span>Full ${countLabel}</span></button>`;
  }
  if (s.available && s.booked > 0) {
    return `<button type="button" class="slot-btn partial" data-time="${s.time}">${label}<span>${countLabel} · ${s.remaining} left</span></button>`;
  }
  if (s.available) {
    return `<button type="button" class="slot-btn available" data-time="${s.time}">${label}<span>Open · 0/${s.capacity}</span></button>`;
  }
  return `<button type="button" class="slot-btn booked" disabled>${label}<span>${countLabel}</span></button>`;
}

async function loadSlots() {
  const doctorId = document.getElementById("doctor-select")?.value;
  const date = document.getElementById("appointment-date")?.value;
  const grid = document.getElementById("slot-grid");

  selectedSlot = null;
  document.getElementById("selected-slot").value = "";
  document.getElementById("btn-confirm-booking").disabled = true;
  document.getElementById("suggestions-panel")?.classList.add("hidden");

  if (!doctorId || !date) {
    grid.innerHTML = '<p class="slot-placeholder">Select a doctor and date to see slots.</p>';
    document.getElementById("queue-live-panel")?.classList.add("hidden");
    return;
  }

  if (!isDateValidForDoctor(doctorId, date)) {
    grid.innerHTML = '<p class="slot-placeholder">No slots — doctor does not work on this weekday.</p>';
    try {
      const data = await api(`/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
      if (data.suggestions?.length) showSuggestions(data.suggestions, data.workingDayLabels);
    } catch {
      /* optional */
    }
    return;
  }

  grid.innerHTML = '<p class="slot-placeholder">Loading slots…</p>';

  try {
    const data = await api(`/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);

    if (!data.doctorAvailable) {
      grid.innerHTML = `<p class="slot-placeholder">Not available on ${escapeHtml(data.selectedDayName || "this day")}.</p>`;
      if (data.suggestions?.length) showSuggestions(data.suggestions, data.workingDayLabels);
      return;
    }

    grid.innerHTML = data.slots.map((s) => renderSlotButton(s)).join("");

    grid.querySelectorAll(".slot-btn.available, .slot-btn.partial").forEach((btn) => {
      btn.addEventListener("click", () => selectSlot(btn.dataset.time));
    });

    if (data.suggestions?.length && data.slots.every((s) => !s.available)) {
      showSuggestions(data.suggestions);
    }

    if (selectedSlot) loadLiveQueue();
    else document.getElementById("queue-live-panel")?.classList.add("hidden");
  } catch (err) {
    grid.innerHTML = `<p class="slot-placeholder error">${escapeHtml(err.message)}</p>`;
  }
}

async function loadLiveQueue() {
  const doctorId = document.getElementById("doctor-select")?.value;
  const date = document.getElementById("appointment-date")?.value;
  const time = selectedSlot;
  const panel = document.getElementById("queue-live-panel");
  const list = document.getElementById("queue-live-list");

  if (!doctorId || !date || !time || !panel || !list) return;

  try {
    const { queue } = await api(
      `/slots/queue?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
    );
    panel.classList.remove("hidden");
    if (!queue.length) {
      list.innerHTML = "<li>No bookings in this slot yet.</li>";
      return;
    }
    list.innerHTML = queue
      .map(
        (q) => `<li class="${q.isYou ? "you" : ""}">
          <span>#${q.queuePosition}</span> ${escapeHtml(q.patientName)}
          <em>${escapeHtml(q.status)}</em>${q.delayMinutes ? ` (+${q.delayMinutes}m delay)` : ""}
          ${q.isYou ? " (you)" : ""}
        </li>`
      )
      .join("");
  } catch {
    panel.classList.add("hidden");
  }
}

function selectSlot(time) {
  selectedSlot = time;
  document.getElementById("selected-slot").value = time;
  document.getElementById("btn-confirm-booking").disabled = false;

  document.querySelectorAll(".slot-btn.available, .slot-btn.partial").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.time === time);
  });

  loadLiveQueue();
}

function showSuggestions(suggestions, workingDayLabels) {
  const panel = document.getElementById("suggestions-panel");
  const list = document.getElementById("suggestions-list");
  if (!panel || !list || !suggestions?.length) return;

  list.innerHTML = suggestions
    .map(
      (s) => `<li>
        <button type="button" class="suggestion-btn" data-date="${s.date}" data-time="${s.time}">
          ${formatDate(s.date)} at ${formatTime(s.time)}${s.remaining != null ? ` (${s.remaining} spots)` : ""}
        </button>
      </li>`
    )
    .join("");

  panel.querySelector("h4").textContent = "Suggested available slots:";
  list.querySelectorAll(".suggestion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("appointment-date").value = btn.dataset.date;
      onDateChange();
      setTimeout(() => selectSlot(btn.dataset.time), 300);
    });
  });

  panel.classList.remove("hidden");
}

async function loadAppointments() {
  const list = document.getElementById("appointments-list");
  const empty = document.getElementById("empty-appointments");

  try {
    const { appointments } = await api("/appointments");
    if (!appointments.length) {
      list.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }
    empty?.classList.add("hidden");
    list.innerHTML = appointments
      .map((apt) => {
        let actions = "";
        if (apt.status === "scheduled" || apt.status === "waiting") {
          actions += `<button type="button" class="btn btn-ghost btn-sm btn-start" data-start="${apt.id}">Start treatment</button>`;
        }
        if (apt.status === "in_progress") {
          actions += `<button type="button" class="btn btn-primary btn-sm btn-delay" data-delay="${apt.id}">Report delay (+15 min)</button>`;
        }
        if (apt.status === "delayed") {
          actions += `<span class="delay-badge">Delayed +${apt.delayMinutes}m — others notified</span>`;
        }
        if (apt.status === "waiting") {
          actions += `<span class="delay-badge">Waiting — delay alert received</span>`;
        }

        return `
      <article class="appointment-card">
        <div>
          <span class="badge">${escapeHtml(apt.status)}</span>
          <h3>${escapeHtml(apt.doctor?.name || "Doctor")}</h3>
          <p class="meta">${escapeHtml(apt.doctor?.department || "")}</p>
          <p class="meta">${formatDate(apt.date)} at ${formatTime(apt.time)} · Queue #${apt.queuePosition} of ${capacityPerSlot}</p>
          ${apt.reason ? `<p class="meta">Note: ${escapeHtml(apt.reason)}</p>` : ""}
          <p class="meta notify-note">Email &amp; SMS sent on booking; delay alerts sent to waiting patients</p>
          <div class="apt-actions">${actions}</div>
        </div>
        <button type="button" class="btn-cancel" data-cancel="${apt.id}">Cancel</button>
      </article>`;
      })
      .join("");

    list.querySelectorAll("[data-start]").forEach((btn) => {
      btn.addEventListener("click", () => startTreatment(btn.dataset.start));
    });
    list.querySelectorAll("[data-delay]").forEach((btn) => {
      btn.addEventListener("click", () => reportDelay(btn.dataset.delay));
    });
  } catch (err) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

async function startTreatment(id) {
  try {
    const res = await api(`/appointments/${id}/start`, { method: "POST" });
    showToast(res.message || "Treatment started");
    loadAppointments();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function reportDelay(id) {
  try {
    const res = await api(`/appointments/${id}/delay`, {
      method: "POST",
      body: JSON.stringify({ extraMinutes: 15 }),
    });
    showToast(res.message || "Waiting patients notified via email & SMS");
    loadAppointments();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const msg = document.getElementById("register-message");
  const body = Object.fromEntries(new FormData(e.target));

  try {
    const { user, token } = await api("/auth/register", { method: "POST", body: JSON.stringify(body) });
    setSession(token, user);
    updateAuthUI();
    await loadDoctors();
    showToast("Account created! Welcome to MediBook.");
    navigate("home");
  } catch (err) {
    setFormMessage(msg, err.message, "error");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const msg = document.getElementById("login-message");
  const body = Object.fromEntries(new FormData(e.target));

  try {
    const { user, token } = await api("/auth/login", { method: "POST", body: JSON.stringify(body) });
    setSession(token, user);
    updateAuthUI();
    await loadDoctors();
    showToast(`Welcome back, ${user.name.split(" ")[0]}!`);
    navigate("home");
  } catch (err) {
    setFormMessage(msg, err.message, "error");
  }
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const msg = document.getElementById("form-message");
  const doctorId = document.getElementById("doctor-select").value;
  const date = document.getElementById("appointment-date").value;
  const time = selectedSlot;
  const reason = document.getElementById("reason").value;

  if (!isDateValidForDoctor(doctorId, date)) {
    setFormMessage(msg, "Selected date is not a working day for this doctor.", "error");
    return;
  }
  if (!time) {
    setFormMessage(msg, "Please select a slot.", "error");
    return;
  }

  try {
    const result = await api("/appointments", {
      method: "POST",
      body: JSON.stringify({ doctorId, date, time, reason }),
    });
    setFormMessage(msg, result.message, "success");
    showToast(result.message);
    resetBookingForm();
    document.getElementById("reason").value = "";
    setTimeout(() => navigate("appointments"), 1200);
  } catch (err) {
    setFormMessage(msg, err.message, "error");
    if (err.data?.suggestions?.length) {
      showSuggestions(err.data.suggestions);
    }
  }
}

function getInitialViewFromHash() {
  if (!isLoggedIn()) return (location.hash || "").replace("#", "") === "register" ? "register" : "login";
  const hash = (location.hash || "").replace("#", "");
  return AUTH_VIEWS.includes(hash) ? hash : "home";
}

function initNavigation() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (el.dataset.nav) navigate(el.dataset.nav);
    });
  });

  document.getElementById("logo-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(isLoggedIn() ? "home" : "login");
  });

  document.getElementById("hero-book-btn")?.addEventListener("click", () => {
    navigate(isLoggedIn() ? "book" : "login");
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    clearSession();
    updateAuthUI();
    showToast("Logged out");
    navigate("login");
  });

  document.querySelector(".menu-toggle")?.addEventListener("click", () => {
    const nav = document.querySelector(".main-nav");
    const open = nav.classList.toggle("open");
    document.querySelector(".menu-toggle").setAttribute("aria-expanded", open);
  });

  window.addEventListener("hashchange", () => {
    if (!isLoggedIn()) {
      const h = (location.hash || "").replace("#", "");
      navigate(h === "register" ? "register" : "login", { replaceHash: false });
      return;
    }
    const hash = (location.hash || "").replace("#", "");
    if (AUTH_VIEWS.includes(hash)) navigate(hash, { replaceHash: false });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();
  updateAuthUI();
  setMinDate();

  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  document.getElementById("register-form")?.addEventListener("submit", handleRegister);
  document.getElementById("booking-form")?.addEventListener("submit", handleBookingSubmit);
  document.getElementById("doctor-select")?.addEventListener("change", onDoctorChange);
  document.getElementById("appointment-date")?.addEventListener("change", onDateChange);

  document.getElementById("appointments-list")?.addEventListener("click", async (e) => {
    const id = e.target.dataset?.cancel;
    if (!id) return;
    try {
      await api(`/appointments/${id}`, { method: "DELETE" });
      showToast("Appointment cancelled");
      loadAppointments();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  const boot = async () => {
    navigate(getInitialViewFromHash(), { replaceHash: false });
    if (isLoggedIn()) {
      try {
        const { user } = await api("/auth/me");
        setSession(getToken(), user);
        updateAuthUI();
        await loadDoctors();
      } catch {
        clearSession();
        updateAuthUI();
        navigate("login", { silent: true });
      }
    }
  };

  boot();
});
