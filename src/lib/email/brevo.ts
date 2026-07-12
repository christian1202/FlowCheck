export async function sendQrEmail(
  toEmail: string,
  toName: string,
  eventName: string,
  qrBase64: string,
  textFallback: string
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY is missing');
    return false;
  }

  const payload = {
    sender: {
      name: 'FlowCheck',
      email: 'noreply@flowcheck.app', // Should ideally match your verified sender domain
    },
    to: [
      {
        email: toEmail,
        name: toName,
      },
    ],
    subject: `Your Ticket for ${eventName}`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
        <h2>You're registered for ${eventName}!</h2>
        <p>Hi ${toName},</p>
        <p>Please present the QR code below at the event entrance.</p>
        
        <div style="margin: 30px 0;">
          <img src="cid:qrcodetoken" alt="Your Ticket QR Code" style="width: 250px; height: 250px;" />
        </div>
        
        <p style="color: #666; font-size: 12px;">If the image doesn't load, your ticket ID is: <strong>${textFallback}</strong></p>
      </div>
    `,
    attachment: [
      {
        content: qrBase64,
        name: 'ticket.png',
        contentId: 'qrcodetoken',
      },
    ],
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Brevo API Error:', res.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fetch error calling Brevo:', error);
    return false;
  }
}
