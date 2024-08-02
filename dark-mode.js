// dark-mode

var app = document.getElementsByTagName("BODY")[0];

const darkMode = document.querySelector(".light-mode-button")

// darkMode.addEventListener("click", () => {
//   var app = document.getElementsByTagName("BODY")[0];
//   if (localStorage.lightMode == "dark" || false) {

//     localStorage.lightMode = "light";
//     app.setAttribute("light-mode", "light");
//   } else {

//     localStorage.lightMode = "dark";
//     app.setAttribute("light-mode", "dark");
//   }

// })

window.onload = () => {

  if (localStorage.lightMode == "dark" || false) {
    app.setAttribute("light-mode", "dark");
  }
  else {
    app.setAttribute("light-mode", "light");
  }
}

if (localStorage.lightMode == "dark") {
  app.setAttribute("light-mode", "dark");
}
function switchMode() {
  var app = document.getElementsByTagName("BODY")[0];
  if (localStorage.lightMode == "dark" || false) {

    localStorage.lightMode = "light";
    app.setAttribute("light-mode", "light");
  } else {

    localStorage.lightMode = "dark";
    app.setAttribute("light-mode", "dark");
  }
  let moon = document.getElementById("moon");
  if (moon.className == "moon") {
    moon.className = "sun";
    document.body.style.backgroundColor = "#141D26";
    document.body.style.color = "#fff";
  }
  else {
    moon.className = "moon";
    document.body.style.backgroundColor = "#fff";
    document.body.style.color = "#000";
  }
}

