document.addEventListener("DOMContentLoaded", () => {
  const app = document.body;
  const moon = document.getElementById("moon");

  if (localStorage.lightMode === "dark") {
    app.setAttribute("light-mode", "dark");
    moon.className = "sun";
  } else {
    app.setAttribute("light-mode", "light");
    moon.className = "moon";
  }

  const darkMode = document.querySelector(".night-toggle");
  const toggleTheme = () => {
    if (localStorage.lightMode === "dark") {
      localStorage.lightMode = "light";
      app.setAttribute("light-mode", "light");
      moon.className = "moon";
    } else {
      localStorage.lightMode = "dark";
      app.setAttribute("light-mode", "dark");
      moon.className = "sun";
    }
  };

  darkMode.addEventListener("click", (e) => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) return toggleTheme();

    // New theme grows out of the toggle as an expanding circle
    const r = darkMode.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    document.startViewTransition(toggleTheme).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.7, 0, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  });
});
