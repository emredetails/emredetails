export async function onRequestPost({ request, env }) {
  try {
    const { name, email, vehicle, service, message } = await request.json();

    // Validierung
    if (!name || !email || !message) {
      return new Response("Fehlende Daten", { status: 400 });
    }

    // Email an Dich (Admin)
    const adminEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "EmreDetails Website <onboarding@resend.dev>", // Oder verifizierte Domain
        to: "info@emredetails.de", 
        subject: `Neue Anfrage von ${name} (${service || 'Allgemein'})`,
        html: `
          <h3>Neue Kontaktanfrage</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Fahrzeug:</strong> ${vehicle || 'Keine Angabe'}</p>
          <p><strong>Leistung:</strong> ${service || 'Keine Angabe'}</p>
          <hr>
          <p><strong>Nachricht:</strong><br>${message.replace(/\n/g, '<br>')}</p>
        `
      })
    });

    if (adminEmail.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      const errData = await adminEmail.text();
      console.log(errData);
      return new Response("Fehler bei Resend", { status: 500 });
    }

  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
