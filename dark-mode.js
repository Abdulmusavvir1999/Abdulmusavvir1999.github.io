window.onload = () => {
  const app = document.body;
  const moon = document.getElementById("moon");

  if (localStorage.lightMode === "dark") {
    app.setAttribute("light-mode", "dark");
    moon.className = "sun";
  } else {
    app.setAttribute("light-mode", "light");
    moon.className = "moon";
  }
};

const darkMode = document.querySelector(".night-toggle");
darkMode.addEventListener("click", () => {
  const app = document.body;
  const moon = document.getElementById("moon");

  if (localStorage.lightMode === "dark") {
    localStorage.lightMode = "light";
    app.setAttribute("light-mode", "light");
    moon.className = "moon";
  } else {
    localStorage.lightMode = "dark";
    app.setAttribute("light-mode", "dark");
    moon.className = "sun";
  }
});




