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
      mobileNav.hidden = isExpanded;
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

  // 5. Kontaktformular (Sendet an Cloudflare Function /api/send)
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

      // Daten sammeln
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          if(status) { 
            status.textContent = "✓ Nachricht erfolgreich gesendet!"; 
            status.style.color = "#7BFFA8"; 
            status.style.display = "block"; 
          }
          form.reset();
          btn.textContent = "Gesendet";
        } else {
          try {
             const errData = await response.json();
             console.error("Server Error:", errData);
          } catch(e) {}
          throw new Error('Senden fehlgeschlagen');
        }
      } catch (err) {
        console.error(err);
        if(status) { 
          status.textContent = "⚠ Fehler beim Senden. Bitte WhatsApp nutzen."; 
          status.style.color = "#ff6b6b"; 
          status.style.display = "block"; 
        }
        btn.textContent = "Fehler";
      }
      
      // Reset Button nach 3 Sekunden
      setTimeout(() => { 
        btn.disabled = false; 
        btn.textContent = originalText; 
      }, 3000);
    });
  }

  // 6. Interaktive Effekte (Glass & Magnet)
  qsa('.glass6').forEach(el => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`);
      el.classList.add('is-hot');
    });
    el.addEventListener('pointerleave', () => el.classList.remove('is-hot'));
  });

  qsa('.pill').forEach(el => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `translate3d(${dx * 5}px, ${dy * 5}px, 0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    });
  });

  // 7. Ablauf Animation (Sequentiell Blau bei Scroll)
  const stepsContainer = qs('.steps');
  if (stepsContainer) {
    const steps = qsa('.step', stepsContainer);
    
    // Observer der schaut, wann die Sektion sichtbar ist
    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          
          // Geht durch alle Steps durch und aktiviert sie zeitversetzt
          steps.forEach((step, index) => {
            setTimeout(() => {
              step.classList.add('step--active');
            }, index * 700); // 700ms Pause zwischen jedem Schritt
          });

          // Observer stoppen, damit es nur einmal passiert
          stepObserver.unobserve(entry.target); 
        }
      });
    }, { threshold: 0.25 }); // Startet wenn 25% der Box sichtbar sind
    
    stepObserver.observe(stepsContainer);
  }

  // 8. NEU: Smart Staggering (Kaskaden-Effekt für Listen)
  // Das sorgt dafür, dass Elemente nacheinander reinfliegen statt gleichzeitig
  const staggerGroups = qsa('.cards, .steps, .trustRow, .service-grid, .faq-grid, .hero__cta, .hero__socials, .reviewsTrack');
  
  staggerGroups.forEach(group => {
    // Finde alle .reveal Elemente in der Gruppe
    const children = qsa('.reveal', group);
    
    children.forEach((child, index) => {
      // Setzt die CSS-Variable --d (Delay) basierend auf dem Index
      // 1. Element: 0ms, 2. Element: 120ms, 3. Element: 240ms usw.
      child.style.setProperty('--d', `${index * 120}ms`);
    });
  });

})();
