import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-maroon-dark text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 md:px-8 lg:grid-cols-2">
        <div>
          <Link href="/" className="font-serif text-3xl font-semibold">
            ArtNovaX
          </Link>

          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
            Where art heals, tech empowers, and minds transform.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 lg:justify-end">
          <Link href="/about" className="text-sm text-white/80 hover:text-white">
            About
          </Link>
          <Link
            href="/our-work"
            className="text-sm text-white/80 hover:text-white"
          >
            Our Work
          </Link>
          <Link
            href="/events"
            className="text-sm text-white/80 hover:text-white"
          >
            Events
          </Link>
          <Link
            href="/research"
            className="text-sm text-white/80 hover:text-white"
          >
            Research
          </Link>
          <Link
            href="/contact"
            className="text-sm text-white/80 hover:text-white"
          >
            Contact
          </Link>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto max-w-[1440px] px-5 py-5 text-xs text-white/60 md:px-8">
          © {new Date().getFullYear()} ArtNovaX Mental Health Foundation.
        </div>
      </div>
    </footer>
  );
}
