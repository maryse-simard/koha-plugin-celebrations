
// ===== Fichier: utils.js =====
/**
 * =======================================================
 *  Utilitaires généraux du plugin Celebrations
 * =======================================================
 */

/**
 *
 *  Utilitaires généraux
 *  @param {string} id - Identifiant de l'élément DOM.
 *  @returns {HTMLElement|null} Élément DOM trouvé ou null.
 */
const getById = id => document.getElementById(id);
/**
 *
 *  Décode les entités HTML
 *  @param {string} html - Chaîne contenant des entités HTML.
 *  @returns {string} - Chaîne décodée.
 */
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
/**
 *
 *  Parse JSON sécurisé
 *  @param {string} encodedStr - Chaîne JSON encodée.
 *  @param {string} [label="JSON inconnu"] - Nom utilisé pour identifier la source du JSON dans les logs.
 *  @returns {Object} - Objet décodé ou un objet vide en cas d’erreur.
 */
function safeParseJSON(encodedStr, label = "JSON inconnu") {
  try {
    if (!encodedStr) throw new Error(`${label} vide ou non défini`);
    const decoded = decodeHtml(encodedStr);
    return JSON.parse(decoded);
  } catch (e) {
    console.warn(`Erreur de parsing ${label} :`, e);
    return {};
  }
}
/**
 * Formate un timestamp pour l'affichage lisible aux utilisateurs.
 * @param {number} timestamp - Timestamp en secondes.
 * @param {boolean} [endOfDay=false] - Si vrai, force l'heure à 23:59 pour indiquer la fin de journée.
 * @returns {string} Date formatée (ex: "12 novembre 2025 à 08:42" ou "12 novembre 2025 à 23:59").
 */
function formatDate(timestamp, endOfDay = false) {
  const date = new Date(timestamp * 1000);
  const day = date.getDate();
  const month = date.toLocaleString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  const hour = endOfDay ? '23' : String(date.getHours()).padStart(2, '0');
  const minute = endOfDay ? '59' : String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} à ${hour}:${minute}`;
}
/**
 * Formate un timestamp pour un input HTML de type "date".
 * @param {number} timestamp - Timestamp en secondes.
 * @returns {string} Date au format "YYYY-MM-DD" pour l'input.
 */
function formatDateForInput(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 *
 *  Calcule le pourcentage de progression
 *  @param {number} startDate - Timestamp de début (en secondes).
 *  @param {number} endDate - Timestamp de fin (en secondes).
 *  @returns {number} - Pourcentage d’avancement (0 à 100).
 */
function calculateProgress(startDate, endDate) {
  const now = Date.now() / 1000;
  const total = endDate - startDate;
  const elapsed = now - startDate;
  if (elapsed < 0) return 0;
  if (elapsed > total) return 100;
  return Math.round((elapsed / total) * 100);
}
/**
 *
 *  Détermine le statut d'un thème
 *  @param {Object} theme - Objet contenant les propriétés d’un thème (start_date, end_date, active, etc.).
 *  @returns {{type: string, label: string}} - Type et libellé du statut.
 */
function getThemeStatus(theme) {
  const now = Date.now() / 1000;
  if (theme.is_current) {
    return { type: 'current', label: 'En cours' };
  }
  if (!theme.active) {
    return { type: 'expired', label: 'Inactif' };
  }
  if (theme.start_date > now) {
    return { type: 'scheduled', label: 'Programmé' };
  }
  if (theme.end_date < now) {
    return { type: 'expired', label: 'Expiré' };
  }
  return { type: 'active', label: 'Actif' };
}
/**
 *
 * Analyse les éléments d’un thème :
 * - compte les éléments actifs
 * - retourne la liste des noms actifs
 * @param {Object} theme - Objet contenant les propriétés d’un thème
 * @returns {{count: string, displayList: string}} - Type et libellé du statut.
 */
function getActiveElementsInfo(theme, maxDisplay = 4) {
  if (!theme?.elements || typeof theme.elements !== 'object') {
    return {
      count: 0,
      displayList: [],
      hasMore: false
    };
  }
  const activeElements = Object.entries(theme.elements)
    .filter(([_, element]) => element?.enabled)
    .map(([key]) => key);

  return {
    count: activeElements.length,
    displayList: activeElements.slice(0, maxDisplay),
    hasMore: activeElements.length > maxDisplay
  };
}

/**
 * Affiche une notification temporaire
 * @param {string} message - Message à afficher.
 * @param {'info'|'success'|'error'} [type='info'] - Type de notification (impacte la couleur et le comportement)
 * @returns {Promise<void>|void} - Pour 'info', renvoie une Promise qui se résout quand l'utilisateur confirme
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  let background = '';
  if (type === 'success') {
    background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  } else if (type === 'error') {
    background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else {
    background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  }
  notification.style.cssText = `
    position: fixed;
    top: 235px;
    left: 50%;
    transform: translateX(-50%);
    padding: 16px 24px;
    background: ${background};
    color: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 600;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  if (type === 'info') {
    return new Promise((resolve) => {
      const btn = document.createElement('button');
      btn.textContent = TRANSLATION_UI['yes'];
      btn.style.cssText = `
        padding: 4px 12px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: rgba(255,255,255,0.2);
        color: white;
        font-weight: 600;
      `;
      notification.appendChild(btn);
      btn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          notification.remove();
          resolve(true);
        }, 300);
      });
       const btnCancel = document.createElement('button');
      btnCancel.textContent = TRANSLATION_UI['cancel'];
      btnCancel.style.cssText = `
        padding: 4px 12px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: rgba(255, 0, 0, 0.49);
        color: white;
        font-weight: 600;
      `;
      notification.appendChild(btnCancel);
      btnCancel.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          notification.remove();
          resolve(false);
        }, 300);
      });
    });
  } else {
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}
/**
 *
 *  Active/désactive les boutons
 *  @param {HTMLButtonElement[]} buttons - Tableau de boutons à modifier.
 *  @param {boolean} disabled - Indique si les boutons doivent être désactivés.
 *  @returns {void}
 */
