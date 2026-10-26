const visitorForms = document.querySelectorAll("[data-visitor-form]");
const visitorDialog = document.querySelector("[data-visitor-dialog]");
const validAgePattern = /^(?:[1-9]|[1-9][0-9]|1[01][0-9]|120)$/;

const ageWarning = "Yosh noto‘g‘ri. 1 dan 120 gacha bo‘lgan butun son kiriting.";

visitorForms.forEach((visitorForm) => {
  const status = visitorForm.querySelector("[data-visitor-status]");
  const ageInput = visitorForm.elements.namedItem("age");

  ageInput.addEventListener("input", () => {
    const value = ageInput.value.trim();
    status.textContent = value && !validAgePattern.test(value) ? ageWarning : "";
    if (value && !validAgePattern.test(value)) {
      status.classList.add("is-error");
    } else {
      status.classList.remove("is-error");
    }
  });

  ageInput.addEventListener("invalid", () => {
    status.textContent = ageWarning;
    status.classList.add("is-error");
  });

  visitorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    const formData = new FormData(visitorForm);
    const name = String(formData.get("name") || "").trim();
    const ageValue = String(formData.get("age") || "").trim();
    const age = Number(ageValue);
    const consent = formData.get("consent") === "on";

    if (!name || !validAgePattern.test(ageValue) || !Number.isInteger(age) || age < 1 || age > 120 || !consent) {
      status.textContent = !validAgePattern.test(ageValue)
        ? ageWarning
        : "Ism va saqlashga rozilikni tekshiring.";
      status.classList.add("is-error");
      return;
    }
    status.classList.remove("is-error");

    const submitButton = visitorForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      await window.Trest12Data.submitVisitor({
        id: crypto.randomUUID(),
        name,
        age,
        createdAt: new Date().toISOString(),
      });
      visitorForm.reset();
      status.textContent = "Rahmat! Ma’lumotingiz shu qurilmada saqlandi.";
      let promptDismissed = false;
      try {
        await window.Trest12Data.dismissVisitorPrompt();
        promptDismissed = true;
      } catch (error) {
        status.textContent = `Ma’lumotingiz saqlandi, lekin kirish eslatmasini yopib bo‘lmadi: ${error.message}`;
      }
      if (promptDismissed && visitorForm.hasAttribute("data-entry-form") && visitorDialog?.open) {
        visitorDialog.close();
      }
    } catch (error) {
      status.textContent = `Ma’lumotni saqlab bo‘lmadi: ${error.message}`;
    } finally {
      submitButton.disabled = false;
    }
  });
});

if (visitorDialog) {
  visitorDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    window.location.assign("admin.html");
  });

  (async () => {
    try {
      if (!(await window.Trest12Data.isVisitorPromptDismissed())) {
        visitorDialog.showModal();
      }
    } catch (error) {
      const status = visitorDialog.querySelector("[data-visitor-status]");
      status.textContent = `Kirish oynasini ochib bo‘lmadi: ${error.message}`;
      visitorDialog.showModal();
    }
  })();
}
