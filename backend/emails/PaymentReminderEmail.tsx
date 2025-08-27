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
import { Text } from "./components/Text";
import { theme } from "./theme";

interface InvoiceData {
  invoiceNumber: string;
  dueDate: string;
  amountDue: number;
}

interface PaymentReminderEmailProps {
  recipientName: string;
  invoice: InvoiceData;
  daysOverdue?: number;
}

export default function PaymentReminderEmail({ 
  recipientName, 
  invoice, 
  daysOverdue = 0 
}: PaymentReminderEmailProps) {
  const isOverdue = daysOverdue > 0;
  const statusText = isOverdue 
    ? `${daysOverdue} days overdue` 
    : 'due today';

  return (
    <BaseLayout>
      <Header>
        <MjmlText align="center" fontSize="28px" fontWeight="bold" color={theme.colors.white}>
          VEVURN ACCESSORIES
        </MjmlText>
        <MjmlText align="center" fontSize="16px" color={theme.colors.white}>
          Payment Reminder
        </MjmlText>
      </Header>

      <MjmlWrapper>
        <MjmlSection backgroundColor={theme.colors.gray100} padding="30px">
          <MjmlColumn>
            <Text fontSize="20px" fontWeight="bold" color={theme.colors.gray900}>
              Hello {recipientName},
            </Text>

            <Text>
              This is a friendly reminder that invoice {invoice.invoiceNumber} is {statusText}.
            </Text>

            <MjmlSection 
              backgroundColor={isOverdue ? "#fef2f2" : theme.colors.white} 
              padding="20px" 
              borderRadius="8px"
              borderLeft={isOverdue ? "4px solid #dc2626" : "4px solid #2563eb"}
            >
              <MjmlColumn>
                <Text fontSize="18px" fontWeight="bold" color={theme.colors.gray900}>
                  {isOverdue ? "⚠️ Overdue Invoice" : "💰 Payment Due"}
                </Text>

                <MjmlTable>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Invoice:</td>
                    <td style={{ padding: "8px 0" }}>{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Amount Due:</td>
                    <td style={{ padding: "8px 0", color: isOverdue ? "#dc2626" : "#2563eb", fontWeight: "bold" }}>
                      RWF {Number(invoice.amountDue).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Due Date:</td>
                    <td style={{ padding: "8px 0" }}>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  </tr>
                  {isOverdue && (
                    <tr>
                      <td style={{ padding: "8px 0", fontWeight: "bold", color: "#dc2626" }}>Days Overdue:</td>
                      <td style={{ padding: "8px 0", color: "#dc2626", fontWeight: "bold" }}>{daysOverdue} days</td>
                    </tr>
                  )}
                </MjmlTable>
              </MjmlColumn>
            </MjmlSection>

            <Text>
              Please arrange payment at your earliest convenience.
            </Text>

            {isOverdue && (
              <MjmlSection backgroundColor="#fef2f2" padding="15px" borderRadius="6px" border="1px solid #fecaca">
                <MjmlColumn>
                  <Text fontSize="14px" color="#dc2626" fontWeight="bold">
                    ⚠️ Important Notice:
                  </Text>
                  <Text fontSize="14px" color="#dc2626">
                    This invoice is now overdue. Please contact us immediately if you have any questions or concerns about this payment.
                  </Text>
                </MjmlColumn>
              </MjmlSection>
            )}

            <Text fontWeight="bold">
              Payment Methods:
            </Text>

            <MjmlText>
              <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                <li style={{ margin: "5px 0" }}>📱 Mobile Money (MTN MoMo, Airtel Money)</li>
                <li style={{ margin: "5px 0" }}>🏦 Bank Transfer</li>
                <li style={{ margin: "5px 0" }}>💵 Cash at our store</li>
              </ul>
            </MjmlText>

            <Text>
              Thank you for your prompt attention to this matter.
            </Text>

            <Text>
              Best regards,<br/>
              <strong>Vevurn Accessories Team</strong>
            </Text>
          </MjmlColumn>
        </MjmlSection>
      </MjmlWrapper>

      <Footer>
        <Text align="center" fontSize="14px" color={theme.colors.gray600}>
          <strong>Vevurn Accessories</strong><br/>
          Phone Accessories & Electronics<br/>
          Kigali, Rwanda<br/>
          +250 XXX XXX XXX | support@vevurn.com
        </Text>
      </Footer>
    </BaseLayout>
  );
}
