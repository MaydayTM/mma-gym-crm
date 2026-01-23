/**
 * Password Reset Email Template
 *
 * Use this template in Supabase Dashboard > Authentication > Email Templates > Reset Password
 * Copy the HTML output and paste it in the template editor.
 */

// Brand colors
const colors = {
  primary: '#FBBF24',
  dark: '#0A0A0A',
  darkGray: '#171717',
  mediumGray: '#262626',
  gray: '#525252',
  lightGray: '#A3A3A3',
  white: '#FAFAFA',
}

/**
 * Password Reset Email HTML
 *
 * Variables available in Supabase templates:
 * - {{ .Email }} - User's email
 * - {{ .Token }} - Reset token (use in URL)
 * - {{ .TokenHash }} - Hashed token
 * - {{ .SiteURL }} - Your site URL
 * - {{ .ConfirmationURL }} - Full confirmation URL
 * - {{ .RedirectTo }} - Redirect URL after action
 */
export const passwordResetEmailTemplate = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset je wachtwoord</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${colors.primary}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="background-color: ${colors.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 40px 16px;">

  <div style="display: none; max-height: 0; overflow: hidden;">
    Reset je wachtwoord voor Reconnect Academy
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${colors.darkGray}; border-radius: 24px; overflow: hidden;">

        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background-color: ${colors.dark}; padding: 32px 40px; text-align: center;">
              <img src="https://mmagym.be/images/logo-reconnect.png" width="160" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 40px;">

              <h1 style="color: ${colors.white}; font-size: 24px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
                Wachtwoord resetten
              </h1>

              <p style="color: ${colors.lightGray}; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Je hebt een wachtwoord reset aangevraagd voor je Reconnect Academy account. Klik op onderstaande knop om een nieuw wachtwoord in te stellen.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px;">
                <tr>
                  <td style="background-color: ${colors.primary}; border-radius: 50px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.4);">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; color: ${colors.dark}; font-size: 16px; font-weight: 700; text-decoration: none;">
                      Wachtwoord Resetten
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: ${colors.gray}; font-size: 13px; text-align: center; margin: 0 0 32px;">
                Deze link is 1 uur geldig
              </p>

              <!-- Security Notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: ${colors.mediumGray}; border-radius: 12px; padding: 16px 20px;">
                    <p style="color: ${colors.lightGray}; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong style="color: ${colors.white};">Heb je dit niet aangevraagd?</strong><br>
                      Negeer deze email dan. Je wachtwoord blijft ongewijzigd.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: ${colors.lightGray}; font-size: 15px; line-height: 1.6; margin: 32px 0 0;">
                Met sportieve groet,<br>
                <strong style="color: ${colors.white};">Team Reconnect Academy</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="border-top: 1px solid #333;"></td>
          </tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="color: ${colors.gray}; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
                Reconnect Academy | MMA & BJJ Gym<br>
                Aalst, België
              </p>
              <p style="margin: 0 0 16px;">
                <a href="https://instagram.com/reconnect.academy" style="color: ${colors.primary}; font-size: 13px;">Instagram</a>
                <span style="color: ${colors.gray}; margin: 0 8px;">•</span>
                <a href="https://facebook.com/reconnectacademy" style="color: ${colors.primary}; font-size: 13px;">Facebook</a>
                <span style="color: ${colors.gray}; margin: 0 8px;">•</span>
                <a href="https://mmagym.be" style="color: ${colors.primary}; font-size: 13px;">Website</a>
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

/**
 * Magic Link Email HTML
 */
export const magicLinkEmailTemplate = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inloggen bij Reconnect</title>
  <style>
    body { margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    a { color: ${colors.primary}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="background-color: ${colors.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 16px;">

  <div style="display: none; max-height: 0; overflow: hidden;">
    Je magic link om in te loggen bij Reconnect Academy
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${colors.darkGray}; border-radius: 24px; overflow: hidden;">

        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background-color: ${colors.dark}; padding: 32px 40px; text-align: center;">
              <img src="https://mmagym.be/images/logo-reconnect.png" width="160" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 40px;">

              <h1 style="color: ${colors.white}; font-size: 24px; font-weight: 700; margin: 0 0 24px; text-align: center;">
                Inloggen
              </h1>

              <p style="color: ${colors.lightGray}; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Klik op onderstaande knop om direct in te loggen. Geen wachtwoord nodig!
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px;">
                <tr>
                  <td style="background-color: ${colors.primary}; border-radius: 50px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.4);">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; color: ${colors.dark}; font-size: 16px; font-weight: 700; text-decoration: none;">
                      Inloggen
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: ${colors.gray}; font-size: 13px; text-align: center; margin: 0 0 32px;">
                Deze link is 1 uur geldig en kan maar één keer gebruikt worden
              </p>

              <p style="color: ${colors.lightGray}; font-size: 15px; margin: 32px 0 0;">
                Met sportieve groet,<br>
                <strong style="color: ${colors.white};">Team Reconnect Academy</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td style="border-top: 1px solid #333;"></td></tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="color: ${colors.gray}; font-size: 13px; margin: 0 0 16px;">
                Reconnect Academy | MMA & BJJ Gym | Aalst, België
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

/**
 * Invite User Email HTML (for new users invited by admin)
 */
export const inviteUserEmailTemplate = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Je bent uitgenodigd voor Reconnect Academy</title>
  <style>
    body { margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    a { color: ${colors.primary}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="background-color: ${colors.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 16px;">

  <div style="display: none; max-height: 0; overflow: hidden;">
    Welkom bij Reconnect Academy! Activeer je account.
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${colors.darkGray}; border-radius: 24px; overflow: hidden;">

        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background-color: ${colors.dark}; padding: 32px 40px; text-align: center;">
              <img src="https://mmagym.be/images/logo-reconnect.png" width="160" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 40px;">

              <h1 style="color: ${colors.white}; font-size: 24px; font-weight: 700; margin: 0 0 24px; text-align: center;">
                Welkom bij Reconnect! 💪
              </h1>

              <p style="color: ${colors.lightGray}; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Je bent uitgenodigd om lid te worden van Reconnect Academy. Klik hieronder om je account te activeren en je wachtwoord in te stellen.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px;">
                <tr>
                  <td style="background-color: ${colors.primary}; border-radius: 50px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.4);">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; color: ${colors.dark}; font-size: 16px; font-weight: 700; text-decoration: none;">
                      Account Activeren
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: ${colors.gray}; font-size: 13px; text-align: center; margin: 0 0 32px;">
                Deze uitnodiging is 7 dagen geldig
              </p>

              <p style="color: ${colors.lightGray}; font-size: 15px; margin: 32px 0 0;">
                Tot op de mat!<br>
                <strong style="color: ${colors.white};">Team Reconnect Academy</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td style="border-top: 1px solid #333;"></td></tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="color: ${colors.gray}; font-size: 13px; margin: 0 0 16px;">
                Reconnect Academy | MMA & BJJ Gym | Aalst, België
              </p>
              <p style="margin: 0;">
                <a href="https://instagram.com/reconnect.academy" style="color: ${colors.primary}; font-size: 13px;">Instagram</a>
                <span style="color: ${colors.gray}; margin: 0 8px;">•</span>
                <a href="https://mmagym.be" style="color: ${colors.primary}; font-size: 13px;">Website</a>
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
