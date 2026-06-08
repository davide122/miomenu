import { AuthForm } from "@/components/auth/auth-form"
import { loginAction } from "@/lib/auth/actions"

export default function LoginPage() {
  return (
    <AuthForm
      title="Accedi"
      subtitle="Bentornato. Accedi e gestisci il tuo menu in modo semplice."
      action={loginAction}
      submitLabel="Accedi"
      secondaryText="Non hai un account? Registrati"
      secondaryHref="/register"
      tertiaryText="Password dimenticata?"
      tertiaryHref="/forgot-password"
    />
  )
}
