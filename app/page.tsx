import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
            Attendance System
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Scan QR codes to record attendance and display results on screen.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-md">
          <Link
            href="/scanner"
            className="flex h-14 w-full items-center justify-center rounded-lg bg-blue-500 px-8 text-lg font-semibold text-white transition-colors hover:bg-blue-600"
          >
            📱 Scanner (Phone)
          </Link>
          <Link
            href="/display"
            className="flex h-14 w-full items-center justify-center rounded-lg bg-green-500 px-8 text-lg font-semibold text-white transition-colors hover:bg-green-600"
          >
            📺 Display (TV/Screen)
          </Link>
        </div>
      </main>
    </div>
  );
}
