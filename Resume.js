// Track currently editing element
let currentlyEditing = null;
let undoStack = [];
let redoStack = [];
const MAX_UNDO = 20;

// Auto-save functionality
let autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveToLocalStorage();
    showToast("✓ Sauvegarde automatique", false, 2000);
  }, 2000);
}

// Save/Load from localStorage
function saveToLocalStorage() {
  try {
    const cvData = {
      html: document.querySelector(".container").innerHTML,
      colors: {
        primary: document.getElementById("primaryColor").value,
        secondary: document.getElementById("secondaryColor").value,
        accent: document.getElementById("accentColor").value,
        background: document.getElementById("backgroundColor").value,
        sidebar: document.getElementById("sidebarBg").value,
        text: document.getElementById("textColor").value,
      },
      profileImage: document.getElementById("profileImage").src,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cvData", JSON.stringify(cvData));
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("cvData");
    if (saved) {
      const cvData = JSON.parse(saved);
      document.querySelector(".container").innerHTML = cvData.html;

      // Restore colors
      if (cvData.colors) {
        document.getElementById("primaryColor").value = cvData.colors.primary;
        document.getElementById("secondaryColor").value =
          cvData.colors.secondary;
        document.getElementById("accentColor").value = cvData.colors.accent;
        document.getElementById("backgroundColor").value =
          cvData.colors.background;
        document.getElementById("sidebarBg").value = cvData.colors.sidebar;
        document.getElementById("textColor").value = cvData.colors.text;
        updateColors();
      }
      let profileSrc = cvData.profileImage || "";
      const img = document.getElementById("profileImage");
      const header = document.querySelector(".header");

      if (img && header) {
        if (profileSrc) {
          img.src = profileSrc;
          img.style.display = "block";
          header.classList.add("has-profile-image");
        } else {
          img.src = "";
          img.style.display = "none";
          header.classList.remove("has-profile-image");
        }
      }

      initEditableElements();
      initProfileImage(); // 👈 IMPORTANT

      const date = new Date(cvData.timestamp);
      showToast(
        `📂 CV restauré (${date.toLocaleString("fr-FR")})`,
        false,
        3000
      );
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e);
  }
}

// Undo/Redo functionality
function saveState() {
  const state = document.querySelector(".container").innerHTML;
  undoStack.push(state);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = []; // Clear redo stack on new action
}

function undo() {
  if (undoStack.length > 0) {
    redoStack.push(document.querySelector(".container").innerHTML);
    const previousState = undoStack.pop();
    document.querySelector(".container").innerHTML = previousState;
    initEditableElements();
    showToast("↶ Annulation", false, 1500);
  }
}

function redo() {
  if (redoStack.length > 0) {
    undoStack.push(document.querySelector(".container").innerHTML);
    const nextState = redoStack.pop();
    document.querySelector(".container").innerHTML = nextState;
    initEditableElements();
    showToast("↷ Rétablissement", false, 1500);
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Z = Undo
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key === "y" || (e.key === "z" && e.shiftKey))
  ) {
    e.preventDefault();
    redo();
  }
  // Ctrl/Cmd + S = Save
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveToLocalStorage();
    showToast("💾 CV sauvegardé", false, 2000);
  }
  // Ctrl/Cmd + P = Print
  if ((e.ctrlKey || e.metaKey) && e.key === "p") {
    e.preventDefault();
    downloadPDF();
  }
});

// Color configuration functionality
function updateColors() {
  const root = document.documentElement;
  root.style.setProperty(
    "--primary-color",
    document.getElementById("primaryColor").value
  );
  root.style.setProperty(
    "--secondary-color",
    document.getElementById("secondaryColor").value
  );
  root.style.setProperty(
    "--accent-color",
    document.getElementById("accentColor").value
  );
  root.style.setProperty(
    "--background-color",
    document.getElementById("backgroundColor").value
  );
  root.style.setProperty(
    "--sidebar-bg",
    document.getElementById("sidebarBg").value
  );
  root.style.setProperty(
    "--text-color",
    document.getElementById("textColor").value
  );
  scheduleAutoSave();
}

