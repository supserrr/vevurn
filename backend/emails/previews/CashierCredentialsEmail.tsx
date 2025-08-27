import CashierCredentialsEmail from "../CashierCredentialsEmail";

export function cashierCredentialsNew() {
  return (
    <CashierCredentialsEmail
      name="John Doe"
      email="john.doe@vevurn.com"
      tempPassword="TempPass123!"
      loginUrl="https://pos.vevurn.com/login"
    />
  );
}

export function cashierCredentialsExisting() {
  return (
    <CashierCredentialsEmail
      name="Sarah Wilson"
      email="sarah.wilson@vevurn.com"
      tempPassword="NewTemp456@"
      loginUrl="https://pos.vevurn.com/login"
    />
  );
}
