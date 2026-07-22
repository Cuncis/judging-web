// Category 04 (Social Media Impact) example submission is country-specific:
// the tagged handle, hashtags, and even the primary platform differ by
// market (see the official campaign pages: WDP ID/PH/VN category-04 —
// Indonesia and Philippines run their program on Instagram, Vietnam runs
// on Facebook, and only Philippines has an Instagram handle suffixed
// "_ph"). This mirrors the real per-country channel setup instead of
// always showing the Philippines example regardless of judge country.
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('[data-country-code]')) return;

  const COUNTRIES = {
    ID: {
      flagClass: 'flag-id',
      countryName: 'Indonesia',
      judgeName: 'Dr. Ratna Wijaya',
      code: 'ID-CAT4-001',
      handle: '@apotekerkita',
      platform: 'Instagram',
      postUrl: 'instagram.com/p/D2xR8k_apotekerkita',
      caption: '"5 hal yang ingin diketahui apoteker Anda tentang mengatasi demam di rumah 🌡️ Simpan ini sebelum kunjungan berikutnya ke apotek! Link pendaftaran ada di bio 🔗 @swiperxapp #TrustBeginsAtTheCounter #SwipeRxJoinTheMovement #SwipeRxWPD2026 #WPD2026ID"',
      likes: '5,140', comments: '298', shares: '204',
      hashtags: ['#TrustBeginsAtTheCounter', '#SwipeRxJoinTheMovement', '#SwipeRxWPD2026', '#WPD2026ID'],
    },
    PH: {
      flagClass: 'flag-ph',
      countryName: 'Philippines',
      judgeName: 'Dr. Maria Santos',
      code: 'PH-CAT4-001',
      handle: '@theurbanfarmacist',
      platform: 'Instagram',
      postUrl: 'instagram.com/p/C8xY2f_urbanfarmacist',
      caption: '"5 things your pharmacist wishes you knew about treating a fever at home 🌡️ Save this before your next trip to the pharmacy! Registration link in bio 🔗 @swiperxapp_ph #TrustBeginsAtTheCounter #SwipeRxJoinTheMovement #SwipeRxWPD2026 #WPD2026PH"',
      likes: '4,820', comments: '312', shares: '189',
      hashtags: ['#TrustBeginsAtTheCounter', '#SwipeRxJoinTheMovement', '#SwipeRxWPD2026', '#WPD2026PH'],
    },
    VN: {
      flagClass: 'flag-vn',
      countryName: 'Vietnam',
      judgeName: 'Dr. Linh Nguyen',
      code: 'VN-CAT4-001',
      handle: '@duocsi.tam',
      platform: 'Facebook',
      postUrl: 'facebook.com/duocsi.tam/posts/pfbid02x9qk',
      caption: '"5 điều dược sĩ của bạn muốn bạn biết về cách hạ sốt tại nhà 🌡️ Lưu lại trước khi đến nhà thuốc lần sau! Link đăng ký có trong bio 🔗 @swiperxvn #TrustBeginsAtTheCounter #SwipeRxJoinTheMovement #SwipeRxWPD2026 #WPD2026VN"',
      likes: '3,960', comments: '256', shares: '231',
      hashtags: ['#TrustBeginsAtTheCounter', '#SwipeRxJoinTheMovement', '#SwipeRxWPD2026', '#WPD2026VN'],
    },
  };

  const country = COUNTRIES[localStorage.getItem('wpdjCountry')] || COUNTRIES.PH;

  const flagEl = document.querySelector('[data-country-flag]');
  if (flagEl) {
    flagEl.classList.remove('flag-id', 'flag-ph', 'flag-vn');
    flagEl.classList.add(country.flagClass);
  }
  const set = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };

  set('[data-country-name]', country.countryName);
  set('[data-country-judge]', country.judgeName);
  set('[data-country-code]', country.code);
  set('[data-country-handle]', country.handle);
  set('[data-country-caption]', country.caption);
  set('[data-country-likes]', `❤️ ${country.likes}`);
  set('[data-country-comments]', `💬 ${country.comments}`);
  set('[data-country-shares]', `🔁 ${country.shares}`);
  set('[data-country-platform]', country.platform);

  const postUrlEl = document.querySelector('[data-country-posturl]');
  if (postUrlEl) postUrlEl.textContent = country.postUrl;

  const tagsEl = document.querySelector('[data-country-tags]');
  if (tagsEl) {
    tagsEl.innerHTML = country.hashtags
      .map((tag) => `<span class="tag-pill">${tag}</span>`)
      .join('');
  }
});
