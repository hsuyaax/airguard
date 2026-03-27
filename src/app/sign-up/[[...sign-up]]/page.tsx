import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 to-surface/90" />
      </div>

      <main className="relative z-10 w-full max-w-5xl px-6 py-12">
        <div className="rounded-[2rem] overflow-hidden flex flex-col md:flex-row min-h-[700px]" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", boxShadow: "0 25px 50px rgba(25,28,30,0.08)" }}>
          {/* Left: Citizen Portal Info */}
          <section className="flex-1 p-8 md:p-12 flex flex-col justify-between" style={{ borderRight: "1px solid rgba(199,196,216,0.1)" }}>
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Citizen Portal</h1>
              <p className="text-on-surface-variant text-sm">Monitor your air quality and protect your ward.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4 mt-12">
                  {[
                    { icon: "distance", label: "Your Wards" },
                    { icon: "notifications_active", label: "Your Alerts" },
                    { icon: "translate", label: "Your Language" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center text-center space-y-2 opacity-60">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">{item.icon}</span>
                      </div>
                      <span className="text-[10px] font-label uppercase">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-6 bg-primary/5 rounded-xl">
                  <h3 className="font-headline text-lg font-bold mb-2">After signing up, you can:</h3>
                  <ul className="space-y-2 text-sm text-on-surface-variant">
                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span> View real-time AQI for your ward</li>
                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span> Get personalized health advisories</li>
                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span> Access 48-hour pollution forecasts</li>
                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span> Receive GRAP stage alerts</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Active Nodes: 1,482</span>
            </div>
          </section>

          {/* Right: Clerk Sign-Up */}
          <section className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center bg-surface-low/50">
            <div className="mb-8 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Create Account</h2>
              <p className="text-on-surface-variant text-sm">Join the AirGuard monitoring network.</p>
            </div>
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full max-w-sm",
                  card: "shadow-none border-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-xl border-outline-variant/30 hover:bg-surface-low transition-all",
                  formButtonPrimary: "rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all",
                  footerActionLink: "text-primary hover:text-primary/80",
                  formFieldInput: "rounded-xl bg-white/50 border-none focus:ring-2 focus:ring-primary/20",
                  formFieldLabel: "font-label text-xs uppercase tracking-widest text-slate-400",
                },
              }}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-headline font-bold tracking-tight text-on-surface">AirGuard</span>
            <span className="w-px h-6 bg-outline-variant" />
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Atmospheric Intelligence Unit</span>
          </div>
          <div className="flex gap-8">
            <span className="text-[11px] font-medium text-on-surface-variant">Emergency Protocol</span>
            <span className="text-[11px] font-medium text-on-surface-variant">Privacy &amp; Data Governance</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