function toggleButtons(buttons, disabled) {
  buttons.forEach(btn => {
    if (btn) {
      btn.disabled = disabled;
      btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
  });
}
/**
 *
 * Met à jour la grille des thèmes et rattache les événements associés.
 *
 * @param {Object} state - État global comprenant :
 *   - {Object} allThemes : liste de tous les thèmes disponibles
 *   - {Object} currentSettings : thème actif + options actuelles
 *   - {string} themesConfigStr : configuration brute renvoyée par la BD/API
 *
 * @param {Object} elements - Références DOM nécessaires au rendu :
 *   - {HTMLElement} themesGrid : conteneur principal de la grille
 *   - {HTMLElement} noThemeMessage : message affiché si aucun thème n'existe
 *   - {HTMLSelectElement} themeSelect : dropdown de sélection des thèmes
 * @returns {Promise<void>}
 */
async function renderThemesGrid(state, elements) {
  updateThemesGrid(
    state.allThemes,
    state.currentSettings.theme_name,
    elements.noThemeMessage,
    elements.themesGrid
  );
  attachThemeCardEvents(
    themeName => {
      state.currentSettings = { theme_name: themeName };
      showThemeEditor(themeName, state, elements);
    },
    async (deletedThemeName) => {
      const wasAllConfigured = state.isAllConfigured;
      const currentEditedTheme = state.currentSettings?.theme_name;
      await refreshThemesGridFromAPI(state, elements, state.rawThemes);
      refreshThemeSelect(state.allThemes, state.rawThemes, elements.themeSelect);
      if (currentEditedTheme == deletedThemeName) {
        exitThemeEditor(state.rawThemes, elements);
        state.currentSettings = {};
      }else{
        state.currentSettings = { theme_name: currentEditedTheme };
      }
      if (wasAllConfigured && !areAllThemesConfigured(state.allThemes, state.rawThemes)) {
        state.isAllConfigured = false;
        exitAllConfiguredMode(elements);
      }
    }
  );
}
/**
 *
 *  Désactive tous les boutons d'action des cartes de thème
 *  Empêche l'utilisateur de cliquer plusieurs fois pendant une action asynchrone
 *  @returns {void}
 */
function disableAllActionButtons() {
  document.querySelectorAll('.btn-action').forEach(btn => btn.disabled = true);
}
/**
 *
 *  Réactive tous les boutons d'action des cartes de thème
 *  À utiliser une fois les opérations asynchrones complétées
 *  @returns {void}
 */
function enableAllActionButtons() {
  document.querySelectorAll('.btn-action').forEach(btn => btn.disabled = false);
}


// ===== Fichier: config.js =====
/**
 * ======================================================
 *  Configuration Générale
 * ======================================================
 */
/**
 *
 * Traductions chargées depuis Perl (injectées dans window.translation)
 */
const TRANSLATION_UI = window.translation?.T || {};
const TRANSLATION_BACKEND = window.translation?.B || {};
/**
 *
 * Namespace d’API injecté dans le template Koha
 */
const API_NS = window.api_namespace || '';

/**
 *
 * Paramètres de configuration pour l'affichage de l'aperçu du thème sur différents appareils (responsive).
 * Chaque clé définit la largeur de base (baseWidth) et les sélecteurs CSS du conteneur (container) et de l'écran (screen)
 * pour permettre le positionnement et la mise à l'échelle corrects de l'iframe.
 */
const DEVICE_CONFIG = {
  ordi: {
    baseWidth: 1300,
    container: '.monitor-preview',
    screen: '.screenOrdi .content'
  },
  tel: {
    baseWidth: 500,
    container: '.iphone',
    screen: '.iphone .screenMobile'
  },
  tablet: {
    baseWidth: 800,
    container: '.ipad',
    screen: '.ipad .screenMobile'
  }
};
/**
 *
 * Répertorie tous les chemins d'accès (URLs) pour les appels AJAX (Fetch) vers le plugin Perl
 * via l'interface CGI de Koha.
 */
const API_ENDPOINTS = {
  themes:       '/api/v1/contrib/Celebrations-api/themes',
  opacPreview:  '/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=opac_preview',
  previewAsset: '/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=preview_theme_asset'
};

// ===== Fichier: themeOptions.js =====
/**
 * =======================================================
 *  Gestion du menu de configuration des options de thème
 * =======================================================
 */

/**
 *
 * Met à jour dynamiquement l'affichage des options du thème sélectionné.
 * @param {Object} rawThemes - Ensemble complet des thèmes et de leurs éléments.
 * @param {HTMLSelectElement} themeSelect - Liste déroulante permettant de sélectionner un thème.
 * @returns {void}
 */
function updateThemeOptions(rawThemes, themeSelect = null, forcedThemeName = null) {
  const startInput = getById("start_date");
  const endInput   = getById("end_date");
  if (!startInput || !endInput) return;
  startInput.value = "";
  endInput.value = "";
  Object.values(rawThemes).forEach(theme => {
    Object.entries(theme.elements || {}).forEach(([elementKey, element]) => {
      const toggleId = `toggle_${elementKey}`;
      const toggleEl = getById(toggleId);
      if (toggleEl) toggleEl.style.display = 'none';
      if (element.extra_options) {
        const configDivId = `${elementKey}-config`;
        const configDiv   = getById(configDivId);
        if (configDiv) configDiv.style.display = 'none';
      }
    });
  });
  const selectedTheme = forcedThemeName || (themeSelect ? themeSelect.value : null);
  if (!selectedTheme) return;
  const themeData = rawThemes[selectedTheme];
  if (!themeData || !themeData.elements) return;
  Object.entries(themeData.elements).forEach(([elementKey]) => {
    const toggleId = `toggle_${elementKey}`;
    const toggleEl = getById(toggleId);
    if (toggleEl) toggleEl.style.display = 'flex';
  });
  Object.values(themeData.elements).forEach(element => {
    const mainToggle = getById(element.setting);
    if (mainToggle) mainToggle.dispatchEvent(new Event('change'));
  });
  Object.entries(themeData.elements).forEach(([elementKey, element]) => {
    if (
      element.extra_options &&
      !Object.values(element.extra_options).some(opt => opt.type === 'ignore')
    ) {
      const mainToggle = getById(element.setting);
      const configDiv  = getById(`${elementKey}-config`);
      toggleConfig(mainToggle, configDiv);
    }
  });
  setTimeout(() => {
    if (window.positionIframeGlobal) {
      window.positionIframeGlobal();
    }
  }, 150);
  document.querySelectorAll('.form-group').forEach(div => {
    div.style.display = 'none';
  });
  const themeDiv = getById(`${selectedTheme}-options`);
  if (themeDiv) {
    themeDiv.style.display = 'block';
  }
}
/**
 *
 * Gère l'affichage conditionnel des sous-options liées à un élément de thème.
 * @param {HTMLElement} mainToggle - Élément principal déclenchant l’affichage (checkbox, select, etc.).
 * @param {HTMLElement} configDiv - Conteneur des options supplémentaires à afficher/masquer.
 * @returns {void}
 */
function toggleConfig(mainToggle, configDiv) {
  if (!mainToggle || !configDiv) return;
  const updateDisplay = () => {
    const isChecked = mainToggle.type === 'checkbox' ? mainToggle.checked : true;
    configDiv.style.display =
      isChecked ? 'block' : 'none';
    setTimeout(() => {
      if (window.positionIframeGlobal) {
        window.positionIframeGlobal();
      }
    }, 100);
  };
  mainToggle.removeEventListener('change', updateDisplay);
  mainToggle.addEventListener('change', updateDisplay);
  updateDisplay();
}
/**
 *
 * Mise à jour du sélecteur de thème qui permet d'ajouter de nouveaux thèmes
 * @param {Array<Object>} themesConf - Tableau des thèmes déjà configurés.
 * @param {Object} allTheme - Objet de tous les thèmes possibles.
 * @param {HTMLSelectElement} themeSelect - L'élément <select> à mettre à jour.
 * @returns {void}
 */
function refreshThemeSelect(themesConf, allTheme, themeSelect) {
  if (!themeSelect) return;
  const themeArray = Array.isArray(themesConf)
    ? themesConf
    : Object.values(themesConf || {});
  const existingThemeNames = themeArray.map(
    t => t.name || t.theme_name
  );
  const selectedValue = themeSelect.value;
  themeSelect.innerHTML = '';
  Object.keys(allTheme).forEach(themeKey => {
    if (existingThemeNames.includes(themeKey)) return;
    const option = document.createElement('option');
    option.value = themeKey;
    option.textContent = TRANSLATION_UI.form[themeKey] || themeKey;
    themeSelect.appendChild(option);
  });
  if ([...themeSelect.options].some(opt => opt.value === selectedValue)) {
    themeSelect.value = selectedValue;
  }
  themeSelect.dispatchEvent(new Event('change'));
  if (themeSelect.options.length === 0) {
    themeSelect.dispatchEvent(new Event('allConfigured'));
  } else {
    themeSelect.dispatchEvent(new Event('notAllConfigured'));
  }
}
/**
 *
 * Restaure les paramètres du thème (dates et options) aux valeurs
 * qu'ils avaient lors de l'ouverture du mode édition.
 * @param {string} themeName - Nom du thème en cours d'édition.
 * @param {Object} state - Objet d'état contenant les données brutes des thèmes et l'état initial.
 * @returns {void}
 */
function resetThemeOptions(themeName, state) {
  const themeEntry = state.allThemes[themeName];
  const startDate = themeEntry.start_date_formatted;
  const endDate = themeEntry.end_date_formatted;
  // Réinitialiser les dates
  const startInput = getById("start_date");
  const endInput   = getById("end_date");
  if (startInput && endInput) {
   startInput.value = startDate ? startDate.slice(0, 10) : "";
    endInput.value   = endDate ? endDate.slice(0, 10) : "";
  }
  //  Réinitialiser les options principales et supplémentaires
  Object.entries(themeEntry.elements).forEach(([elementKey, element]) => {
   const initialEnabled = Boolean(element.enabled);
    const settingKey = state.rawThemes[themeName].elements[elementKey].setting;
    const mainToggle = getById(settingKey);
    if (!mainToggle) return;
    if (mainToggle.type === 'checkbox') {
      mainToggle.checked = initialEnabled;
    }
    // Réinitialiser les Options Supplémentaires (Sliders, Selects)
    if (element.options) {
      Object.entries(element.options).forEach(([optKey, opt]) => {
        const input = getById(optKey);
        if (!input) return;
        input.value = opt;
        if (input.type === 'range') {
          const span = getById(`val_${optKey}`);
          span.textContent = opt;
        }
      });
    }
    mainToggle.dispatchEvent(new Event('change'));
  });
  updatePreview(state.rawThemes, themeName);
}
/**
 *
 * Passe en mode édition pour le thème sélectionné :
 * @param {string} themeName - Nom du thème à éditer
 * @param {Object} rawThemes - Configuration complète (THEMES_CONFIG_STR)
 * @param {Object} elements - Références aux éléments DOM (titre, select, etc.)
 * @returns {void}
 */
function showThemeEditor(themeName, state, elements) {
  const confTitre = getById('ConfTitre');
  const labelSel = getById('label-select');
  const themeSelect = elements.themeSelect;
  const createbtn = getById('create-button');
  const updatebtn = getById('update-button');
  const resetbtn = getById('reset-button');
  confTitre.textContent = `${TRANSLATION_UI['txtConf']} ${TRANSLATION_UI.form[themeName]}`;
  labelSel.style.display = 'none';
  createbtn.style.display = 'none';
  updatebtn.style.display = 'block';
  if (themeSelect) themeSelect.style.display = 'none';
  updateThemeOptions(state.rawThemes, themeSelect , themeName );
  const startInput = getById("start_date");
  const endInput   = getById("end_date");
  if (!startInput || !endInput) return;
  const themeEntry = state.allThemes[themeName];
  if (themeEntry) {
    startInput.value = formatDateForInput(themeEntry.start_date);
    endInput.value   = formatDateForInput(themeEntry.end_date);
  } else {
      startInput.value = "";
      endInput.value = "";
  }
  if (!getById('cancel-edit-btn')) {
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit-btn';
    cancelBtn.className = 'modern-button reset';
    cancelBtn.textContent = `${TRANSLATION_UI['cancel']}`;
    const buttonRow = getById('greyBtn');
    if (buttonRow) buttonRow.prepend(cancelBtn);

    const confTitre = document.getElementById('ConfTitre');

    const themeSelect = document.getElementById('theme-select');
    const themeForm = document.getElementById('theme-form');
    const celebrationComplete = document.getElementById('celebration-complete');

    cancelBtn.addEventListener('click', () => {

      const isEmpty = themeSelect.options.length == 0;

      if(isEmpty){

        confTitre.style.display = 'none';
        themeForm.style.display = 'none';
        celebrationComplete.style.display = 'block';

      }else{
        exitThemeEditor(state.rawThemes, elements)
      }
    });

  }

  if (resetbtn) {
    resetbtn.removeEventListener('click', resetbtn.resetListener);
    resetbtn.resetListener = () => resetThemeOptions(themeName, state);
    resetbtn.addEventListener('click', resetbtn.resetListener);
    resetbtn.style.display = 'block';
  }
  updatePreview(state.rawThemes, themeName);
}
/**
 *
 * Revient au mode normal (sélecteur visible, options masquées)
 * @param {Object} rawThemes - Configuration complète des thèmes,
 * @param {Object} elements - Références aux éléments DOM utilisés par le module.
 *   - {HTMLSelectElement} elements.themeSelect - Sélecteur de thème global.
 *   - {HTMLElement} [elements.themesGrid] - Grille listant les thèmes (si affichée).
 *   - {HTMLElement} [elements.noThemeMessage] - Message affiché si aucun thème n’existe.
 *   - {HTMLElement} [elements.themeSelectLab
 * @returns {void}
 */
function exitThemeEditor(rawThemes, elements) {
  const confTitre = getById('ConfTitre');
  const createbtn = getById('create-button');
  const themeSelect = elements.themeSelect;
  const cancelBtn = getById('cancel-edit-btn');
  const updateBtn = getById('update-button');
  const resetbtn = getById('reset-button');
  confTitre.textContent = `${TRANSLATION_UI['select_theme']}`;
  themeSelect.style.display = 'block';
  createbtn.style.display = 'block';
  updateThemeOptions(rawThemes, themeSelect);
  updatePreview(rawThemes, themeSelect.value);
  if (cancelBtn) cancelBtn.remove();
  if (updateBtn) updateBtn.style.display = 'none';
  if (resetbtn) resetbtn.style.display = 'none';
}
/**
 *
 * Passe l’interface en mode "configuration complète".
 * Ce mode est activé lorsque tous les thèmes disponibles sont déjà configurés.
 * @param {Object} elements - Références aux éléments DOM utilisés par l’interface.
 * @param {HTMLSelectElement} [elements.themeSelect] - Sélecteur principal des thèmes.
 * @param {HTMLElement} [elements.form] - Formulaire principal de configuration.
 * @param {HTMLElement} [elements.createButton] - Bouton de création de thème.
 * @param {HTMLElement} [elements.previewButton] - Bouton de prévisualisation.
 * @param {HTMLElement} [elements.completeSection] - Section affichée lorsque tout est configuré.
 *
 * @returns {void}
 */
function enterAllConfiguredMode(elements) {
  if (!elements) return;
  const card = document.getElementsByClassName('plugin-card')[0];
  const form = getById('theme-form');
  const title = getById('ConfTitre');
  const createBtn = getById('create-button');
  const resetBtn = getById('preview-button');
  const completeSection = getById('celebration-complete');
  if (elements.themeSelect) elements.themeSelect.style.display = 'none';
  if (card) card.style.justifyContent = 'center';
  if (form) form.style.display = 'none';
  if (title) title.style.display = 'none';
  if (createBtn) createBtn.style.display = 'none';
  if (resetBtn) resetBtn.style.display = 'none';
  if (completeSection) completeSection.style.display = 'block';
}
/**
 *
 * Quitte le mode "configuration complète" et restaure l’interface normale.
 * @param {Object} elements - Références aux éléments DOM utilisés par l’interface.
 * @param {HTMLSelectElement} [elements.themeSelect] - Sélecteur principal des thèmes.
 * @param {HTMLElement} [elements.form] - Formulaire principal de configuration.
 * @param {HTMLElement} [elements.createButton] - Bouton de création de thème.
 * @param {HTMLElement} [elements.previewButton] - Bouton de prévisualisation.
 * @param {HTMLElement} [elements.completeSection] - Section "tout configuré" à masquer.
 *
 * @returns {void}
 */
function exitAllConfiguredMode(elements) {
  if (!elements) return;
  const card = document.getElementsByClassName('plugin-card')[0];
  const form = getById('theme-form');
  const title = getById('ConfTitre');
  const createBtn = getById('create-button');
  const updateBtn = getById('preview-button');
  const completeSection = getById('celebration-complete');
  if (elements.themeSelect) elements.themeSelect.style.display = 'block';
  if (card) card.style.justifyContent = 'normal';
  if (form) form.style.display = 'flex';
  if (title) title.style.display = 'block';
  if (createBtn) createBtn.style.display = 'block';
  if (updateBtn) updateBtn.style.display = 'block';
  if (completeSection) completeSection.style.display = 'none';
}
/**
 *
 * Vérifie si tous les thèmes disponibles ont déjà été configurés.
 * @param {Object} allThemes - Thèmes actuellement configurés par l’utilisateur
 * @param {Object} rawThemes - Configuration complète de tous les thèmes disponibles
 * @returns {boolean} `true` si tous les thèmes sont configurés, sinon `false`.
 */
function areAllThemesConfigured(allThemes, rawThemes) {
  return Object.keys(allThemes).length >= Object.keys(rawThemes).length;
}


// ===== Fichier: themeGrid.js =====
/**
 * ======================================================
 *  Gestion de la grille des thèmes
 * ======================================================
 */

/**
 *
 * Trie les thèmes par statut et par date de début.
 * @param {Object} themes - Ensemble des thèmes à trier.
 * @returns {Array<Object>} - Liste triée des thèmes.
 */
function sortThemes(themes) {
  return Object.values(themes).sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return b.start_date - a.start_date;
  });
}
/**
 *
 * Crée le HTML d'une carte représentant un thème.
 * @param {Object} theme - Données du thème.
 * @param {string} currentTheme - Nom du thème actuellement actif.
 * @returns {string} - Code HTML de la carte du thème.
 */
