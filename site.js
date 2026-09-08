/* Downloads are ordinary HTML links; this script only enhances the presentation. */
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

  const form = document.getElementById('signupForm');
  const button = document.getElementById('signupButton');
  const status = document.getElementById('signupStatus');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (document.getElementById('signupHp').value) return;
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 8000);
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    try {
      await fetch(form.action, {method: 'POST', body: new FormData(form), mode: 'no-cors', signal: controller.signal});
      // MailerLite returns an opaque cross-origin response. Do not claim a confirmed subscription.
      status.textContent = 'Request sent. Check your inbox for a confirmation from the lab. If nothing arrives, please try again.';
    } catch (error) {
      status.textContent = 'The signup service did not respond. Please try again later. The app downloads above are ready to use.';
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = 'Keep me posted ↗';
    }
  });
})();
