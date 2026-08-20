import { type FormEvent, useState } from "react"
import { useAuth } from "@/state/AuthContext"

type Mode = "login" | "invitation"

function invitationTokenFromHash(): string {
  const match = window.location.hash.match(/^#\/invite\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : ""
}

export default function Login() {
  const { login, acceptInvitation, error, clearError } = useAuth()
  const linkedToken = invitationTokenFromHash()
  const [mode, setMode] = useState<Mode>(linkedToken ? "invitation" : "login")
  const [email, setEmail] = useState("omar@example.test")
  const [password, setPassword] = useState("TrustPayDemo!2026")
  const [displayName, setDisplayName] = useState("")
  const [token, setToken] = useState(linkedToken)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next: Mode) => {
    clearError()
    setMode(next)
    if (next === "invitation") {
      setPassword("")
    } else {
      setPassword("TrustPayDemo!2026")
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await acceptInvitation({ token, displayName, password })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const chooseDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("TrustPayDemo!2026")
    clearError()
  }

  return (
    <div className="min-h-screen bg-canvas px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-edge bg-card shadow-[0_24px_80px_rgba(13,31,64,0.12)] grid md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden md:flex min-h-[650px] flex-col justify-between bg-ink p-10 text-white relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 6.5L10 3l7 3.5V10c0 4.2-7 7.5-7 7.5S3 14.2 3 10V6.5Z" fill="white" />
                <path d="m6.5 10 2.2 2.2 4.8-5" stroke="#2B9B8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>TrustPay</span>
          </div>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-mid">Milestone confidence for SMEs</p>
            <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Agreements, evidence and decisions in one trusted record.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              TrustPay helps businesses and customers agree work, review milestone evidence and record decisions without claiming to hold or transfer funds.
            </p>
          </div>
          <p className="relative text-xs text-white/45">Protected organization access · Auditable decisions · Simulated payment records</p>
        </section>

        <section className="p-7 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="md:hidden mb-9 flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand" />
            <span className="text-xl font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>TrustPay</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {mode === "login" ? "Secure access" : "Organization invitation"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {mode === "login" ? "Welcome back" : "Join your organization"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {mode === "login" ? "Log in with your TrustPay account." : "Create your account using the invitation sent by an organization administrator."}
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "login" ? (
              <label className="block">
                <span className="text-xs font-semibold text-ink-dim">Email address</span>
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-edge bg-white px-3.5 py-3 text-sm text-ink" />
              </label>
            ) : (
              <>
                <label className="block">
                  <span className="text-xs font-semibold text-ink-dim">Invitation token</span>
                  <input required value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste your invitation token" className="mt-1.5 w-full rounded-xl border border-edge bg-white px-3.5 py-3 text-sm text-ink" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink-dim">Your full name</span>
                  <input required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-edge bg-white px-3.5 py-3 text-sm text-ink" />
                </label>
              </>
            )}
            <label className="block">
              <span className="text-xs font-semibold text-ink-dim">Password</span>
              <input type="password" required autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 8 : 12} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-edge bg-white px-3.5 py-3 text-sm text-ink" />
              {mode === "invitation" && <span className="mt-1.5 block text-[11px] text-muted">At least 12 characters with uppercase, lowercase and a number.</span>}
            </label>

            {error && <div className="rounded-xl border border-danger/25 bg-danger-light px-3.5 py-3 text-sm text-danger" role="alert">{error}</div>}

            <button disabled={submitting} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Accept invitation"}
            </button>
          </form>

          {mode === "login" && (
            <div className="mt-6 rounded-xl border border-edge bg-canvas p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Prototype accounts</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => chooseDemo("nadia@example.test")} className="rounded-lg border border-edge bg-card px-3 py-2 text-left hover:border-brand/40">
                  <span className="block text-xs font-semibold text-ink">Nadia</span><span className="text-[11px] text-muted">SME owner</span>
                </button>
                <button onClick={() => chooseDemo("omar@example.test")} className="rounded-lg border border-edge bg-card px-3 py-2 text-left hover:border-brand/40">
                  <span className="block text-xs font-semibold text-ink">Omar</span><span className="text-[11px] text-muted">Customer approver</span>
                </button>
              </div>
            </div>
          )}

          <button onClick={() => switchMode(mode === "login" ? "invitation" : "login")} className="mt-6 text-sm font-semibold text-brand hover:underline">
            {mode === "login" ? "Have an invitation? Accept it" : "Already have an account? Log in"}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">Bank access is provisioned by invitation or organizational SSO only.</p>
        </section>
      </div>
    </div>
  )
}
