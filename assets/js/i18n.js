// Lightweight client-side translation layer for the judge-facing pages.
// A judge picks their language at login (assets/js/login pages write to
// localStorage['wpdjLang']); every page below the login walks its own text
// nodes and swaps any exact match found in PHRASES. Fabricated submission
// content (initiative descriptions, captions, etc.) is intentionally left
// untranslated, the same way a real judge portal would show a nominee's
// own words as submitted rather than machine-translating them.
(function () {
  const STORAGE_KEY = 'wpdjLang';
  const HTML_LANG = { en: 'en', id: 'id', fil: 'tl', vi: 'vi' };

  const PHRASES = {
    // Shared nav / footer / session
    'Dashboard': { id: 'Dasbor', fil: 'Dashboard', vi: 'Bảng điều khiển' },
    'Sign Out': { id: 'Keluar', fil: 'Mag-sign Out', vi: 'Đăng xuất' },
    'Session expired. Please sign in again.': { id: 'Sesi berakhir. Silakan masuk kembali.', fil: 'Nag-expire na ang session. Mangyaring mag-sign in muli.', vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
    'Confidential: authorised judges only · SwipeRx 2026': { id: 'Rahasia: hanya untuk juri resmi · SwipeRx 2026', fil: 'Kumpidensyal: para lamang sa mga awtorisadong hukom · SwipeRx 2026', vi: 'Bảo mật: chỉ dành cho giám khảo được ủy quyền · SwipeRx 2026' },

    // Judge dashboard hero
    'Judge Dashboard': { id: 'Dasbor Juri', fil: 'Dashboard ng Hukom', vi: 'Bảng điều khiển Giám khảo' },
    'Welcome, Dr. Maria Santos': { id: 'Selamat datang, Dr. Maria Santos', fil: 'Maligayang pagdating, Dr. Maria Santos', vi: 'Chào mừng, Dr. Maria Santos' },
    'Here is your scoring progress for Philippines.': { id: 'Berikut progres penilaian Anda untuk Filipina.', fil: 'Narito ang iyong progreso sa pag-score para sa Pilipinas.', vi: 'Đây là tiến độ chấm điểm của bạn cho Philippines.' },
    'Overall Progress': { id: 'Progres Keseluruhan', fil: 'Kabuuang Progreso', vi: 'Tiến độ chung' },
    '21 of 40 submissions scored': { id: '21 dari 40 pengajuan telah dinilai', fil: '21 sa 40 na submission ang na-score na', vi: 'Đã chấm 21/40 bài dự thi' },

    // Category progress section
    'Progress by Category': { id: 'Progres per Kategori', fil: 'Progreso ayon sa Kategorya', vi: 'Tiến độ theo Danh mục' },
    'Score Your Assigned Submissions': { id: 'Nilai Pengajuan yang Ditugaskan kepada Anda', fil: 'I-score ang mga Naka-assign na Submission', vi: 'Chấm điểm các Bài dự thi được giao' },
    'Assigned Submissions': { id: 'Pengajuan yang Ditugaskan', fil: 'Mga Naka-assign na Submission', vi: 'Bài dự thi được giao' },
    'Empower & Educate': { id: 'Berdayakan & Edukasi', fil: 'Bigyang-kapangyarihan at Turuan', vi: 'Trao quyền & Giáo dục' },
    'Expanding Access': { id: 'Perluasan Akses', fil: 'Pagpapalawak ng Access', vi: 'Mở rộng tiếp cận' },
    'Referral & Care': { id: 'Rujukan & Perawatan', fil: 'Referral at Pangangalaga', vi: 'Giới thiệu & Chăm sóc' },
    'Social Media': { id: 'Media Sosial', fil: 'Social Media', vi: 'Mạng xã hội' },
    'Category 01': { id: 'Kategori 01', fil: 'Kategorya 01', vi: 'Danh mục 01' },
    'Category 02': { id: 'Kategori 02', fil: 'Kategorya 02', vi: 'Danh mục 02' },
    'Category 03': { id: 'Kategori 03', fil: 'Kategorya 03', vi: 'Danh mục 03' },
    'Category 04': { id: 'Kategori 04', fil: 'Kategorya 04', vi: 'Danh mục 04' },

    // Filters
    'Category:': { id: 'Kategori:', fil: 'Kategorya:', vi: 'Danh mục:' },
    'All': { id: 'Semua', fil: 'Lahat', vi: 'Tất cả' },

    // Submissions table
    'Submission Code': { id: 'Kode Pengajuan', fil: 'Code ng Submission', vi: 'Mã bài dự thi' },
    'Category': { id: 'Kategori', fil: 'Kategorya', vi: 'Danh mục' },
    'Entry Type': { id: 'Jenis Entri', fil: 'Uri ng Entry', vi: 'Loại bài dự thi' },
    'Status': { id: 'Status', fil: 'Status', vi: 'Trạng thái' },
    'Action': { id: 'Aksi', fil: 'Aksyon', vi: 'Hành động' },
    'Self': { id: 'Mandiri', fil: 'Personal', vi: 'Tự đề cử' },
    'Team': { id: 'Tim', fil: 'Koponan', vi: 'Nhóm' },
    'Individual': { id: 'Individu', fil: 'Indibidwal', vi: 'Cá nhân' },
    'Complete': { id: 'Selesai', fil: 'Tapos na', vi: 'Hoàn thành' },
    'In Progress': { id: 'Sedang Berlangsung', fil: 'Isinasagawa', vi: 'Đang thực hiện' },
    'Not Started': { id: 'Belum Dimulai', fil: 'Hindi pa Nasisimulan', vi: 'Chưa bắt đầu' },
    'Review →': { id: 'Tinjau →', fil: 'Suriin →', vi: 'Xem lại →' },
    'Score Now →': { id: 'Nilai Sekarang →', fil: 'I-score Ngayon →', vi: 'Chấm điểm ngay →' },
    'Start →': { id: 'Mulai →', fil: 'Simulan →', vi: 'Bắt đầu →' },
    '← Previous': { id: '← Sebelumnya', fil: '← Nakaraan', vi: '← Trước' },
    'Next →': { id: 'Berikutnya →', fil: 'Susunod →', vi: 'Tiếp theo →' },

    // Scoring pages: back link, notices, badges
    '← Back to Dashboard': { id: '← Kembali ke Dasbor', fil: '← Bumalik sa Dashboard', vi: '← Quay lại Bảng điều khiển' },
    'Nominee identity is hidden to ensure unbiased judging. Name, workplace, and contact details are never shown.': {
      id: 'Identitas nominee disembunyikan untuk memastikan penilaian yang tidak bias. Nama, tempat kerja, dan detail kontak tidak pernah ditampilkan.',
      fil: 'Itinatago ang pagkakakilanlan ng nominado upang matiyak ang patas na paghusga. Hindi kailanman ipinapakita ang pangalan, lugar ng trabaho, at detalye ng contact.',
      vi: 'Danh tính người được đề cử được ẩn để đảm bảo việc chấm điểm không thiên vị. Tên, nơi làm việc và thông tin liên hệ không bao giờ được hiển thị.',
    },
    'This category is unblinded.': { id: 'Kategori ini tidak disamarkan.', fil: 'Hindi naka-blind ang kategoryang ito.', vi: 'Danh mục này không ẩn danh.' },
    "The pharmacist's social handle and post link are visible below, unlike Categories 01–03.": {
      id: 'Akun media sosial dan tautan unggahan apoteker terlihat di bawah ini, tidak seperti Kategori 01–03.',
      fil: 'Nakikita sa ibaba ang social media account at link ng post ng parmasyutiko, hindi tulad ng Kategorya 01–03.',
      vi: 'Tên tài khoản mạng xã hội và liên kết bài đăng của dược sĩ được hiển thị bên dưới, không giống như Danh mục 01–03.',
    },
    'Category 01 · Empower & Educate': { id: 'Kategori 01 · Berdayakan & Edukasi', fil: 'Kategorya 01 · Bigyang-kapangyarihan at Turuan', vi: 'Danh mục 01 · Trao quyền & Giáo dục' },
    'Category 02 · Expanding Access': { id: 'Kategori 02 · Perluasan Akses', fil: 'Kategorya 02 · Pagpapalawak ng Access', vi: 'Danh mục 02 · Mở rộng tiếp cận' },
    'Category 03 · Referral & Care Pathways': { id: 'Kategori 03 · Jalur Rujukan & Perawatan', fil: 'Kategorya 03 · Referral at Care Pathways', vi: 'Danh mục 03 · Giới thiệu & Lộ trình chăm sóc' },
    'Category 04 · Social Media Impact': { id: 'Kategori 04 · Dampak Media Sosial', fil: 'Kategorya 04 · Epekto sa Social Media', vi: 'Danh mục 04 · Tác động mạng xã hội' },

    // Field labels
    'Area of Practice': { id: 'Bidang Praktik', fil: 'Larangan ng Practice', vi: 'Lĩnh vực hành nghề' },
    'About This Initiative': { id: 'Tentang Inisiatif Ini', fil: 'Tungkol sa Inisyatibong Ito', vi: 'Về sáng kiến này' },
    'Impact': { id: 'Dampak', fil: 'Epekto', vi: 'Tác động' },
    'Who Benefited': { id: 'Siapa yang Diuntungkan', fil: 'Sino ang Nakinabang', vi: 'Đối tượng hưởng lợi' },
    'Post Date': { id: 'Tanggal Posting', fil: 'Petsa ng Post', vi: 'Ngày đăng' },
    'Post URL': { id: 'URL Postingan', fil: 'URL ng Post', vi: 'URL bài đăng' },
    'Tags': { id: 'Tag', fil: 'Mga Tag', vi: 'Thẻ' },
    'SwipeRx Tagged': { id: 'Ditandai SwipeRx', fil: 'Naka-tag ang SwipeRx', vi: 'Có gắn thẻ SwipeRx' },
    'Campaign Link Included': { id: 'Tautan Kampanye Disertakan', fil: 'Kasama ang Campaign Link', vi: 'Có kèm liên kết chiến dịch' },
    '✓ Yes': { id: '✓ Ya', fil: '✓ Oo', vi: '✓ Có' },

    // Scoring form
    'Score This Submission': { id: 'Nilai Pengajuan Ini', fil: 'I-score ang Submission na Ito', vi: 'Chấm điểm bài dự thi này' },
    'Rate each criterion from 1 (lowest) to 10 (highest).': { id: 'Beri nilai setiap kriteria dari 1 (terendah) hingga 10 (tertinggi).', fil: 'I-rate ang bawat criterion mula 1 (pinakamababa) hanggang 10 (pinakamataas).', vi: 'Chấm điểm từng tiêu chí từ 1 (thấp nhất) đến 10 (cao nhất).' },
    'Scoring Guide': { id: 'Panduan Penilaian', fil: 'Gabay sa Pag-score', vi: 'Hướng dẫn chấm điểm' },
    'Does not meet the standard': { id: 'Tidak memenuhi standar', fil: 'Hindi naaabot ang standard', vi: 'Không đạt tiêu chuẩn' },
    'Meets the standard': { id: 'Memenuhi standar', fil: 'Naaabot ang standard', vi: 'Đạt tiêu chuẩn' },
    'Exceeds the standard': { id: 'Melebihi standar', fil: 'Lumalampas sa standard', vi: 'Vượt tiêu chuẩn' },
    'Exceptional: rare, reserve for truly outstanding work': { id: 'Luar biasa: jarang, khusus untuk karya yang benar-benar unggul', fil: 'Natatangi: bihira, para lamang sa trabahong tunay na natatangi', vi: 'Xuất sắc: hiếm khi dùng, chỉ dành cho tác phẩm thực sự nổi bật' },

    'Impact on patient outcomes': { id: 'Dampak pada hasil pasien', fil: 'Epekto sa outcomes ng pasyente', vi: 'Tác động đến kết quả điều trị bệnh nhân' },
    'Innovation & approach': { id: 'Inovasi & pendekatan', fil: 'Innovation at approach', vi: 'Đổi mới & Cách tiếp cận' },
    'Sustainability & scalability': { id: 'Keberlanjutan & skalabilitas', fil: 'Sustainability at scalability', vi: 'Tính bền vững & Khả năng nhân rộng' },
    'Relevance to self-care pillar': { id: 'Relevansi dengan pilar self-care', fil: 'Relevance sa self-care pillar', vi: 'Mức độ liên quan đến trụ cột tự chăm sóc' },
    'Creativity & production quality': { id: 'Kreativitas & kualitas produksi', fil: 'Creativity at kalidad ng production', vi: 'Sáng tạo & Chất lượng sản xuất' },
    'Authenticity & storytelling': { id: 'Autentisitas & storytelling', fil: 'Authenticity at storytelling', vi: 'Tính chân thực & Cách kể chuyện' },
    'Pharmacy advocacy strength': { id: 'Kekuatan advokasi kefarmasian', fil: 'Lakas ng pharmacy advocacy', vi: 'Mức độ ủng hộ ngành dược' },
    'Campaign alignment': { id: 'Keselarasan dengan kampanye', fil: 'Pagkakahanay sa campaign', vi: 'Mức độ phù hợp với chiến dịch' },

    '40% weight': { id: 'Bobot 40%', fil: '40% na bigat', vi: 'Trọng số 40%' },
    '35% weight': { id: 'Bobot 35%', fil: '35% na bigat', vi: 'Trọng số 35%' },
    '20% weight': { id: 'Bobot 20%', fil: '20% na bigat', vi: 'Trọng số 20%' },
    '15% weight': { id: 'Bobot 15%', fil: '15% na bigat', vi: 'Trọng số 15%' },
    '10% weight': { id: 'Bobot 10%', fil: '10% na bigat', vi: 'Trọng số 10%' },
    'Weighted Total': { id: 'Total Berbobot', fil: 'Weighted Total', vi: 'Tổng có trọng số' },

    'Comments': { id: 'Komentar', fil: 'Comments', vi: 'Nhận xét' },
    'Share your rationale for this score...': { id: 'Bagikan alasan Anda untuk skor ini...', fil: 'Ibahagi ang iyong dahilan para sa score na ito...', vi: 'Chia sẻ lý do của bạn cho điểm số này...' },
    'Comments are required before you can save this score.': { id: 'Komentar wajib diisi sebelum Anda dapat menyimpan skor ini.', fil: 'Kailangan ang comments bago mo ma-save ang score na ito.', vi: 'Cần có nhận xét trước khi bạn có thể lưu điểm số này.' },
    'Save Score': { id: 'Simpan Skor', fil: 'I-save ang Score', vi: 'Lưu điểm' },
    'Cancel': { id: 'Batal', fil: 'Kanselahin', vi: 'Hủy' },
    '✓ Score Saved': { id: '✓ Skor Tersimpan', fil: '✓ Na-save ang Score', vi: '✓ Đã lưu điểm' },
    'Edit Score': { id: 'Ubah Skor', fil: 'I-edit ang Score', vi: 'Chỉnh sửa điểm' },
    '← Previous submission': { id: '← Pengajuan sebelumnya', fil: '← Nakaraang submission', vi: '← Bài dự thi trước' },
    'Next submission →': { id: 'Pengajuan berikutnya →', fil: 'Susunod na submission →', vi: 'Bài dự thi tiếp theo →' },

    // Unsaved-changes modal + toast
    'Discard changes?': { id: 'Buang perubahan?', fil: 'Itapon ang mga pagbabago?', vi: 'Hủy các thay đổi?' },
    'You have unsaved changes on this scoring form. Leaving now will discard them.': {
      id: 'Anda memiliki perubahan yang belum disimpan pada formulir penilaian ini. Meninggalkan sekarang akan membuangnya.',
      fil: 'May mga hindi pa na-save na pagbabago sa scoring form na ito. Kapag umalis ka ngayon, mawawala ang mga ito.',
      vi: 'Bạn có các thay đổi chưa lưu trên biểu mẫu chấm điểm này. Rời đi bây giờ sẽ hủy bỏ chúng.',
    },
    'Stay': { id: 'Tetap di Sini', fil: 'Manatili', vi: 'Ở lại' },
    'Leave Anyway': { id: 'Tetap Tinggalkan', fil: 'Umalis pa rin', vi: 'Vẫn rời đi' },
    '✓ Score saved successfully.': { id: '✓ Skor berhasil disimpan.', fil: '✓ Matagumpay na na-save ang score.', vi: '✓ Đã lưu điểm thành công.' },
  };

  const PAGE_INFO_TEMPLATE = { en: 'Page {c} of {t}', id: 'Halaman {c} dari {t}', fil: 'Pahina {c} ng {t}', vi: 'Trang {c} / {t}' };
  const SHOWING_TEMPLATE = { en: 'Showing {a}-{b} of {n}', id: 'Menampilkan {a}-{b} dari {n}', fil: 'Ipinapakita ang {a}-{b} ng {n}', vi: 'Hiển thị {a}-{b} trong số {n}' };
  const TOTAL_SUFFIX_TEMPLATE = { en: ' ({n} total)', id: ' ({n} total)', fil: ' ({n} kabuuan)', vi: ' (tổng {n})' };

  function getLang() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('lang');
    if (fromUrl && (fromUrl === 'en' || HTML_LANG[fromUrl])) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return HTML_LANG[stored] ? stored : 'en';
  }

  function translatePage() {
    const lang = getLang();
    document.documentElement.setAttribute('lang', HTML_LANG[lang] || 'en');
    if (lang === 'en') return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = node.parentElement ? node.parentElement.tagName : '';
        return tag === 'SCRIPT' || tag === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach((node) => {
      const trimmed = node.textContent.trim();
      const entry = trimmed && PHRASES[trimmed];
      if (entry && entry[lang]) {
        node.textContent = node.textContent.replace(trimmed, entry[lang]);
      }
    });

    document.querySelectorAll('[placeholder]').forEach((el) => {
      const entry = PHRASES[el.getAttribute('placeholder')];
      if (entry && entry[lang]) el.setAttribute('placeholder', entry[lang]);
    });
  }

  window.wpdjI18n = {
    getLang,
    pageInfo(current, total) {
      const lang = getLang();
      return (PAGE_INFO_TEMPLATE[lang] || PAGE_INFO_TEMPLATE.en).replace('{c}', current).replace('{t}', total);
    },
    showingRange(a, b, n, totalIfFiltered) {
      const lang = getLang();
      let text = (SHOWING_TEMPLATE[lang] || SHOWING_TEMPLATE.en).replace('{a}', a).replace('{b}', b).replace('{n}', n);
      if (totalIfFiltered != null) {
        text += (TOTAL_SUFFIX_TEMPLATE[lang] || TOTAL_SUFFIX_TEMPLATE.en).replace('{n}', totalIfFiltered);
      }
      return text;
    },
    apply: translatePage,
  };

  document.addEventListener('DOMContentLoaded', translatePage);
})();
