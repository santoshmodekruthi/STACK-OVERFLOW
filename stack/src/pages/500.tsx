import Link from "next/link";
import Mainlayout from "@/layout/Mainlayout";

export default function Custom500() {
  return (
    <Mainlayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">500</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Internal Server Error
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Something went wrong on our end. Our team has been notified and we're working on a fix.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </Mainlayout>
  );
}
