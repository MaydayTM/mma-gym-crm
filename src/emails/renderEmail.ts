/**
 * Email HTML Template Generator
 *
 * Since Edge Functions can't run React, we generate the HTML server-side.
 * This module provides pre-built HTML templates that match our React Email design.
 */

// Brand colors
const colors = {
  primary: '#F59E0B',
  dark: '#171717',
  darkGray: '#262626',
  gray: '#525252',
  lightGray: '#A3A3A3',
  white: '#FAFAFA',
}

interface EmailOptions {
  recipientName?: string
  subject: string
  body: string
  ctaText?: string
  ctaUrl?: string
}

/**
 * Generate HTML email with Reconnect Academy branding
 */
export function generateEmailHtml(options: EmailOptions): string {
  const { recipientName, subject, body, ctaText, ctaUrl } = options

  // Convert plain text body to HTML paragraphs
  const bodyHtml = body
    .split('\n\n')
    .map(paragraph => `<p style="color: ${colors.lightGray}; font-size: 15px; line-height: 26px; margin: 0 0 16px;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')

  // Optional CTA button
  const ctaHtml = ctaText && ctaUrl ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 8px;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 12px 24px; color: ${colors.dark}; font-size: 14px; font-weight: 600; text-decoration: none;">${ctaText}</a>
        </td>
      </tr>
    </table>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${colors.primary}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .content { padding: 24px !important; }
    }
  </style>
</head>
<body style="background-color: ${colors.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 40px 0;">

  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${subject}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${colors.darkGray}; border-radius: 16px; overflow: hidden;">

        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background-color: ${colors.dark}; padding: 32px 40px; text-align: center;">
              <img src="https://mmagym.be/images/logo-reconnect.png" width="180" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 40px;">

              ${recipientName ? `
              <!-- Greeting -->
              <p style="color: ${colors.white}; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                Hoi ${recipientName},
              </p>
              ` : ''}

              <!-- Body -->
              ${bodyHtml}

              <!-- CTA Button -->
              ${ctaHtml}

              <!-- Signature -->
              <p style="color: ${colors.lightGray}; font-size: 15px; line-height: 24px; margin-top: 32px;">
                Met sportieve groet,<br>
                <strong style="color: ${colors.white};">Team Reconnect Academy</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="border-top: 1px solid #404040;"></td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 32px 40px; text-align: center;">

              <!-- Company Info -->
              <p style="color: ${colors.gray}; font-size: 13px; line-height: 20px; margin: 0 0 16px;">
                Reconnect Academy | MMA & BJJ Gym<br>
                Aalst, België
              </p>

              <!-- Social Links -->
              <p style="margin: 0 0 16px;">
                <a href="https://instagram.com/reconnect.academy" style="color: ${colors.primary}; font-size: 13px;">Instagram</a>
                <span style="color: ${colors.gray}; margin: 0 8px;">•</span>
                <a href="https://facebook.com/reconnectacademy" style="color: ${colors.primary}; font-size: 13px;">Facebook</a>
                <span style="color: ${colors.gray}; margin: 0 8px;">•</span>
                <a href="https://mmagym.be" style="color: ${colors.primary}; font-size: 13px;">Website</a>
              </p>

              <!-- Legal -->
              <p style="color: ${colors.gray}; font-size: 11px; line-height: 18px; margin: 0;">
                Je ontvangt deze email omdat je lid bent van Reconnect Academy.<br>
                <a href="https://mmagym.be/uitschrijven" style="color: ${colors.gray}; text-decoration: underline;">Uitschrijven</a>
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`.trim()
}

export default generateEmailHtml
