/**
 * MEBİ Arayüz ve Etkileşim Yöneticisi (ui.js)
 * Tema yönetimi, ses geçişi, dokunsal toast bildirimleri ve çekmece/modal kontrolleri.
 */

(function(window) {
  'use strict';

  /* ----------------- 1. TEMA YÖNETİMİ (Light & Neutral Graphite Dark) ----------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mebi-theme', theme);
    } catch (e) {}

    var themeThumb = document.querySelector('.mebi-theme-thumb');
    if (themeThumb) {
      if (theme === 'dark') {
        themeThumb.style.transform = 'translateX(30px)';
      } else {
        themeThumb.style.transform = 'translateX(0)';
      }
    }
  }

  function getSavedTheme() {
    try {
      var saved = localStorage.getItem('mebi-theme');
      if (saved) return saved;
    } catch (e) {}
    return 'light';
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') || 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    if (window.MebiAudio) window.MebiAudio.playClick();
    showMebiToast('info', 'Tema Güncellendi', next === 'dark' ? 'Karanlık (Nötr Grafit) mod aktif.' : 'Aydınlık mod aktif.', 2500);
  }

  /* ----------------- 2. DOKUNSAL TOAST BİLDİRİM MOTORU ----------------- */
  function getToastContainer() {
    var container = document.getElementById('mebiToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mebiToastContainer';
      container.className = 'mebi-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  var toastIcons = {
    success: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    danger: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  };

  function showMebiToast(type, title, message, duration) {
    type = type || 'info';
    duration = duration || 3500;
    var container = getToastContainer();

    var toastEl = document.createElement('div');
    toastEl.className = 'mebi-toast mebi-toast-' + type;

    var iconSvg = toastIcons[type] || toastIcons.info;
    toastEl.innerHTML =
      '<div class="mebi-toast-icon">' + iconSvg + '</div>' +
      '<div class="mebi-toast-content">' +
        '<div class="mebi-toast-title">' + (title || '') + '</div>' +
        '<div class="mebi-toast-desc">' + (message || '') + '</div>' +
      '</div>' +
      '<div class="mebi-toast-timer-wrap">' +
        '<svg class="mebi-toast-circle-svg" viewBox="0 0 32 32">' +
          '<circle class="mebi-toast-circle-bg" cx="16" cy="16" r="13"></circle>' +
          '<circle class="mebi-toast-circle-meter" cx="16" cy="16" r="13" style="animation-duration:' + duration + 'ms;"></circle>' +
        '</svg>' +
        '<button type="button" class="mebi-toast-close" title="Kapat">✕</button>' +
      '</div>';

    function dismissToast() {
      if (toastEl.classList.contains('is-hiding')) return;
      toastEl.classList.add('is-hiding');
      setTimeout(function() {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 260);
    }

    var closeBtn = toastEl.querySelector('.mebi-toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dismissToast();
      });
    }

    container.appendChild(toastEl);

    var autoTimer = setTimeout(dismissToast, duration);

    toastEl.addEventListener('mouseenter', function() {
      clearTimeout(autoTimer);
      var meter = toastEl.querySelector('.mebi-toast-circle-meter');
      if (meter) meter.style.animationPlayState = 'paused';
    });

    toastEl.addEventListener('mouseleave', function() {
      var meter = toastEl.querySelector('.mebi-toast-circle-meter');
      if (meter) meter.style.animationPlayState = 'running';
      autoTimer = setTimeout(dismissToast, 1600);
    });

    if (window.MebiAudio) window.MebiAudio.playHover();
  }

  /* ----------------- 3. ÇEKMECE PANELİ YÖNETİMİ ----------------- */
  function openDrawer(title, contentHtml) {
    var drawer = document.getElementById('mebiDrawer');
    var overlay = document.getElementById('mebiDrawerOverlay');
    var drawerTitle = document.getElementById('mebiDrawerTitle');
    var drawerBody = document.getElementById('mebiDrawerBody');

    if (drawer && overlay) {
      if (drawerTitle) drawerTitle.innerHTML = title || 'Bilgi';
      if (drawerBody) drawerBody.innerHTML = contentHtml || '';
      drawer.classList.add('is-active');
      overlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      if (window.MebiAudio) window.MebiAudio.playClick();
    }
  }

  function closeDrawer() {
    var drawer = document.getElementById('mebiDrawer');
    var overlay = document.getElementById('mebiDrawerOverlay');
    if (drawer && overlay) {
      drawer.classList.remove('is-active');
      overlay.classList.remove('is-active');
      document.body.style.overflow = '';
      if (window.MebiAudio) window.MebiAudio.playClick();
    }
  }

  /* ----------------- 5b. SIFIRLAMA ONAY MODALI (RESET CONFIRMATION MODAL) ----------------- */
  var pendingResetConfirmCallback = null;

  function openResetModal(count, onConfirm) {
    var overlay = document.getElementById('resetModalOverlay');
    var textEl = document.getElementById('resetModalText');
    if (!overlay) return;
    pendingResetConfirmCallback = onConfirm;
    if (textEl) {
      textEl.textContent = 'Bu işlem keşfettiğiniz tüm tepkime kartlarını (' + (count || 0) + ' adet) ve mevcut laboratuvar deney ilerlemesini kalıcı olarak silecektir. Devam etmek istiyor musunuz?';
    }
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.MebiAudio) window.MebiAudio.playClick();
  }

  function closeResetModal() {
    var overlay = document.getElementById('resetModalOverlay');
    if (overlay) {
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      pendingResetConfirmCallback = null;
      if (window.MebiAudio) window.MebiAudio.playClick();
    }
  }

  function confirmResetModal() {
    var callback = pendingResetConfirmCallback;
    closeResetModal();
    if (typeof callback === 'function') {
      callback();
    }
  }

  /* ----------------- 6. CİHAZI YATAY ÇEVİRİN (ORIENTATION LOCK) YÖNETİMİ ----------------- */
  var isOrientationDismissed = false;

  function openOrientationOverlay() {
    var overlay = document.getElementById('mebiOrientationOverlay');
    if (overlay) {
      isOrientationDismissed = false;
      document.body.classList.add('mebi-landscape-required');
      overlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      if (window.MebiAudio) window.MebiAudio.playClick();
    }
  }

  function closeOrientationOverlay() {
    var overlay = document.getElementById('mebiOrientationOverlay');
    var isPortrait = (window.innerHeight > window.innerWidth) || (window.matchMedia && window.matchMedia('(orientation: portrait)').matches);
    var isMobileOrTablet = (window.innerWidth <= 900) || (window.innerHeight <= 600 && window.innerWidth <= 1024);
    if (isPortrait && isMobileOrTablet) {
      checkOrientation();
      return;
    }
    if (overlay) {
      overlay.classList.remove('is-active');
      overlay.classList.remove('is-forced');
      isOrientationDismissed = true;
      document.body.classList.remove('mebi-landscape-required');
      document.body.style.overflow = '';
      if (window.MebiAudio) window.MebiAudio.playClick();

      // Cihaz yataya çevrildiğinde rehber henüz açılmadıysa popup kartı aç
      var hideWelcome = false;
      try {
        hideWelcome = (localStorage.getItem('mebi_hide_welcome_modal') === 'true');
      } catch (e) {}
      if (!isWelcomeOpened && !hideWelcome) {
        setTimeout(function() {
          openWelcomeModal();
        }, 220);
      }
    }
  }

  function checkOrientation() {
    var overlay = document.getElementById('mebiOrientationOverlay');
    if (!overlay) return;

    var isPortrait = (window.innerHeight > window.innerWidth) || (window.matchMedia && window.matchMedia('(orientation: portrait)').matches);
    var isMobileOrTablet = (window.innerWidth <= 900) || (window.innerHeight <= 600 && window.innerWidth <= 1024);
    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    document.body.classList.toggle('mebi-mobile-landscape', !isPortrait && isMobileOrTablet);

    if (isPortrait && isMobileOrTablet && isTouchDevice && !isOrientationDismissed) {
      document.body.classList.add('mebi-landscape-required');
      overlay.classList.add('is-forced');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    } else if (!isPortrait || !isMobileOrTablet || isOrientationDismissed) {
      overlay.classList.remove('is-forced');
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('mebi-landscape-required');
      document.body.style.overflow = '';
      if (!isPortrait) {
        isOrientationDismissed = false;

        var hideWelcome = false;
        try {
          hideWelcome = (localStorage.getItem('mebi_hide_welcome_modal') === 'true');
        } catch (e) {}
        if (!isWelcomeOpened && !hideWelcome) {
          setTimeout(function() {
            openWelcomeModal();
          }, 300);
        }
      }
    }
  }

  /* ----------------- 6.5. ÖĞRENCİ BAŞLANGIÇ REHBERİ POP-UP KARTI ----------------- */
  var isWelcomeOpened = false;

  /* ----------------- 6.6. MİNİMALİST SEKMELİ REHBER KARTI (ÖNERİ 3) ----------------- */
  var currentWelcomeStep = 1;
  var welcomeStepData = {
    1: { pillText: '👁️ 1. Makroskobik Gözlem Seviyesi', pillClass: 'pill-makro' },
    2: { pillText: '⚗️ 2. Sembolik & Hipotez Seviyesi', pillClass: 'pill-sembolik' },
    3: { pillText: '👁️ 1. Makroskobik Gözlem Seviyesi', pillClass: 'pill-cyan' },
    4: { pillText: '⚗️ 2. Sembolik Analiz Seviyesi', pillClass: 'pill-emerald' },
    5: { pillText: '🔬 3. Alt-Mikroskobik Tanecik Boyutu', pillClass: 'pill-purple' }
  };

  function setWelcomeStep(stepNum) {
    if (stepNum < 1) stepNum = 1;
    if (stepNum > 5) stepNum = 5;
    currentWelcomeStep = stepNum;

    var tabs = document.querySelectorAll('.welcome-tab-btn');
    for (var t = 0; t < tabs.length; t++) {
      var tab = tabs[t];
      var s = parseInt(tab.getAttribute('data-step'), 10);
      tab.id = 'welcomeTab' + s;
      tab.setAttribute('aria-controls', 'welcomeStep' + s);
      tab.tabIndex = s === currentWelcomeStep ? 0 : -1;
      if (s === currentWelcomeStep) {
        tab.classList.add('tab-active');
        tab.setAttribute('aria-selected', 'true');
        if (document.getElementById('welcomeModalOverlay').classList.contains('is-active')) tab.scrollIntoView({block:'nearest',inline:'nearest'});
      } else {
        tab.classList.remove('tab-active');
        tab.setAttribute('aria-selected', 'false');
      }
    }

    for (var i = 1; i <= 5; i++) {
      var panel = document.getElementById('welcomeStep' + i);
      if (panel) {
        panel.setAttribute('aria-labelledby', 'welcomeTab' + i);
        if (i === currentWelcomeStep) {
          panel.classList.add('is-active');
        } else {
          panel.classList.remove('is-active');
        }
      }
    }

    var jPill = document.getElementById('welcomeJohnstonePill');
    if (jPill && welcomeStepData[currentWelcomeStep]) {
      jPill.textContent = welcomeStepData[currentWelcomeStep].pillText;
      jPill.className = 'welcome-johnstone-pill ' + welcomeStepData[currentWelcomeStep].pillClass;
    }

    var counter = document.getElementById('welcomeStepCounter');
    if (counter) counter.textContent = currentWelcomeStep + ' / 5';

    var btnPrev = document.getElementById('btnWelcomePrev');
    if (btnPrev) btnPrev.disabled = (currentWelcomeStep === 1);

    var btnNext = document.getElementById('btnWelcomeNext');
    if (btnNext) {
      if (currentWelcomeStep === 5) {
        btnNext.innerHTML = '<span>Başa Dön</span> ↺';
      } else {
        btnNext.innerHTML = '<span>Sonraki</span> →';
      }
    }
  }

  function openWelcomeModal() {
    var overlay = document.getElementById('welcomeModalOverlay');
    var chk = document.getElementById('chkDoNotShowWelcome');
    if (!overlay) return;

    if (chk) {
      try {
        chk.checked = (localStorage.getItem('mebi_hide_welcome_modal') === 'true');
      } catch (e) {
        chk.checked = false;
      }
    }

    setWelcomeStep(1);
    document.querySelector('.welcome-tabs-track').scrollLeft = 0;
    isWelcomeOpened = true;
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.MebiAudio) window.MebiAudio.playClick();
  }

  function closeWelcomeModal() {
    var overlay = document.getElementById('welcomeModalOverlay');
    var chk = document.getElementById('chkDoNotShowWelcome');
    if (overlay) {
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (chk) {
        try {
          localStorage.setItem('mebi_hide_welcome_modal', chk.checked ? 'true' : 'false');
        } catch (e) {}
      }

      if (window.MebiAudio) window.MebiAudio.playClick();
    }
  }

  /* ----------------- 7. İLK YÜKLEME ----------------- */
  document.addEventListener('DOMContentLoaded', function() {
    applyTheme(getSavedTheme());

    var overlay = document.getElementById('mebiDrawerOverlay');
    var closeBtn = document.getElementById('btnCloseDrawer');
    if (overlay) overlay.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // Öğrenci Başlangıç Rehberi Pop-up Kartı butonları
    var closeWelcomeBtn = document.getElementById('btnCloseWelcomeModal');
    var dismissWelcomeBtn = document.getElementById('btnDismissWelcomeModal');
    var welcomeOverlay = document.getElementById('welcomeModalOverlay');
    var chkWelcome = document.getElementById('chkDoNotShowWelcome');

    if (closeWelcomeBtn) closeWelcomeBtn.addEventListener('click', closeWelcomeModal);
    if (dismissWelcomeBtn) dismissWelcomeBtn.addEventListener('click', closeWelcomeModal);

    // Sekme Butonları Dinleyicileri
    var tabBtns = document.querySelectorAll('.welcome-tab-btn');
    for (var b = 0; b < tabBtns.length; b++) {
      (function(btn) {
        btn.addEventListener('keydown', function(event) {
          if (['ArrowLeft','ArrowRight','Home','End'].indexOf(event.key) === -1) return;
          event.preventDefault();
          var next = event.key === 'Home' ? 1 : event.key === 'End' ? 5 : (currentWelcomeStep + (event.key === 'ArrowLeft' ? 3 : 5)) % 5 + 1;
          setWelcomeStep(next);
          document.getElementById('welcomeTab' + next).focus();
        });
        btn.addEventListener('click', function() {
          var s = parseInt(btn.getAttribute('data-step'), 10);
          if (s) {
            setWelcomeStep(s);
            if (window.MebiAudio) window.MebiAudio.playHover();
          }
        });
      })(tabBtns[b]);
    }

    // İleri / Geri Butonları
    var btnPrev = document.getElementById('btnWelcomePrev');
    var btnNext = document.getElementById('btnWelcomeNext');
    if (btnPrev) {
      btnPrev.addEventListener('click', function() {
        if (currentWelcomeStep > 1) {
          setWelcomeStep(currentWelcomeStep - 1);
          if (window.MebiAudio) window.MebiAudio.playHover();
        }
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', function() {
        if (currentWelcomeStep < 5) {
          setWelcomeStep(currentWelcomeStep + 1);
        } else {
          setWelcomeStep(1);
        }
        if (window.MebiAudio) window.MebiAudio.playHover();
      });
    }

    if (chkWelcome) {
      chkWelcome.addEventListener('change', function() {
        try {
          localStorage.setItem('mebi_hide_welcome_modal', chkWelcome.checked ? 'true' : 'false');
        } catch (e) {}
      });
    }

    if (welcomeOverlay) {
      welcomeOverlay.addEventListener('click', function(e) {
        if (e.target === welcomeOverlay) {
          closeWelcomeModal();
        }
      });
    }


    // Yatay ekran kalkanı butonları
    var closeOriBtn = document.getElementById('btnCloseOrientation');
    var dismissOriBtn = document.getElementById('btnDismissOrientation');
    var oriOverlay = document.getElementById('mebiOrientationOverlay');

    if (closeOriBtn) closeOriBtn.addEventListener('click', closeOrientationOverlay);
    if (dismissOriBtn) dismissOriBtn.addEventListener('click', closeOrientationOverlay);

    if (oriOverlay) {
      oriOverlay.addEventListener('click', function(e) {
        if (e.target === oriOverlay) {
          closeOrientationOverlay();
        }
      });
    }

    // Sıfırlama Onay Modalı butonları
    var closeResetBtn = document.getElementById('btnCloseResetModal');
    var cancelResetBtn = document.getElementById('btnCancelResetModal');
    var confirmResetBtn = document.getElementById('btnConfirmResetModal');
    var resetOverlay = document.getElementById('resetModalOverlay');

    if (closeResetBtn) closeResetBtn.addEventListener('click', closeResetModal);
    if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeResetModal);
    if (confirmResetBtn) confirmResetBtn.addEventListener('click', confirmResetModal);
    if (resetOverlay) {
      resetOverlay.addEventListener('click', function(e) {
        if (e.target === resetOverlay) closeResetModal();
      });
    }

    // ESC tuşu ile kapatma
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (resetOverlay && resetOverlay.classList.contains('is-active')) {
          closeResetModal();
          return;
        }
        if (welcomeOverlay && welcomeOverlay.classList.contains('is-active')) {
          closeWelcomeModal();
          return;
        }

        if (oriOverlay && (oriOverlay.classList.contains('is-active') || oriOverlay.classList.contains('is-forced'))) {
          closeOrientationOverlay();
        }
        closeDrawer();
      }
    });

    // Yön değişimi ve yeniden boyutlandırma dinleyicileri
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Öğrenci Arenayı açtığında otomatik gösterim kontrolü
    var hideWelcome = false;
    try {
      hideWelcome = (localStorage.getItem('mebi_hide_welcome_modal') === 'true');
    } catch (e) {}

    var isPortrait = (window.innerHeight > window.innerWidth) || (window.matchMedia && window.matchMedia('(orientation: portrait)').matches);
    var isMobileOrTablet = (window.innerWidth <= 900) || (window.innerHeight <= 600 && window.innerWidth <= 1024);

    if (!hideWelcome && (!isPortrait || !isMobileOrTablet)) {
      setTimeout(function() {
        openWelcomeModal();
      }, 350);
    }
  });

  // Global erişim
  window.MebiUI = {
    applyTheme: applyTheme,
    getSavedTheme: getSavedTheme,
    toggleTheme: toggleTheme,
    showToast: showMebiToast,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    openWelcomeModal: openWelcomeModal,
    closeWelcomeModal: closeWelcomeModal,
    openResetModal: openResetModal,
    closeResetModal: closeResetModal,
    openOrientation: openOrientationOverlay,
    closeOrientation: closeOrientationOverlay,
    checkOrientation: checkOrientation
  };

  window.showMebiToast = showMebiToast;

})(window);