// Apply color presets
function applyPreset(presetName) {
  saveState();
  const presets = {
    blue: {
      primary: "#3498db",
      secondary: "#2c3e50",
      accent: "#4a5f7f",
      background: "#ffffff",
      sidebar: "#fafafa",
      text: "#444444",
    },
    green: {
      primary: "#27ae60",
      secondary: "#2c3e50",
      accent: "#3d7e5a",
      background: "#ffffff",
      sidebar: "#f8fcf9",
      text: "#444444",
    },
    red: {
      primary: "#e74c3c",
      secondary: "#2c3e50",
      accent: "#a8433a",
      background: "#ffffff",
      sidebar: "#fdf8f7",
      text: "#444444",
    },
    purple: {
      primary: "#9b59b6",
      secondary: "#2c3e50",
      accent: "#7a4b8c",
      background: "#ffffff",
      sidebar: "#faf7fc",
      text: "#444444",
    },
    dark: {
      primary: "#3498db",
      secondary: "#34495e",
      accent: "#2c3e50",
      background: "#2c3e50",
      sidebar: "#34495e",
      text: "#ecf0f1",
    },
  };

  const preset = presets[presetName];
  if (preset) {
    document.getElementById("primaryColor").value = preset.primary;
    document.getElementById("secondaryColor").value = preset.secondary;
    document.getElementById("accentColor").value = preset.accent;
    document.getElementById("backgroundColor").value = preset.background;
    document.getElementById("sidebarBg").value = preset.sidebar;
    document.getElementById("textColor").value = preset.text;
    updateColors();
    showToast(`🎨 Thème ${presetName} appliqué`, false, 2000);
  }
}

// Toggle configuration panel
function toggleConfig() {
  const configPanel = document.getElementById("colorConfig");
  configPanel.style.display =
    configPanel.style.display === "none" ? "block" : "none";
}

// Show toast notification with custom duration
function showToast(message, isError = false, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast" + (isError ? " error" : "") + " show";

  setTimeout(() => {
    toast.className = "toast";
  }, duration);
}

document.addEventListener("DOMContentLoaded", function () {
  loadFromLocalStorage(); // <-- ADD THIS LINE HERE

  // Add event listeners to color inputs
  const colorInputs = document.querySelectorAll(
    '.color-config input[type="color"]'
  );
  colorInputs.forEach((input) => {
    input.addEventListener("input", updateColors);
  });

  document.getElementById("colorConfig").style.display = "none";

  const languageDots = document.querySelectorAll(".lang-dots .dot");
  languageDots.forEach((dot) => {
    dot.addEventListener("click", function () {
      toggleLanguageLevel(this);
    });
  });

  initEditableElements();
  initDragAndDrop();
  initProfileImage();
  addScrollAnimations();
});

// Smooth scroll reveal animations
function addScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  document
    .querySelectorAll(".experience-item, .education-item, .sidebar-section")
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(el);
    });
}

function initEditableElements() {
  // 1) On supprime les anciens listeners en clonant les éléments .editable
  const editableElements = document.querySelectorAll(".editable");
  editableElements.forEach((element) => {
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
  });

  // 2) On ré-attache le handler sur tous les .editable
  const newEditableElements = document.querySelectorAll(".editable");
  newEditableElements.forEach((element) => {
    element.addEventListener("click", handleEditClick);
    element.setAttribute("title", "Cliquer pour éditer");
  });

  // 3) Rendre les titres de sections éditables aussi
  const sectionTitles = document.querySelectorAll(
    ".section-title > span, .sidebar-title > span"
  );
  sectionTitles.forEach((title) => {
    title.classList.add("editable", "section-title-editable");
    title.setAttribute("title", "Cliquer pour modifier le titre");
    title.addEventListener("click", handleEditClick);
  });
}

// Fonction handleEditClick - BLOQUER COMPLÈTEMENT
function handleEditClick(e) {
  e.stopPropagation();

  // Close ALL open editors safely
  closeAllOpenEditors();

  startEditing(this);
}

function closeAllOpenEditors() {
  const editors = document.querySelectorAll(".editing");

  editors.forEach((el) => {
    const input = el.querySelector("input, textarea");
    if (input) {
      const original = el.dataset.originalValue || input.value;
      el.textContent = original;
    }
    el.classList.remove("editing");

    if (el._clickAwayHandler) {
      document.removeEventListener("click", el._clickAwayHandler);
      delete el._clickAwayHandler;
    }
  });

  currentlyEditing = null;
}

// Download PDF function
function downloadPDF() {
  window.print();
  showToast("📥 Téléchargement PDF en cours...", false, 2000);
}

