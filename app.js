
// --- GESTION DE RESTAURANT - LOGIQUE INTÉGRÉE ---

window.addEventListener('load', () => {
  // Splash Screen & PWA Banner
  checkPWAInstallBanner();
  checkForAppUpdates();
});

// 2) Bannière PWA d'installation sur navigateur
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (!document.getElementById('pwa-install-banner') && !window.matchMedia('(display-mode: standalone)').matches) {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = 'background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; padding:10px 15px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; position:sticky; top:0; z-index:1000;';
    banner.innerHTML = `<span>📱 Installer "Gestion de Restaurant"</span><button onclick="installPWA()" style="background:#fff; color:#d97706; border:none; padding:5px 10px; border-radius:5px; font-weight:bold; cursor:pointer;">Installer</button>`;
    document.body.prepend(banner);
  }
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      deferredPrompt = null;
      document.getElementById('pwa-install-banner')?.remove();
    });
  }
}

// 2) Notification de mise à jour
function checkForAppUpdates() {
  const currentVersion = "1.6.0";
  const savedVersion = localStorage.getItem('app_version');
  if (savedVersion && savedVersion !== currentVersion) {
    showUpdateNotification();
  } else {
    localStorage.setItem('app_version', currentVersion);
  }
}

function showUpdateNotification() {
  const note = document.createElement('div');
  note.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#1e293b; color:#fff; padding:15px; border-radius:10px; border:1px solid #f59e0b; z-index:1000;';
  note.innerHTML = `<h4>🚀 Mise à jour disponible !</h4><button onclick="window.location.reload()" style="background:#10b981; color:#fff; border:none; padding:6px 12px; border-radius:5px; font-weight:bold; cursor:pointer;">Mettre à jour</button>`;
  document.body.appendChild(note);
}

// 4 & 5) Persistance & Inscription sécurisée (Question: Quel est votre nom ?)
function registerUserWithSecurity(userData) {
  if (!userData.securityName || userData.securityName.trim() === "") {
    alert("La réponse à la question 'Quel est votre nom ?' est obligatoire pour valider la création de votre compte.");
    return false;
  }
  let users = JSON.parse(localStorage.getItem('restogest_users') || '[]');
  if(users.some(u => u.phone === userData.phone)) {
    alert("Ce numéro de téléphone est déjà enregistré.");
    return false;
  }
  users.push(userData);
  localStorage.setItem('restogest_users', JSON.stringify(users));
  return true;
}

// 5) Récupération de mot de passe par le nom
function recoverPassword(phone, securityName) {
  let users = JSON.parse(localStorage.getItem('restogest_users') || '[]');
  let user = users.find(u => u.phone === phone);
  if (!user) {
    alert("Utilisateur introuvable.");
    return;
  }
  if (user.securityName.trim().toLowerCase() === securityName.trim().toLowerCase()) {
    alert(`Mot de passe récupéré avec succès : ${user.password}`);
  } else {
    alert("Nom incorrect. Impossible de récupérer le mot de passe.");
  }
}

// 1) Recherche propriétaire par téléphone ou ID pro
function ownerSearchUsers(query) {
  let users = JSON.parse(localStorage.getItem('restogest_users') || '[]');
  if (!query) return users;
  return users.filter(u => 
    u.phone.includes(query) || (u.proSubId && u.proSubId.toLowerCase().includes(query.toLowerCase())) || (u.securityName && u.securityName.toLowerCase().includes(query.toLowerCase()))
  );
}

// 3) Chat de support
function saveChatMessage(msg) {
  let messages = JSON.parse(localStorage.getItem('restogest_chat') || '[]');
  messages.push(msg);
  localStorage.setItem('restogest_chat', JSON.stringify(messages));
}

function getChatMessages() {
  return JSON.parse(localStorage.getItem('restogest_chat') || '[]');
}
