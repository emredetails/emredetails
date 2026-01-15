(() => {
  // Helfer
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // 1. Footer Jahr Update
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
      mobileNav.hidden = isExpanded; // Wenn offen, dann verstecken (true)
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
  // Nutzt nur CSS Klassen, keine schweren JS Berechnungen
  const revealEls = qsa('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target); // Stop observing after reveal
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

  revealEls.forEach(el => observer.observe(el));

  // 4. FAQ Accordion (Simpel & Schnell)
  qsa('details').forEach(el => {
    el.addEventListener('toggle', () => {
      if (el.open) {
        // Schließt alle anderen, wenn eins geöffnet wird
        qsa('details').forEach(other => {
          if (other !== el && other.open) {
            other.removeAttribute('open');
          }
        });
      }
    });
  });

  // 5. Kontaktformular Logik (Senden an Cloudflare Functions)
  const form = qs('#contact-form');
  const status = qs('#form-status');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      
      // UI Feedback: Laden
      btn.disabled = true;
      btn.textContent = "Wird gesendet...";
      status.style.display = 'none';

      // Daten sammeln
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        // Senden an Backend-Funktion (siehe Schritt 2)
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          // Erfolg
          status.textContent = "✓ Nachricht erfolgreich gesendet!";
          status.style.color = "#7BFFA8"; // Hellgrün
          status.style.display = "block";
          form.reset();
          btn.textContent = "Gesendet";
        } else {
          throw new Error('Server Fehler');
        }

      } catch (error) {
        // Fehler
        console.error(error);
        status.textContent = "⚠ Fehler beim Senden. Bitte WhatsApp nutzen.";
        status.style.color = "#ff6b6b"; // Rot
        status.style.display = "block";
        btn.textContent = "Fehler";
      }

      // Reset Button nach 3 Sekunden
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = originalText;
      }, 3000);
    });
  }
})();