// Edit functionality with better UX
function startEditing(element) {
  if (element.classList.contains("editing")) return;

  saveState();
  currentlyEditing = element;
  const currentText = element.textContent.trim();

  element.dataset.originalValue = currentText;

  let input;
  if (element.classList.contains("intro-text")) {
    input = document.createElement("textarea");
    input.className = "edit-textarea";
    input.value = currentText;
  } else {
    input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = currentText;
  }

  element.innerHTML = "";
  element.appendChild(input);
  element.classList.add("editing");

  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "edit-buttons";

  const saveButton = document.createElement("button");
  saveButton.textContent = "✓ Sauvegarder";
  saveButton.className = "edit-btn save-btn";
  saveButton.onclick = (e) => {
    e.stopPropagation();
    saveEdit(element, input.value);
  };

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "✕ Annuler";
  cancelButton.className = "edit-btn cancel-btn";
  cancelButton.onclick = (e) => {
    e.stopPropagation();
    cancelEdit(element, currentText);
  };

  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(cancelButton);
  element.appendChild(buttonsContainer);

  input.focus();
  input.select();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit(element, input.value);
    } else if (e.key === "Escape") {
      cancelEdit(element, currentText);
    }
  });

  // Stop propagation to prevent click-away from triggering immediately
  input.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  buttonsContainer.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // NOUVELLE FONCTIONNALITÉ: Sauvegarde automatique au clic en dehors
  const clickAwayHandler = (e) => {
    if (!element.contains(e.target)) {
      saveEdit(element, input.value);
      document.removeEventListener("click", clickAwayHandler);
    }
  };

  // Utiliser setTimeout pour éviter que le clic actuel ne déclenche immédiatement
  setTimeout(() => {
    document.addEventListener("click", clickAwayHandler);
  }, 100);
}

function saveEdit(element, newValue) {
  if (!element || !element.classList.contains("editing")) return;

  const trimmedValue = newValue.trim();

  // Prevent empty values for important fields
  if (!trimmedValue && !element.classList.contains("intro-text")) {
    showToast("⚠️ Le champ ne peut pas être vide", true, 2000);
    return;
  }

  element.textContent = trimmedValue || newValue;
  element.classList.remove("editing");
  currentlyEditing = null;
  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Modifié", false, 1500);
}

function cancelEdit(element, originalValue) {
  if (!element) return;

  // Nettoyer l'écouteur d'événements click away
  if (element._clickAwayHandler) {
    document.removeEventListener("click", element._clickAwayHandler);
    delete element._clickAwayHandler;
  }

  element.textContent = originalValue;
  element.classList.remove("editing");
  currentlyEditing = null;
  initEditableElements();
}
// Language level functionality
function toggleLanguageLevel(dot) {
  saveState();
  const dotsContainer = dot.parentElement;
  const dots = Array.from(dotsContainer.querySelectorAll(".dot"));
  const dotIndex = dots.indexOf(dot);

  dots.forEach((d, index) => {
    if (index <= dotIndex) {
      d.classList.add("filled");
    } else {
      d.classList.remove("filled");
    }
  });

  scheduleAutoSave();
  showToast("✓ Niveau mis à jour", false, 1500);
}

// Delete functionality with confirmation
function deleteItem(id) {
  if (confirm("Supprimer cet élément ?")) {
    saveState();
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
      // Check if we're deleting the currently editing element
      if (
        currentlyEditing &&
        (item.contains(currentlyEditing) || item === currentlyEditing)
      ) {
        currentlyEditing = null;
      }

      item.style.transform = "scale(0.8)";
      item.style.opacity = "0";
      setTimeout(() => {
        item.remove();
        scheduleAutoSave();
      }, 300);
      showToast("🗑️ Élément supprimé", false, 2000);
    }
  }
}

function deleteSection(sectionId) {
  if (confirm("Supprimer cette section complète ?")) {
    saveState();
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
      section.style.transform = "scale(0.8)";
      section.style.opacity = "0";
      setTimeout(() => {
        section.remove();
        scheduleAutoSave();
      }, 300);
      showToast("🗑️ Section supprimée", false, 2000);
    }
  }
}

