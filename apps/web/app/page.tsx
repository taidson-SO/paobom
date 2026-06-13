import { HealthStatusPanel } from "@/features/health/presentation/components/HealthStatusPanel";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-zinc-100 px-6 py-10">
      <HealthStatusPanel />
    </main>
  );
}
