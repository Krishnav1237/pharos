import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="/terms" className="text-gray-500 hover:text-gray-600">
            Terms
          </Link>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-600">
            Privacy
          </Link>
          <Link href="/faq" className="text-gray-500 hover:text-gray-600">
            FAQ
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-600"
          >
            GitHub
          </a>
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; {new Date().getFullYear()} Pharos Exchange. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
