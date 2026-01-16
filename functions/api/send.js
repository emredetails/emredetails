export async function onRequestPost({ request, env }) {
  try {
    // WICHTIG: Hier muss 'telefon' mit in der Klammer stehen!
    const { name, email, vehicle, service, message, telefon } = await request.json();

    // Validierung (Telefon ist optional, daher hier nicht zwingend geprüft)
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Bitte alle Pflichtfelder ausfüllen." }), { status: 400 });
    }

    // HTML Template für die E-Mail
    const emailHtml = `
      <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #0B1221; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Neue Anfrage: ${service || 'Allgemein'}</h2>
          </div>
          <div style="padding: 30px; color: #333;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Kunde:</p>
            <p style="margin: 0 0 20px; font-weight: bold; font-size: 18px;">${name}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><b><a href="mailto:${email}" style="color:#0B1221; text-decoration:none;">${email}</a></b></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Telefon:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><b><a href="tel:${telefon}" style="color:#0B1221; text-decoration:none;">${telefon || '-'}</a></b></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Fahrzeug:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${vehicle || '-'}</td>
              </tr>
            </table>

            <p style="margin: 0 0 5px; font-size: 14px; color: #666;">Nachricht:</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; line-height: 1.5;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="background-color: #eee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            Gesendet über EmreDetails Webseite
          </div>
        </div>
      </div>
    `;

    // Senden an Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'EmreDetails Web <onboarding@resend.dev>', // Oder deine verifizierte Domain
        to: 'info@emredetails.de', 
        subject: `Anfrage von ${name}`,
        html: emailHtml
      })
    });

    if (res.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: errText }), { status: 500 });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
