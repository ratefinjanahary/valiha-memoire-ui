import { MistBackground } from "@/components/mist-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <MistBackground />
      <div className="w-full max-w-md space-y-8">
        {children}
      </div>
    </div>
  );
}