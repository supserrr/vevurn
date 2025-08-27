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

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
}

export default function PasswordResetEmail({ userName, resetUrl }: PasswordResetEmailProps) {
  return (
    <BaseLayout>
      <Header>
        <MjmlText align="center" fontSize="28px" fontWeight="bold" color={theme.colors.white}>
          VEVURN POS
        </MjmlText>
        <MjmlText align="center" fontSize="16px" color={theme.colors.white}>
          Password Reset Request
        </MjmlText>
      </Header>

      <MjmlWrapper>
        <MjmlSection backgroundColor={theme.colors.gray100} padding="30px">
          <MjmlColumn>
            <Text fontSize="20px" fontWeight="bold" color={theme.colors.gray900}>
              Hello {userName},
            </Text>

            <Text>
              We received a request to reset your password for your Vevurn POS account. If you didn't make this request, you can safely ignore this email.
            </Text>

            <MjmlSection 
              backgroundColor={theme.colors.white} 
              padding="20px" 
              borderRadius="8px"
              borderLeft="4px solid #2563eb"
            >
              <MjmlColumn>
                <Text fontSize="18px" fontWeight="bold" color={theme.colors.gray900}>
                  🔐 Reset Your Password
                </Text>
                <Text>
                  Click the button below to reset your password. This link will expire in 1 hour for security reasons.
                </Text>
              </MjmlColumn>
            </MjmlSection>

            <MjmlSection padding="30px 0" align="center">
              <MjmlColumn>
                <Button href={resetUrl}>
                  Reset Password
                </Button>
              </MjmlColumn>
            </MjmlSection>

            <MjmlSection 
              backgroundColor="#fef2f2" 
              border="1px solid #fecaca" 
              padding="15px" 
              borderRadius="6px"
            >
              <MjmlColumn>
                <Text fontSize="16px" color="#dc2626" fontWeight="bold">
                  🔒 Security Tips:
                </Text>
                <MjmlText>
                  <ul style={{ color: "#dc2626", paddingLeft: "20px", margin: "10px 0" }}>
                    <li style={{ margin: "5px 0" }}>Choose a strong, unique password</li>
                    <li style={{ margin: "5px 0" }}>Don't share your password with anyone</li>
                    <li style={{ margin: "5px 0" }}>Log out when using shared computers</li>
                    <li style={{ margin: "5px 0" }}>Contact support if you notice suspicious activity</li>
                  </ul>
                </MjmlText>
              </MjmlColumn>
            </MjmlSection>

            <Text fontSize="14px" color={theme.colors.gray600}>
              If you're having trouble clicking the button, copy and paste the URL below into your web browser:
            </Text>
            
            <Text fontSize="12px" color={theme.colors.blue600} fontFamily="monospace">
              {resetUrl}
            </Text>

            <Text>
              If you didn't request this password reset, please contact our support team immediately.
            </Text>

            <Text>
              Best regards,<br/>
              <strong>The Vevurn POS Team</strong>
            </Text>
          </MjmlColumn>
        </MjmlSection>
      </MjmlWrapper>

      <Footer>
        <Text align="center" fontSize="12px" color={theme.colors.gray600}>
          This is an automated security message. Please do not reply to this email.<br/>
          © {new Date().getFullYear()} Vevurn POS. All rights reserved.
        </Text>
      </Footer>
    </BaseLayout>
  );
}