function deleteProject(projectId) {
  if (confirm("Supprimer ce projet ?")) {
    saveState();
    const project = document.querySelector(`[data-id="${projectId}"]`);
    if (project) {
      // Check if we're deleting the currently editing element
      if (
        currentlyEditing &&
        (project.contains(currentlyEditing) || project === currentlyEditing)
      ) {
        currentlyEditing = null;
      }

      project.style.opacity = "0";
      setTimeout(() => {
        project.remove();
        scheduleAutoSave();
      }, 300);
      showToast("🗑️ Projet supprimé", false, 2000);
    }
  }
}

// Reset CV function
function resetCV() {
  if (
    confirm("Réinitialiser complètement le CV ? Cette action est irréversible.")
  ) {
    localStorage.removeItem("cvData");
    location.reload();
  }
}

// Translation helper
function translateResume() {
  const translations = {
    fr: {
      "À propos": "About",
      "Expérience Professionnelle": "Professional Experience",
      Formation: "Education",
      Contact: "Contact",
      Expertise: "Expertise",
      Technologies: "Technologies",
      Langues: "Languages",
      Localisation: "Location",
      Téléphone: "Phone",
      Frontend: "Frontend",
      Backend: "Backend",
      Mobile: "Mobile",
    },
    en: {
      About: "À propos",
      "Professional Experience": "Expérience Professionnelle",
      Education: "Formation",
      Contact: "Contact",
      Expertise: "Expertise",
      Technologies: "Technologies",
      Languages: "Langues",
      Location: "Localisation",
      Phone: "Téléphone",
      Frontend: "Frontend",
      Backend: "Backend",
      Mobile: "Mobile",
    },
  };

  const language = prompt("Traduire vers (fr/en) :", "en");

  if (!language || !translations[language]) {
    showToast("❌ Langue non supportée", true, 2000);
    return;
  }

  saveState();

  const dict = translations[language];
  let translatedCount = 0;

  // Translate section titles
  document
    .querySelectorAll(".section-title > span, .sidebar-title > span")
    .forEach((title) => {
      const currentText = title.textContent.trim();
      if (dict[currentText]) {
        title.textContent = dict[currentText];
        translatedCount++;
      }
    });

  // Translate contact labels
  document.querySelectorAll(".contact-label").forEach((label) => {
    const currentText = label.textContent.trim();
    if (dict[currentText]) {
      label.textContent = dict[currentText];
      translatedCount++;
    }
  });

  // Translate skill labels
  document.querySelectorAll(".skill-label").forEach((label) => {
    const currentText = label.textContent.trim();
    if (dict[currentText]) {
      label.textContent = dict[currentText];
      translatedCount++;
    }
  });

  if (translatedCount > 0) {
    scheduleAutoSave();
    showToast(
      `✓ ${translatedCount} titre(s) traduit(s) vers ${language.toUpperCase()}`,
      false,
      3000
    );
  } else {
    showToast("ℹ️ Aucun titre à traduire", false, 2000);
  }
}

