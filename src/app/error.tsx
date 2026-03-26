'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900">Something went wrong</h2>
        <p className="text-slate-500 font-medium">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#9C5FEC] text-white rounded-full font-bold hover:brightness-110 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
