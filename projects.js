const projectList = document.querySelector("[data-project-list]");
const projectDialog = document.querySelector(".project-dialog");

if (projectList && projectDialog) {
  const gallery = projectDialog.querySelector(".project-dialog-gallery");
  const closeButton = projectDialog.querySelector(".dialog-close");
  let lastActiveCard = null;

  const openProject = (project, card) => {
    lastActiveCard = card;
    projectDialog.querySelector("#project-dialog-title").textContent = project.title;
    projectDialog.querySelector(".project-dialog-description").textContent = project.description;
    projectDialog.querySelector(".project-dialog-location").textContent = project.location;
    projectDialog.querySelector(".project-dialog-note").textContent =
      [project.cover, ...project.gallery].some((image) => image.includes("images.unsplash.com"))
        ? "Quyidagi rasmlar hozircha namunaviy. Haqiqiy obyekt rasmlari keyinroq kiritiladi."
        : "Ushbu loyiha rasmlari TREST 12 admin panelida yuklangan.";
    gallery.replaceChildren();

    [project.cover, ...project.gallery].filter(Boolean).forEach((src, index) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = `Loyiha uchun rasm ${index + 1}`;
      image.loading = index === 0 ? "eager" : "lazy";
      gallery.append(image);
    });

    projectDialog.showModal();
  };

  const renderProjects = async () => {
    try {
      const projects = await window.Trest12Data.getProjects();
      projectList.replaceChildren();
      const note = document.querySelector(".projects-note");
      if (note) {
        const hasSampleImages = projects.some((project) =>
          [project.cover, ...project.gallery].some((image) => image.includes("images.unsplash.com"))
        );
        note.textContent = hasSampleImages
          ? "Boshlang‘ich rasmlar namunaviy. Haqiqiy obyekt suratlarini admin panelida almashtirishingiz mumkin."
          : "Loyiha kartasini tanlab, loyiha ma’lumoti va rasmlar galereyasini ko‘ring.";
      }

      projects.forEach((project, index) => {
        const card = document.createElement("article");
        card.className = "project-card reveal is-visible";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-haspopup", "dialog");
        card.setAttribute("aria-controls", "project-dialog");

        const cover = document.createElement("img");
        cover.className = "project-photo";
        cover.src = project.cover;
        cover.alt = `${project.title} — loyiha rasmi`;
        cover.loading = "lazy";

        const info = document.createElement("div");
        info.className = "project-info";
        const number = document.createElement("span");
        number.className = "project-index";
        number.textContent = `${String(index + 1).padStart(2, "0")} / OBYEKT`;
        const title = document.createElement("h3");
        title.textContent = project.title;
        const description = document.createElement("p");
        description.textContent = project.description;
        const location = document.createElement("small");
        location.textContent = project.location;
        const details = document.createElement("span");
        details.className = "project-cta";
        details.append("Batafsil ko‘rish ");
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "↗";
        details.append(arrow);

        info.append(number, title, description, location, details);
        card.append(cover, info);
        card.addEventListener("click", () => openProject(project, card));
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProject(project, card);
          }
        });
        projectList.append(card);
      });
    } catch (error) {
      projectList.textContent = `Loyihalarni yuklab bo‘lmadi: ${error.message}`;
    }
  };

  closeButton.addEventListener("click", () => projectDialog.close());
  projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) projectDialog.close();
  });
  projectDialog.addEventListener("close", () => lastActiveCard?.focus());

  renderProjects();
}