function createThemeCard(theme, currentTheme) {
  const displayName = theme.theme_name;
  const status = getThemeStatus(theme);
  const progress = calculateProgress(theme.start_date, theme.end_date);
  const isCurrent = theme.theme_name === currentTheme;
  const activeInfo = getActiveElementsInfo(theme, 4);
  const activeListHTML = activeInfo.displayList
    .map(key => {
      const label = TRANSLATION_UI.elements?.[key] || key;
      return `<li>${label}</li>`;
    })
    .join('');
  return `
  <div class="theme-card-wrapper ${isCurrent ? 'active' : ''}">
    <div class="theme-card">
      <div class="theme-card-top">
        <div class="theme-card-header">
          <div class="theme-icon">${TRANSLATION_UI.emoji[displayName] || TRANSLATION_UI.emoji.default}</div>
          <div class="theme-name">${TRANSLATION_UI.form[displayName]}</div>
        </div>
      </div>
      <div class="theme-card-body" style="padding:12px;">
        <div class="theme-dates">
          <div class="date-row">
            <span class="labelCard">${TRANSLATION_UI.prog['debut']}</span>
            <span class="value">${formatDate(theme.start_date)}</span>
          </div>
          <div class="date-row">
            <span class="labelCard">${TRANSLATION_UI.prog['fin']}</span>
            <span class="value">${formatDate(theme.end_date, true)}</span>
          </div>
        </div>
        <div class="theme-progress">
          <div class="progress-label">
            ${status.type === 'current'
              ? `<span>${TRANSLATION_UI.prog['prog']}</span><span class="progress-percent">${progress}% ${TRANSLATION_UI.grille['actif']}</span>`
              : `<span>${TRANSLATION_UI.prog['prog']}</span><span class="progress-percent inactive-text">${TRANSLATION_UI.grille['nonActif']}</span>`}
          </div>
          <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" data-progress="${progress}"
                 style="width: ${status.type === 'current' ? progress : 0}%;
                        opacity: ${status.type === 'current' ? 1 : 0.3};"></div>
          </div>
        </div>
        <div class="theme-elements">
          <div class="elements-label">${TRANSLATION_UI.grille['elementsActifs']} : ${activeInfo.count}</div>
          <ul class="elements-list">
            ${activeListHTML}
            ${activeInfo.hasMore ? `<li>…</li>` : ""}
          </ul>
        </div>
      </div>
      <div class="theme-card-footer">
        <button class="btn-action action-btn-edit" data-theme="${theme.theme_name}">${TRANSLATION_UI.grille['modif']}</button>
        <button class="btn-action action-btn-delete" data-theme="${theme.theme_name}">${TRANSLATION_UI.grille['sup']}</button>
      </div>
    </div>
  </div>`;
}
/**
 *
 * Met à jour l'affichage complet de la grille des thèmes.
 * @param {Object} themes - Ensemble des thèmes disponibles.
 * @param {string} currentTheme - Thème actuellement actif.
 * @param {HTMLElement} noThemeMessage - Élément affiché lorsqu’aucun thème n’est disponible.
 * @param {HTMLElement} themesGrid - Conteneur HTML de la grille.
 * @returns {void}
 */
