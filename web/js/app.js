/* Legacy static UI — use React app at http://localhost:8080 for full features */
const API = "/api";
const TOKEN_KEY = "medibook_token";
const GUEST_VIEWS = ["login", "register"];

function isLoggedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

function applyGuestMode() {
  document.body.classList.toggle("guest-mode", !isLoggedIn());
}

function navigate(viewId) {
  if (!isLoggedIn() && !GUEST_VIEWS.includes(viewId)) {
    viewId = "login";
    showToast("Please login or register first", "error");
  }
  if (isLoggedIn() && GUEST_VIEWS.includes(viewId)) viewId = "home";

  applyGuestMode();
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${viewId}`)?.classList.add("active");
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === viewId);
  });
}

function showToast(message, type) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  applyGuestMode();
  navigate(isLoggedIn() ? "home" : "login");
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (el.dataset.nav) navigate(el.dataset.nav);
    });
  });
});
