// Drives the judge dashboard's nav pill (flag + country) and welcome hero
// from whichever country the judge logged in as (see login-indonesia.html,
// login-philippines.html, login-vietnam.html — each sets localStorage
// wpdjCountry on submit). Mirrors the per-country judge identities used in
// cat4-localize.js so the name/country shown is consistent across the site.
// Mockup only: in the real plugin the judge's name/country come from the
// logged-in WP user, not a hardcoded lookup table.
document.addEventListener('DOMContentLoaded', () => {
  const JUDGES = {
    ID: { flagClass: 'flag-id', countryName: 'Indonesia', judgeName: 'Dr. Ratna Wijaya' },
    PH: { flagClass: 'flag-ph', countryName: 'Philippines', judgeName: 'Dr. Maria Santos' },
    VN: { flagClass: 'flag-vn', countryName: 'Vietnam', judgeName: 'Dr. Linh Nguyen' },
  };

  const judge = JUDGES[localStorage.getItem('wpdjCountry')] || JUDGES.PH;

  const flagEl = document.querySelector('[data-judge-flag]');
  if (flagEl) {
    flagEl.classList.remove('flag-id', 'flag-ph', 'flag-vn');
    flagEl.classList.add(judge.flagClass);
  }

  const set = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  };

  set('[data-judge-country]', judge.countryName);
  set('[data-judge-name]', judge.judgeName);

  const welcomeEl = document.querySelector('[data-judge-welcome]');
  if (welcomeEl) welcomeEl.textContent = `Welcome, ${judge.judgeName}`;

  const subtitleEl = document.querySelector('[data-judge-subtitle]');
  if (subtitleEl) subtitleEl.textContent = `Here is your scoring progress for ${judge.countryName}.`;
});
