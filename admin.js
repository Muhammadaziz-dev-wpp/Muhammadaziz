const authPanel = document.querySelector("[data-admin-auth-panel]");
const authForm = document.querySelector("[data-admin-auth-form]");
const dashboard = document.querySelector("[data-admin-dashboard]");

if (authPanel && authForm && dashboard) {
  const authDescription = document.querySelector("[data-auth-description]");
  const confirmation = document.querySelector("[data-auth-confirmation]");
  const confirmationInput = document.querySelector("#admin-password-confirm");
  const authMessage = document.querySelector("[data-auth-message]");
  const authSubmit = document.querySelector("[data-auth-submit]");
  const projectList = document.querySelector("[data-admin-project-list]");
  const projectMessage = document.querySelector("[data-project-message]");
  const visitorsBody = document.querySelector("[data-admin-visitors]");
  const emptyVisitors = document.querySelector("[data-empty-visitors]");
  const visitorsMessage = document.querySelector("[data-visitors-message]");
  const sessionKey = "trest12-admin-session";
  let setupMode = false;

  const setMessage = (element, message, isError = false) => {
    element.textContent = message;
    element.classList.toggle("is-error", isError);
  };

  const createField = (labelText, name, value, multiline = false) => {
    const wrapper = document.createElement("label");
    wrapper.className = "admin-field";
    const label = document.createElement("span");
    label.textContent = labelText;
    const input = document.createElement(multiline ? "textarea" : "input");
    input.name = name;
    input.required = name === "title";
    if (multiline) {
      input.rows = 3;
      input.maxLength = 600;
    } else {
      input.type = "text";
      input.maxLength = name === "title" ? 100 : 180;
    }
    input.value = value;
    wrapper.append(label, input);
    return { wrapper, input };
  };

  const createImagePicker = (labelText, multiple) => {
    const wrapper = document.createElement("label");
    wrapper.className = "admin-file-field";
    const label = document.createElement("span");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.multiple = multiple;
    wrapper.append(label, input);
    return { wrapper, input };
  };

  const resizeImage = async (file) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) {
      throw new Error("Rasm JPG, PNG yoki WebP formatida va 15 MB dan kichik bo‘lsin.");
    }

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    let scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    let quality = 0.78;
    let result;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL("image/webp", quality);
      if (result.length <= 270000) break;
      if (quality > 0.5) quality -= 0.08;
      else scale *= 0.8;
    }

    bitmap.close();
    if (!result || result.length > 270000) {
      throw new Error("Rasmni kichraytirib saqlab bo‘lmadi. Boshqa rasm tanlang.");
    }
    return result;
  };

  const saveProject = async (project, form) => {
    const title = form.elements.namedItem("title").value.trim();
    const description = form.elements.namedItem("description").value.trim();
    const location = form.elements.namedItem("location").value.trim();
    const coverFile = form.elements.namedItem("cover").files[0];
    const galleryFiles = Array.from(form.elements.namedItem("gallery").files);

    if (!title) throw new Error("Loyiha nomini kiriting.");
    if (galleryFiles.length > 3) throw new Error("Qo‘shimcha rasmlardan ko‘pi bilan 3 ta tanlang.");

    const updated = {
      ...project,
      title,
      description: description || "Ma’lumot: ?",
      location: location || "Manzil: ?",
    };
    if (coverFile) updated.cover = await resizeImage(coverFile);
    if (galleryFiles.length) {
      updated.gallery = await Promise.all(galleryFiles.map(resizeImage));
    }

    const projects = await window.Trest12Data.getProjects();
    const existingIndex = projects.findIndex((item) => item.id === project.id);
    if (existingIndex === -1) projects.push(updated);
    else projects[existingIndex] = updated;
    await window.Trest12Data.saveProjects(projects);
  };

  const renderProjects = async () => {
    try {
      const projects = await window.Trest12Data.getProjects();
      projectList.replaceChildren();

      projects.forEach((project, index) => {
        const form = document.createElement("form");
        form.className = "admin-project-form";
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          setMessage(projectMessage, "");
          const saveButton = form.querySelector('[type="submit"]');
          saveButton.disabled = true;
          saveButton.textContent = "Saqlanmoqda…";
          try {
            await saveProject(project, form);
            setMessage(projectMessage, "Loyiha saqlandi.");
            await renderProjects();
          } catch (error) {
            setMessage(projectMessage, error.message, true);
            saveButton.disabled = false;
            saveButton.textContent = "Saqlash";
          }
        });

        const top = document.createElement("div");
        top.className = "admin-project-top";
        const heading = document.createElement("h4");
        heading.textContent = `Loyiha ${String(index + 1).padStart(2, "0")}`;
        const deleteButton = document.createElement("button");
        deleteButton.className = "button button-danger";
        deleteButton.type = "button";
        deleteButton.textContent = "O‘chirish";
        deleteButton.addEventListener("click", async () => {
          if (!window.confirm("Bu loyihani o‘chirasizmi?")) return;
          try {
            const remaining = (await window.Trest12Data.getProjects())
              .filter((item) => item.id !== project.id);
            await window.Trest12Data.saveProjects(remaining);
            setMessage(projectMessage, "Loyiha o‘chirildi.");
            await renderProjects();
          } catch (error) {
            setMessage(projectMessage, `Loyihani o‘chirib bo‘lmadi: ${error.message}`, true);
          }
        });
        top.append(heading, deleteButton);

        const fields = document.createElement("div");
        fields.className = "admin-project-fields";
        fields.append(
          createField("Loyiha nomi", "title", project.title).wrapper,
          createField("Tavsif", "description", project.description, true).wrapper,
          createField("Manzil", "location", project.location).wrapper
        );

        const imageControls = document.createElement("div");
        imageControls.className = "admin-image-controls";
        let previewUrl = "";
        const currentCover = document.createElement("img");
        currentCover.className = "admin-image-preview";
        currentCover.src = project.cover;
        currentCover.alt = `${project.title} asosiy rasmi`;
        const coverPicker = createImagePicker("Asosiy rasmni almashtirish", false);
        coverPicker.input.name = "cover";
        coverPicker.input.addEventListener("change", () => {
          if (coverPicker.input.files[0]) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = URL.createObjectURL(coverPicker.input.files[0]);
            currentCover.src = previewUrl;
          }
        });

        const galleryPreview = document.createElement("div");
        galleryPreview.className = "admin-gallery-preview";
        project.gallery.forEach((image, imageIndex) => {
          const preview = document.createElement("img");
          preview.src = image;
          preview.alt = `Qo‘shimcha loyiha rasmi ${imageIndex + 1}`;
          galleryPreview.append(preview);
        });
        const galleryPicker = createImagePicker("Qo‘shimcha rasmlar (1–3 ta tanlansa eskilari almashadi)", true);
        galleryPicker.input.name = "gallery";

        imageControls.append(currentCover, coverPicker.wrapper, galleryPreview, galleryPicker.wrapper);
        const actions = document.createElement("div");
        actions.className = "admin-form-actions";
        const saveButton = document.createElement("button");
        saveButton.className = "button button-primary";
        saveButton.type = "submit";
        saveButton.textContent = "Saqlash";
        actions.append(saveButton);
        form.append(top, fields, imageControls, actions);
        projectList.append(form);
      });
    } catch (error) {
      setMessage(projectMessage, `Loyihalarni yuklab bo‘lmadi: ${error.message}`, true);
    }
  };

  const renderVisitors = async () => {
    try {
      const visitors = await window.Trest12Data.getVisitors();
      visitorsBody.replaceChildren();
      emptyVisitors.hidden = visitors.length > 0;
      visitors.slice().reverse().forEach((visitor) => {
        const row = document.createElement("tr");
        const name = document.createElement("td");
        name.textContent = visitor.name;
        const age = document.createElement("td");
        age.textContent = String(visitor.age);
        const date = document.createElement("td");
        date.textContent = new Intl.DateTimeFormat("uz-UZ", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(visitor.createdAt));
        const action = document.createElement("td");
        const removeButton = document.createElement("button");
        removeButton.className = "text-button";
        removeButton.type = "button";
        removeButton.textContent = "O‘chirish";
        removeButton.addEventListener("click", async () => {
          try {
            const remaining = (await window.Trest12Data.getVisitors())
              .filter((item) => item.id !== visitor.id);
            await window.Trest12Data.saveVisitors(remaining);
            setMessage(visitorsMessage, "Yozuv o‘chirildi.");
            await renderVisitors();
          } catch (error) {
            setMessage(visitorsMessage, `Yozuvni o‘chirib bo‘lmadi: ${error.message}`, true);
          }
        });
        action.append(removeButton);
        row.append(name, age, date, action);
        visitorsBody.append(row);
      });
    } catch (error) {
      setMessage(visitorsMessage, `Tashrifchilarni yuklab bo‘lmadi: ${error.message}`, true);
    }
  };

  const showDashboard = async () => {
    authPanel.hidden = true;
    dashboard.hidden = false;
    await Promise.all([renderProjects(), renderVisitors()]);
  };

  const configureAuthForm = async () => {
    const admin = await window.Trest12Data.getAdmin();
    setupMode = !admin;
    authPanel.hidden = false;
    dashboard.hidden = true;
    confirmation.hidden = !setupMode;
    confirmationInput.required = setupMode;
    authDescription.textContent = setupMode
      ? "Birinchi marta admin hisobini shu brauzerda yarating. Login va parolni kodga kiritmang, ularni bu formaga o‘zingiz yozing."
      : "Admin hisobingiz bilan tizimga kiring.";
    authSubmit.firstChild.textContent = setupMode ? "Admin hisobini yaratish " : "Kirish ";
    authForm.reset();
    setMessage(authMessage, "");
  };

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(authMessage, "");
    const username = authForm.elements.namedItem("username").value.trim();
    const password = authForm.elements.namedItem("password").value;
    authSubmit.disabled = true;

    try {
      if (setupMode) {
        if (password !== confirmationInput.value) {
          throw new Error("Parollar bir xil emas.");
        }
        if (await window.Trest12Data.getAdmin()) {
          throw new Error("Admin hisobi oldin yaratilgan. Sahifani yangilang.");
        }
        await window.Trest12Data.createAdmin(username, password);
      } else if (!(await window.Trest12Data.verifyAdmin(username, password))) {
        throw new Error("Login yoki parol noto‘g‘ri.");
      }

      sessionStorage.setItem(sessionKey, "active");
      setMessage(authMessage, "");
      await showDashboard();
    } catch (error) {
      setMessage(authMessage, error.message, true);
    } finally {
      authSubmit.disabled = false;
    }
  });

  document.querySelector("[data-admin-logout]").addEventListener("click", async () => {
    sessionStorage.removeItem(sessionKey);
    await configureAuthForm();
  });

  document.querySelector("[data-add-project]").addEventListener("click", async () => {
    try {
      const projects = await window.Trest12Data.getProjects();
      const project = {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        location: "",
        cover: window.Trest12Data.initialProjects()[0].cover,
        gallery: [],
      };
      projects.push(project);
      await window.Trest12Data.saveProjects(projects);
      await renderProjects();
      const lastTitle = projectList.querySelector(".admin-project-form:last-child input[name='title']");
      lastTitle?.focus();
    } catch (error) {
      setMessage(projectMessage, `Yangi loyiha qo‘shib bo‘lmadi: ${error.message}`, true);
    }
  });

  document.querySelector("[data-clear-visitors]").addEventListener("click", async () => {
    if (!window.confirm("Tashrifchilar ro‘yxatidagi barcha yozuvlarni o‘chirasizmi?")) return;
    try {
      await window.Trest12Data.saveVisitors([]);
      setMessage(visitorsMessage, "Tashrifchilar ro‘yxati tozalandi.");
      await renderVisitors();
    } catch (error) {
      setMessage(visitorsMessage, `Ro‘yxatni tozalab bo‘lmadi: ${error.message}`, true);
    }
  });

  (async () => {
    try {
      if (sessionStorage.getItem(sessionKey) === "active" && await window.Trest12Data.getAdmin()) {
        await showDashboard();
      } else {
        await configureAuthForm();
      }
    } catch (error) {
      setMessage(authMessage, `Admin panelini yuklab bo‘lmadi: ${error.message}`, true);
    }
  })();
}
