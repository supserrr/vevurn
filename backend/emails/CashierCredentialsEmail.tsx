import {
  MjmlColumn,
  MjmlSection,
  MjmlWrapper,
  MjmlText,
  MjmlTable
} from "@faire/mjml-react";
import { BaseLayout } from "./components/BaseLayout";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Button } from "./components/Button";
import { Text } from "./components/Text";
import { theme } from "./theme";

interface CashierCredentialsEmailProps {
  name: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export default function CashierCredentialsEmail({ 
  name, 
  email, 
  tempPassword, 
  loginUrl 
}: CashierCredentialsEmailProps) {
  return (
    <BaseLayout>
      <Header>
        <MjmlText align="center" fontSize="28px" fontWeight="bold" color={theme.colors.white}>
          🎉 Welcome to Vevurn POS
        </MjmlText>
        <MjmlText align="center" fontSize="16px" color={theme.colors.white}>
          You've been added as a cashier
        </MjmlText>
      </Header>

      <MjmlWrapper>
        <MjmlSection backgroundColor={theme.colors.gray100} padding="30px">
          <MjmlColumn>
            <Text fontSize="20px" fontWeight="bold" color={theme.colors.gray900}>
              Hi {name},
            </Text>

            <Text>
              You have been added as a cashier to the Vevurn POS system. Here are your login credentials:
            </Text>

            <MjmlSection 
              backgroundColor={theme.colors.white} 
              padding="20px" 
              borderRadius="8px"
              borderLeft="4px solid #2563eb"
            >
              <MjmlColumn>
                <Text fontSize="18px" fontWeight="bold" color={theme.colors.gray900}>
                  🔑 Your Login Credentials
                </Text>

                <MjmlTable>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Email:</td>
                    <td style={{ padding: "8px 0" }}>{email}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Temporary Password:</td>
                    <td style={{ 
                      padding: "8px 0", 
                      fontFamily: "monospace", 
                      backgroundColor: "#e5e7eb", 
                      padding: "4px 8px", 
                      borderRadius: "4px" 
                    }}>
                      {tempPassword}
                    </td>
                  </tr>
                </MjmlTable>
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
                  ⚠️ Important Security Notice:
                </Text>
                <MjmlText>
                  <ul style={{ color: "#dc2626", paddingLeft: "20px", margin: "10px 0" }}>
                    <li style={{ margin: "5px 0", fontWeight: "500" }}>You must change this password on your first login</li>
                    <li style={{ margin: "5px 0", fontWeight: "500" }}>Do not share these credentials with anyone</li>
                    <li style={{ margin: "5px 0", fontWeight: "500" }}>This temporary password will expire in 7 days</li>
                    <li style={{ margin: "5px 0", fontWeight: "500" }}>Keep your login credentials secure at all times</li>
                  </ul>
                </MjmlText>
              </MjmlColumn>
            </MjmlSection>

            <MjmlSection padding="30px 0" align="center">
              <MjmlColumn>
                <Button href={loginUrl}>
                  🚀 Login to Vevurn POS
                </Button>
              </MjmlColumn>
            </MjmlSection>

            <MjmlSection 
              backgroundColor={theme.colors.white} 
              padding="20px" 
              borderRadius="8px"
              borderLeft="4px solid #10b981"
            >
              <MjmlColumn>
                <Text fontSize="16px" fontWeight="bold" color="#10b981">
                  What's Next?
                </Text>
                <MjmlText>
                  <ol style={{ color: "#374151", paddingLeft: "20px", margin: "10px 0" }}>
                    <li style={{ margin: "5px 0" }}>Click the login button above</li>
                    <li style={{ margin: "5px 0" }}>Enter your email and temporary password</li>
                    <li style={{ margin: "5px 0" }}>Change your password when prompted</li>
                    <li style={{ margin: "5px 0" }}>Start using the POS system!</li>
                  </ol>
                </MjmlText>
              </MjmlColumn>
            </MjmlSection>

            <Text>
              If you have any questions or need help getting started, please contact your manager or system administrator.
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
          This is an automated message. Please do not reply to this email.<br/>
          © {new Date().getFullYear()} Vevurn POS. All rights reserved.
        </Text>
      </Footer>
    </BaseLayout>
  );
}
