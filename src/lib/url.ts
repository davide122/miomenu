export function appUrl() {
  const fromEnv = (process.env.APP_URL || "").trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV === "production") return "https://menumio.it"
  return "http://localhost:3000"
}
