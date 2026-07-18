// Live score calculator for scoring pages (Cat 1-3 and Cat 4)
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-scoring-form]');
  if (!container) return;

  const weights = (container.dataset.weights || '')
    .split(',')
    .map((w) => parseFloat(w))
    .filter((w) => !isNaN(w));

  const rows = Array.from(container.querySelectorAll('[data-score-row]'));
  const liveTotal = document.getElementById('liveTotal');
  const liveFormula = document.getElementById('liveFormula');
  const comments = document.getElementById('comments');
  const saveBtn = document.getElementById('saveBtn');
  const commentsHint = document.getElementById('commentsHint');
  const toast = document.getElementById('toast');
  const formActions = document.querySelector('[data-form-actions]');
  const savedActions = document.querySelector('[data-saved-actions]');
  const editBtn = document.getElementById('editScoreBtn');

  function updateFill(range) {
    const min = parseFloat(range.min || 1);
    const max = parseFloat(range.max || 10);
    const pct = ((range.value - min) / (max - min)) * 100;
    range.style.setProperty('--fill', pct + '%');
  }

  function recalc() {
    const values = rows.map((row) => parseInt(row.querySelector('input[type="range"]').value, 10));
    let total = 0;
    const formulaParts = [];

    values.forEach((v, i) => {
      const w = weights[i] ?? 0;
      total += v * w;
      formulaParts.push(`(${v}×${w})`);
    });

    if (liveTotal) liveTotal.textContent = total.toFixed(1);
    if (liveFormula) liveFormula.textContent = formulaParts.join(' + ');
  }

  rows.forEach((row) => {
    const range = row.querySelector('input[type="range"]');
    const number = row.querySelector('input[type="number"]');
    const display = row.querySelector('[data-score-display]');

    updateFill(range);

    range.addEventListener('input', () => {
      number.value = range.value;
      display && (display.textContent = range.value);
      updateFill(range);
      recalc();
      window.__wpdjDirty = true;
    });

    number.addEventListener('input', () => {
      let val = parseInt(number.value, 10);
      if (isNaN(val)) return;
      val = Math.min(10, Math.max(1, val));
      number.value = val;
      range.value = val;
      display && (display.textContent = val);
      updateFill(range);
      recalc();
      window.__wpdjDirty = true;
    });
  });

  function validateComments() {
    const filled = comments.value.trim().length > 0;
    if (!filled) {
      comments.classList.add('field-invalid');
      commentsHint?.classList.remove('hidden');
      saveBtn.disabled = true;
    } else {
      comments.classList.remove('field-invalid');
      commentsHint?.classList.add('hidden');
      saveBtn.disabled = false;
    }
    return filled;
  }

  if (comments) {
    comments.addEventListener('input', () => {
      window.__wpdjDirty = true;
      validateComments();
    });
    comments.addEventListener('blur', validateComments);
    validateComments();
  }

  function setSavedState(saved) {
    rows.forEach((row) => {
      row.querySelector('input[type="range"]').disabled = saved;
      row.querySelector('input[type="number"]').disabled = saved;
    });
    if (comments) comments.disabled = saved;
    formActions?.classList.toggle('hidden', saved);
    savedActions?.classList.toggle('hidden', !saved);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!validateComments()) return;

      window.__wpdjDirty = false;
      setSavedState(true);
      if (toast) {
        toast.classList.add('open');
        setTimeout(() => toast.classList.remove('open'), 2600);
      }
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      setSavedState(false);
    });
  }

  recalc();
});
