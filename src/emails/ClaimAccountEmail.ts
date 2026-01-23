/**
 * Claim Account Email Template
 *
 * Sent to existing members (imported from ClubPlanner) to activate their account
 * in the new system. Clean white design matching Reconnect brand.
 */

// Brand colors - Light theme
const colors = {
  primary: '#FBBF24', // Yellow/Gold - CTA buttons
  primaryHover: '#F59E0B',
  white: '#FFFFFF',
  background: '#F9FAFB', // Light gray background
  text: '#111827', // Dark text
  textMuted: '#6B7280', // Gray text
  textLight: '#9CA3AF', // Light gray text
  border: '#E5E7EB',
}

interface ClaimAccountEmailOptions {
  firstName: string
  email: string
  memberNumber?: number | string
  activationUrl: string
  expiresInHours?: number
}

/**
 * Generate the Claim Account email HTML
 */
export function generateClaimAccountEmail(options: ClaimAccountEmailOptions): string {
  const {
    firstName,
    email,
    memberNumber,
    activationUrl,
    expiresInHours = 48
  } = options

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Activeer je Reconnect Account</title>
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
    a { color: ${colors.text}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .content { padding: 32px 24px !important; }
      .header { padding: 24px !important; }
    }
  </style>
</head>
<body style="background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 40px 16px;">

  <!-- Preview Text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${firstName}, activeer je account en krijg toegang tot je trainingshistorie, reserveringen en meer!
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${colors.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header with Logo -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="header" style="padding: 32px 40px; text-align: center; border-bottom: 1px solid ${colors.border};">
              <img src="https://mmagym.be/images/logo-reconnect-dark.png" width="120" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
              <p style="color: ${colors.textLight}; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 12px 0 0;">RECONNECT</p>
            </td>
          </tr>
        </table>

        <!-- Main Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 48px 40px;">

              <!-- Welcome Heading -->
              <h1 style="color: ${colors.text}; font-size: 32px; font-weight: 700; line-height: 1.2; margin: 0 0 16px; text-align: center;">
                Activeer je account
              </h1>

              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                Hallo ${firstName}.
              </p>
              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Je account bij Reconnect staat klaar! 💪
              </p>

              <!-- Info Box: Login Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: ${colors.background}; border-radius: 12px; padding: 20px 24px;">
                    <p style="color: ${colors.textMuted}; font-size: 13px; font-weight: 600; margin: 0 0 8px;">
                      Jouw inloggegevens:
                    </p>
                    <p style="color: ${colors.text}; font-size: 18px; font-weight: 600; margin: 0;">
                      ${memberNumber ? `${memberNumber} of ` : ''}<span style="color: ${colors.text};">${email}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Klik hieronder om je wachtwoord in te stellen en toegang te krijgen tot je trainingshistorie, reserveringen en QR-code.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px;">
                <tr>
                  <td style="background-color: ${colors.primary}; border-radius: 50px;">
                    <a href="${activationUrl}" style="display: inline-block; padding: 16px 48px; color: ${colors.text}; font-size: 16px; font-weight: 600; text-decoration: none;">
                      Account Activeren
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center; margin: 0 0 48px;">
                Deze link is ${expiresInHours} uur geldig
              </p>

              <!-- Divider -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid ${colors.border}; padding-top: 32px;"></td>
                </tr>
              </table>

              <!-- What You Get Section -->
              <h2 style="color: ${colors.text}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
                Dit krijg je met je account
              </h2>

              <!-- Feature 1 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="40" valign="top">
                    <div style="background-color: ${colors.primary}; border-radius: 50%; width: 28px; height: 28px; line-height: 28px; text-align: center; color: ${colors.text}; font-size: 14px; font-weight: 700;">1</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                      Je trainingshistorie
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; margin: 0;">
                      Bekijk je check-ins, gordel voortgang en statistieken
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Feature 2 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="40" valign="top">
                    <div style="background-color: ${colors.primary}; border-radius: 50%; width: 28px; height: 28px; line-height: 28px; text-align: center; color: ${colors.text}; font-size: 14px; font-weight: 700;">2</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                      Reserveer voor lessen
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; margin: 0;">
                      Schrijf je in voor je favoriete trainingen
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Feature 3 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td width="40" valign="top">
                    <div style="background-color: ${colors.primary}; border-radius: 50%; width: 28px; height: 28px; line-height: 28px; text-align: center; color: ${colors.text}; font-size: 14px; font-weight: 700;">3</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                      QR-code toegang
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; margin: 0;">
                      Check-in bij de gym met je persoonlijke QR-code
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid ${colors.border};">

              <!-- Company Info -->
              <p style="color: ${colors.textMuted}; font-size: 13px; line-height: 1.6; margin: 0 0 12px;">
                Reconnect Academy | Erembodegem­straat 31/16, 9300 Aalst
              </p>

              <!-- Social Links -->
              <p style="margin: 0 0 12px;">
                <a href="https://instagram.com/reconnect.academy" style="color: ${colors.textMuted}; font-size: 13px; text-decoration: underline;">Instagram</a>
                <span style="color: ${colors.textLight}; margin: 0 8px;">•</span>
                <a href="https://facebook.com/reconnectacademy" style="color: ${colors.textMuted}; font-size: 13px; text-decoration: underline;">Facebook</a>
                <span style="color: ${colors.textLight}; margin: 0 8px;">•</span>
                <a href="https://mmagym.be" style="color: ${colors.textMuted}; font-size: 13px; text-decoration: underline;">Website</a>
              </p>

              <!-- Legal -->
              <p style="color: ${colors.textLight}; font-size: 12px; line-height: 1.6; margin: 0;">
                Je ontvangt deze email omdat je lid bent van Reconnect Academy.
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

export default generateClaimAccountEmail
