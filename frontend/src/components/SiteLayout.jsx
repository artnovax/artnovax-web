import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { SiteChromeProvider } from "../context/SiteChromeContext";

/*
 * Global navigation memory.
 *
 * Each section has one or more entry URLs that appear in the Header/Footer,
 * plus a matcher that identifies every page that belongs to that section.
 * This lets global navigation return visitors to the deepest page they last
 * visited without changing the meaning of explicit links inside page content.
 */
const DEEP_NAV_SECTIONS = [
  {
    key: "about",
    entryPaths: ["/about"],
    matches: (pathname) =>
      pathname === "/about" || pathname.startsWith("/founders/"),
  },
  {
    key: "events",
    entryPaths: ["/events"],
    matches: (pathname) =>
      pathname === "/events" || pathname.startsWith("/events/"),
  },
  {
    key: "research",
    entryPaths: ["/research"],
    matches: (pathname) =>
      pathname === "/research" || pathname.startsWith("/research/"),
  },
  {
    key: "newsletters",
    entryPaths: ["/newsletters"],
    matches: (pathname) =>
      pathname === "/newsletters" || pathname.startsWith("/newsletters/"),
  },
  {
    key: "volunteer",
    entryPaths: ["/get-involved/volunteer"],
    matches: (pathname) =>
      pathname === "/get-involved/volunteer" ||
      pathname.startsWith("/get-involved/volunteer/"),
  },
  {
    key: "shop",
    entryPaths: ["/shop", "/get-involved/shop"],
    matches: (pathname) =>
      pathname === "/shop" ||
      pathname.startsWith("/shop/") ||
      pathname === "/get-involved/shop" ||
      pathname.startsWith("/get-involved/shop/"),
  },
];

const getSectionForPath = (pathname) =>
  DEEP_NAV_SECTIONS.find((section) => section.matches(pathname));

const getSectionForEntryHref = (href) => {
  if (!href || !href.startsWith("/") || href.includes("#")) {
    return null;
  }

  const pathname = href.split("?")[0];

  return DEEP_NAV_SECTIONS.find((section) =>
    section.entryPaths.includes(pathname)
  );
};

const SiteLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollPositions = useRef(new Map());
  const currentPageKey = useRef(
    `${location.pathname}${location.search}`
  );

  const [lastSectionRoutes, setLastSectionRoutes] = useState({});

  /*
   * Remember the latest route inside every list/detail section.
   *
   * Examples:
   * events      -> /events/some-event
   * about       -> /founders/marion-yego
   * research    -> /research/some-article
   * newsletters -> /newsletters/august-2026
   * volunteer   -> /get-involved/volunteer/designer
   * shop        -> /shop/product-id
   */
  useLayoutEffect(() => {
    const section = getSectionForPath(location.pathname);

    if (!section) {
      return;
    }

    const route = `${location.pathname}${location.search}${location.hash}`;

    setLastSectionRoutes((current) => {
      if (current[section.key] === route) {
        return current;
      }

      return {
        ...current,
        [section.key]: route,
      };
    });
  }, [location.pathname, location.search, location.hash]);

  /*
   * Used only by persistent global navigation (Header/Footer).
   * Explicit hash links keep their literal destination, so links such as
   * /about#founders and /about#story continue to work normally.
   */
  const resolveNavHref = useCallback(
    (href) => {
      const section = getSectionForEntryHref(href);

      if (!section) {
        return href;
      }

      return lastSectionRoutes[section.key] || href;
    },
    [lastSectionRoutes]
  );

  /*
   * Continuously remember the current route's scroll position.
   */
  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.current.set(
        currentPageKey.current,
        window.scrollY
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /*
   * Existing page CTAs still include normal <a href="/..."> links.
   * Keep same-origin navigation inside React Router without changing the
   * literal destination. Deep-route restoration is intentionally reserved
   * for the persistent Header/Footer navigation.
   */
  useEffect(() => {
    const handleClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.("a[href]");

      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const rawHref = anchor.getAttribute("href");

      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:")
      ) {
        return;
      }

      let url;

      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      scrollPositions.current.set(
        currentPageKey.current,
        window.scrollY
      );

      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [navigate]);

  /*
   * Save the current position before browser Back / Forward navigation.
   */
  useEffect(() => {
    const handlePopState = () => {
      scrollPositions.current.set(
        currentPageKey.current,
        window.scrollY
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  /*
   * Restore the scroll position belonging to the destination route.
   * Explicit anchors take priority over remembered scroll positions.
   */
  useLayoutEffect(() => {
    const pageKey = `${location.pathname}${location.search}`;
    currentPageKey.current = pageKey;

    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));

      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView();
      });

      return;
    }

    const savedPosition = scrollPositions.current.get(pageKey) ?? 0;

    window.scrollTo({
      top: savedPosition,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <Header
        activePath={location.pathname}
        resolveNavHref={resolveNavHref}
        persistent
      />

      <SiteChromeProvider value={true}>
        <Outlet />
      </SiteChromeProvider>

      <Footer
        resolveNavHref={resolveNavHref}
        persistent
      />
    </>
  );
};

export default SiteLayout;