function updateThemesGrid(themes, currentTheme, noThemeMessage, themesGrid) {
  const sortedThemes = sortThemes(themes);
  if (!sortedThemes || sortedThemes.length === 0) {
    noThemeMessage.style.display = 'block';
    themesGrid.innerHTML = '';
  } else {
    noThemeMessage.style.display = 'none';
    themesGrid.innerHTML = sortedThemes
      .map(theme => createThemeCard(theme, currentTheme))
      .join('');
  }
}
/**
 *
 * Rafraîchit la grille des thèmes depuis l’API.
 * @async
 * @param {Object} state - État global de l’application.
 * @param {Object} state.allThemes - Dictionnaire des thèmes disponibles.
 * @param {Object} state.currentSettings - Paramètres courants, incluant le thème actif.
 * @param {Object} elements - Ensemble des éléments du DOM nécessaires à la mise à jour.
 * @param {HTMLElement} elements.noThemeMessage - Élément affiché lorsqu’aucun thème n’est disponible.
 * @param {HTMLElement} elements.themesGrid - Conteneur de la grille des thèmes.
 * @param {HTMLElement} [elements.themeSelect] - Menu déroulant des thèmes (optionnel, pour le rafraîchissement du sélecteur).
 * @returns {Promise<void>}
 */
async function refreshThemesGridFromAPI(state, elements ) {
  try {
    const response = await fetch(API_ENDPOINTS.themes, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
    });
    const json = await response.json();
    const data = json.results?.result;
    if (data.success) {
      state.allThemes = {};
      data.themes.forEach(theme => {
        state.allThemes[theme.name] = {
          ...theme,
          theme_name: theme.name
        };
      });
      state.currentSettings.theme_name = data.current_theme;
      await renderThemesGrid(state, elements);
    } else {
      console.error('Erreur lors du rafraîchissement:', data.error);
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
}
/**
 *
 * Supprime un thème à partir de son nom.
 * @async
 * @param {string} themeName - Nom du thème à supprimer.
 * @param {Function} [onSuccess] - Fonction callback appelée après suppression réussie.
 * @returns {Promise<void>}
 */
async function deleteTheme(themeName, onSuccess) {
  const confirmed = await showNotification(
    `${TRANSLATION_UI.grille['delete1']} ${TRANSLATION_UI.form[themeName]} ?\n\n${TRANSLATION_UI.grille['delete2']}`,
    'info'
  );
  if (!confirmed) return;
  try {
    const response = await fetch(
      `${API_ENDPOINTS.themes}/${encodeURIComponent(themeName)}`,
      {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    const json = await response.json();
    const data = json.results?.result;
    if (data.success) {
      const card = document.querySelector(`.theme-card[data-theme="${themeName}"]`);
      if (card) {
        card.style.transform = 'scale(0.8)';
        card.style.opacity = '0';
        await new Promise(resolve => {
          setTimeout( () => {
            card.remove();
            const remainingCards = document.querySelectorAll('.theme-card');
            if (remainingCards.length === 0) {
              const themesGrid = document.getElementById('themes-grid');
              if (themesGrid) themesGrid.innerHTML = '';
            }
            resolve();
          }, 300);
        });
      }
      if (onSuccess) await onSuccess(themeName);
      showNotification(`${TRANSLATION_UI.grille['delNotif1']}`, 'success');
    } else {
      throw new Error(`${TRANSLATION_UI.grille['delNotif2']}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification(`${TRANSLATION_UI.grille['delNotif2']}`, 'error');
  }
}
/**
 *
 * Attache les événements de clic aux boutons des cartes de thème.
 * @param {Function} [onEdit] - Callback appelée lors du clic sur “Modifier”.
 * @param {Function} [onDelete] - Callback appelée lors du clic sur “Supprimer”.
 * @returns {void}
 */
let isProcessingThemeAction = false;
function attachThemeCardEvents(onEdit, onDelete) {
  document.querySelectorAll('.action-btn-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const themeName = e.currentTarget.dataset.theme;

      const confTitre = document.getElementById('ConfTitre');

      const themeForm = document.getElementById('theme-form');
      const celebrationComplete = document.getElementById('celebration-complete');
      const previewBtn = document.getElementById('preview-button');

      if (getComputedStyle(celebrationComplete).display === 'block') {
        confTitre.style.display = 'block';
        themeForm.style.display = 'block';
        celebrationComplete.style.display = 'none';
        previewBtn.style.display = 'block';
      }

      disableAllActionButtons();
      try {
        if (onEdit) {
          await onEdit(themeName);
        }
      } finally {
        enableAllActionButtons();
      }
    });
  });
  document.querySelectorAll('.action-btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
       if (isProcessingThemeAction) return;
        isProcessingThemeAction = true;
      const themeName = e.currentTarget.dataset.theme;
      disableAllActionButtons();
      try {
        if (onDelete) {
          await deleteTheme(themeName, onDelete);
        }
      } finally {
        enableAllActionButtons();
         isProcessingThemeAction = false;
      }
    });
  });
}


// ===== Fichier: formHandler.js =====
/**
 * ======================================================
 *  Gestion du formulaire de thème
 * ======================================================
 */

/**
 *
 *  Soumet le formulaire de thème au serveur
 *  @param {HTMLFormElement} form - Formulaire à soumettre
 *  @param {Object} rawThemes - Objet contenant tous les thèmes et leurs éléments
 *  @param {Object} elements - Références vers les éléments DOM utiles (messages, selects, etc.)
 *  @param {Function} [onSuccess] - Callback optionnel appelé après succès
 *  @returns {Promise<void>} - Envoie les données au serveur et met à jour l'UI
 */
async function submitThemeForm(form, rawThemes, elements, onSuccess) {
  const actionType = form.dataset.actionType || "apply";
  delete form.dataset.actionType;
  const selectedTheme = elements.themeSelect.value;
  const themeData = rawThemes[selectedTheme];
  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  const prevBtn = getById('preview-button');
  const start_date = form.querySelector('input[name="start_date"]').value;
  const end_date = form.querySelector('input[name="end_date"]').value;
  toggleButtons([submitBtn, prevBtn], true);
  const elementsPayload = {};
  if (themeData && themeData.elements) {
    Object.values(themeData.elements).forEach(element => {
      const elementPayload = {
        enabled: false,
        options: {}
      };
      const mainInput = getById(element.setting);
      if (mainInput) {
        elementPayload.enabled =
          mainInput.type === 'checkbox'
            ? mainInput.checked
            : Boolean(mainInput.value);
      }
      if (element.extra_options) {
        Object.keys(element.extra_options).forEach(optKey => {
          const extraInput = getById(optKey);
          if (extraInput) {
            elementPayload.options[optKey] =
              extraInput.type === 'checkbox'
                ? extraInput.checked
                : extraInput.value;
          }
        });
      }
      elementsPayload[element.setting] = elementPayload;
    });
  }
  const payload = {
    theme: selectedTheme,
    start_date,
    end_date,
    elements: elementsPayload
  };

  try {
    const response = await fetch(API_ENDPOINTS.themes, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    const data = json.results?.result;
    if (data.success) {
      elements.successMessage.textContent = TRANSLATION_BACKEND[data.message];
      elements.successMessage.style.display = "block";
    } else {
      elements.erreurMessage.textContent = TRANSLATION_BACKEND[data.message];
      elements.erreurMessage.style.display = "block";
    }
    const iframe = getById('theme-preview');
    if (iframe) iframe.contentWindow.location.reload(true);
    setTimeout(() => {
      elements.resetMessage.style.display = 'none';
      elements.successMessage.style.display = 'none';
      elements.erreurMessage.style.display = 'none';
      toggleButtons([submitBtn, prevBtn], false);
    }, 5000);
    if (onSuccess && data.success) onSuccess();
  } catch (error) {
    console.error("Erreur réseau:", error);
    elements.erreurMessage.textContent = 'connexion_error';
    elements.erreurMessage.style.display = 'block';
    setTimeout(() => {
      elements.erreurMessage.style.display = 'none';
      toggleButtons([submitBtn, prevBtn], false);
    }, 5000);
  }
}
/**
 *
 *  Réinitialise la configuration du formulaire aux valeurs actuelles
 *  @param {HTMLFormElement} form - Formulaire à réinitialiser
 *  @param {Object} currentSettings - Valeurs actuelles des paramètres du thème
 *  @returns {void} - Met à jour les inputs et déclenche le submit pour appliquer la réinitialisation
 */
function resetConfiguration(form, currentSettings) {
  if (currentSettings.theme) {
    const themeSelect = getById('theme-select');
    if (themeSelect) themeSelect.value = currentSettings.theme;
  }
  Object.entries(currentSettings).forEach(([key, value]) => {
    const input = $(key);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = value === 'on';
    } else {
      input.value = value;
      const valLabel = getById(`val_${key}`);
      if (valLabel) valLabel.textContent = value;
    }
  });
  form.dataset.actionType = "reset";
  form.dispatchEvent(new Event('submit'));
}
/**
 * ------------------------------------------------------
 *  Met à jour un thème existant dans la BD
 * ------------------------------------------------------
 *  @param {string} themeName - Nom du thème à modifier
 *  @param {Object} rawThemes - Toutes les configs de thèmes
 *  @param {HTMLElement} form - Le formulaire contenant les nouvelles valeurs
 *  @param {Object} elements - Tous les éléments DOM utiles (messages, boutons)
 */
async function updateTheme(themeName, rawThemes, form, elements) {
  const themeSelect = document.getElementById('theme-select');

  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  const resetBtn = form.querySelector('button[type="reset"], input[type="reset"]');
  toggleButtons([submitBtn, resetBtn], true);
  const themeData = rawThemes[themeName];
  const start_date = form.querySelector('input[name="start_date"]').value;
  const end_date   = form.querySelector('input[name="end_date"]').value;
  const elementsPayload = {};
  if (themeData?.elements) {
    Object.values(themeData.elements).forEach(element => {
      const mainInput = getById(element.setting);
      elementsPayload[element.setting] = {
        enabled: mainInput?.checked || false,
        options: {}
      };
      if (element.extra_options) {
        Object.keys(element.extra_options).forEach(optKey => {
          const input = getById(optKey);
          if (input) {
            elementsPayload[element.setting].options[optKey] =
              input.type === 'checkbox'
                ? input.checked
                : input.value;
          }
        });
      }
    });
  }
  const payload = {
    start_date,
    end_date,
    elements: elementsPayload
  };
  try {
    const response = await fetch(`${API_ENDPOINTS.themes}/${encodeURIComponent(themeName)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify(payload),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const json = await response.json();
    const data = json.results?.result;
    if (data?.success) {
      elements.successMessage.textContent = TRANSLATION_BACKEND['theme_updated'];
      elements.successMessage.style.display = "block";

      const isEmpty = themeSelect.options.length == 0;
      if(isEmpty){
         window.alert(TRANSLATION_BACKEND['theme_updated']);
      }

      return true;
    } else {
      elements.erreurMessage.textContent =  TRANSLATION_BACKEND[data.message];
      elements.erreurMessage.style.display = "block";

      const isEmpty = themeSelect.options.length == 0;
      if(isEmpty){
         window.alert(TRANSLATION_BACKEND[data.message]);
      }

      return false;
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
    elements.erreurMessage.textContent = TRANSLATION_BACKEND['connexion_error'];
    elements.erreurMessage.style.display = "block";

    const isEmpty = themeSelect.options.length == 0;
      if(isEmpty){
         window.alert(TRANSLATION_BACKEND['connexion_error']);
      }

    return false;
  } finally {
    setTimeout(() => {
      elements.successMessage.style.display = "none";
      elements.erreurMessage.style.display = "none";
      toggleButtons([submitBtn, resetBtn], false);
    }, 4000);
  }
}


// ===== Fichier: devicePreview.js =====
/**
 * ======================================================
 *  Système de prévisualisation multi-device
 * ======================================================
 */

/**
 * Variables d'état utilisées pour gérer le cycle de vie et le positionnement de l'iframe de prévisualisation.
 */
let iframe = null;
let iframeContainer = null;
let currentDevice = 'ordi';
let isInitialized = false;
let initialPreviewDone = false;
/**
 *
 *  Crée le conteneur fixe utilisé pour afficher l’iframe de prévisualisation.
 *  @returns {HTMLDivElement} - Conteneur créé ou existant
 */
function createFixedIframeContainer() {
  if (iframeContainer) return iframeContainer;
  iframeContainer = document.createElement('div');
  iframeContainer.id = 'iframe-fixed-container';
  document.body.appendChild(iframeContainer);
  return iframeContainer;
}
/**
 *
 *  Crée l’iframe utilisée pour la prévisualisation du thème.
 *  @returns {HTMLIFrameElement} - Iframe créé ou existant
 */
function createIframe() {
  if (iframe) return iframe;
  createFixedIframeContainer();
  iframe = document.createElement('iframe');
  iframe.src = API_ENDPOINTS.opacPreview;
  iframe.id = 'theme-preview';
  iframe.title = 'Aperçu du thème OPAC';
  iframe.frameBorder = '0';
  iframe.allowFullscreen = true;
  iframe.removeAttribute('sandbox');
  iframe.addEventListener('load',  async () => {
    await showLoadingOverlay();
    isInitialized = true;
    injectDisableInteractions();
     if (!initialPreviewDone) {
    initialPreviewDone = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        switchToDevice(currentDevice);
      });
    });
  }
  await hideLoadingOverlay();
  });
  iframeContainer.appendChild(iframe);
  return iframe;
}
/**
 *
 * Injecte un script dans l'iframe pour désactiver les interactions (clics, soumissions de formulaire)
 * @returns {void}
 */
function injectDisableInteractions() {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (iframeDoc) {
      const script = iframeDoc.createElement('script');
      script.textContent = `
        document.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
        document.addEventListener('submit', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      `;
      iframeDoc.body.appendChild(script);
    }
  } catch (err) {
    console.warn("Impossible d'injecter le script dans l'iframe :", err);
  }
}
/**
 *
 *  Positionne l’iframe de prévisualisation selon le device sélectionné.
 *  @returns {void}
 */
function positionIframe() {
  let overlay = document.getElementById('preview-loading-overlay');
  if (!iframe || !isInitialized || !overlay) return;
  const config = DEVICE_CONFIG[currentDevice];
  if (!config) return;
  const screenElement = document.querySelector(config.screen);
  if (!screenElement) return;
  const rect = screenElement.getBoundingClientRect();
  const scale = rect.width / config.baseWidth;
  iframeContainer.style.display = 'block';
  iframe.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${scale})`;
  iframe.style.width = `${config.baseWidth}px`;
  iframe.style.height = `${rect.height / scale}px`;
  overlay.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${scale})`;
  overlay.style.width = `${config.baseWidth}px`;
  overlay.style.height = `${rect.height / scale}px`;
}
/**
 *
 *  Change le device actif pour la prévisualisation
 *  @param {string} deviceKey - Clé du device ('ordi', 'tel', 'tablet')
 *  @returns {void}
 */
function switchToDevice(deviceKey) {
  if (!DEVICE_CONFIG[deviceKey]) return;
  currentDevice = deviceKey;
  Object.values(DEVICE_CONFIG).forEach(config => {
    const device = document.querySelector(config.container);
    if (device) device.style.display = 'none';
  });
  const activeDevice = document.querySelector(DEVICE_CONFIG[deviceKey].container);
  if (activeDevice) {
    activeDevice.style.display = 'block';
  }
  if (!iframe) {
    createIframe();
    return;
  }
  showLoadingOverlay();
  const oldSrc = iframe.src;
  iframe.src = '';
  iframe.src = oldSrc;
  iframe.onload = async () => {
    isInitialized = true;
    injectDisableInteractions();
    positionIframe();
    await hideLoadingOverlay();
  };
}
/**
 *
 *  Initialise les écouteurs sur les radios pour changer de device
 *  @returns {void}
 */
function initRadioListeners() {
  const radios = document.querySelectorAll('.radio-inputs input[type="radio"]');
  const deviceMap = ['ordi', 'tel', 'tablet'];
  radios.forEach((radio, index) => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        switchToDevice(deviceMap[index]);
      }
    });
  });
}
/**
 *
 * Met en place les écouteurs d'événements (resize, scroll, MutationObserver)
 * pour repositionner automatiquement l'iframe lorsque le layout de la page change.
 * @returns {void}
 */
