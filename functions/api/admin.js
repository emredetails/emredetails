export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const response = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    // GET (Daten laden)
    if (request.method === "GET") {
      const data = await env.WEBSITE_CONTENT.get("site_data", { type: "json" });
      return response(data || {}); 
    }

    // POST LOGIN (Hier liegt das Problem)
    if (request.method === "POST" && url.searchParams.get("action") === "login") {
      const body = await request.json();
      const emailInput = body.email || "";

      // Debug: Wir holen die Variablen und erzwingen Strings
      const configEmail = env.ADMIN_EMAIL ? String(env.ADMIN_EMAIL) : "";
      const configKey = env.RESEND_API_KEY ? String(env.RESEND_API_KEY) : "";

      // 1. Check: Fehlt die Config komplett?
      if (!configEmail) return response({ error: "DEBUG: ADMIN_EMAIL ist in Cloudflare leer oder nicht gefunden." }, 500);
      
      // 2. Check: Vergleich
      const inputClean = emailInput.toLowerCase().trim();
      const configClean = configEmail.toLowerCase().trim();

      if (inputClean !== configClean) {
        // --- DEBUG AUSGABE ---
        // Das hier wird dir im Browser-Netzwerk-Tab genau zeigen, was falsch läuft
        return response({ 
          error: "Email Mismatch",
          debug: {
            du_hast_gesendet: inputClean,
            cloudflare_hat_gespeichert: configClean,
            laenge_input: inputClean.length,
            laenge_config: configClean.length,
            hinweis: "Sind da Anführungszeichen oder Leerzeichen zu viel?"
          }
        }, 403);
      }

      // Wenn wir hier sind, passen die E-Mails. Weiter zu Resend.
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await env.WEBSITE_CONTENT.put(`auth_${emailInput}`, code, { expirationTtl: 900 });

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${configKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Admin Zugang <info@emredetails.de>", 
          to: emailInput,
          subject: "Dein Login Code",
          html: `<p>Dein Code: <strong>${code}</strong></p>`
        })
      });

      if (!resendResponse.ok) {
        const errText = await resendResponse.text();
        return response({ error: "Resend Fehler", details: errText }, 500);
      }

      return response({ success: true });
    }

    // REST (Verify & Save)
    if (request.method === "POST" && url.searchParams.get("action") === "verify") {
      const { email, code } = await request.json();
      const storedCode = await env.WEBSITE_CONTENT.get(`auth_${email}`);
      if (storedCode && storedCode === code) {
        await env.WEBSITE_CONTENT.delete(`auth_${email}`);
        const token = "session_" + crypto.randomUUID();
        await env.WEBSITE_CONTENT.put(token, "valid", { expirationTtl: 86400 }); 
        return response({ success: true, token });
      }
      return response({ error: "Code falsch" }, 401);
    }

    if (request.method === "POST" && url.searchParams.get("action") === "save") {
      const token = request.headers.get("Authorization");
      if (!token || !(await env.WEBSITE_CONTENT.get(token))) return response({ error: "Session weg" }, 401);
      const newData = await request.json();
      await env.WEBSITE_CONTENT.put("site_data", JSON.stringify(newData));
      return response({ success: true });
    }

    return response({ error: "Methode ?" }, 405);

  } catch (err) {
    return response({ error: "CRASH", details: err.message, stack: err.stack }, 500);
  }
}
