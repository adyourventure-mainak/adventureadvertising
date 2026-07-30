/* ============================================================
   Gate lines — the animated-path effect, natively

   The reference implementation is a React component using
   framer-motion, where each path's `pathLength` is a MotionValue
   driven by scroll progress. None of that machinery is needed: SVG
   already exposes the same thing through stroke-dasharray and
   stroke-dashoffset, and getTotalLength() gives the number to
   animate against.

   So this is the same effect with no React, no Tailwind and no
   build step — which matters, because adding those three to run one
   animation would mean rewriting every file on the site.

   Two behaviours the original does not have, both deliberate:
   the gate does not scroll, so progress is driven by time and by
   pointer position instead; and the whole thing is skipped when the
   reader has asked for reduced motion.
   ============================================================ */
(function () {
  'use strict';

  const host = document.getElementById('gateLines');
  if (!host) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    host.remove();                       /* honour the setting, show nothing */
    return;
  }

  /* Five ribbons, drawn once and reused for the blurred copy behind.
     Colours follow the source component. */
  const PATHS = [
    { d: 'M0 663C145 663 191 666 269 647C326 630 339 621 397 566C439 531 455 529 490 523C509 519 521 503 538 504C553 504 562 514 584 522C592 525 600 526 607 523C624 515 641 496 657 496C673 496 693 519 712 526C718 528 725 528 730 525C751 517 764 497 782 496C794 496 804 508 822 518C835 525 850 526 862 520C875 513 889 502 903 503C922 505 935 510 945 515C954 519 963 522 972 524C996 530 1007 534 1034 549C1077 573 1082 594 1140 629C1206 670 1328 662 1440 662', c: '#FFB7C5' },
    { d: 'M0 587C147 587 277 587 310 573C348 563 392 543 408 535C434 523 426 526 479 515C494 512 523 510 534 512C554 516 555 523 576 523C592 523 616 496 633 497C648 497 661 515 684 524C692 527 700 528 707 525C724 517 741 498 757 498C773 498 791 520 810 527C816 529 822 529 828 526C849 518 861 502 879 501C886 501 896 506 907 510C930 521 957 519 982 520C1020 520 1037 530 1056 537C1102 556 1116 570 1180 579C1257 589 1279 587 1440 588', c: '#FFDDB7' },
    { d: 'M0 514C147 514 294 513 380 513C405 514 422 515 436 515C477 514 518 506 559 511C564 511 569 512 575 513C588 516 616 521 627 519C647 515 659 499 680 499C700 499 725 529 742 528C757 528 768 510 791 500C798 497 807 496 814 499C832 507 850 524 866 524C882 524 902 509 921 505C926 504 932 504 937 505C966 511 970 514 989 514C1006 515 1036 513 1055 513C1114 513 1090 513 1124 513C1177 513 1178 514 1241 514C1317 514 1274 512 1440 513', c: '#B1C5FF' },
    { d: 'M0 438C150 438 261 438 323 456C351 464 387 484 423 494C447 501 472 503 487 507C503 512 504 516 523 518C547 521 564 501 584 501C604 501 626 529 643 528C658 528 672 511 695 501C703 499 711 498 718 501C735 509 751 529 767 529C783 529 801 507 819 500C825 498 832 499 837 501C859 508 873 523 891 523C907 524 923 504 963 506C1034 506 1047 492 1071 481C1122 457 1142 452 1185 446C1255 436 1294 439 1439 439', c: '#4FABFF' },
    { d: 'M0 364C145 362 195 361 265 378C322 391 399 457 411 467C424 478 456 491 496 502C498 503 501 504 503 505C517 511 541 520 551 521C571 521 590 498 611 498C631 498 652 529 669 528C685 528 697 510 721 501C728 497 736 497 743 500C761 508 778 529 794 528C810 528 829 508 848 502C854 500 860 500 866 502C886 509 898 519 916 520C932 520 934 510 967 501C1011 491 1007 493 1029 480C1069 453 1072 440 1128 403C1180 369 1275 360 1439 364', c: '#076EFF' }
  ];

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1440 890');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');

  /* The blur behind each ribbon is what gives the effect its glow. */
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = '<filter id="gateBlur"><feGaussianBlur in="SourceGraphic" stdDeviation="7"/></filter>';
  svg.appendChild(defs);

  const glow = document.createElementNS(svgNS, 'g');
  glow.setAttribute('filter', 'url(#gateBlur)');
  glow.setAttribute('opacity', '.55');
  svg.appendChild(glow);

  const lines = [];
  PATHS.forEach(({ d, c }) => {
    const mk = parent => {
      const el = document.createElementNS(svgNS, 'path');
      el.setAttribute('d', d);
      el.setAttribute('stroke', c);
      el.setAttribute('stroke-width', '2');
      el.setAttribute('fill', 'none');
      parent.appendChild(el);
      return el;
    };
    mk(glow);                            /* static blurred copy */
    lines.push(mk(svg));                 /* animated sharp copy */
  });

  host.appendChild(svg);

  /* Measure once the paths are in the document, then drive dashoffset.
     This is the direct equivalent of framer-motion's pathLength. */
  const lengths = lines.map(l => l.getTotalLength());
  lines.forEach((l, i) => {
    l.style.strokeDasharray = lengths[i];
    l.style.strokeDashoffset = lengths[i];
  });

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  let pointer = 0;                        /* 0…1, nudged by the cursor */

  addEventListener('pointermove', e => {
    pointer = clamp(e.clientX / innerWidth, 0, 1);
  }, { passive: true });

  let START = performance.now();
  const DRAW_MS = 2600;                   /* initial draw-on */

  /* requestAnimationFrame does not run in a background tab, so a gate
     opened in one would be found already drawn when the reader finally
     switches to it. Restart the clock instead, so the animation plays
     for the person rather than for an empty tab. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) START = performance.now();
  });

  /* Each ribbon lags the one before it so the set reads as a single
     gesture. The lag has to be RESCALED, not just subtracted: plain
     subtraction meant the last line topped out at 0.76 and never
     finished drawing. */
  const LAG = 0.06;
  const SPAN = 1 - LAG * (PATHS.length - 1);

  function frame(now) {
    const t = clamp((now - START) / DRAW_MS, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    lines.forEach((l, i) => {
      const stagger = clamp((eased - i * LAG) / SPAN, 0, 1);
      const drawn = clamp(stagger + pointer * 0.12 * (1 - stagger), 0, 1);
      l.style.strokeDashoffset = String(lengths[i] * (1 - drawn));
    });

    if (t < 1 || true) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
