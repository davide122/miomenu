import { ResetPasswordForm } from "./reset-password-form"

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams?: { token?: string | string[] }
}) {
  const token = typeof searchParams?.token === "string" ? searchParams.token : ""
  return <ResetPasswordForm token={token} />
}