function setupAutoReposition() {
  let resizing = false;
  let resizeFrame;
  function updateDuringResize() {
    if (!resizing) return;
    positionIframe();
    requestAnimationFrame(updateDuringResize);
  }
  window.addEventListener('resize', () => {
    if (!resizing) {
      resizing = true;
      requestAnimationFrame(updateDuringResize);
    }
    clearTimeout(resizeFrame);
    resizeFrame = setTimeout(() => {
      resizing = false;
    }, 120);
  });
  window.addEventListener('scroll', () => {
    requestAnimationFrame(() => positionIframe());
  });
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => positionIframe());
    Object.values(DEVICE_CONFIG).forEach(config => {
      const screen = document.querySelector(config.screen);
      if (screen) resizeObserver.observe(screen);
    });
  }
  const pluginCard = document.querySelector('.plugin-card');
  if (pluginCard && window.MutationObserver) {
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => positionIframe());
    });
    mutationObserver.observe(pluginCard, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  const themeSelect = getById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      setTimeout(() => positionIframe(), 100);
    });
  }
  const allToggles = document.querySelectorAll('.plugin-card input[type="checkbox"]');
  allToggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      setTimeout(() => positionIframe(), 100);
    });
  });
}
/**
 *
 * Collecte les chemins d'accès (URL) des fichiers CSS et JS du thème,
 * ainsi que les options JavaScript du thème, en fonction des sélections de l'utilisateur.
 * @param {Object} themeData - Données de configuration du thème sélectionné.
 * @param {string} selectedTheme - Nom du thème actif.
 * @returns {{cssFiles: Array<string>, jsFiles: Array<string>, jsOptions: Object}} - Les assets et options collectés.
 */
