import {
  MjmlColumn,
  MjmlSection,
  MjmlWrapper,
  MjmlButton,
  MjmlText,
  MjmlDivider,
  MjmlTable
} from "@faire/mjml-react";
import { BaseLayout } from "./components/BaseLayout";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Button } from "./components/Button";
import { Text } from "./components/Text";
import { theme } from "./theme";

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountDue: number;
  status: string;
}

interface InvoiceEmailProps {
  recipientName: string;
  invoice: InvoiceData;
}

export default function InvoiceEmail({ recipientName, invoice }: InvoiceEmailProps) {
  return (
    <BaseLayout>
      <Header>
        <MjmlText align="center" fontSize="28px" fontWeight="bold" color={theme.colors.white}>
          VEVURN ACCESSORIES
        </MjmlText>
        <MjmlText align="center" fontSize="16px" color={theme.colors.white}>
          Your Invoice is Ready
        </MjmlText>
      </Header>

      <MjmlWrapper>
        <MjmlSection backgroundColor={theme.colors.gray100} padding="30px">
          <MjmlColumn>
            <Text fontSize="20px" fontWeight="bold" color={theme.colors.gray900}>
              Hello {recipientName},
            </Text>

            <Text>
              Thank you for your purchase! Please find your invoice attached to this email.
            </Text>

            <MjmlSection backgroundColor={theme.colors.white} padding="20px" borderRadius="8px">
              <MjmlColumn>
                <Text fontSize="18px" fontWeight="bold" color={theme.colors.gray900}>
                  Invoice Details:
                </Text>

                <MjmlTable>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Invoice Number:</td>
                    <td style={{ padding: "8px 0" }}>{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Issue Date:</td>
                    <td style={{ padding: "8px 0" }}>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Due Date:</td>
                    <td style={{ padding: "8px 0" }}>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Total Amount:</td>
                    <td style={{ padding: "8px 0" }}>RWF {Number(invoice.totalAmount).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Amount Due:</td>
                    <td style={{ padding: "8px 0" }}>RWF {Number(invoice.amountDue).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Status:</td>
                    <td style={{ padding: "8px 0" }}>{invoice.status}</td>
                  </tr>
                </MjmlTable>
              </MjmlColumn>
            </MjmlSection>

            <Text>
              If you have any questions about this invoice, please don't hesitate to contact us.
            </Text>

            <Text fontWeight="bold">
              Payment can be made via:
            </Text>

            <MjmlText>
              <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                <li style={{ margin: "5px 0" }}>Mobile Money (MTN MoMo, Airtel Money)</li>
                <li style={{ margin: "5px 0" }}>Bank Transfer</li>
                <li style={{ margin: "5px 0" }}>Cash at our store</li>
              </ul>
            </MjmlText>
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
