import React, { useState, useEffect } from 'react';
import { Heart, Menu, X, ChevronDown, ShoppingBag } from 'lucide-react';
import { LogoWithTagline } from './Logo';
import { NAV_LINKS } from '../mock';
import { useCart } from '../context/CartContext';

const Header = ({ activePath = '/' }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const { count, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-ivory/95 backdrop-blur-md shadow-[0_2px_20px_-12px_rgba(92,21,25,0.25)]' : 'bg-ivory'}`}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-8 h-[84px] md:h-[100px] flex items-center justify-between gap-6">
        <a href="/" aria-label="ArtNovaX home" className="flex items-center shrink-0 mr-4 lg:mr-10">
          <LogoWithTagline />
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.hasDropdown && setDropdown(link.label)}
              onMouseLeave={() => link.hasDropdown && setDropdown(null)}
            >
              <a
                href={link.href}
                data-active={activePath === link.href}
                className="nav-link text-[15px] font-medium text-ink hover:text-burgundy inline-flex items-center gap-1"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
              </a>
              {link.hasDropdown && dropdown === link.label && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl bg-white shadow-[0_20px_40px_-18px_rgba(92,21,25,0.35)] ring-1 ring-ivory-300 py-2">
                  {link.children.map((c) => (
                    <a key={c.label} href={c.href} className="block px-4 py-2 text-sm text-ink hover:bg-ivory-200 hover:text-burgundy transition-colors">
                      {c.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
            className="relative inline-flex items-center justify-center w-11 h-11 rounded-full text-burgundy hover:bg-ivory-200 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-burgundy text-ivory text-[10.5px] font-semibold flex items-center justify-center px-1">{count}</span>
            )}
          </button>
          <a
            href="/get-involved/support"
            className="cta-btn hidden md:inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3 text-[14px] font-semibold hover:bg-burgundy-light shadow-[0_10px_25px_-14px_rgba(92,21,25,0.7)]"
          >
            <Heart className="w-4 h-4" fill="#FBF3E8" />
            Support Our Work
          </a>

          <button
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full text-burgundy hover:bg-ivory-200 transition-colors"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 top-[76px] z-40 bg-ivory transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-6 py-8 overflow-y-auto h-full">
          <nav className="flex flex-col divide-y divide-ivory-300">
            {NAV_LINKS.map((link) => (
              <MobileNavItem key={link.label} link={link} onNavigate={() => setOpen(false)} />
            ))}
          </nav>
          <a
            href="/get-involved/support"
            className="cta-btn mt-8 inline-flex w-full justify-center items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-4 text-[15px] font-semibold hover:bg-burgundy-light"
            onClick={() => setOpen(false)}
          >
            <Heart className="w-4 h-4" fill="#FBF3E8" />
            Support Our Work
          </a>
        </div>
      </div>
    </header>
  );
};

const MobileNavItem = ({ link, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  if (!link.hasDropdown) {
    return (
      <a href={link.href} onClick={onNavigate} className="py-4 text-lg font-medium text-ink hover:text-burgundy">
        {link.label}
      </a>
    );
  }
  return (
    <div className="py-2">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between py-2 text-lg font-medium text-ink"
      >
        {link.label}
        <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="pl-3 pb-3 flex flex-col gap-2">
          {link.children.map((c) => (
            <a key={c.label} href={c.href} onClick={onNavigate} className="py-2 text-[15px] text-muted-foreground hover:text-burgundy">
              {c.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
