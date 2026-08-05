// Live score calculator for scoring pages (Cat 1-3 and Cat 4), plus the
// submission queue: Previous/Next walks Category 1 -> 2 -> 3 -> 4, submissions
// in ascending code order within each category (see submissions-data.js),
// and scores/comments persist per submission code in localStorage so a
// judge can leave and come back without losing saved work.
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

  // --- Submission queue: resolve current submission, populate its detail
  // fields, point Previous/Next at its neighbours in the full queue. ---
  let currentItem = null;

  function getScoreState(item) {
    const stored = JSON.parse(localStorage.getItem('wpdjScores') || '{}');
    if (stored[item.code]) return stored[item.code];
    if (item.saved) return { scores: item.scores, comment: item.comment || '', saved: true };
    return { scores: rows.map(() => 0), comment: '', saved: false };
  }

  function setScoreState(code, state) {
    const stored = JSON.parse(localStorage.getItem('wpdjScores') || '{}');
    stored[code] = state;
    localStorage.setItem('wpdjScores', JSON.stringify(stored));
  }

  const category = document.body.dataset.category;
  const judgeCountry = localStorage.getItem('wpdjCountry') || 'PH';
  let state = null;

  // Category 04 only has a full submission queue for the Philippines flow
  // (see submissions-data.js); a judge logged in as ID/VN keeps seeing the
  // single country-specific example from cat4-localize.js untouched.
  const hasQueueForThisPage = category !== 'CAT4' || judgeCountry === 'PH';

  if (hasQueueForThisPage && window.WPDJ_SUBMISSIONS && category && window.WPDJ_SUBMISSIONS[category]) {
    const order = ['CAT1', 'CAT2', 'CAT3', 'CAT4'];
    const queue = order.flatMap((c) => (window.WPDJ_SUBMISSIONS[c] || []).map((item) => ({ ...item, category: c })));

    // Sample data is authored as PH-CATx-0NN; relabel the prefix to match the
    // judge's own country (see judge-country.js, which does the same for the
    // dashboard table) so the code shown/linked/persisted-against is ID-/VN-
    // for those judges instead of always Philippines.
    queue.forEach((item) => {
      item.code = item.code.replace(/^PH-/, `${judgeCountry}-`);
    });

    const codeParam = new URLSearchParams(window.location.search).get('code');
    let currentIdx = queue.findIndex((i) => i.code === codeParam);
    if (currentIdx < 0) currentIdx = queue.findIndex((i) => i.category === category);
    currentItem = queue[currentIdx];

    // Vietnam judges viewing the page in Vietnamese see the submission's own
    // content (title/area/about/impact/who, or the Cat 4 caption) in the `vi`
    // translation authored alongside each item in submissions-data.js, per
    // client request; everyone else sees the English original as submitted.
    const lang = window.wpdjI18n ? window.wpdjI18n.getLang() : (localStorage.getItem('wpdjLang') || 'en');
    const useViContent = judgeCountry === 'VN' && lang === 'vi';

    document.querySelectorAll('[data-field]').forEach((el) => {
      const key = el.dataset.field;
      if (key === 'hashtags') {
        el.innerHTML = (currentItem.hashtags || []).map((t) => `<span class="tag-pill">${t}</span>`).join('');
      } else if (key === 'materials') {
        el.innerHTML = currentItem.materialsUrl
          ? `<a href="${currentItem.materialsUrl}" target="_blank" rel="noopener">Click here</a>`
          : '-';
      } else {
        const value = useViContent && currentItem.vi && currentItem.vi[key] !== undefined
          ? currentItem.vi[key]
          : currentItem[key];
        if (value !== undefined) el.textContent = value;
      }
    });

    // Sample data stores entryType etc. as plain English ("Self"/"Team"/
    // "Individual"); i18n.js already translated the page once on load, but
    // that ran before this loop overwrote entryType with fresh English text,
    // so re-apply it now the field is populated (submission title/description
    // stay untranslated on purpose - see i18n.js's top-of-file note - only
    // known UI phrases like Self/Team/Individual have PHRASES entries).
    window.wpdjI18n?.apply();

    const prevLink = document.querySelector('[data-nav-prev]');
    const nextLink = document.querySelector('[data-nav-next]');
    if (prevLink && nextLink && queue.length) {
      const prevItem = queue[(currentIdx - 1 + queue.length) % queue.length];
      const nextItem = queue[(currentIdx + 1) % queue.length];
      prevLink.href = `${window.WPDJ_CATEGORY_PAGES[prevItem.category]}?code=${prevItem.code}`;
      nextLink.href = `${window.WPDJ_CATEGORY_PAGES[nextItem.category]}?code=${nextItem.code}`;
    }

    state = getScoreState(currentItem);
    rows.forEach((row, i) => {
      const range = row.querySelector('input[type="range"]');
      const number = row.querySelector('input[type="number"]');
      const display = row.querySelector('[data-score-display]');
      const val = state.scores ? (state.scores[i] ?? 0) : 0;
      range.value = val;
      number.value = val;
      if (display) display.textContent = val;
    });
    if (comments) comments.value = state.comment || '';
  }

  function updateFill(range) {
    const min = parseFloat(range.min || 0);
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
      val = Math.min(10, Math.max(0, val));
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
      if (currentItem) {
        const scores = rows.map((row) => parseInt(row.querySelector('input[type="range"]').value, 10));
        setScoreState(currentItem.code, { scores, comment: comments.value, saved: true });
      }
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

  if (state) setSavedState(state.saved);
  recalc();
});
