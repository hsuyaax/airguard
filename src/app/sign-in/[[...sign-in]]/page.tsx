import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 to-surface/90" />
      </div>

      <main className="relative z-10 w-full max-w-5xl px-6 py-12">
        <div className="rounded-[2rem] overflow-hidden flex flex-col md:flex-row min-h-[700px]" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", boxShadow: "0 25px 50px rgba(25,28,30,0.08)" }}>
          {/* Left: Clerk Sign-In */}
          <section className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center" style={{ borderRight: "1px solid rgba(199,196,216,0.1)" }}>
            <div className="mb-8 text-center">
              <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Welcome Back</h1>
              <p className="text-on-surface-variant text-sm">Sign in to access your AirGuard dashboard.</p>
            </div>
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full max-w-sm",
                  card: "shadow-none border-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-xl border-outline-variant/30 hover:bg-surface-low transition-all",
                  formButtonPrimary: "rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all",
                  footerActionLink: "text-primary hover:text-primary/80",
                  formFieldInput: "rounded-xl bg-surface-low border-none focus:ring-2 focus:ring-primary/20",
                  formFieldLabel: "font-label text-xs uppercase tracking-widest text-slate-400",
                },
              }}
            />
          </section>

          {/* Right: Branding Panel */}
          <section className="flex-1 p-8 md:p-12 flex flex-col justify-between bg-surface-low/50">
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Officer Access</h2>
              <p className="text-on-surface-variant text-sm">Authorized personnel login for MCD Authority.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-6 mt-12">
              {[
                { title: "Your Jurisdiction", desc: "Map-based sector assignment." },
                { title: "Your Tools", desc: "Sensor network & incident dashboard tour." },
                { title: "Quick Actions", desc: "Setup rapid response triggers." },
              ].map((step) => (
                <div key={step.title} className="flex items-center gap-4 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                  <div className="flex-1 pb-3" style={{ borderBottom: "1px solid rgba(199,196,216,0.3)" }}>
                    <h4 className="font-label text-xs uppercase tracking-tight text-on-surface">{step.title}</h4>
                    <p className="text-[10px] text-on-surface-variant">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">System Status: Optimal</span>
            </div>
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
