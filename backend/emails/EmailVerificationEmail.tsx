import {
  MjmlColumn,
  MjmlSection,
  MjmlWrapper,
  MjmlText
} from "@faire/mjml-react";
import { BaseLayout } from "./components/BaseLayout";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Button } from "./components/Button";
import { Text } from "./components/Text";
import { theme } from "./theme";

interface EmailVerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

export default function EmailVerificationEmail({ userName, verificationUrl }: EmailVerificationEmailProps) {
  return (
    <BaseLayout>
      <Header>
        <MjmlText align="center" fontSize="28px" fontWeight="bold" color={theme.colors.white}>
          VEVURN POS
        </MjmlText>
        <MjmlText align="center" fontSize="16px" color={theme.colors.white}>
          Verify Your Email Address
        </MjmlText>
      </Header>

      <MjmlWrapper>
        <MjmlSection backgroundColor={theme.colors.gray100} padding="30px">
          <MjmlColumn>
            <Text fontSize="20px" fontWeight="bold" color={theme.colors.gray900}>
              Welcome {userName}!
            </Text>

            <Text>
              Thank you for creating your Vevurn POS account. To complete your registration and start using our system, please verify your email address.
            </Text>

            <MjmlSection 
              backgroundColor={theme.colors.white} 
              padding="20px" 
              borderRadius="8px"
              borderLeft="4px solid #10b981"
            >
              <MjmlColumn>
                <Text fontSize="18px" fontWeight="bold" color={theme.colors.gray900}>
                  ✅ Verify Your Email
                </Text>
                <Text>
                  Click the button below to verify your email address and activate your account.
                </Text>
              </MjmlColumn>
            </MjmlSection>

            <MjmlSection padding="30px 0" align="center">
              <MjmlColumn>
                <Button href={verificationUrl} backgroundColor="#10b981">
                  Verify Email Address
                </Button>
              </MjmlColumn>
            </MjmlSection>

            <MjmlSection 
              backgroundColor="#f0fdf4" 
              border="1px solid #bbf7d0" 
              padding="15px" 
              borderRadius="6px"
            >
              <MjmlColumn>
                <Text fontSize="16px" color="#166534" fontWeight="bold">
                  🎉 What's Next?
                </Text>
                <MjmlText>
                  <ol style={{ color: "#166534", paddingLeft: "20px", margin: "10px 0" }}>
                    <li style={{ margin: "5px 0" }}>Click the verification button above</li>
                    <li style={{ margin: "5px 0" }}>Your email will be confirmed instantly</li>
                    <li style={{ margin: "5px 0" }}>Log in to your Vevurn POS account</li>
                    <li style={{ margin: "5px 0" }}>Start managing your business!</li>
                  </ol>
                </MjmlText>
              </MjmlColumn>
            </MjmlSection>

            <Text fontSize="14px" color={theme.colors.gray600}>
              If you're having trouble clicking the button, copy and paste the URL below into your web browser:
            </Text>
            
            <Text fontSize="12px" color={theme.colors.green600} fontFamily="monospace">
              {verificationUrl}
            </Text>

            <Text fontSize="14px" color={theme.colors.gray600}>
              This verification link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email.
            </Text>

            <Text>
              If you have any questions or need assistance, don't hesitate to contact our support team.
            </Text>

            <Text>
              Welcome to Vevurn POS!<br/>
              <strong>The Vevurn Team</strong>
            </Text>
          </MjmlColumn>
        </MjmlSection>
      </MjmlWrapper>

      <Footer>
        <Text align="center" fontSize="12px" color={theme.colors.gray600}>
          This is an automated message. Please do not reply to this email.<br/>
          © {new Date().getFullYear()} Vevurn POS. All rights reserved.
        </Text>
      </Footer>
    </BaseLayout>
  );
}
