import { createFileRoute } from "@tanstack/react-router";
import { SandboxProvider } from "@/contexts/SandboxProvider";
import { Navbar } from "@/components/layout/Navbar";
import { DebugWorkbench } from "@/components/debugger/DebugWorkbench";

export const Route = createFileRoute("/_authenticated/debug")({
  head: () => ({
    meta: [{ title: "Debugger — X-Debug" }],
  }),
  component: DebugPage,
});

function DebugPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <SandboxProvider>
        <DebugWorkbench />
      </SandboxProvider>
    </div>
  );
}