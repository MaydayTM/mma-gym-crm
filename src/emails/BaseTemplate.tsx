import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BaseTemplateProps {
  previewText: string
  recipientName?: string
  heading?: string
  children: React.ReactNode
}

// Brand colors
const colors = {
  primary: '#F59E0B', // Amber/Gold - Reconnect brand
  dark: '#171717',
  darkGray: '#262626',
  gray: '#525252',
  lightGray: '#A3A3A3',
  white: '#FAFAFA',
}

export function BaseTemplate({
  previewText,
  recipientName,
  heading,
  children,
}: BaseTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header with Logo */}
          <Section style={styles.header}>
            <Img
              src="https://mmagym.be/images/logo-reconnect.png"
              width="180"
              height="auto"
              alt="Reconnect Academy"
              style={styles.logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={styles.content}>
            {/* Greeting */}
            {recipientName && (
              <Text style={styles.greeting}>
                Hoi {recipientName},
              </Text>
            )}

            {/* Optional Heading */}
            {heading && (
              <Heading style={styles.heading}>{heading}</Heading>
            )}

            {/* Dynamic Content */}
            <div style={styles.bodyText}>
              {children}
            </div>

            {/* Signature */}
            <Text style={styles.signature}>
              Met sportieve groet,
              <br />
              <strong>Team Reconnect Academy</strong>
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Footer */}
          <Section style={styles.footer}>
            {/* Contact Info */}
            <Text style={styles.footerText}>
              Reconnect Academy | MMA & BJJ Gym
              <br />
              Aalst, België
            </Text>

            {/* Social Links */}
            <Section style={styles.socialLinks}>
              <Link href="https://instagram.com/reconnect.academy" style={styles.socialLink}>
                Instagram
              </Link>
              <Text style={styles.socialDivider}>•</Text>
              <Link href="https://facebook.com/reconnectacademy" style={styles.socialLink}>
                Facebook
              </Link>
              <Text style={styles.socialDivider}>•</Text>
              <Link href="https://mmagym.be" style={styles.socialLink}>
                Website
              </Link>
            </Section>

            {/* Legal */}
            <Text style={styles.legal}>
              Je ontvangt deze email omdat je lid bent van Reconnect Academy.
              <br />
              <Link href="https://mmagym.be/uitschrijven" style={styles.unsubscribe}>
                Uitschrijven
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Reusable text component for email body
export function EmailText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bodyText}>{children}</Text>
}

// Reusable button component
export function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={styles.buttonContainer}>
      <Link href={href} style={styles.button}>
        {children}
      </Link>
    </Section>
  )
}

// Reusable info box
export function EmailInfoBox({ children }: { children: React.ReactNode }) {
  return (
    <Section style={styles.infoBox}>
      {children}
    </Section>
  )
}

const styles = {
  body: {
    backgroundColor: colors.dark,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    margin: 0,
    padding: '40px 0',
  },
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: '16px',
    margin: '0 auto',
    maxWidth: '600px',
    overflow: 'hidden' as const,
  },
  header: {
    backgroundColor: colors.dark,
    padding: '32px 40px',
    textAlign: 'center' as const,
  },
  logo: {
    margin: '0 auto',
  },
  content: {
    padding: '40px',
  },
  greeting: {
    color: colors.white,
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 24px',
  },
  heading: {
    color: colors.primary,
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '32px',
    margin: '0 0 24px',
  },
  bodyText: {
    color: colors.lightGray,
    fontSize: '15px',
    lineHeight: '26px',
    margin: '0 0 16px',
  },
  signature: {
    color: colors.lightGray,
    fontSize: '15px',
    lineHeight: '24px',
    marginTop: '32px',
  },
  divider: {
    borderColor: '#404040',
    borderTopWidth: '1px',
    margin: '0',
  },
  footer: {
    padding: '32px 40px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: colors.gray,
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0 0 16px',
  },
  socialLinks: {
    marginBottom: '16px',
  },
  socialLink: {
    color: colors.primary,
    fontSize: '13px',
    textDecoration: 'none',
  },
  socialDivider: {
    color: colors.gray,
    display: 'inline',
    margin: '0 8px',
    fontSize: '13px',
  },
  legal: {
    color: colors.gray,
    fontSize: '11px',
    lineHeight: '18px',
    margin: 0,
  },
  unsubscribe: {
    color: colors.gray,
    textDecoration: 'underline',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '24px 0',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: '8px',
    color: colors.dark,
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 24px',
    textDecoration: 'none',
  },
  infoBox: {
    backgroundColor: '#1F1F1F',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '16px 0',
  },
}

export default BaseTemplate
