import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Menu, X, ChevronDown, ShoppingBag } from "lucide-react";

import { LogoWithTagline } from "./Logo";
import { NAV_LINKS } from "../mock";
import { useCart } from "../context/CartContext";
import { useSiteChromeSuppressed } from "../context/SiteChromeContext";

const Header = ({ persistent = false, ...props }) => {
  const suppressed = useSiteChromeSuppressed();

  if (suppressed && !persistent) {
    return null;
  }

  return <HeaderInner {...props} />;
};

const HeaderInner = ({
  activePath = "/",
  resolveNavHref = (href) => href,
}) => {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const desktopNavRef = useRef(null);
  const { count, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        desktopNavRef.current &&
        !desktopNavRef.current.contains(event.target)
      ) {
        setDropdown(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDropdown(null);
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const closeMenus = () => {
    setDropdown(null);
    setOpen(false);
  };

  const toggleMobileMenu = () => {
    setDropdown(null);
    setOpen((current) => !current);
  };

  return (
    <>
      <header
        className="
          sticky top-0 z-50 w-full
          bg-ivory
          shadow-[0_2px_20px_-12px_rgba(92,21,25,0.25)]
        "
      >
        <div
          className="
            mx-auto
            max-w-[1280px]
            px-4 md:px-8
            h-[84px] md:h-[100px]
            flex items-center justify-between
            gap-6
          "
        >
          <Link
            to="/"
            aria-label="ArtNovaX home"
            className="flex items-center shrink-0 mr-4 lg:mr-10"
            onClick={closeMenus}
          >
            <LogoWithTagline />
          </Link>

          <nav
            ref={desktopNavRef}
            className="
              hidden lg:flex
              items-center
              gap-7
              flex-1
              justify-center
            "
          >
            {NAV_LINKS.map((link) => {
              const isDropdownOpen = dropdown === link.label;
              const isActive =
                activePath === link.href ||
                (link.hasDropdown && activePath.startsWith(`${link.href}/`));

              if (!link.hasDropdown) {
                return (
                  <Link
                    key={link.label}
                    to={resolveNavHref(link.href)}
                    data-active={isActive}
                    onClick={closeMenus}
                    className="
                      nav-link
                      text-[15px]
                      font-medium
                      text-ink
                      hover:text-burgundy
                    "
                  >
                    {link.label}
                  </Link>
                );
              }

              return (
                <div key={link.label} className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isDropdownOpen}
                    data-active={isActive}
                    onClick={() =>
                      setDropdown(isDropdownOpen ? null : link.label)
                    }
                    className="
                      nav-link
                      bg-transparent
                      border-0
                      text-[15px]
                      font-medium
                      text-ink
                      hover:text-burgundy
                      inline-flex
                      items-center
                      gap-1
                      cursor-pointer
                    "
                  >
                    {link.label}
                    <ChevronDown
                      className={`
                        w-4 h-4
                        transition-transform
                        duration-200
                        ${isDropdownOpen ? "rotate-180" : ""}
                      `}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div
                      className="
                        absolute
                        top-full
                        left-1/2
                        -translate-x-1/2
                        pt-3
                        w-60
                        z-[70]
                      "
                    >
                      <div
                        role="menu"
                        className="
                          rounded-xl
                          bg-white
                          shadow-[0_20px_40px_-18px_rgba(92,21,25,0.35)]
                          ring-1
                          ring-ivory-300
                          py-2
                          overflow-hidden
                        "
                      >
                        <Link
                          to={resolveNavHref(link.href)}
                          role="menuitem"
                          onClick={closeMenus}
                          className="
                            block
                            px-4 py-3
                            text-sm
                            font-medium
                            text-ink
                            hover:bg-ivory-200
                            hover:text-burgundy
                            transition-colors
                          "
                        >
                          Overview
                        </Link>

                        <div className="h-px bg-ivory-300 mx-3" />

                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            to={resolveNavHref(child.href)}
                            role="menuitem"
                            onClick={closeMenus}
                            className="
                              block
                              px-4 py-3
                              text-sm
                              text-ink
                              hover:bg-ivory-200
                              hover:text-burgundy
                              transition-colors
                            "
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="
                relative
                inline-flex
                items-center
                justify-center
                w-11 h-11
                rounded-full
                text-burgundy
                hover:bg-ivory-200
                transition-colors
              "
            >
              <ShoppingBag className="w-5 h-5" />

              {count > 0 && (
                <span
                  className="
                    absolute
                    -top-0.5
                    -right-0.5
                    min-w-[18px]
                    h-[18px]
                    rounded-full
                    bg-burgundy
                    text-ivory
                    text-[10.5px]
                    font-semibold
                    flex
                    items-center
                    justify-center
                    px-1
                  "
                >
                  {count}
                </span>
              )}
            </button>

            <Link
              to="/get-involved/support"
              onClick={closeMenus}
              className="
                cta-btn
                hidden md:inline-flex
                items-center
                gap-2
                rounded-full
                bg-burgundy
                text-ivory
                px-5 py-3
                text-[14px]
                font-semibold
                hover:bg-burgundy-light
                shadow-[0_10px_25px_-14px_rgba(92,21,25,0.7)]
              "
            >
              <Heart className="w-4 h-4" fill="#FBF3E8" />
              Support Our Work
            </Link>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={toggleMobileMenu}
              className="
                lg:hidden
                inline-flex
                items-center
                justify-center
                w-11 h-11
                rounded-full
                text-burgundy
                hover:bg-ivory-200
                transition-colors
              "
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="mobile-navigation"
          className="
            lg:hidden
            fixed
            inset-x-0
            top-[84px]
            md:top-[100px]
            bottom-0
            z-40
            bg-ivory
            overflow-y-auto
            overscroll-contain
            border-t
            border-ivory-300
          "
        >
          <div className="px-6 py-6 md:px-10 md:py-8">
            <nav className="flex flex-col divide-y divide-ivory-300">
              {NAV_LINKS.map((link) => (
                <MobileNavItem
                  key={link.label}
                  link={link}
                  onNavigate={closeMenus}
                  resolveNavHref={resolveNavHref}
                />
              ))}
            </nav>

            <Link
              to="/get-involved/support"
              onClick={closeMenus}
              className="
                cta-btn
                mt-8
                inline-flex
                w-full
                justify-center
                items-center
                gap-2
                rounded-full
                bg-burgundy
                text-ivory
                px-5 py-4
                text-[15px]
                font-semibold
                hover:bg-burgundy-light
              "
            >
              <Heart className="w-4 h-4" fill="#FBF3E8" />
              Support Our Work
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

const MobileNavItem = ({
  link,
  onNavigate,
  resolveNavHref,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!link.hasDropdown) {
    return (
      <Link
        to={resolveNavHref(link.href)}
        onClick={onNavigate}
        className="
          py-4
          text-lg
          font-medium
          text-ink
          hover:text-burgundy
        "
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div className="py-2">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="
          w-full
          flex
          items-center
          justify-between
          py-3
          text-lg
          font-medium
          text-ink
        "
      >
        {link.label}
        <ChevronDown
          className={`
            w-5 h-5
            transition-transform
            duration-200
            ${expanded ? "rotate-180" : ""}
          `}
        />
      </button>

      {expanded && (
        <div className="pl-3 pb-3 flex flex-col">
          <Link
            to={resolveNavHref(link.href)}
            onClick={onNavigate}
            className="
              py-3
              text-[15px]
              font-medium
              text-ink
              hover:text-burgundy
            "
          >
            Overview
          </Link>

          {link.children.map((child) => (
            <Link
              key={child.label}
              to={resolveNavHref(child.href)}
              onClick={onNavigate}
              className="
                py-3
                text-[15px]
                text-muted-foreground
                hover:text-burgundy
              "
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
