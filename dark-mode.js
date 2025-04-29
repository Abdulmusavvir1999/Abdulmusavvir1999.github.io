// dark-mode

var app = document.getElementsByTagName("BODY")[0];

const darkMode = document.querySelector(".night-toggle")

darkMode.addEventListener("click", () => {
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
  }
  else {
    moon.className = "moon";
  }

})



if (localStorage.lightMode == "dark") {
  app.setAttribute("light-mode", "dark");
}

window.onload = () => {

  if (localStorage.lightMode == "dark" || false) {
    app.setAttribute("light-mode", "dark");
    moon.className = "sun";

  }
  else {
    app.setAttribute("light-mode", "light");
    moon.className = "moon";

  }

}


