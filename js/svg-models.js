
/* Icons and fallback beaker drawings. Particle models live in particle-models.js. */
(function(window) {
  'use strict';

  function getBeakerDefs() {
    return '<defs>' +
      // Şeffaf Çözelti Sıvı Yansıması
      '<linearGradient id="gClearWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(214, 238, 255, 0.65)"/><stop offset="40%" stop-color="rgba(190, 226, 250, 0.50)"/><stop offset="85%" stop-color="rgba(165, 210, 245, 0.72)"/><stop offset="100%" stop-color="rgba(145, 198, 238, 0.88)"/></linearGradient>' +
      // Şeffaf Çözelti Üst Menisküs
      '<linearGradient id="gClearMeniscus" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.92)"/><stop offset="30%" stop-color="rgba(224, 242, 254, 0.6)"/><stop offset="70%" stop-color="rgba(202, 232, 252, 0.5)"/><stop offset="100%" stop-color="rgba(255, 255, 255, 0.88)"/></linearGradient>' +
      // Cu(NO3)2 Mavi Çözelti
      '<linearGradient id="gCuSolution" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="25%" stop-color="#0284c7"/><stop offset="75%" stop-color="#0369a1"/><stop offset="100%" stop-color="#075985"/></linearGradient>' +
      // Cu(NO3)2 Üst Menisküs
      '<linearGradient id="gCuMeniscus" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="40%" stop-color="#38bdf8"/><stop offset="70%" stop-color="#0284c7"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient>' +
      // Katı Maddeler İçin 3B Toz Yığını
      '<linearGradient id="gPowderMound" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#f8fafc"/><stop offset="75%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient>' +
      '<linearGradient id="gPowderShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.85)"/><stop offset="50%" stop-color="rgba(241, 245, 249, 0.3)"/><stop offset="100%" stop-color="rgba(148, 163, 184, 0.38)"/></linearGradient>' +
      // Cam Dikey Yansıma
      '<linearGradient id="gGlassReflection" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.9)"/><stop offset="60%" stop-color="rgba(255, 255, 255, 0.45)"/><stop offset="100%" stop-color="rgba(255, 255, 255, 0)"/></linearGradient>' +
      // Zemin Temas Gölgesi
      '<radialGradient id="gBeakerGroundShadow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(15, 23, 42, 0.22)"/><stop offset="60%" stop-color="rgba(15, 23, 42, 0.08)"/><stop offset="100%" stop-color="rgba(15, 23, 42, 0)"/></radialGradient>' +
      // Cu(NO3)2 Zemin Mavi Işıma
      '<radialGradient id="gCuGroundGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(2, 132, 199, 0.38)"/><stop offset="60%" stop-color="rgba(2, 132, 199, 0.12)"/><stop offset="100%" stop-color="rgba(2, 132, 199, 0)"/></radialGradient>' +
      '</defs>';
  }

  /* ----------------- 6. REAKTİF HAVUZU GERÇEKÇİ BEHER SVG (REFERANS GÖRSEL STANDARDI) ----------------- */
  function renderBeakerSVG(reagent, isSlotEmpty) {
    var isCu = (!isSlotEmpty && reagent && reagent.id === 'Cu(NO3)2');
    var isSolid = (!isSlotEmpty && reagent && reagent.solid);
    var groundShadow = isCu ? 'url(#gCuGroundGlow)' : 'url(#gBeakerGroundShadow)';

    var content = '';
    if (!isSlotEmpty && reagent) {
      if (isSolid) {
        content = '<g class="beaker-powder">' +
          '<path d="M 18.5 86 Q 32 82 41 68 Q 47 55 50 52 Q 53 55 59 68 Q 68 82 81.5 86 Q 50 90 18.5 86 Z" fill="url(#gPowderMound)" stroke="#94a3b8" stroke-width="0.8" stroke-linejoin="round"/>' +
          '<path d="M 21 85 Q 33 80 43 67 Q 48 56 50 54 Q 52 56 58 67 Q 68 80 79 85 Q 50 89 21 85 Z" fill="url(#gPowderShade)"/>' +
          '<ellipse cx="48" cy="62" rx="7" ry="2.8" fill="#ffffff" opacity="0.95"/>' +
          '<ellipse cx="38" cy="74" rx="10" ry="3.5" fill="#ffffff" opacity="0.85"/>' +
          '<ellipse cx="60" cy="75" rx="11" ry="3.8" fill="#f1f5f9" opacity="0.7"/>' +
          '<path d="M 26 80 Q 38 72 50 74 Q 63 71 74 78" stroke="rgba(255,255,255,0.85)" stroke-width="1" fill="none"/>' +
          '<ellipse cx="50" cy="85" rx="26" ry="2.2" fill="#cbd5e1" opacity="0.45"/>' +
        '</g>';
      } else {
        var fluidFill = isCu ? 'url(#gCuSolution)' : 'url(#gClearWater)';
        var meniscusFill = isCu ? 'url(#gCuMeniscus)' : 'url(#gClearMeniscus)';
        var fluidOpacity = isCu ? '0.94' : '0.85';

        content = '<g class="beaker-fluid">' +
          '<path d="M 18.5 41 L 81.5 41 L 81 85 A 9 9 0 0 1 72 94 L 28 94 A 9 9 0 0 1 19 85 Z" fill="' + fluidFill + '" opacity="' + fluidOpacity + '"/>' +
          '<ellipse cx="50" cy="41" rx="31.5" ry="3.8" fill="' + meniscusFill + '" opacity="0.96"/>' +
          '<path d="M 19 41 Q 50 45 81 41" stroke="rgba(255,255,255,0.92)" stroke-width="1.2" fill="none"/>' +
          '<path d="M 27 43 L 29 88 Q 50 92 71 88 L 73 43" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>' +
        '</g>';
      }
    }

    var scaleStroke = isCu ? 'rgba(255,255,255,0.85)' : 'var(--mebi-glass-grad, #64748b)';
    var scaleFill = isCu ? '#ffffff' : 'var(--mebi-glass-grad, #64748b)';

    return '<svg viewBox="0 0 100 118" width="100%" height="100%" style="overflow:visible;" role="img" aria-label="' + (reagent ? reagent.name : 'Boş Beher') + '">' +
      getBeakerDefs() +
      '<ellipse cx="50" cy="103" rx="38" ry="7.5" fill="' + groundShadow + '"/>' +
      '<path d="M 14 15 Q 16 17 18 17.5 L 18 86 A 10 10 0 0 0 28 96 L 72 96 A 10 10 0 0 0 82 86 L 82 17.5 Q 84 17 86 15 Z" fill="rgba(248, 250, 252, 0.45)"/>' +
      content +
      '<path d="M 22 93 Q 50 95.5 78 93 L 76 96 Q 50 98.5 24 96 Z" fill="rgba(255,255,255,0.65)"/>' +
      '<g font-family="Plus Jakarta Sans, sans-serif" font-size="5.8" font-weight="700" fill="' + scaleFill + '" text-anchor="start" opacity="0.88">' +
        '<line x1="58" y1="28" x2="65" y2="28" stroke="' + scaleStroke + '" stroke-width="0.9" stroke-linecap="round"/><text x="67" y="30">100</text>' +
        '<line x1="61" y1="35" x2="65" y2="35" stroke="' + scaleStroke + '" stroke-width="0.6" stroke-linecap="round"/>' +
        '<line x1="58" y1="42" x2="65" y2="42" stroke="' + scaleStroke + '" stroke-width="0.9" stroke-linecap="round"/><text x="67" y="44">80</text>' +
        '<line x1="61" y1="49" x2="65" y2="49" stroke="' + scaleStroke + '" stroke-width="0.6" stroke-linecap="round"/>' +
        '<line x1="58" y1="56" x2="65" y2="56" stroke="' + scaleStroke + '" stroke-width="0.9" stroke-linecap="round"/><text x="67" y="58">60</text>' +
        '<line x1="61" y1="63" x2="65" y2="63" stroke="' + scaleStroke + '" stroke-width="0.6" stroke-linecap="round"/>' +
        '<line x1="58" y1="70" x2="65" y2="70" stroke="' + scaleStroke + '" stroke-width="0.9" stroke-linecap="round"/><text x="67" y="72">40</text>' +
        '<line x1="61" y1="77" x2="65" y2="77" stroke="' + scaleStroke + '" stroke-width="0.6" stroke-linecap="round"/>' +
        '<line x1="58" y1="84" x2="65" y2="84" stroke="' + scaleStroke + '" stroke-width="0.9" stroke-linecap="round"/><text x="67" y="86">20</text>' +
      '</g>' +
      '<path d="M 22 20 L 22 86" stroke="url(#gGlassReflection)" stroke-width="2.2" stroke-linecap="round" opacity="0.92"/>' +
      '<path d="M 25 24 L 25 82" stroke="rgba(255,255,255,0.42)" stroke-width="0.9" stroke-linecap="round"/>' +
      '<path d="M 78 20 L 78 86" stroke="rgba(255,255,255,0.45)" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M 14 14 Q 15 16 18 16.5 L 18 86 A 10 10 0 0 0 28 96 L 72 96 A 10 10 0 0 0 82 86 L 82 16.5 Q 85 16 86 14" fill="none" stroke="var(--mebi-glass-stroke, #475569)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="15" rx="33" ry="3.6" fill="none" stroke="var(--mebi-glass-stroke-rim, #334155)" stroke-width="1.8"/>' +
      '<path d="M 18 15 Q 50 18.5 82 15" stroke="rgba(255,255,255,0.95)" stroke-width="1.3" fill="none"/>' +
      '<path d="M 14 14 Q 17 16.5 20 16.5" stroke="rgba(255,255,255,0.92)" stroke-width="1.3" fill="none"/>' +
    '</svg>';
  }

  /* ----------------- 7. İKON KÜTÜPHANESİ ----------------- */
  function icon(key, extraClass) {
    var paths = {
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      zoomIn: '<circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15 15 5 5M7 10h6m-3-3v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      zoomOut: '<circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15 15 5 5M7 10h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      focus: '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      search: '<circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      down: '<polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      panelsTopLeft: '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 9h18M9 9v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      info: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      flaskIc: '<path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
      flaskOutline: '<path d="M10 2h4M10 2v5.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 7.5V2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      sparkles: '<path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" fill="currentColor"/>',
      beakerIc: '<path d="M5 3h14v2l-1.5 1.5V18a2.5 2.5 0 0 1-2.5 2.5H9A2.5 2.5 0 0 1 6.5 18V6.5L5 5V3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.3"/><line x1="10" y1="14" x2="13" y2="14" stroke="currentColor" stroke-width="1.3"/>',
      eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/>',
      helpCircle: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-1.5 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.5" r="0.8" fill="currentColor"/>',
      undo: '<path d="M7 8H4V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 8c1.6-2.5 4.3-4 7.4-4a8 8 0 1 1-7.6 10.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      reset: '<path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 3v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      gas: '<circle cx="8" cy="15.5" r="4.5" fill="rgba(6,182,212,0.25)" stroke="currentColor" stroke-width="1.8"/><circle cx="6.5" cy="13.5" r="1.3" fill="#ffffff"/><circle cx="16" cy="8.5" r="5.5" fill="rgba(6,182,212,0.25)" stroke="currentColor" stroke-width="1.8"/><circle cx="14" cy="6.2" r="1.6" fill="#ffffff"/><circle cx="15" cy="18.5" r="3.2" fill="rgba(6,182,212,0.25)" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="6.5" r="2.5" fill="rgba(6,182,212,0.25)" stroke="currentColor" stroke-width="1.5"/>',
      precipitate: '<path d="M6 4h12l-1.2 13.5A3 3 0 0 1 13.8 20h-3.6a3 3 0 0 1-3-2.5L6 4z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="15" r="1.4" fill="currentColor"/><circle cx="14" cy="16.5" r="1.1" fill="currentColor"/><circle cx="12" cy="13" r="0.9" fill="currentColor"/>',
      color: '<path d="M12 3c3 4 6 7.2 6 10.8A6 6 0 1 1 6 13.8C6 10.2 9 7 12 3z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      temp: '<rect x="10.3" y="3.5" width="3.4" height="11" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="17.5" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="12" y1="7" x2="12" y2="16" stroke="currentColor" stroke-width="1.6"/>',
      none: '<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
      check: '<path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      handIc: '<path d="M9 12.4V6a1.4 1.4 0 0 1 2.8 0v5.3M11.8 11.2V4.7a1.4 1.4 0 0 1 2.8 0v6.6M14.6 11.4V6.7a1.4 1.4 0 0 1 2.8 0v7.6c0 3.5-2.4 6.3-6 6.3h-1.1c-1.9 0-3.1-.7-4.1-2L4.5 15c-.6-.8-.4-1.8.4-2.3.7-.4 1.5-.3 2.1.3L9 14.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
      volumeOn: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      volumeOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>',
      deviceRotate: '<rect width="18" height="12" x="3" y="6" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m9 2 3-2 3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      fullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      fullscreenExit: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      rotate: '<path d="M21 2v6h-6M21 15.5a9 9 0 1 1-2.5-7.5l5.5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      atom: '<circle cx="12" cy="12" r="2.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)" fill="none" stroke="currentColor" stroke-width="1.6"/>',
      award: '<circle cx="12" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 13.9 2.5 8.1-6-3.5-6 3.5 2.5-8.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      save: '<path d="M5 3h12l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 3v6h9V3M7 21v-8h10v8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      play: '<polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/>'
    };

    var content = paths[key] || '';
    return '<svg viewBox="0 0 24 24" class="' + (extraClass || '') + '" width="20" height="20">' + content + '</svg>';
  }

  /* ----------------- 8. FOTOGERÇEKÇİ BOROSİLİKAT 3.3 CAM BEHER MODELLERİ ----------------- */
  // Beher Arka Cam ve Ağız Arka Çizgisi (Daldırma probunun arkasında kalır - z-index: 2)
  function renderRealisticMainBeakerBackSVG() {
    return '<svg viewBox="0 0 160 200" width="160" height="200" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:2;" role="presentation">' +
      '<defs>' +
        '<radialGradient id="gRealGroundShadow" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="rgba(15, 23, 42, 0.45)"/>' +
          '<stop offset="50%" stop-color="rgba(15, 23, 42, 0.16)"/>' +
          '<stop offset="100%" stop-color="rgba(15, 23, 42, 0)"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<ellipse cx="82" cy="195" rx="66" ry="5.5" fill="url(#gRealGroundShadow)"/>' +
      '<path d="M 27 24 L 27 178 A 13 13 0 0 0 40 192 L 124 192 A 13 13 0 0 0 137 178 L 137 24 Z" fill="rgba(240, 249, 255, 0.05)"/>' +
      '<path d="M 26 22 A 56 4.2 0 0 1 138 22" fill="none" stroke="rgba(255, 255, 255, 0.65)" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M 29 22 A 53 3.4 0 0 1 135 22" fill="none" stroke="rgba(255, 255, 255, 0.35)" stroke-width="1.2" stroke-linecap="round"/>' +
    '</svg>';
  }

  // Beher Ön Cam, Ağız Ön Kavisi, Skala ve Yansımalar (Daldırma probunun önünden geçer - z-index: 8)
  function renderRealisticMainBeakerGlassSVG() {
    return '<svg viewBox="0 0 160 200" width="160" height="200" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:8;" role="img" aria-label="Gerçek Borosilikat 3.3 Cam Beher">' +
      '<defs>' +
        '<linearGradient id="gRealGlassHighlight" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="rgba(255, 255, 255, 0.98)"/>' +
          '<stop offset="35%" stop-color="rgba(255, 255, 255, 0.65)"/>' +
          '<stop offset="70%" stop-color="rgba(255, 255, 255, 0.18)"/>' +
          '<stop offset="100%" stop-color="rgba(255, 255, 255, 0)"/>' +
        '</linearGradient>' +
        '<linearGradient id="gRealGlassFresnel" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)"/>' +
          '<stop offset="10%" stop-color="rgba(240, 249, 255, 0.08)"/>' +
          '<stop offset="90%" stop-color="rgba(240, 249, 255, 0.06)"/>' +
          '<stop offset="100%" stop-color="rgba(255, 255, 255, 0.40)"/>' +
        '</linearGradient>' +
        '<linearGradient id="gRealGlassBase" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="rgba(255, 255, 255, 0.35)"/>' +
          '<stop offset="45%" stop-color="rgba(226, 232, 240, 0.55)"/>' +
          '<stop offset="85%" stop-color="rgba(148, 163, 184, 0.75)"/>' +
          '<stop offset="100%" stop-color="rgba(100, 116, 139, 0.88)"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="M 26 176 L 26 180 A 14 14 0 0 0 40 194 L 124 194 A 14 14 0 0 0 138 180 L 138 176 Z" fill="url(#gRealGlassBase)"/>' +
      '<path d="M 26 24 L 26 180 A 14 14 0 0 0 40 194 L 124 194 A 14 14 0 0 0 138 180 L 138 24 Z" fill="url(#gRealGlassFresnel)"/>' +
      '<path d="M 28 26 L 28 178 A 12 12 0 0 0 40 190 L 124 190 A 12 12 0 0 0 136 178 L 136 26" fill="none" stroke="rgba(255, 255, 255, 0.42)" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M 8 18 Q 14 18 18 20 L 26 24 L 26 180 A 14 14 0 0 0 40 194 L 124 194 A 14 14 0 0 0 138 180 L 138 24 Q 142 22 146 22" fill="none" stroke="rgba(255, 255, 255, 0.88)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M 8 18 Q 14 18 18 20 L 26 24 L 26 180 A 14 14 0 0 0 40 194 L 124 194 A 14 14 0 0 0 138 180 L 138 24 Q 142 22 146 22" fill="none" stroke="rgba(71, 85, 105, 0.45)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M 8 18 L 16 26" stroke="rgba(255, 255, 255, 0.95)" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M 26 22 A 56 4.2 0 0 0 138 22" fill="none" stroke="rgba(255, 255, 255, 0.88)" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M 29 22 A 53 3.4 0 0 0 135 22" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M 26 22 Q 82 26.5 138 22" stroke="#ffffff" stroke-width="1.8" fill="none" opacity="0.95"/>' +
      '<path d="M 31 28 L 31 176" stroke="url(#gRealGlassHighlight)" stroke-width="3.5" stroke-linecap="round" opacity="0.95"/>' +
      '<path d="M 35 32 L 35 170" stroke="rgba(255, 255, 255, 0.55)" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M 133 30 L 133 174" stroke="rgba(255, 255, 255, 0.65)" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M 44 191 Q 82 194.5 120 191" stroke="rgba(255, 255, 255, 0.88)" stroke-width="2.2" stroke-linecap="round"/>' +
      '<g opacity="0.94">' +
        '<rect x="74" y="44" width="28" height="19" rx="3" fill="rgba(255, 255, 255, 0.28)" stroke="rgba(255, 255, 255, 0.75)" stroke-width="0.9"/>' +
        '<text x="88" y="52" font-family="JetBrains Mono, monospace" font-size="4.5" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">BORO 3.3</text>' +
        '<text x="88" y="59.5" font-family="Plus Jakarta Sans, sans-serif" font-size="3.2" font-weight="700" fill="rgba(255, 255, 255, 0.95)" text-anchor="middle">APPROX. VOL.</text>' +
        '<g font-family="JetBrains Mono, monospace" font-size="6.8" font-weight="700" fill="#ffffff" text-anchor="end">' +
          '<line x1="46" y1="68" x2="68" y2="68" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><text x="44" y="70.5">250ml</text>' +
          '<line x1="52" y1="81" x2="64" y2="81" stroke="#ffffff" stroke-width="1.0" stroke-linecap="round"/>' +
          '<line x1="48" y1="94" x2="68" y2="94" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/><text x="44" y="96.5">200</text>' +
          '<line x1="52" y1="107" x2="64" y2="107" stroke="#ffffff" stroke-width="1.0" stroke-linecap="round"/>' +
          '<line x1="48" y1="120" x2="68" y2="120" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/><text x="44" y="122.5">150</text>' +
          '<line x1="52" y1="133" x2="64" y2="133" stroke="#ffffff" stroke-width="1.0" stroke-linecap="round"/>' +
          '<line x1="48" y1="146" x2="68" y2="146" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/><text x="44" y="148.5">100</text>' +
          '<line x1="52" y1="158" x2="64" y2="158" stroke="#ffffff" stroke-width="1.0" stroke-linecap="round"/>' +
          '<line x1="48" y1="168" x2="68" y2="168" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/><text x="44" y="170.5">50</text>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  function renderRealisticDragBeakerGlassSVG() {
    return '<svg viewBox="0 0 115 150" width="115" height="150" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:8;" role="img" aria-label="Dökülen Borosilikat 3.3 Cam Beher">' +
      '<defs>' +
        '<linearGradient id="gDragRealHighlight" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="rgba(255, 255, 255, 0.98)"/>' +
          '<stop offset="40%" stop-color="rgba(255, 255, 255, 0.55)"/>' +
          '<stop offset="100%" stop-color="rgba(255, 255, 255, 0)"/>' +
        '</linearGradient>' +
        '<linearGradient id="gDragRealBase" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="rgba(255, 255, 255, 0.3)"/>' +
          '<stop offset="50%" stop-color="rgba(226, 232, 240, 0.5)"/>' +
          '<stop offset="100%" stop-color="rgba(148, 163, 184, 0.8)"/>' +
        '</linearGradient>' +
        '<linearGradient id="gDragRealFresnel" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="rgba(255, 255, 255, 0.42)"/>' +
          '<stop offset="12%" stop-color="rgba(240, 249, 255, 0.08)"/>' +
          '<stop offset="88%" stop-color="rgba(240, 249, 255, 0.06)"/>' +
          '<stop offset="100%" stop-color="rgba(255, 255, 255, 0.38)"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="M 16 130 L 16 134 A 10 10 0 0 0 26 144 L 90 144 A 10 10 0 0 0 100 134 L 100 130 Z" fill="url(#gDragRealBase)"/>' +
      '<path d="M 16 16 L 16 134 A 10 10 0 0 0 26 144 L 90 144 A 10 10 0 0 0 100 134 L 100 16 Z" fill="url(#gDragRealFresnel)"/>' +
      '<path d="M 18 18 L 18 132 A 8 8 0 0 0 26 140 L 90 140 A 8 8 0 0 0 98 132 L 98 18" fill="none" stroke="rgba(255, 255, 255, 0.42)" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M 4 12 Q 9 12 12 14 L 16 16 L 16 134 A 10 10 0 0 0 26 144 L 90 144 A 10 10 0 0 0 100 134 L 100 16 Q 104 14 107 14" fill="none" stroke="rgba(255, 255, 255, 0.88)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M 4 12 Q 9 12 12 14 L 16 16 L 16 134 A 10 10 0 0 0 26 144 L 90 144 A 10 10 0 0 0 100 134 L 100 16 Q 104 14 107 14" fill="none" stroke="rgba(71, 85, 105, 0.45)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M 4 12 L 12 20" stroke="rgba(255, 255, 255, 0.95)" stroke-width="2.4" stroke-linecap="round"/>' +
      '<ellipse cx="58" cy="15" rx="42" ry="3.6" fill="none" stroke="rgba(255, 255, 255, 0.78)" stroke-width="2.4"/>' +
      '<path d="M 16 15 Q 58 18.5 100 15" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.95"/>' +
      '<path d="M 20 20 L 20 132" stroke="url(#gDragRealHighlight)" stroke-width="3" stroke-linecap="round" opacity="0.92"/>' +
      '<path d="M 96 20 L 96 130" stroke="rgba(255, 255, 255, 0.6)" stroke-width="1.8" stroke-linecap="round"/>' +
      '<g opacity="0.92" font-family="JetBrains Mono, monospace" font-size="5.8" font-weight="700" fill="#ffffff" text-anchor="end">' +
        '<line x1="36" y1="38" x2="52" y2="38" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/><text x="34" y="40">100ml</text>' +
        '<line x1="40" y1="60" x2="52" y2="60" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/><text x="34" y="62">80</text>' +
        '<line x1="40" y1="82" x2="52" y2="82" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/><text x="34" y="84">60</text>' +
        '<line x1="40" y1="104" x2="52" y2="104" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/><text x="34" y="106">40</text>' +
        '<line x1="40" y1="124" x2="52" y2="124" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/><text x="34" y="126">20</text>' +
      '</g>' +
    '</svg>';
  }

  // Global erişim
  window.MebiSVG = {
    renderBeakerSVG: renderBeakerSVG,
    renderRealisticMainBeakerBackSVG: renderRealisticMainBeakerBackSVG,
    renderRealisticMainBeakerGlassSVG: renderRealisticMainBeakerGlassSVG,
    renderRealisticDragBeakerGlassSVG: renderRealisticDragBeakerGlassSVG,
    icon: icon
  };

})(window);
