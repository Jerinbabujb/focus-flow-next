import { Html, Head, Preview, Body, Container, Text, Button, Section } from "@react-email/components"

interface InviteProps {
  groupName: string;
  inviterName: string;
}

export function ExistingUserEmail({ groupName, inviterName }: InviteProps) {
  return (
    <Html>
      <Head />
      <Preview>You have been added to a new shopping group!</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", padding: "40px 0", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <Text style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>You're In!</Text>
          <Text style={{ fontSize: "16px", color: "#475569", lineHeight: "24px" }}>
            <strong>{inviterName}</strong> just added you to the <strong>"{groupName}"</strong> grocery group on Flux.
          </Text>
          <Section style={{ marginTop: "32px" }}>
            <Button href="https://your-domain.com/app" style={{ backgroundColor: "#14b8a6", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
              Open Flux Dashboard
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function NewUserEmail({ groupName, inviterName }: InviteProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} invited you to join Flux!</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", padding: "40px 0", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <Text style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>You've been invited!</Text>
          <Text style={{ fontSize: "16px", color: "#475569", lineHeight: "24px" }}>
            <strong>{inviterName}</strong> wants to shop together with you in the <strong>"{groupName}"</strong> group on Flux. 
            Create an account to start adding items to the list.
          </Text>
          <Section style={{ marginTop: "32px" }}>
            <Button href="https://your-domain.com/auth" style={{ backgroundColor: "#14b8a6", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
              Create Free Account
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}