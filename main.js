(() => {
  // Helfer-Funktionen
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // 1. Footer Jahr automatisch setzen
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // 2. Navbar Logik (Glass Effect & Mobile Menu)
  const topbar = qs('.topbar');
  const burger = qs('.burger');
  const mobileNav = qs('#mobileNav');

  // Scroll Effekt für Navbar
  const onScroll = () => {
    if (!topbar) return;
    topbar.setAttribute('data-scrolled', window.scrollY > 10 ? 'true' : 'false');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile Menü Toggle
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isExpanded = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', !isExpanded);
      mobileNav.hidden = isExpanded; // toggle logic
    });

    // Schließen beim Klick auf Link
    mobileNav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.hidden = true;
      }
    });
  }

  // 3. Reveal Animation (Performance-Optimiert)
  // Entfernt "Layout Thrashing", das Firefox zum Absturz brachte
  const revealEls = qsa('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => observer.observe(el));

  // 4. FAQ Accordion Logik
  qsa('details').forEach(el => {
    el.addEventListener('toggle', () => {
      if (el.open) {
        qsa('details').forEach(other => {
          if (other !== el && other.open) {
            other.removeAttribute('open');
          }
        });
      }
    });
  });

  // 5. Kontaktformular mit DIREKTER Resend Integration
  const form = qs('#contact-form');
  const status = qs('#form-status');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      
      // Button sperren & Feedback
      btn.disabled = true;
      btn.textContent = "Sende...";
      if(status) status.style.display = 'none';

      // Daten auslesen
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const vehicle = formData.get('vehicle') || '-';
      const service = formData.get('service') || '-';
      const message = formData.get('message');

      // --- DEINE RESEND KONFIGURATION ---
      const API_KEY = 're_123456789'; // <--- HIER DEINEN API KEY REINKOPIEREN (re_...)
      const TO_EMAIL = 'info@emredetails.de'; // <--- HIER DEINE EMPFÄNGER MAIL

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            from: 'EmreDetails Form <onboarding@resend.dev>', // Oder deine verifizierte Domain
            to: TO_EMAIL,
            subject: `Neue Anfrage von ${name}`,
            html: `
              <h3>Neue Nachricht über Webseite</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Fahrzeug:</strong> ${vehicle}</p>
              <p><strong>Service:</strong> ${service}</p>
              <hr/>
              <p>${message.replace(/\n/g, '<br>')}</p>
            `
          })
        });

        if (response.ok) {
          if(status) {
            status.textContent = "✓ Erfolgreich gesendet!";
            status.style.color = "#7BFFA8";
            status.style.display = "block";
          }
          form.reset();
          btn.textContent = "Gesendet";
        } else {
          const errorText = await response.text();
          console.error("Resend Error:", errorText);
          throw new Error('Senden fehlgeschlagen');
        }

      } catch (error) {
        console.error(error);
        if(status) {
          status.textContent = "⚠ Fehler. Bitte WhatsApp nutzen.";
          status.style.color = "#ff6b6b";
          status.style.display = "block";
        }
        btn.textContent = "Fehler";
      }

      // Button Reset
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = originalText;
      }, 3000);
    });
  }

  // Glass Specular Highlight (Optional, leichtgewichtig)
  qsa('.glass6').forEach(el => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`);
      el.classList.add('is-hot');
    });
    el.addEventListener('pointerleave', () => el.classList.remove('is-hot'));
  });

})();
