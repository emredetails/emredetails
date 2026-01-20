export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const response = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    // 1. GET: Daten laden
    if (request.method === "GET") {
      const data = await env.WEBSITE_CONTENT.get("site_data", { type: "json" });
      return response(data || {}); 
    }

    // 2. POST: LOGIN (Passwort Check)
    if (request.method === "POST" && url.searchParams.get("action") === "login") {
      const { email, password } = await request.json(); // Wir erwarten jetzt ein Passwort

      const configPass = env.ADMIN_PASSWORD;
      
      if (!configPass) {
        return response({ error: "Server-Fehler: Kein Admin-Passwort konfiguriert." }, 500);
      }

      // Check: Passwort korrekt?
      // Optional: Du kannst auch prüfen ob email === env.ADMIN_EMAIL ist, wenn du das willst.
      if (password.trim() === configPass) {
        
        // Erfolg! Token generieren
        const token = "session_" + crypto.randomUUID();
        // Token für 24h (86400 sek) speichern
        await env.WEBSITE_CONTENT.put(token, "valid", { expirationTtl: 86400 });
        
        return response({ success: true, token });
      }

      return response({ error: "Falsches Passwort" }, 401);
    }

    // 3. POST: SPEICHERN (Token Check)
    if (request.method === "POST" && url.searchParams.get("action") === "save") {
      const token = request.headers.get("Authorization");
      if (!token || !(await env.WEBSITE_CONTENT.get(token))) {
        return response({ error: "Session abgelaufen" }, 401);
      }
      
      const newData = await request.json();
      await env.WEBSITE_CONTENT.put("site_data", JSON.stringify(newData));
      return response({ success: true });
    }

    return response({ error: "Methode nicht erlaubt" }, 405);

  } catch (err) {
    return response({ error: "Crash", details: err.message }, 500);
  }
}
