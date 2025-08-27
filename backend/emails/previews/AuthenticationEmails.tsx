import PasswordResetEmail from "../PasswordResetEmail";
import EmailVerificationEmail from "../EmailVerificationEmail";

export function passwordReset() {
  return (
    <PasswordResetEmail
      userName="John Doe"
      resetUrl="https://pos.vevurn.com/reset-password?token=abc123def456"
    />
  );
}

export function emailVerification() {
  return (
    <EmailVerificationEmail
      userName="Jane Smith"
      verificationUrl="https://pos.vevurn.com/verify-email?token=xyz789uvw012"
    />
  );
}

export function emailVerificationNewUser() {
  return (
    <EmailVerificationEmail
      userName="Alex Johnson"
      verificationUrl="https://pos.vevurn.com/verify-email?token=new456user789"
    />
  );
}
