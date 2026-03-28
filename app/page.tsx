import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans px-6">
      <main className="flex flex-col items-center gap-8 text-center max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Restaurant Menu Config Validator
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
          Upload your menu configuration and validate routing rules, kitchen stations, and printer assignments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/upload"
            className="flex items-center justify-center h-12 px-6 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Upload Config
          </Link>
          <Link
            href="/analyzer"
            className="flex items-center justify-center h-12 px-6 rounded-full border border-zinc-300 text-zinc-800 font-medium hover:bg-zinc-100 transition-colors dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Go to Analyzer
          </Link>
        </div>
      </main>
    </div>
  );
}