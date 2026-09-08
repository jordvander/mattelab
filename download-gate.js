/* Only an accepted MailerLite submission unlocks the website's downloads. */
(function () {
  'use strict';
  const KEY = 'ml.gate.unlocked.v2';
  const form = document.getElementById('signupForm');
  const email = document.getElementById('signupEmail');
  const button = document.getElementById('signupButton');
  const status = document.getElementById('signupStatus');
  const panel = document.getElementById('download-signup');
  const links = Array.from(document.querySelectorAll('[data-gated-url]'));
  let unlocked = false;

  function unlock(remember) {
    unlocked = true;
    links.forEach(function (link) { link.href = link.dataset.gatedUrl; });
    form.hidden = true;
    document.getElementById('signupTerms').hidden = true;
    document.getElementById('signupHeading').textContent = 'Your downloads are ready.';
    document.getElementById('signupIntro').textContent = 'Choose Mac or Windows below to get started.';
    panel.classList.add('is-unlocked');
    status.textContent = remember ? 'Thanks for signing up. If a confirmation email arrives, follow its link to receive updates.' : 'Welcome back. Your downloads are unlocked.';
    if (remember) {
      // Remember acceptance only, never the visitor's email address.
      try { localStorage.setItem(KEY, '1'); } catch (error) {}
    }
  }
  // The previous ml.gate.email key was written even when signup failed.
  // It must not count as an accepted subscription.
  try { if (localStorage.getItem(KEY) === '1') unlock(false); } catch (error) {}
  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (unlocked) return;
      event.preventDefault();
      panel.scrollIntoView({behavior: 'auto', block: 'center'});
      email.focus({preventScroll: true});
    });
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (button.disabled || unlocked) return;
    email.value = email.value.trim();
    if (!form.reportValidity()) return;
    if (document.getElementById('signupHp').value) return;
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 12000);
    button.disabled = true;
    button.textContent = 'Submitting…';
    status.textContent = '';
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: new FormData(form), mode: 'cors',
        credentials: 'omit', signal: controller.signal
      });
      if (!response.ok) throw new Error('service unavailable');
      const result = await response.json();
      if (result.success === true) {
        unlock(true);
        const first = document.querySelector('[data-asset="mac"]');
        if (first) first.focus({preventScroll: true});
      } else {
        const errors = result.errors && result.errors.fields && result.errors.fields.email;
        status.textContent = Array.isArray(errors) && typeof errors[0] === 'string'
          ? errors[0] + ' Please check your email and try again.'
          : 'Your signup was not accepted. Please check your email and try again.';
      }
    } catch (error) {
      status.textContent = 'We could not complete your signup. Please try again in a moment to unlock the downloads.';
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = 'Unlock downloads ↓';
    }
  });
})();
