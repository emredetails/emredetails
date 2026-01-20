export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const response = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  // 1. INHALT LADEN 
  if (request.method === "GET") {
    const data = await env.WEBSITE_CONTENT.get("site_data", { type: "json" });
    return response(data || {}); // Wenn leer, gib leeres Objekt zurück
  }

  // 2. LOGIN (Email senden)
  if (request.method === "POST" && url.searchParams.get("action") === "login") {
    const { email } = await request.json();
    
    // Einfache Whitelist
    if (email !== env.ADMIN_EMAIL) {
      return response({ error: "Unbekannte Email" }, 403);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Code für 15 Min (900 sek) speichern
    await env.WEBSITE_CONTENT.put(`auth_${email}`, code, { expirationTtl: 900 });

    // Email über Resend senden
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Admin <info@emredetails.de>", // verifizierte Resend Domain
        to: email,
        subject: "Dein Admin Login Code",
        html: `<p>Dein Code ist: <strong>${code}</strong></p><p>Gültig für 15 Minuten.</p>`
      })
    });

    if (resendResponse.ok) return response({ success: true });
    return response({ error: "Fehler beim Mailversand" }, 500);
  }

  // 3. VERIFY (Code prüfen)
  if (request.method === "POST" && url.searchParams.get("action") === "verify") {
    const { email, code } = await request.json();
    const storedCode = await env.WEBSITE_CONTENT.get(`auth_${email}`);

    if (storedCode && storedCode === code) {
      // Code löschen
      await env.WEBSITE_CONTENT.delete(`auth_${email}`);
      const token = "admin_session_" + Date.now();
      await env.WEBSITE_CONTENT.put(token, "valid", { expirationTtl: 86400 }); // 24h Session
      return response({ success: true, token });
    }
    return response({ error: "Ungültiger oder abgelaufener Code" }, 401);
  }

  // 4. SPEICHERN (Nur mit Token)
  if (request.method === "POST" && url.searchParams.get("action") === "save") {
    const token = request.headers.get("Authorization");
    const isValid = await env.WEBSITE_CONTENT.get(token);
    
    if (!isValid) return response({ error: "Nicht eingeloggt" }, 401);

    const newData = await request.json();
    // Speichere die kompletten Webseiten-Daten
    await env.WEBSITE_CONTENT.put("site_data", JSON.stringify(newData));
    return response({ success: true });
  }

  return response({ error: "Methode nicht erlaubt" }, 405);
}
