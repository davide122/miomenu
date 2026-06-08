import { ResetPasswordForm } from "./reset-password-form"

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  const token = typeof sp.token === "string" ? sp.token : ""
  return <ResetPasswordForm token={token} />
}
