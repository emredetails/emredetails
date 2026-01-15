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

// 5. Kontaktformular mit DIREKTER Resend Integration & Styled HTML
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
      const data = Object.fromEntries(formData.entries());

      // ==========================================
      // HIER DEINE DATEN EINFÜGEN
      // ==========================================
      const API_KEY = 're_fTshEpDM_CP1BtAo2Do44LwUyBewSdEsP'; // <--- API KEY (re_...)
      const TO_EMAIL = 'info@emredetails.de'; // <--- E-MAIL ADRESSE
      // ==========================================

      // Styled HTML Template für die Email
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f2f4f8; padding: 40px 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            
            <div style="background-color: #0B1221; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Neue Anfrage</h1>
              <p style="color: #a0aec0; margin: 5px 0 0; font-size: 14px;">über emredetails.de</p>
            </div>

            <div style="padding: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #718096; font-size: 14px; width: 120px;">Name</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #2d3748; font-weight: 500; font-size: 15px;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #718096; font-size: 14px;">Email</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #2d3748; font-weight: 500; font-size: 15px;">
                    <a href="mailto:${data.email}" style="color: #3b82f6; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #718096; font-size: 14px;">Fahrzeug</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #2d3748; font-weight: 500; font-size: 15px;">${data.vehicle || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #718096; font-size: 14px;">Interesse an</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #2d3748; font-weight: 500; font-size: 15px;">${data.service || '-'}</td>
                </tr>
              </table>

              <div style="margin-top: 25px;">
                <p style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 8px;">Nachricht</p>
                <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; color: #4a5568; line-height: 1.6; font-size: 15px;">
                  ${data.message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>

            <div style="background-color: #edf2f7; padding: 15px; text-align: center; font-size: 12px; color: #a0aec0;">
              EmreDetails Web Formular
            </div>
          </div>
        </div>
      `;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            // WICHTIG: Wenn Domain verifiziert ist: 'info@emredetails.de'
            // Wenn Domain NICHT verifiziert ist (Test): 'onboarding@resend.dev'
            from: 'EmreDetails Web <onboarding@resend.dev>', 
            to: TO_EMAIL,
            subject: `Anfrage: ${data.name} (${data.service || 'Allgemein'})`,
            html: emailHtml
          })
        });

        if (res.ok) {
          if(status) { 
            status.textContent = "✓ Erfolgreich gesendet!"; 
            status.style.color = "#7BFFA8"; 
            status.style.display = "block"; 
          }
          form.reset();
        } else {
          // Fehler auslesen
          const errData = await res.json();
          console.error("Resend Error:", errData);
          throw new Error('Senden fehlgeschlagen');
        }
      } catch (err) {
        console.error(err);
        if(status) { 
          status.textContent = "⚠ Fehler beim Senden. Bitte WhatsApp nutzen."; 
          status.style.color = "#ff6b6b"; 
          status.style.display = "block"; 
        }
      }
      setTimeout(() => { btn.disabled = false; btn.textContent = originalText; }, 3000);
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
(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // 1. Jahr Update
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // 2. Navbar & Mobile Menu
  const topbar = qs('.topbar');
  const burger = qs('.burger');
  const mobileNav = qs('#mobileNav');

  const onScroll = () => {
    if (!topbar) return;
    topbar.setAttribute('data-scrolled', window.scrollY > 10 ? 'true' : 'false');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isExpanded = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', !isExpanded);
      mobileNav.hidden = isExpanded;
    });
    mobileNav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.hidden = true;
      }
    });
  }

  // 3. Reveal Animation (Simpel & Performant)
  const revealEls = qsa('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => observer.observe(el));

  // 4. FAQ Logic
  qsa('details').forEach(el => {
    el.addEventListener('toggle', () => {
      if (el.open) {
        qsa('details').forEach(other => {
          if (other !== el && other.open) other.removeAttribute('open');
        });
      }
    });
  });

  // 5. INTERAKTIVE EFFEKTE (Wieder aktiviert!)
  
  // A) Specular Highlight (Glass Glow)
  qsa('.glass6').forEach(el => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 100;
      const y = ((ev.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
      el.classList.add('is-hot');
    });
    el.addEventListener('pointerleave', () => el.classList.remove('is-hot'));
  });

  // B) Magnetic Buttons (Pills)
  qsa('.pill').forEach(el => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      // Berechnet Abstand zur Mitte des Buttons
      const dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
      
      // Bewegt den Button leicht in Mausrichtung (Magnet-Effekt)
      // Faktor 5 steuert die Stärke (Pixel)
      el.style.transform = `translate3d(${dx * 5}px, ${dy * 5}px, 0)`;
    });

    el.addEventListener('pointerleave', () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    });
  });


  // 6. Kontaktformular (Resend Frontend Integration)
  const form = qs('#contact-form');
  const status = qs('#form-status');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      
      btn.disabled = true;
      btn.textContent = "Sende...";
      if(status) status.style.display = 'none';

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // API KEY HIER EINFÜGEN
      const API_KEY = 're_DEIN_API_KEY_HIER'; 
      const TO_EMAIL = 'info@emredetails.de'; 

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            from: 'EmreDetails Web <onboarding@resend.dev>',
            to: TO_EMAIL,
            subject: `Anfrage: ${data.name}`,
            html: `<p>Name: ${data.name}</p><p>Email: ${data.email}</p><p>Nachricht: ${data.message}</p>`
          })
        });

        if (res.ok) {
          if(status) { status.textContent = "✓ Gesendet!"; status.style.display = 'block'; status.style.color='#7BFFA8'; }
          form.reset();
        } else {
          throw new Error('Fehler');
        }
      } catch (err) {
        if(status) { status.textContent = "Fehler. Bitte WhatsApp nutzen."; status.style.display = 'block'; status.style.color='red'; }
      }
      setTimeout(() => { btn.disabled = false; btn.textContent = originalText; }, 3000);
    });
  }
})();
