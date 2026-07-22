// Admin dashboard interactions: mock CSV export
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportCsvBtn');
  const toast = document.getElementById('toast');

  // Sample rows mirroring the wpdj_score CPT post meta keys documented in the
  // README (_judge_user_id, _submission_id, _submission_code, _country,
  // _category, _score_1..4, _weighted_total, _comments). judge_user_id is
  // shown resolved to a display name here, the way WP_Query + get_userdata()
  // would render it for a human-readable CSV.
  const mockScores = [
    { submission_code: 'ID-CAT1-001', country: 'ID', category: 'CAT1', judge_user_id: 'Dr. Ratna Wijaya', score_1: 9, score_2: 8, score_3: 8, score_4: 9, weighted_total: 8.6, comments: 'Excellent literacy program with strong, measurable impact.' },
    { submission_code: 'ID-CAT2-004', country: 'ID', category: 'CAT2', judge_user_id: 'Dr. Hendra Kusuma', score_1: 7, score_2: 7, score_3: 6, score_4: 8, weighted_total: 7.0, comments: 'Solid outreach initiative; recommend expanding to more barangays.' },
    { submission_code: 'PH-CAT1-003', country: 'PH', category: 'CAT1', judge_user_id: 'Dr. Maria Santos', score_1: 8, score_2: 7, score_3: 8, score_4: 9, weighted_total: 8.0, comments: 'Strong literacy impact with clear before/after evidence.' },
    { submission_code: 'PH-CAT3-002', country: 'PH', category: 'CAT3', judge_user_id: 'Dr. Antonio Reyes', score_1: 8, score_2: 7, score_3: 8, score_4: 9, weighted_total: 8.0, comments: 'Well-documented referral protocol with measurable outcomes.' },
    { submission_code: 'VN-CAT4-005', country: 'VN', category: 'CAT4', judge_user_id: 'Dr. Linh Nguyen', score_1: 9, score_2: 8, score_3: 9, score_4: 9, weighted_total: 8.65, comments: 'Highly creative, authentic storytelling with strong pharmacy advocacy.' },
    { submission_code: 'VN-CAT2-001', country: 'VN', category: 'CAT2', judge_user_id: 'Dr. Minh Tran', score_1: 7, score_2: 6, score_3: 7, score_4: 6, weighted_total: 6.6, comments: 'Good initiative; documentation could be more thorough.' },
  ];

  function csvEscape(value) {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  exportBtn?.addEventListener('click', () => {
    const header = ['submission_code', 'country', 'category', 'judge_user_id', 'score_1', 'score_2', 'score_3', 'score_4', 'weighted_total', 'comments'];
    const lines = [
      header.join(','),
      ...mockScores.map((row) => header.map((key) => csvEscape(row[key])).join(',')),
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wpd-2026-scores-export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (toast) {
      toast.classList.add('open');
      setTimeout(() => toast.classList.remove('open'), 2600);
    }
  });

  // Country filter chips — filters the Judge Progress table by country
  const judgeRows = Array.from(document.querySelectorAll('[data-judge-table] tbody tr'));

  document.querySelectorAll('[data-filter-chip]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const group = chip.closest('[data-filter-group]');
      group?.querySelectorAll('[data-filter-chip]').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');

      const value = chip.dataset.filterValue;
      judgeRows.forEach((row) => {
        row.style.display = value === 'all' || row.dataset.country === value ? '' : 'none';
      });
    });
  });
});
