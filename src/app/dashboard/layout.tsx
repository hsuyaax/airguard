import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { TickerTape } from "@/components/TickerTape";
import { AICopilot } from "@/components/AICopilot";
import { SettingsProvider } from "@/lib/settings-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <Sidebar />
      <TopNav />
      <main className="ml-64 pt-16 pb-10 min-h-screen bg-surface-lowest">
        <div className="max-w-[1400px] mx-auto px-10 py-8">
          {children}
        </div>
      </main>
      <TickerTape />
      <AICopilot />
    </SettingsProvider>
  );
}
