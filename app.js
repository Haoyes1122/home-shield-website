(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const mobileMode = window.matchMedia("(max-width: 700px)");

  function updateNavigation() {
  if (!nav) return;

  const pages = {
    about: "about.html",
    solutions: "solutions.html",
    bn1000: "bn1000.html",
    process: "process.html",
    passport: "passport.html",
    contact: "contact.html"
  };

  nav.querySelectorAll("a[data-anchor]").forEach(link => {
    const anchor = link.dataset.anchor;
    if (pages[anchor]) {
      link.href = `./${pages[anchor]}`;
    }
  });
}

  updateNavigation();
  if (mobileMode.addEventListener) mobileMode.addEventListener("change", updateNavigation);
  else if (mobileMode.addListener) mobileMode.addListener(updateNavigation);

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
