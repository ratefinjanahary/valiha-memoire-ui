"use client";

import { Menu } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";

export function Header() {
  const { toggleSidebar, toggleMobileSidebar } = useUiStore();

  return (
    <header className="h-16 border-b bg-background flex items-center px-4 md:px-6 shrink-0">
      {/* Mobile : ouvre le drawer */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileSidebar}
        className="mr-2 md:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Ouvrir le menu</span>
      </Button>

      {/* Desktop : étend / réduit la sidebar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="mr-2 hidden md:inline-flex"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Réduire ou étendre le menu</span>
      </Button>
    </header>
  );
}