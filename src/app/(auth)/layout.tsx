export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm rounded-lg border border-subtle bg-surface p-8 shadow-md">
        <div className="mb-6 text-center text-xl font-semibold text-primary">PulseQ</div>
        {children}
      </div>
    </div>
  );
}
