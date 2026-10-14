
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import {
  navigationItems,
  type PageId,
} from "../../config/navigation";
import OperationsPage from "../../pages/OperationPage";

export default function AppLayout() {
  const [activePage, setActivePage] = useState<PageId>("operations");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeItem = navigationItems.find(
    (item) => item.id === activePage,
  );

  function handleNavigate(pageId: PageId) {
    setActivePage(pageId);
    setIsSidebarOpen(false);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        activePage={activePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <div className="flex min-w-0 flex-1 flex-col">
   
        <header className="sticky top-0 z-30 flex h-18 shrink-0 items-center gap-3 border-b border-border bg-white px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-controls="app-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} aria-hidden="true" />
          </button>

          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {activeItem?.label ?? "Operations"}
            </h2>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Campus Transport Intelligence
            </p>
          </div>
        </header>

  

<main className="flex-1 p-4 sm:p-6 lg:p-8">
  <div className="mb-6">
    <h1 className="text-2xl font-semibold tracking-tight">
      {activeItem?.label ?? "Operations"}
    </h1>

    <p className="mt-1 text-sm text-muted-foreground">
      {activePage === "operations" &&
        "Monitor campus transport operations and network status."}
      {activePage === "recovery-planner" &&
        "Plan recovery scenarios and review proposed schedules."}
      {activePage === "performance-lab" &&
        "Compare baseline performance with optimized results."}
    </p>
  </div>

  {activePage === "operations" ? (
    <OperationsPage />
  ) : (
    <div className="rounded-lg border border-border bg-white p-6">
      <p className="text-sm text-muted-foreground">
        {activeItem?.label} page content will be implemented here.
      </p>
    </div>
  )}
</main>

      </div>
    </div>
  );
}