function collectThemeAssets(themeData, selectedTheme) {
  const cssFiles = [];
  const jsFiles = [];
  const jsOptions = {};
  const baseUrl = API_ENDPOINTS.previewAsset;
  Object.entries(themeData.elements || {}).forEach(([elementName, element]) => {
    const input = getById(element.setting);
    const isActive = input?.type === 'checkbox' ? input.checked : true;
    if (!isActive || !element.file) return;
    const type = element.type || "both";
    if (type === "css" || type === "both") {
      cssFiles.push(`${baseUrl}&type=css&theme=${selectedTheme}&file=${element.file}`);
    }
    if (type === "js" || type === "both") {
      jsFiles.push(`${baseUrl}&type=js&theme=${selectedTheme}&file=${element.file}`);
    }
    if (element.extra_options) {
      Object.entries(element.extra_options).forEach(([optKey, optValue]) => {
        if (optValue.type === "ignore") {
           jsOptions[optKey] = window[optKey];
          return;
        }
        const extraInput = getById(optKey);
        const extraActive = extraInput?.type === 'checkbox' ? extraInput.checked : !!extraInput?.value;
        if (extraActive) {
          if (optValue.css) cssFiles.push(optValue.css);
          if (optValue.js) jsFiles.push(optValue.js);
          if (extraInput?.value) {
            jsOptions[optKey] = extraInput.value;
          }
        }
      });
    }
  });
  return { cssFiles, jsFiles, jsOptions };
}
/**
 *
 * Injecte les balises <link> des fichiers CSS dans la section <head> du document de l'iframe.
 * @async
 * @param {HTMLDocument} doc - Document de l'iframe.
 * @param {Array<string>} cssFiles - Liste des URL des fichiers CSS à injecter.
 * @param {string} selectedTheme - Nom du thème utilisé pour le dataset de nettoyage.
 * @returns {Promise<void>}
 */
