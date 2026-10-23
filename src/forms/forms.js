import { clearErrors, showError, isEmail } from './validation.js';

function val(form, name) {
  return (form.elements[name]?.value ?? '').trim();
}

function setOk(id, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('d-none', !ok);
}

export function initForms() {
  // 1) Player Profile (Registration)
  const reg = document.getElementById('regForm');
  reg.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(reg);
    setOk('regOk', false);

    const username = val(reg, 'username');
    const ageStr = val(reg, 'age');
    const difficulty = val(reg, 'difficulty');

    let valid = true;

    if (username.length < 3) {
      showError(reg, 'username', 'Username must be at least 3 characters.');
      valid = false;
    }

    const age = Number(ageStr);
    if (!Number.isFinite(age) || age < 10) {
      showError(reg, 'age', 'Age must be 10 or above.');
      valid = false;
    }

    if (!difficulty) {
      showError(reg, 'difficulty', 'Please select your preferred difficulty.');
      valid = false;
    }

    if (valid) {
      // demo-only: store profile locally (no backend required)
      localStorage.setItem('frog_profile', JSON.stringify({ username, age, difficulty }));
      setOk('regOk', true);
    }
  });

  // 2) Feedback (Contact)
  const contact = document.getElementById('contactForm');
  contact.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(contact);
    setOk('contactOk', false);

    const email = val(contact, 'email');
    const type = val(contact, 'type');
    const message = val(contact, 'message');

    let valid = true;

    if (!isEmail(email)) {
      showError(contact, 'email', 'Please enter a valid email address.');
      valid = false;
    }

    if (!type) {
      showError(contact, 'type', 'Please choose a feedback type.');
      valid = false;
    }

    if (message.length < 10) {
      showError(contact, 'message', 'Message must be at least 10 characters long.');
      valid = false;
    }

    if (valid) {
      // demo-only: keep last feedback locally so you can show it during demo
      localStorage.setItem('frog_last_feedback', JSON.stringify({ email, type, message, at: Date.now() }));
      setOk('contactOk', true);
      contact.reset();
    }
  });

  // 3) Game Settings
  const settings = document.getElementById('settingsForm');
  settings.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(settings);
    setOk('settingsOk', false);

    const volumeStr = val(settings, 'volume');
    const controls = val(settings, 'controls');
    const nightMode = settings.elements['nightMode']?.checked ?? false;
    const remember = settings.elements['remember']?.checked ?? false;

    let valid = true;

    const volume = Number(volumeStr);
    if (!Number.isFinite(volume) || volume < 0 || volume > 100) {
      showError(settings, 'volume', 'Volume must be a number between 0 and 100.');
      valid = false;
    }

    if (!controls) {
      showError(settings, 'controls', 'Please select a control method.');
      valid = false;
    }

    if (valid) {
      const payload = { volume, controls, nightMode };
      if (remember) localStorage.setItem('frog_settings', JSON.stringify(payload));
      else localStorage.removeItem('frog_settings');

      // Optional: apply a simple "night mode" class to the body for demo
      document.body.classList.toggle('night-mode', nightMode);

      setOk('settingsOk', true);
    }
  });

  // Prefill remembered profile/settings (demo-friendly)
  try {
    const profile = JSON.parse(localStorage.getItem('frog_profile') || 'null');
    if (profile && document.getElementById('regForm')) {
      const f = document.getElementById('regForm');
      if (profile.username) f.elements['username'].value = profile.username;
      if (Number.isFinite(profile.age)) f.elements['age'].value = profile.age;
      if (profile.difficulty) f.elements['difficulty'].value = profile.difficulty;
    }

    const saved = JSON.parse(localStorage.getItem('frog_settings') || 'null');
    if (saved && document.getElementById('settingsForm')) {
      const s = document.getElementById('settingsForm');
      if (Number.isFinite(saved.volume)) s.elements['volume'].value = saved.volume;
      if (saved.controls) s.elements['controls'].value = saved.controls;
      s.elements['nightMode'].checked = !!saved.nightMode;
      s.elements['remember'].checked = true;
      document.body.classList.toggle('night-mode', !!saved.nightMode);
    }
  } catch {
    /* ignore */
  }
}
