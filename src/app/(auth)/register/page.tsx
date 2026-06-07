import { AuthForm } from "@/components/auth/auth-form"
import { registerAction } from "@/lib/auth/actions"

export default function RegisterPage() {
  return (
    <AuthForm
      title="Crea il tuo account"
      subtitle="Crea l’account e pubblica il tuo menu digitale. Ci metti pochi minuti."
      action={registerAction}
      submitLabel="Crea account"
      secondaryText="Hai già un account? Accedi"
      secondaryHref="/login"
      showName
    />
  )
}
