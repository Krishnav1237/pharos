import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have
          been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go Home
          </Link>
          <div>
            <Link
              href="/markets"
              className="inline-block text-indigo-600 hover:text-indigo-800"
            >
              Browse Markets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