async function injectCSSFiles(doc, cssFiles, selectedTheme) {
  const head = doc.head;
  cssFiles.forEach(href => {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.theme = selectedTheme;
    head.appendChild(link);
  });
}
/**
 *
 * Génère le contenu du script contenant les options JavaScript du thème (window.ThemeOptions).
 * @param {string} selectedTheme - Nom du thème.
 * @param {Object} jsOptions - Options JavaScript à inclure.
 * @returns {string} - Chaîne de caractères représentant le contenu du script.
 */
function generateOptionsScript(selectedTheme, jsOptions) {
  if (Object.keys(jsOptions).length === 0) return '';
  const jsonOpts = JSON.stringify(jsOptions);
  return `window["${selectedTheme}ThemeOptions"] = ${jsonOpts};`;
}
/**
 *
 * Crée et ajoute l'overlay de chargement au document body.
 * @returns {HTMLDivElement} - L'élément overlay créé.
 */
function createLoadingOverlay() {
  createFixedIframeContainer();
  const overlay = document.createElement('div');
  overlay.id = 'preview-loading-overlay';
  const apiNamespace = window.api_namespace || 'default';
  const logo = document.createElement('img');
  logo.src = `/api/v1/contrib/${apiNamespace}/static/images/inLibro_icone.png`;
  logo.alt = 'InLibro Icone';
  logo.classList.add('preview-loading-logo');
  const style = document.createElement('style');
  document.head.appendChild(style);
  overlay.appendChild(logo);
  iframeContainer.appendChild(overlay);
  return overlay;
}
/**
 *
 * Affiche l'overlay de chargement sur l'iframe pour masquer le rechargement.
 * @returns {Promise<void>} - Se résout après que l'affichage soit complet.
 */
function showLoadingOverlay() {
  let overlay = document.getElementById('preview-loading-overlay');
  if (!overlay) {
    overlay = createLoadingOverlay();
  }
  overlay.style.display = 'flex';
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });
}
/**
 *
 * Cache l'overlay de chargement après un court délai pour permettre l'affichage des assets.
 * @async
 * @returns {Promise<void>} - Se résout après un délai et masquage.
 */
async function hideLoadingOverlay() {
  const overlay = document.getElementById('preview-loading-overlay');
  if (!overlay) return;
  await new Promise(resolve => setTimeout(resolve, 2500));
  overlay.style.display = 'none';
  overlay.style.pointerEvents = 'none';
}
/**
 *
 * Nettoie l'iframe en supprimant tous les assets (CSS et JS) du thème précédemment injectés.
 * @param {HTMLDocument} doc - Document de l'iframe.
 * @returns {Promise<void>}
 */
function cleanOldAssets(doc) {
  doc.querySelectorAll('link[data-theme], script[data-theme]').forEach(el => el.remove());
}
/**
 *
 * Met à jour la prévisualisation du thème dans l'iframe en rechargant l'OPAC de prévisualisation
 * et en injectant les assets CSS/JS sélectionnés.
 * @async
 * @param {Object} rawThemes - Configuration complète des thèmes disponibles.
 * @param {string} themeName - Nom du thème à prévisualiser.
 * @returns {Promise<void>} - Se résout une fois les assets chargés et l'overlay masqué.
 */
async function updatePreview(rawThemes, themeName) {
  await showLoadingOverlay();
  const previewBtn = getById('preview-button');
  const createBtn = getById('create-button');
  toggleButtons([previewBtn,createBtn], true);
  const iframe = getById('theme-preview');
  if (!iframe) return;
  const themeData = rawThemes[themeName];
  if (!themeData) {
    await hideLoadingOverlay();
    return;
  }
  await new Promise(resolve => {
    iframe.onload = () => resolve();
    iframe.src = iframe.src;
  });
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc) {
    await hideLoadingOverlay();
    return;
  }
  await cleanOldAssets(doc);
  const { cssFiles, jsFiles, jsOptions } = collectThemeAssets(themeData, themeName);
  await injectCSSFiles(doc, cssFiles, themeName);
  await injectJSFilesAsync(doc, jsFiles, themeName, jsOptions);
  await hideLoadingOverlay();
  toggleButtons([previewBtn,createBtn], false);
}
/**
 *
 * Injecte de manière asynchrone les scripts JS et les options de thème dans le document de l'iframe.
 * Les scripts sont récupérés via fetch et injectés comme scripts inline pour garantir l'exécution
 * et le respect des dépendances de l'API.
 * @async
 * @param {HTMLDocument} doc - Document de l'iframe.
 * @param {Array<string>} jsFiles - Liste des URL des fichiers JS à injecter.
 * @param {string} selectedTheme - Nom du thème.
 * @param {Object} jsOptions - Options JavaScript à inclure.
 * @returns {Promise<void>} - Se résout une fois tous les scripts chargés et exécutés.
 */
async function injectJSFilesAsync(doc, jsFiles, selectedTheme, jsOptions) {
  const body = doc.body;
  const optionsScript = generateOptionsScript(selectedTheme, jsOptions);
  if (optionsScript) {
    const optScript = doc.createElement('script');
    optScript.type = 'text/javascript';
    optScript.textContent = optionsScript;
    optScript.dataset.theme = selectedTheme;
    body.appendChild(optScript);
  }
  const uniqueJsFiles = [...new Set(jsFiles)];
  const loadPromises = uniqueJsFiles.map(src => {
    return fetch(src)
      .then(res => res.text())
      .then(code => {
        const inlineScript = doc.createElement('script');
        inlineScript.type = 'text/javascript';
        inlineScript.textContent = code;
        inlineScript.dataset.theme = selectedTheme;
        body.appendChild(inlineScript);
        if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
          const event = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
          doc.dispatchEvent(event);
        }
      })
      .catch(err => console.error('Erreur chargement JS:', err));
  });
  await Promise.all(loadPromises);
}
/**
 *
 *  Initialise le système de prévisualisation multi-device
 *  @returns {void}
 */
function initDevicePreviewSwitcher() {
  const existing = getById('theme-preview');
  if (existing) existing.remove();
  initRadioListeners();
  createIframe();
  setupAutoReposition();
  switchToDevice(currentDevice);
  window.positionIframeGlobal = positionIframe;
}

// ===== Fichier: main.js =====
/**
 * ======================================================
 *  Script principal du module de gestion des thèmes
 * ======================================================
 */

/**
 *
 * Classe principale pour gérer l'application des thèmes
 */
