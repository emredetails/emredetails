export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const response = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    // 1. DATEN LADEN (GET)
    if (request.method === "GET") {
      const data = await env.WEBSITE_CONTENT.get("site_data", { type: "json" });
      return response(data || {});
    }

    // 2. LOGIN (POST)
    if (request.method === "POST" && url.searchParams.get("action") === "login") {
      const { email } = await request.json();
      
      // Security Check
      if (email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
        return response({ error: "Keine Berechtigung" }, 403);
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await env.WEBSITE_CONTENT.put(`auth_${email}`, code, { expirationTtl: 900 }); // 15 Min

      // Resend API
      const resend = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Admin Zugang <info@emredetails.de>",
          to: email,
          subject: "Dein Login Code",
          html: `<p>Code: <strong>${code}</strong></p>`
        })
      });

      if (!resend.ok) return response({ error: "Mail Fehler" }, 500);
      return response({ success: true });
    }

    // 3. VERIFY (POST)
    if (request.method === "POST" && url.searchParams.get("action") === "verify") {
      const { email, code } = await request.json();
      const storedCode = await env.WEBSITE_CONTENT.get(`auth_${email}`);

      if (storedCode && storedCode === code) {
        await env.WEBSITE_CONTENT.delete(`auth_${email}`);
        const token = "session_" + crypto.randomUUID();
        await env.WEBSITE_CONTENT.put(token, "valid", { expirationTtl: 86400 }); // 24h
        return response({ success: true, token });
      }
      return response({ error: "Code falsch" }, 401);
    }

    // 4. SPEICHERN (POST)
    if (request.method === "POST" && url.searchParams.get("action") === "save") {
      const token = request.headers.get("Authorization");
      const isValid = await env.WEBSITE_CONTENT.get(token);
      
      if (!isValid) return response({ error: "Nicht eingeloggt" }, 401);

      const newData = await request.json();
      await env.WEBSITE_CONTENT.put("site_data", JSON.stringify(newData));
      return response({ success: true });
    }

    return response({ error: "Methode nicht erlaubt" }, 405);

  } catch (err) {
    return response({ error: err.message }, 500);
  }
}
