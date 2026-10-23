export function showError(form, fieldName, message) {
  const el = form.querySelector(`[data-for="${fieldName}"]`);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('show', Boolean(message));
}

export function clearErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
}

export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function hasNumber(v) {
  return /\d/.test(v);
}
