// Judge dashboard: category filter + pagination for the submissions table
document.addEventListener('DOMContentLoaded', () => {
  const rows = Array.from(document.querySelectorAll('[data-submissions-table] tbody tr'));
  const countEl = document.getElementById('submissionsCount');
  const prevBtn = document.querySelector('[data-page-prev]');
  const nextBtn = document.querySelector('[data-page-next]');
  const pageInfo = document.querySelector('[data-page-info]');
  const pagination = document.querySelector('[data-pagination]');
  const total = rows.length;
  const pageSize = 10;

  let currentFilter = 'all';
  let currentPage = 1;

  function getFilteredRows() {
    return rows.filter((row) => currentFilter === 'all' || row.dataset.category === currentFilter);
  }

  function render() {
    const filtered = getFilteredRows();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = filtered.slice(start, end);

    rows.forEach((row) => {
      row.style.display = pageRows.includes(row) ? '' : 'none';
    });

    if (countEl) {
      const rangeStart = filtered.length === 0 ? 0 : start + 1;
      const rangeEnd = Math.min(end, filtered.length);
      countEl.textContent = window.wpdjI18n
        ? window.wpdjI18n.showingRange(rangeStart, rangeEnd, filtered.length, currentFilter !== 'all' ? total : null)
        : `Showing ${rangeStart}-${rangeEnd} of ${filtered.length}${currentFilter !== 'all' ? ` (${total} total)` : ''}`;
    }

    if (pageInfo) {
      pageInfo.textContent = window.wpdjI18n
        ? window.wpdjI18n.pageInfo(currentPage, totalPages)
        : `Page ${currentPage} of ${totalPages}`;
    }
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pagination) pagination.style.display = totalPages <= 1 ? 'none' : 'flex';
  }

  document.querySelectorAll('[data-filter-chip]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const group = chip.closest('[data-filter-group]');
      group?.querySelectorAll('[data-filter-chip]').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      currentFilter = chip.dataset.filterValue;
      currentPage = 1;
      render();
    });
  });

  prevBtn?.addEventListener('click', () => {
    currentPage -= 1;
    render();
  });

  nextBtn?.addEventListener('click', () => {
    currentPage += 1;
    render();
  });

  render();
});
