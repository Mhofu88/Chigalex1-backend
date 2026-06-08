  currentLang = lang;

  // Sync selectors and language buttons
  document.querySelectorAll('.gsel, .lsel').forEach(sel => sel.value = lang);
  document.querySelectorAll('.lbtn').forEach(btn => {
    btn.classList.toggle('on', btn.getAttribute('data-lang') === lang);
  });

  // ── Gate ──
  safeHTML('gate-badge-txt',  t('gate_badge'));
  safeHTML('gate-title',      t('gate_title'));
  safeHTML('gate-sub',        t('gate_sub'));
  safeHTML('fee-desc-txt',    t('fee_desc'));
  safeAttr('loginBtn',  'innerHTML', t('login_btn'));
  safeAttr('payBtn',    'innerHTML', t('pay_btn'));
  safeAttr('enterBtn',  'innerHTML', t('enter_btn'));
  safeHTML('gnote-txt',       t('gnote'));

  // ── Nav ──
  safeHTML('nav-subtitle', t('nav_subtitle'));

  // ── Hero ──
  safeHTML('hero-badge', t('hero_badge'));
  safeHTML('hero-h1',    t('hero_h1'));
  safeHTML('hero-p',     t('hero_p'));
  safeAttr('btn-start',    'innerHTML', t('btn_start'));
  safeAttr('btn-alliance', 'innerHTML', t('btn_alliance'));

  // ── Section Titles ──
  safeHTML('sec-aboutpi-title',    t('sec_aboutpi_title'));
  safeHTML('sec-alliance-title',   t('sec_alliance_title'));
  safeHTML('sec-gcv-title',        t('sec_gcv_title'));
  safeHTML('sec-gcv-sub',          t('sec_gcv_sub'));
  safeHTML('sec-training-title',   t('sec_training_title'));
  safeHTML('sec-mapofpi-title',    t('sec_mapofpi_title'));
  safeHTML('sec-merchants-title',  t('sec_merchants_title'));
  safeHTML('sec-advertise-title',  t('sec_advertise_title'));
  safeHTML('sec-faq-title',        t('sec_faq_title'));
  safeHTML('sec-disclaimer-title', t('sec_disclaimer_title'));
  safeHTML('whats-inside-title',   t('whats_inside_title'));
  safeHTML('whats-inside-sub',     t('whats_inside_sub'));

  // ── About Pi Facts ──
  safeHTML('pi-fact-pioneers', t('pi_fact_pioneers'));
  safeHTML('pi-fact-nations',  t('pi_fact_nations'));
  safeHTML('pi-fact-free',     t('pi_fact_free'));
  safeHTML('pi-fact-kyc',      t('pi_fact_kyc'));
  safeHTML('pi-fact-kyb',      t('pi_fact_kyb'));
  safeHTML('pi-fact-map',      t('pi_fact_map'));

  // ── Training Tabs ──
  safeAttr('tab-reg', 'innerHTML', t('tab_reg'));
  safeAttr('tab-kyc', 'innerHTML', t('tab_kyc'));
  safeAttr('tab-kyb', 'innerHTML', t('tab_kyb'));
  safeAttr('tab-sec', 'innerHTML', t('tab_sec'));

  // ── Section Labels ──
  safeHTML('lbl-learn', t('lbl_learn'));
  safeHTML('lbl-faq',   t('lbl_faq'));

  // ── Registration Steps ──
  safeHTML('reg-s1-title', t('reg_step1_title'));
  safeHTML('reg-s1-desc',  t('reg_step1_desc'));
  safeHTML('reg-s2-title', t('reg_step2_title'));
  safeHTML('reg-s2-desc',  t('reg_step2_desc'));
  safeHTML('reg-s3-title', t('reg_step3_title'));
  safeHTML('reg-s3-desc',  t('reg_step3_desc'));
  safeHTML('reg-s4-title', t('reg_step4_title'));
  safeHTML('reg-s4-desc',  t('reg_step4_desc'));
  safeHTML('reg-s5-title', t('reg_step5_title'));
  safeHTML('reg-s5-desc',  t('reg_step5_desc'));

  // ── KYC Steps ──
  safeHTML('kyc-s1-title', t('kyc_step1_title'));
  safeHTML('kyc-s2-title', t('kyc_step2_title'));
  safeHTML('kyc-s3-title', t('kyc_step3_title'));
  safeHTML('kyc-s4-title', t('kyc_step4_title'));
  safeHTML('kyc-s5-title', t('kyc_step5_title'));

  // ── Security Cards ──
  safeHTML('sec-c1-title', t('sec_card1_title'));
  safeHTML('sec-c1-desc',  t('sec_card1_desc'));
  safeHTML('sec-c2-title', t('sec_card2_title'));
  safeHTML('sec-c3-title', t('sec_card3_title'));

  // ── GCV Phases ──
  safeHTML('gcv-p1-title', t('gcv_phase1_title'));
  safeHTML('gcv-p1-name',  t('gcv_phase1_name'));
  safeHTML('gcv-p2-title', t('gcv_phase2_title'));
  safeHTML('gcv-p3-title', t('gcv_phase3_title'));
  safeHTML('gcv-p4-title', t('gcv_phase4_title'));
  safeHTML('gcv-p5-title', t('gcv_phase5_title'));

  // ── Alliance Cards ──
  safeHTML('alliance-c1-title', t('alliance_card1_title'));
  safeHTML('alliance-c1-desc',  t('alliance_card1_desc'));
  safeHTML('alliance-c2-title', t('alliance_card2_title'));
  safeHTML('alliance-c3-title', t('alliance_card3_title'));
  safeHTML('alliance-c4-title', t('alliance_card4_title'));

  // ── FAQ Questions ──
  safeHTML('faq-q1', t('faq_q1'));
  safeHTML('faq-q2', t('faq_q2'));
  safeHTML('faq-q3', t('faq_q3'));
  safeHTML('faq-q4', t('faq_q4'));
  safeHTML('faq-q5', t('faq_q5'));
  safeHTML('faq-q6', t('faq_q6'));

  // ── Advert Cards ──
  safeHTML('advert-c1-title', t('advert_card1_title'));
  safeHTML('advert-c2-title', t('advert_card2_title'));
  safeHTML('advert-c3-title', t('advert_card3_title'));
  safeHTML('advert-c4-title', t('advert_card4_title'));

  // ── Map of Pi Tabs ──
  safeAttr('maptab-listed',   'innerHTML', t('maptab_listed'));
  safeAttr('maptab-optimize', 'innerHTML', t('maptab_optimize'));
  safeAttr('maptab-pay',      'innerHTML', t('maptab_pay'));
  safeAttr('maptab-grow',     'innerHTML', t('maptab_grow'));

  // ── Merchant Directory ──
  safeAttr('merchantSearch', 'placeholder', t('merchant_search_ph'));
  safeHTML('list-biz-btn', t('list_your_biz'));

  // ── Footer ──
  safeHTML('footer-ref', t('footer_ref'));

  // ── RTL for Arabic ──
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}

function safeHTML(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.innerHTML = val;
}

function safeAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el && val) el[attr] = val;
}