// Add functions with animations
function addExperience() {
  saveState();
  const experiencesSection = document.querySelector(
    '.section[data-section="experience"]'
  );
  const experienceCount =
    document.querySelectorAll(".experience-item").length + 1;

  const newExperience = document.createElement("div");
  newExperience.className = "experience-item draggable";
  newExperience.setAttribute("data-id", `experience-${experienceCount}`);

  newExperience.innerHTML = `
        <button class="delete-btn" onclick="deleteItem('experience-${experienceCount}')" title="Supprimer">×</button>
        <div class="experience-header">
            <div class="experience-period editable" data-id="experience-${experienceCount}-period">Période</div>
            <div class="job-title editable" data-id="experience-${experienceCount}-title">Titre du poste</div>
            <div class="company editable" data-id="experience-${experienceCount}-company">Entreprise, Ville</div>
        </div>
        <ul class="achievements">
            <li>
                <div class="editable" data-id="experience-${experienceCount}-achievement-1">Réalisation 1</div>
                <button class="delete-btn" onclick="deleteItem('experience-${experienceCount}-achievement-1')" title="Supprimer">×</button>
            </li>
        </ul>
        <button class="add-btn" onclick="addAchievement('experience-${experienceCount}')">
            <span>+</span> Ajouter une réalisation
        </button>
        <div class="key-label">Projets majeurs:
            <button class="add-project-btn" onclick="addProject('experience-${experienceCount}')">+ Ajouter un projet</button>
        </div>
        <ul class="project-list" id="experience-${experienceCount}-projects">
            <li>
                <div class="project-content">
                    <span class="project-name">Nom du projet:</span> Description du projet
                </div>
                <button class="delete-btn" onclick="deleteProject('experience-${experienceCount}-project-1')" title="Supprimer">×</button>
            </li>
        </ul>
    `;

  experiencesSection.insertBefore(
    newExperience,
    experiencesSection.querySelector(".add-btn")
  );

  setTimeout(() => {
    newExperience.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    newExperience.style.opacity = "1";
    newExperience.style.transform = "translateY(0)";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Expérience ajoutée", false, 2000);
}

function addAchievement(experienceId) {
  saveState();
  const achievementsList = document.querySelector(
    `[data-id="${experienceId}"] .achievements`
  );
  const achievementCount = achievementsList.children.length + 1;

  const newAchievement = document.createElement("li");
  newAchievement.style.transform = "translateX(-10px)";
  newAchievement.innerHTML = `
        <div class="editable" data-id="${experienceId}-achievement-${achievementCount}">Nouvelle réalisation</div>
        <button class="delete-btn" onclick="deleteItem('${experienceId}-achievement-${achievementCount}')" title="Supprimer">×</button>
    `;

  achievementsList.appendChild(newAchievement);

  setTimeout(() => {
    newAchievement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    newAchievement.style.opacity = "1";
    newAchievement.style.transform = "translateX(0)";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Réalisation ajoutée", false, 1500);
}

function addFreelanceProject() {
  saveState();
  const freelanceSection = document.querySelector("#experience-3-projects");
  const projectCount = freelanceSection.children.length + 1;

  const projectId = `experience-3-project-${projectCount}`;

  const newProject = document.createElement("li");
  newProject.style.opacity = "0";

  newProject.innerHTML = `
    <div class="project-content">

      <span class="project-name editable"
            data-id="${projectId}-name">
        Nouveau projet:
      </span>

      <span class="project-description editable"
            data-id="${projectId}-desc">
        Description
      </span>

    </div>

    <button class="delete-btn" 
            onclick="deleteProject('${projectId}')" 
            title="Supprimer">×</button>
  `;

  freelanceSection.appendChild(newProject);

  setTimeout(() => {
    newProject.style.transition = "opacity 0.3s ease";
    newProject.style.opacity = "1";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Projet freelance ajouté", false, 2000);
}

function addProject(experienceId) {
  saveState();

  const projectList = document.getElementById(`${experienceId}-projects`);
  const projectCount = projectList.children.length + 1;

  const newProject = document.createElement("li");
  newProject.style.opacity = "0";

  newProject.innerHTML = `
    <div class="project-content">
      <span class="project-name editable" 
            data-id="${experienceId}-project-${projectCount}-name">
        Nom du projet:
      </span>

      <span class="project-description editable"
            data-id="${experienceId}-project-${projectCount}-description">
        Description du projet
      </span>
    </div>

    <button class="delete-btn" 
            onclick="deleteProject('${experienceId}-project-${projectCount}')" 
            title="Supprimer">×</button>
  `;

  projectList.appendChild(newProject);

  setTimeout(() => {
    newProject.style.transition = "opacity 0.3s ease";
    newProject.style.opacity = "1";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Projet ajouté", false, 1500);
}

function addEducation() {
  saveState();
  const educationSection = document.querySelector(
    '.section[data-section="education"]'
  );
  const educationCount =
    document.querySelectorAll(".education-item").length + 1;

  const newEducation = document.createElement("div");
  newEducation.className = "education-item draggable";
  newEducation.setAttribute("data-id", `education-${educationCount}`);
  newEducation.style.opacity = "0";
  newEducation.style.transform = "translateY(20px)";

  newEducation.innerHTML = `
        <button class="delete-btn" onclick="deleteItem('education-${educationCount}')" title="Supprimer">×</button>
        <div class="education-year editable" data-id="education-${educationCount}-year">Année</div>
        <div class="degree editable" data-id="education-${educationCount}-degree">Diplôme</div>
        <div class="school editable" data-id="education-${educationCount}-school">Établissement</div>
    `;

  educationSection.insertBefore(
    newEducation,
    educationSection.querySelector(".add-btn")
  );

  setTimeout(() => {
    newEducation.style.opacity = "1";
    newEducation.style.transform = "translateY(0)";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Formation ajoutée", false, 2000);
}

function addContact() {
  saveState();
  const contactSection = document.querySelector(
    '.sidebar-section[data-section="contact"]'
  );
  const contactCount =
    contactSection.querySelectorAll(".contact-item").length + 1;

  const newContact = document.createElement("div");
  newContact.className = "contact-item";
  newContact.style.opacity = "0";
  newContact.innerHTML = `
        <div class="contact-item-content">
            <div class="contact-label editable" data-id="contact-new-${contactCount}-label">Nouveau</div>
            <div class="contact-value editable" data-id="contact-new-${contactCount}-value">Valeur</div>
        </div>
        <button class="delete-btn" onclick="deleteItem('contact-new-${contactCount}-label')" title="Supprimer">×</button>
    `;

  contactSection.insertBefore(
    newContact,
    contactSection.querySelector(".add-btn")
  );

  setTimeout(() => {
    newContact.style.transition = "opacity 0.3s ease";
    newContact.style.opacity = "1";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Contact ajouté", false, 1500);
}

function addExpertise() {
  saveState();
  const expertiseList = document.getElementById("expertise-list");
  const expertiseCount = expertiseList.children.length + 1;

  const newExpertise = document.createElement("li");
  newExpertise.style.opacity = "0";
  newExpertise.innerHTML = `
        <div class="editable" data-id="expertise-${expertiseCount}">Nouvelle compétence</div>
        <button class="delete-btn" onclick="deleteItem('expertise-${expertiseCount}')" title="Supprimer">×</button>
    `;

  expertiseList.appendChild(newExpertise);

  setTimeout(() => {
    newExpertise.style.transition = "opacity 0.3s ease";
    newExpertise.style.opacity = "1";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Compétence ajoutée", false, 1500);
}

function addTechnology() {
  saveState();
  const technologiesSection = document.querySelector(
    '.sidebar-section[data-section="technologies"]'
  );
  const techCount =
    technologiesSection.querySelectorAll(".skills-category").length + 1;

  const newTech = document.createElement("div");
  newTech.className = "skills-category";
  newTech.style.opacity = "0";
  newTech.innerHTML = `
        <div class="skills-category-content">
            <div class="skill-label editable" data-id="tech-new-${techCount}-label">Catégorie</div>
            <div class="skill-value editable" data-id="tech-new-${techCount}-value">Technologies</div>
        </div>
        <button class="delete-btn" onclick="deleteItem('tech-new-${techCount}-label')" title="Supprimer">×</button>
    `;

  technologiesSection.insertBefore(
    newTech,
    technologiesSection.querySelector(".add-btn")
  );

  setTimeout(() => {
    newTech.style.transition = "opacity 0.3s ease";
    newTech.style.opacity = "1";
  }, 10);

  initEditableElements();
  scheduleAutoSave();
  showToast("✓ Technologie ajoutée", false, 1500);
}

function addLanguage() {
  saveState();
  const languagesList = document.querySelector(".languages-list");
  const languageCount = languagesList.children.length + 1;

  const newLanguage = document.createElement("li");
  newLanguage.setAttribute("data-id", `language-${languageCount}`);
  newLanguage.style.opacity = "0";

  newLanguage.innerHTML = `
        <span class="editable" data-id="language-${languageCount}-name">Langue</span>
        <div class="lang-dots">
            <span class="dot" data-level="1"></span>
            <span class="dot" data-level="2"></span>
            <span class="dot" data-level="3"></span>
            <span class="dot" data-level="4"></span>
            <span class="dot" data-level="5"></span>
        </div>
        <button class="delete-btn" onclick="deleteItem('language-${languageCount}')" title="Supprimer">×</button>
    `;

  languagesList.appendChild(newLanguage);

  setTimeout(() => {
    newLanguage.style.transition = "opacity 0.3s ease";
    newLanguage.style.opacity = "1";
  }, 10);

  initEditableElements();

  scheduleAutoSave();
  showToast("✓ Langue ajoutée", false, 1500);
}

// Improved Drag and Drop functionality
function initDragAndDrop() {
  let dragSrcEl = null;

  function handleDragStart(e) {
    saveState();
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.innerHTML);
    this.classList.add("dragging");
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDragEnter(e) {
    this.classList.add("drag-over");
  }

  function handleDragLeave(e) {
    this.classList.remove("drag-over");
  }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();

    if (dragSrcEl !== this) {
      const rect = this.getBoundingClientRect();
      const dropY = e.clientY - rect.top;
      const shouldInsertBefore = dropY < rect.height / 2;

      if (shouldInsertBefore) {
        this.parentNode.insertBefore(dragSrcEl, this);
      } else {
        this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
      }
    }

    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
    scheduleAutoSave();
    return false;
  }

  function handleDragEnd(e) {
    document
      .querySelectorAll(".dragging")
      .forEach((el) => el.classList.remove("dragging"));
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  }

  const draggables = document.querySelectorAll(".draggable");
  draggables.forEach((draggable) => {
    draggable.setAttribute("draggable", "true");
    draggable.addEventListener("dragstart", handleDragStart);
    draggable.addEventListener("dragend", handleDragEnd);
  });

  const dropZones = document.querySelectorAll(
    ".left-column, .right-column, .section, .experience-item, .education-item, .sidebar-section"
  );
  dropZones.forEach((zone) => {
    zone.addEventListener("dragover", handleDragOver);
    zone.addEventListener("dragenter", handleDragEnter);
    zone.addEventListener("dragleave", handleDragLeave);
    zone.addEventListener("drop", handleDrop);
  });
}

// Floating Action Menu
function toggleFabMenu() {
  const fabMenu = document.getElementById("fabMenu");
  fabMenu.classList.toggle("active");
}

// Shortcuts overlay
function showShortcuts() {
  document.getElementById("shortcutsOverlay").classList.add("show");
}

function hideShortcuts() {
  document.getElementById("shortcutsOverlay").classList.remove("show");
}

// Search functionality
let searchActive = false;
function toggleSearch() {
  searchActive = !searchActive;
  const searchContainer = document.getElementById("searchContainer");
  if (searchActive) {
    searchContainer.classList.add("show");
    document.getElementById("searchInput").focus();
  } else {
    searchContainer.classList.remove("show");
    clearSearch();
  }
}

function searchInCV(query) {
  clearSearch(); // remove previous highlights
  if (!query || query.length < 2) return;

  const container = document.querySelector(".container");
  let matchCount = 0;

  // Escape regex special characters so search works safely
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const safeQuery = escapeRegex(query);
  const regex = new RegExp(safeQuery, "gi");

  // Highlight a specific text node (text only)
  function highlightTextNode(node) {
    const text = node.textContent;
    const matches = text.match(regex);
    if (!matches) return;

    matchCount += matches.length;

    const span = document.createElement("span");
    span.innerHTML = text.replace(
      regex,
      (m) => `<mark class="highlight">${m}</mark>`
    );

    node.replaceWith(span);
  }

  // Recursive scan of nodes
  function walk(node) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        highlightTextNode(child);
      } else {
        walk(child);
      }
    });
  }

  walk(container);

  // Show count
  const counter = document.getElementById("searchCount");
  if (counter) {
    counter.textContent =
      matchCount > 0 ? `${matchCount} résultats` : "Aucun résultat";
  }
}

function initProfileImage() {
  const container = document.getElementById("profileImageContainer");
  const img = document.getElementById("profileImage");
  const picker = document.getElementById("profileImagePicker");
  const label = document.getElementById("profileImageLabel");
  const header = document.querySelector(".header");

  if (!container || !img || !picker || !label) return;

  // Remove old listeners
  const newImg = img.cloneNode(true);
  img.replaceWith(newImg);

  const newPicker = picker.cloneNode(true);
  picker.replaceWith(newPicker);

  function refresh() {
    // show only when a REAL uploaded image exists
    if (newImg.src && newImg.src.startsWith("data:image/")) {
      container.style.display = "block";
      header.classList.add("has-profile-image");
      newImg.style.display = "block";
    } else {
      container.style.display = "none";
      header.classList.remove("has-profile-image");
      newImg.style.display = "none";
    }
  }

  // Upload image
  newPicker.addEventListener("change", () => {
    const file = newPicker.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      newImg.src = e.target.result;
      refresh();
      saveToLocalStorage();
      showToast("📸 Photo ajoutée", false, 1500);
    };
    reader.readAsDataURL(file);
  });

  // Delete on click
  newImg.addEventListener("click", () => {
    if (confirm("Supprimer la photo ?")) {
      newImg.src = "";
      newPicker.value = "";
      refresh();
      saveToLocalStorage();
      showToast("🗑️ Photo supprimée", false, 1500);
    }
  });

  refresh();
}