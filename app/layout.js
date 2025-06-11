import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Go Job - Database Viewer",
  description: "Database connection and viewer for Go Job",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-white border-b border-gray-200 px-4 py-2.5 dark:bg-gray-800">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center">
              <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
                Go Job Database
              </span>
            </div>            <div className="flex items-center">
              <Link
                href="/"
                className="mr-6 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/Connection"
                className="mr-6 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                Connection
              </Link>
              <Link
                href="/test-connection"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                Test Connection
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