class ThemeManager {
  constructor() {
    this.elements = this.initializeElements();
    this.state = this.initializeState();
    this.observer = null;
    this.state.isAllConfigured = false;
  }
  /**
   *
   * Initialise les références aux éléments DOM
   */
  initializeElements() {
    return {
      themeSelect: getById('theme-select'),
      form: getById('theme-form'),
      successMessage: getById('success-message'),
      resetMessage: getById('reset-message'),
      erreurMessage: getById('erreur-message'),
      previewButton: getById('preview-button'),
      noThemeMessage: getById('no-themes-message'),
      themesGrid: getById('themes-grid'),
      resetBtn: getById('reset-button'),
      updateBtn: getById('update-button'),
      createBtn: getById('create-button'),
      previewBtn: getById('preview-button')
    };
  }
  /**
   *
   * Initialise l'état de l'application
   */
  initializeState() {
    const allThemesRaw = safeParseJSON(ALL_THEMES, "ALL_THEMES");
    const allThemes = Array.isArray(allThemesRaw)
    ? Object.fromEntries(
        allThemesRaw.map(t => [
          t.theme_name || t.name,
          t
        ])
      )
    : allThemesRaw;
    return {
      currentSettings: safeParseJSON(CURRENT_SETTINGS_STR, "CURRENT_SETTINGS_STR"),
      allThemes,
      rawThemes: safeParseJSON(THEMES_CONFIG_STR, "THEMES_CONFIG_STR"),
    };
  }
  /**
   *
   * Configure le MutationObserver pour surveiller les changements DOM
   */
  setupMutationObserver() {
    this.observer = new MutationObserver(() => {
      disableAllActionButtons();
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  /**
   *
   * Configure l'état initial des boutons
   */
  setupInitialButtonStates() {
    disableAllActionButtons();
    this.elements.createBtn.disabled = true;
    this.elements.previewBtn.disabled = true;
  }
  /**
   *
   * Configure les écouteurs d'événements du formulaire
   */
  setupFormListeners() {
    this.elements.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.handleFormSubmit();
    });
    this.elements.themeSelect.addEventListener('change', () => {
      updateThemeOptions(this.state.rawThemes, this.elements.themeSelect);
    });
    this.elements.themeSelect.addEventListener('allConfigured', () => {
      if (!this.state.isAllConfigured) {
        this.state.isAllConfigured = true;
        enterAllConfiguredMode(this.elements);
      }
    });
    this.elements.themeSelect.addEventListener('notAllConfigured', () => {
      if (this.state.isAllConfigured) {
        this.state.isAllConfigured = false;
        exitAllConfiguredMode(this.elements);
      }
    });
  }
  /**
   *
   * Gère la soumission du formulaire
   */
  async handleFormSubmit() {
    await submitThemeForm(
      this.elements.form,
      this.state.rawThemes,
      this.elements,
      async () => {
        await refreshThemesGridFromAPI(this.state, this.elements, this.state.rawThemes);
        refreshThemeSelect(this.state.allThemes, this.state.rawThemes, this.elements.themeSelect);
        if (areAllThemesConfigured(this.state.allThemes, this.state.rawThemes)) {
          this.state.isAllConfigured = true;
          enterAllConfiguredMode(this.elements);
        }
      }
    );
  }
  /**
   *
   * Configure les sliders de quantité (flocons, coeurs, spiders)
   */
  setupQuantitySliders() {
    ['flocons', 'coeurs', 'spiders'].forEach(type => {
      const input = getById(`quantite_${type}`);
      const label = getById(`val_quantite_${type}`);

      if (input && label) {
        input.addEventListener('input', () => {
          label.textContent = input.value;
        });
      }
    });
  }
  /**
   *
   * Configure le bouton de prévisualisation
   */
  setupPreviewButton() {
    if (!this.elements.previewButton) return;
    this.elements.previewButton.addEventListener('click', () => {
      const themeName = this.getActiveThemeName();
      if (themeName) {
        updatePreview(this.state.rawThemes, themeName);
      }
    });
  }
  /**
   *
   * Configure le bouton de mise à jour
   */
  setupUpdateButton() {
    if (!this.elements.updateBtn) return;
    this.elements.updateBtn.addEventListener('click', async () => {
      await this.handleThemeUpdate();
    });
  }
  /**
   *
   * Gère la mise à jour d'un thème
   */
  async handleThemeUpdate() {
    const buttons = [
      this.elements.updateBtn,
      this.elements.previewBtn,
      getById("cancel-edit-btn"),
      this.elements.resetBtn
    ];
    this.toggleButtons(buttons, true);
    try {
      const themeName = this.getActiveThemeName();
      if (!themeName) return;
      const success = await updateTheme(themeName, this.state.rawThemes, this.elements.form, this.elements);
      if (!success) return;
      await refreshThemesGridFromAPI(this.state, this.elements, this.state.rawThemes);
      refreshThemeSelect(this.state.allThemes, this.state.rawThemes, this.elements.themeSelect);
      exitThemeEditor(this.state.rawThemes, this.elements);
      const activeTheme = this.elements.themeSelect.value;
      //updatePreview(this.state.rawThemes, activeTheme);
    } finally {
      this.toggleButtons(buttons, false);

      const confTitre = document.getElementById('ConfTitre');

      const themeSelect = document.getElementById('theme-select');
      const themeForm = document.getElementById('theme-form');
      const celebrationComplete = document.getElementById('celebration-complete');
      const previewBtn = document.getElementById('preview-button');

      const isEmpty = themeSelect.options.length == 0;

      if(isEmpty){

        confTitre.style.display = 'none';
        themeForm.style.display = 'none';
        celebrationComplete.style.display = 'block';
        previewBtn.style.display = 'block';

      }
    } 
  }
  /**
   *
   * Récupère le nom du thème actuellement actif
   */
  getActiveThemeName() {
    const visibleFormGroup = document.querySelector('.form-group[style*="display: block"]');
    return visibleFormGroup ? visibleFormGroup.id.replace('-options', '') : null;
  }
  /**
   *
   * Active/désactive un ensemble de boutons
   */
  toggleButtons(buttons, disabled) {
    buttons.forEach(btn => {
      if (btn) btn.disabled = disabled;
    });
  }
  /**
   *
   * Configure l'événement de chargement complet de la page
   */
  setupWindowLoadEvent() {
    window.addEventListener('load', () => {
      this.elements.createBtn.disabled = false;
      this.elements.previewBtn.disabled = false;
      enableAllActionButtons();
      if (this.observer) {
        this.observer.disconnect();
      }
    });
  }
  /**
   *
   * Initialise le switcher de prévisualisation des appareils
   */
  setupDevicePreviewSwitcher() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDevicePreviewSwitcher);
    } else {
      initDevicePreviewSwitcher();
    }
  }
   /**
   *
   * Vérifie au chargement si tous les thèmes sont configurés
   * et bascule l’interface dans le mode approprié.
   */
  checkAllConfiguredOnLoad() {
  if (areAllThemesConfigured(this.state.allThemes, this.state.rawThemes)) {
    this.state.isAllConfigured = true;
    enterAllConfiguredMode(this.elements);
  } else {
    this.state.isAllConfigured = false;
    exitAllConfiguredMode(this.elements);
  }
}
  /**
   *
   * Initialise tous les composants de l'application
   */
  init() {
    this.setupMutationObserver();
    this.setupInitialButtonStates();
    renderThemesGrid(this.state, this.elements);
    this.setupFormListeners();
    this.setupQuantitySliders();
    this.setupPreviewButton();
    this.setupUpdateButton();
    this.setupDevicePreviewSwitcher();
    this.setupWindowLoadEvent();
    updateThemeOptions(this.state.rawThemes, this.elements.themeSelect);
    this.checkAllConfiguredOnLoad();
  }
}
/**
 *
 * Point d'entrée de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
  const themeManager = new ThemeManager();
  themeManager.init();
});

