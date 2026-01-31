import { useEffect, useRef, useState } from "react";
import { ChevronDown, Mail, MapPin, Menu, Phone, X } from "lucide-react";

const navItems = [
  { label: "About", id: "about" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Products", id: "products" },
   { label: 'Become an Agent', id: 'become-agent' },
  { label: "Contact", id: "contact" },
];

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const loginMenuRef = useRef(null);
  const loginMenuCloseTimeout = useRef(null);

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleNavigate = () => {
    setIsMenuOpen(false);
    setIsLoginMenuOpen(false);
  };
  const clearLoginMenuCloseTimeout = () => {
    if (loginMenuCloseTimeout.current) {
      clearTimeout(loginMenuCloseTimeout.current);
      loginMenuCloseTimeout.current = null;
    }
  };

  const openLoginMenu = () => {
    clearLoginMenuCloseTimeout();
    setIsLoginMenuOpen(true);
  };

  const scheduleCloseLoginMenu = () => {
    clearLoginMenuCloseTimeout();
    loginMenuCloseTimeout.current = setTimeout(() => {
      setIsLoginMenuOpen(false);
    }, 180);
  };

  const handleLoginToggle = () => {
    if (isLoginMenuOpen) {
      setIsLoginMenuOpen(false);
      clearLoginMenuCloseTimeout();
    } else {
      openLoginMenu();
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") {
      return () => {};
    }

    const originalOverflow = document.body.style.overflow;

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow || "";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isLoginMenuOpen) {
      return () => {};
    }

    const handleClickOutside = (event) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) {
        setIsLoginMenuOpen(false);
        clearLoginMenuCloseTimeout();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLoginMenuOpen]);

  useEffect(() => {
    return () => {
      clearLoginMenuCloseTimeout();
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Contact strip */}
      <div className="hidden bg-[#1a3a52] text-xs sm:text-sm md:block">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="mailto:support@betterlifeloan.com"
              className="flex items-center gap-2 transition hover:text-[#d1d5db]"
            >
              <Mail className="h-4 w-4" aria-hidden />
              <span>support@betterlifeloan.com</span>
            </a>
            <a
              href="tel:+2347030303224"
              className="flex items-center gap-2 transition hover:text-[#d1d5db]"
            >
              <Phone className="h-4 w-4" aria-hidden />
              <span>+234 703 030 3224</span>
            </a>
          </div>

          <div className="flex items-center gap-2 text-[#d1d5db]">
            <MapPin className="h-4 w-4" aria-hidden />
            <span className="leading-tight">261, Old Abeokuta Rd, Tabon Tabon, Agege, Lagos State</span>
          </div>
        </div>
      </div>

      {/* Primary navigation */}
      <div className="border-b border-slate-100 bg-white ">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <a href="#hero" className="flex items-center gap-2">
            <img
              src="/images/logo-2.jpeg"
              alt="LoanSphere logo"
              className="h-10 w-auto"
            />
            <span className="sr-only">LoanSphere</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={handleNavigate}
                className="group relative pb-1 transition-colors hover:text-[#1a3a52]"
              >
                <span className="group inline-flex items-center gap-1">
                  {item.label}
                  <span className="h-1 w-1 rounded-full bg-[#1a3a52] opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </a>
            ))}
            <div
              ref={loginMenuRef}
              className="relative"
              onMouseEnter={openLoginMenu}
              onMouseLeave={scheduleCloseLoginMenu}
              onFocus={openLoginMenu}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  scheduleCloseLoginMenu();
                }
              }}
            >
              <button
                type="button"
                onClick={handleLoginToggle}
                className="inline-flex items-center gap-2 rounded-full bg-[#1a3a52] px-4 py-2 text-white shadow-sm transition hover:bg-[#174061]"
                aria-haspopup="menu"
                aria-expanded={isLoginMenuOpen}
              >
                Login
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isLoginMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {isLoginMenuOpen ? (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-lg ring-1 ring-black/5">
                  <a
                    href="/cso/login"
                    onClick={handleNavigate}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#1a3a52]"
                  >
                    CSO Login
                  </a>
                  <a
                    href="/admin/signin"
                    onClick={handleNavigate}
                    className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#1a3a52]"
                  >
                    Admin Login
                  </a>
                </div>
              ) : null}
            </div>
          </nav>

          <button
            type="button"
            onClick={handleToggleMenu}
            className="flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-700 transition hover:border-[#1a3a52] hover:text-[#1a3a52] lg:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen ? (
          <div className="md:hidden">
            <div
              role="presentation"
              onClick={handleNavigate}
              className="fixed inset-0 z-40"
            />

            <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-full translate-x-0 bg-white shadow-2xl transition-transform duration-300">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <span className="text-sm font-semibold text-slate-900">Menu</span>
                  <button
                    type="button"
                    onClick={handleToggleMenu}
                    className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-[#1a3a52] hover:text-[#1a3a52]"
                    aria-label="Close navigation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                

                <nav className="flex flex-1 flex-col gap-1 bg-white px-5 py-6 text-sm font-medium text-slate-700">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={handleNavigate}
                      className="rounded-md px-3 py-3 transition hover:bg-slate-100 hover:text-[#1a3a52]"
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="space-y-3 px-5 py-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Log in</p>
                      <div className="mt-3 space-y-2">
                        <a
                          href="/cso/login"
                          onClick={handleNavigate}
                          className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:text-[#1a3a52]"
                        >
                          <span>CSO Login</span>
                          <ChevronDown className="h-4 w-4 rotate-[-90deg] text-slate-400" aria-hidden />
                        </a>
                        <a
                          href="/admin/signin"
                          onClick={handleNavigate}
                          className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:text-[#1a3a52]"
                        >
                          <span>Admin Login</span>
                          <ChevronDown className="h-4 w-4 rotate-[-90deg] text-slate-400" aria-hidden />
                        </a>
                      </div>
                    </div>

                    {/* <a
                      href="#contact"
                      onClick={handleNavigate}
                      className="block rounded-full bg-[#1a3a52] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#174061]"
                    >
                      Get Started
                    </a> */}
                  </div>
                  <div className="px-5 pb-4 text-sm text-slate-600">
                    <a href="mailto:support@betterlifeloan.com" className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3a52]/10 text-[#1a3a52]">
                        <Mail className="h-4 w-4" />
                      </span>
                      <span>support@betterlifeloan.com</span>
                    </a>
                    <a href="tel:+2347030303224" className="mt-3 flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3a52]/10 text-[#1a3a52]">
                        <Phone className="h-4 w-4" />
                      </span>
                      <span>+234 703 030 3224</span>
                    </a>
                  </div>
                </nav>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </header>
  );
}
