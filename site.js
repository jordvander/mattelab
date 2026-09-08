/* Motion and presentation controls. Email signup is handled by download-gate.js. */
(function () {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionButton = document.getElementById('motionToggle');
  let backgroundPaused = reducedMotion;
  function updateMotionButton() {
    motionButton.textContent = backgroundPaused ? 'Play background' : 'Pause background';
    motionButton.setAttribute('aria-pressed', String(backgroundPaused));
  }
  updateMotionButton();
  motionButton.hidden = false;
  motionButton.addEventListener('click', function () {
    backgroundPaused = !backgroundPaused;
    updateMotionButton();
    document.dispatchEvent(new CustomEvent('mattelab:motion', {detail: {paused: backgroundPaused}}));
  });

  const videos = Array.from(document.querySelectorAll('.reels video'));
  const reelButton = document.getElementById('reelToggle');
  let reelsPaused = reducedMotion;
  function updateReels() {
    const height = window.innerHeight;
    videos.forEach(function (video) {
      const rect = video.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < height;
      if (visible && !reelsPaused && !document.hidden) {
        if (video.paused) video.play().catch(function () {});
      } else if (!video.paused) video.pause();
    });
  }
  function updateReelButton() {
    reelButton.textContent = reelsPaused ? 'Play reels' : 'Pause reels';
    reelButton.setAttribute('aria-pressed', String(reelsPaused));
  }
  updateReelButton();
  reelButton.hidden = false;
  reelButton.addEventListener('click', function () {
    reelsPaused = !reelsPaused;
    updateReelButton();
    updateReels();
  });
  let scrollQueued = false;
  window.addEventListener('scroll', function () {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () { scrollQueued = false; updateReels(); });
  }, {passive: true});
  window.addEventListener('resize', updateReels, {passive: true});
  document.addEventListener('visibilitychange', updateReels);
  updateReels();

  document.querySelectorAll('a[href="#mac-help"]').forEach(function (link) {
    link.addEventListener('click', function () { document.getElementById('mac-help').open = true; });
  });

})();
