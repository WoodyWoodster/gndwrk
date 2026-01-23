import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface CardReadyEmailProps {
  firstName: string;
  dashboardUrl: string;
}

export default function CardReadyEmail({
  firstName = "there",
  dashboardUrl = "https://gndwrk.com/dashboard",
}: CardReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Gndwrk debit card is ready!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={logoText}>Gndwrk</Heading>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Your debit card is ready!</Heading>

            <Text style={paragraph}>
              Hey {firstName},
            </Text>

            <Text style={paragraph}>
              Great news! Your identity verification is complete and your virtual
              debit card has been created. You can now view your card details and
              start making purchases.
            </Text>

            <Section style={buttonSection}>
              <Link href={dashboardUrl} style={button}>
                View Card Details
              </Link>
            </Section>

            <Text style={paragraph}>
              Your card is linked to your Spend bucket with the following limits:
            </Text>

            <Section style={limitsSection}>
              <Text style={limitItem}>Daily limit: $500</Text>
              <Text style={limitItem}>Monthly limit: $2,000</Text>
            </Section>

            <Text style={paragraph}>
              You can manage spending limits and order a physical card from your
              dashboard at any time.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Gndwrk - Teaching kids smart money habits
            </Text>
            <Text style={footerText}>
              <Link href="https://gndwrk.com" style={footerLink}>
                gndwrk.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f8fafc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logoText = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1a1a2e",
  margin: "0",
};

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "40px 32px",
  border: "1px solid #e2e8f0",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a2e",
  marginTop: "0",
  marginBottom: "24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  margin: "16px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1a1a2e",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "14px 28px",
  display: "inline-block",
};

const limitsSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "16px 0",
};

const limitItem = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "4px 0",
};

const footer = {
  textAlign: "center" as const,
  marginTop: "32px",
};

const footerText = {
  fontSize: "13px",
  color: "#9ca3af",
  margin: "4px 0",
};

const footerLink = {
  color: "#6b7280",
  textDecoration: "underline",
};
