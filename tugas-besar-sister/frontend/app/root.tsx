import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Tambahkan Title Custom di sini untuk Nilai Plus */}
        <title>P2P Secure Messenger</title>
        <Meta />
        <Links />
      </head>
      {/* Tambahkan bg-[#0d1117] di sini agar tidak ada warna putih saat loading */}
      <body className="bg-[#0d1117] text-[#e6edf3]">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    // Sesuaikan ErrorBoundary dengan tema gelap agar konsisten
    <main className="pt-16 p-4 container mx-auto bg-[#0d1117] min-h-screen text-white">
      <h1 className="text-2xl font-bold text-red-500">{message}</h1>
      <p className="mt-2 text-gray-400">{details}</p>
      {stack && (
        <pre className="w-full p-4 mt-4 overflow-x-auto bg-gray-900 rounded border border-gray-700">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
