let currentUser = null;

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || "#/";
  const route = hash.replace("#/", "") || "home";

  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  // Target page
  const targetPage = document.getElementById(`${route}-page`);

  // Protected routes
  const protectedRoutes = ["profile", "requests"];
  const adminRoutes = ["employees", "departments", "accounts"];

  if (protectedRoutes.includes(route) && !currentUser) {
    navigateTo("#/login");
    return;
  }

  if (adminRoutes.includes(route) && (!currentUser || !currentUser.isAdmin)) {
    navigateTo("#/");
    return;
  }

  if (targetPage) {
    targetPage.classList.add("active");
  } else {
    document.getElementById("home-page").classList.add("active");
  }
}

// Listen for hash change
window.addEventListener("hashchange", handleRouting);

// Initial load
window.addEventListener("load", () => {
  if (!window.location.hash) {
    navigateTo("#/");
  } else {
    handleRouting();
  }
});

// Logout button
document.addEventListener("click", (e) => {
  if (e.target.id === "logoutBtn") {
    currentUser = null;
    document.body.className = "not-authenticated";
    navigateTo("#/");
  }
});
