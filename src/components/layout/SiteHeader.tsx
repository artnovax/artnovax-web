import Link from "next/link";

const navigation = [
  { label: "About", href: "/about" },
  { label: "Our Work", href: "/our-work" },
  { label: "Events", href: "/events" },
  { label: "Research & Insights", href: "/research" },
  { label: "ArtNovaX App", href: "/app" },
  { label: "Get Involved", href: "/get-involved" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-8">
        <Link
          href="/"
          className="font-serif text-3xl font-semibold tracking-tight text-maroon"
        >
          ArtNovaX
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-maroon"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/get-involved"
          className="hidden rounded-md bg-maroon px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-dark lg:inline-flex"
        >
          Support Our Work
        </Link>

        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none text-sm font-semibold text-maroon">
            Menu
          </summary>

          <nav
            aria-label="Mobile navigation"
            className="absolute right-0 top-10 z-50 w-64 rounded-lg border border-border bg-surface p-4 shadow-lg"
          >
            <div className="flex flex-col">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-border px-2 py-3 text-sm last:border-none"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/get-involved"
                className="mt-4 rounded-md bg-maroon px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Support Our Work
              </Link>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
