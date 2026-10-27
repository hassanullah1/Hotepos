// app/components/HeaderClient.jsx
"use client";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

import {
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Menu,
  X,
  Check,
  Home,
  Info,
  Book,
  Tag,
  Contact,
  User as UserIcon,
  LogIn,
  LogOut,
  ShoppingBag,
  Receipt,
} from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ps", label: "پښتو", flag: "🇦🇫" },
  { code: "prs", label: "دری", flag: "🇦🇫" },
];

export default function HeaderClient() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Buyer session
  const [buyer, setBuyer] = useState(null);
  const [buyerLoaded, setBuyerLoaded] = useState(false);

  const desktopLangRef = useRef(null);
  const mobileLangRef = useRef(null);
  const desktopAccountRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // ---------- Load buyer session ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/buyer/auth/me", {
          credentials: "same-origin",
        });
        const data = await res.json();
        if (!cancelled) setBuyer(data?.user || null);
      } catch {
        if (!cancelled) setBuyer(null);
      } finally {
        if (!cancelled) setBuyerLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]); // refresh on route change (e.g. after login redirect)

  // ---------- Close dropdowns on outside click ----------
  useEffect(() => {
    function handleClick(e) {
      const insideLang =
        desktopLangRef.current?.contains(e.target) ||
        mobileLangRef.current?.contains(e.target);
      if (!insideLang) setIsLangOpen(false);

      const insideAccount = desktopAccountRef.current?.contains(e.target);
      if (!insideAccount) setIsAccountOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ---------- Escape closes everything ----------
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setIsLangOpen(false);
        setIsMobileMenuOpen(false);
        setIsAccountOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // ---------- Scroll shadow ----------
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------- Lock body scroll while drawer is open ----------
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  async function handleBuyerLogout() {
    try {
      await fetch("/api/buyer/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      /* ignore */
    }
    setBuyer(null);
    setIsAccountOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!mounted) return null;

  const currentLang = LANGUAGES.find((l) => l.code === language);
  const isDark = theme === "dark";
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { href: "/", label: t("home"), icon: Home },
    {
      href: "/hotel",
      label: t("hotelRegister") || "Rgister hotel",
      icon: ShoppingBag,
    },
    { href: "/about", label: t("about"), icon: Info },
    { href: "/pricing", label: t("pricing"), icon: Tag },
    { href: "/tutorials", label: t("tutorials"), icon: Book },
    { href: "/contact", label: t("contact"), icon: Contact },
  ];

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  // ---------- Language dropdown ----------
  const LangMenu = ({ compact }) => (
    <div
      role="listbox"
      className={`absolute end-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[#2E2938] bg-[#1B1823]/95 shadow-2xl shadow-black/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
        compact ? "w-40" : "w-48"
      }`}
    >
      {LANGUAGES.map((lang) => {
        const active = language === lang.code;
        return (
          <button
            key={lang.code}
            role="option"
            aria-selected={active}
            onClick={() => {
              setLanguage(lang.code);
              setIsLangOpen(false);
            }}
            className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition-colors ${
              active
                ? "bg-[#C9A227]/10 font-semibold text-[#E0B93A]"
                : "text-[#CFCADB] hover:bg-[#2A2534]"
            }`}
          >
            <span>{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {active && <Check size={15} className="text-[#C9A227]" />}
          </button>
        );
      })}
    </div>
  );

  // ---------- Account dropdown ----------
  const AccountMenu = () => (
    <div
      role="menu"
      className="absolute end-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#2E2938] bg-[#1B1823]/95 shadow-2xl shadow-black/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
    >
      {buyer ? (
        <>
          <div className="border-b border-[#2E2938] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[#6E687A]">
              Signed in
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#F0EAE2]">
              {buyer.full_name || "Buyer"}
            </p>
            {buyer.email || buyer.phone ? (
              <p className="truncate text-[11px] text-[#9691A6]">
                {buyer.email || buyer.phone}
              </p>
            ) : null}
          </div>

          <Link
            href="/account"
            onClick={() => setIsAccountOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#CFCADB] transition-colors hover:bg-[#2A2534]"
          >
            <UserIcon size={15} className="text-[#C9A227]" />
            My account
          </Link>

          <button
            onClick={handleBuyerLogout}
            className="flex w-full items-center gap-2.5 border-t border-[#2E2938] px-4 py-2.5 text-start text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </>
      ) : (
        <>
          <div className="border-b border-[#2E2938] px-4 py-3">
            <p className="text-xs text-[#9691A6]">
              Sign in to order from any restaurant.
            </p>
          </div>

          <Link
            href={`/login?next=${encodeURIComponent(pathname || "/")}`}
            onClick={() => setIsAccountOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#E0B93A] transition-colors hover:bg-[#C9A227]/10"
          >
            <LogIn size={15} />
            Sign in as buyer
          </Link>

          <Link
            href="/login?mode=signup&next=%2Fbuy%2Forder"
            onClick={() => setIsAccountOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#CFCADB] transition-colors hover:bg-[#2A2534]"
          >
            <UserIcon size={15} className="text-[#C9A227]" />
            Create account
          </Link>
        </>
      )}
    </div>
  );

  // ---------- Compact sign-in / account button (used desktop + mobile) ----------
  const AuthButton = ({ compact = false }) => {
    if (!buyerLoaded) {
      return (
        <div
          className={`rounded-full border border-[#2E2938] bg-[#1B1823]/80 ${
            compact ? "h-9 w-9" : "h-9 px-3"
          }`}
        />
      );
    }

    if (buyer) {
      return (
        <Link
          href="/account"
          aria-label="Account"
          className="flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#1B1823]/80 px-3 py-2 text-[#E0B93A] transition-colors hover:border-[#C9A227] hover:bg-[#C9A227]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
        >
          <UserIcon size={15} />
          {!compact && (
            <span className="max-w-[90px] truncate text-sm font-medium">
              {(buyer.full_name || "Account").split(" ")[0]}
            </span>
          )}
        </Link>
      );
    }

    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname || "/order")}`}
        className="flex items-center gap-2 rounded-full border border-[#2E2938] bg-[#1B1823]/80 px-3 py-2 text-[#CFCADB] transition-colors hover:border-[#C9A227]/60 hover:text-[#E0B93A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
      >
        <LogIn size={15} className="text-[#C9A227]" />
        <span className="text-sm font-medium">{t("signIn") || "Sign in"}</span>
      </Link>
    );
  };

  return (
    <div>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? "border-[#2E2938] bg-[#15121C]/95 shadow-lg shadow-black/30"
            : "border-transparent bg-[#15121C]/75"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/60 to-transparent transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              scrolled ? "h-14 md:h-16" : "h-14 md:h-[4.5rem]"
            }`}
          >
            {/* Brand */}
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
            >
              <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-[#E0B93A] to-[#8A6E1A] p-[2px] transition-transform duration-300 group-hover:rotate-6 md:h-11 md:w-11">
                <div className="h-full w-full overflow-hidden rounded-full bg-[#15121C]">
                  <Image
                    src="/Melmah.png"
                    alt="Melmah Logo"
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <span
                className="whitespace-nowrap text-lg font-semibold tracking-tight text-[#F0EAE2] md:text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t("brand")}
              </span>
            </Link>

            {/* Desktop */}
            <div className="hidden items-center gap-4 md:flex lg:gap-6">
              <nav className="flex items-center gap-1 rounded-full border border-[#2E2938] bg-[#1B1823]/80 p-1">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60 ${
                        active
                          ? "bg-gradient-to-r from-[#E0B93A] to-[#C9A227] text-[#1D1707] shadow-md shadow-[#C9A227]/20"
                          : "text-[#B7B2C4] hover:bg-[#2A2534] hover:text-[#F0EAE2]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Language */}
              <div className="relative" ref={desktopLangRef}>
                <button
                  onClick={() => setIsLangOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isLangOpen}
                  className="flex items-center gap-2 rounded-full border border-[#2E2938] bg-[#1B1823]/80 px-3 py-2 text-[#CFCADB] transition-colors hover:border-[#C9A227]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
                >
                  <Globe size={16} className="text-[#C9A227]" />
                  <span className="text-sm font-medium">
                    {currentLang?.flag} {currentLang?.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[#6E687A] transition-transform duration-200 ${
                      isLangOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isLangOpen && <LangMenu />}
              </div>

              {/* Account (buyer) — dropdown + inline account button */}
              <div className="relative" ref={desktopAccountRef}>
                {buyer ? (
                  <>
                    <button
                      onClick={() => setIsAccountOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={isAccountOpen}
                      className="flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#1B1823]/80 px-3 py-2 text-[#E0B93A] transition-colors hover:border-[#C9A227] hover:bg-[#C9A227]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
                    >
                      <UserIcon size={15} />
                      <span className="max-w-[100px] truncate text-sm font-medium">
                        {(buyer.full_name || "Account").split(" ")[0]}
                      </span>
                      <ChevronDown
                        size={13}
                        className={`text-[#C9A227] transition-transform duration-200 ${
                          isAccountOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isAccountOpen && <AccountMenu />}
                  </>
                ) : (
                  <AuthButton />
                )}
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label="Toggle dark mode"
                className="relative h-8 w-14 rounded-full border border-[#2E2938] bg-[#1B1823] transition-colors hover:border-[#C9A227]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
              >
                <span
                  className={`absolute start-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#E0B93A] to-[#A9821E] shadow-md transition-transform duration-300 ease-out ${
                    isDark
                      ? "translate-x-6 rtl:-translate-x-6"
                      : "translate-x-0"
                  }`}
                >
                  {isDark ? (
                    <Moon size={13} className="text-[#1D1707]" />
                  ) : (
                    <Sun size={13} className="text-[#1D1707]" />
                  )}
                </span>
              </button>
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-1.5 md:hidden">
              <div className="relative" ref={mobileLangRef}>
                <button
                  onClick={() => setIsLangOpen((v) => !v)}
                  aria-label="Change language"
                  aria-expanded={isLangOpen}
                  className="flex items-center gap-1 rounded-full border border-[#2E2938] bg-[#1B1823] px-2.5 py-1.5 text-[#CFCADB]"
                >
                  <Globe size={14} className="text-[#C9A227]" />
                  <span className="text-xs">{currentLang?.flag}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${
                      isLangOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isLangOpen && <LangMenu compact />}
              </div>

              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label="Toggle dark mode"
                className="rounded-full border border-[#2E2938] bg-[#1B1823] p-2 text-[#CFCADB]"
              >
                {isDark ? (
                  <Sun size={15} className="text-[#E0B93A]" />
                ) : (
                  <Moon size={15} className="text-[#E0B93A]" />
                )}
              </button>

              {/* Compact account */}
              <AuthButton compact />

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
                className="rounded-xl border border-[#2E2938] bg-[#1B1823] p-2 text-[#F0EAE2] transition-colors hover:border-[#C9A227]/60"
              >
                <Menu size={19} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeMobileMenu}
          />
          <div className="absolute end-0 top-0 flex h-full w-72 max-w-[82vw] flex-col border-s border-[#2E2938] bg-[#15121C] p-5 shadow-2xl shadow-black/60 animate-in slide-in-from-right rtl:slide-in-from-left duration-300 ease-out">
            <div className="pointer-events-none absolute -top-16 -end-16 h-48 w-48 rounded-full bg-[#C9A227]/10 blur-3xl" />

            <div className="relative mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#E0B93A] to-[#8A6E1A] p-[2px]">
                  <div className="h-full w-full overflow-hidden rounded-full bg-[#15121C]">
                    <Image
                      src="/Melmah.png"
                      alt=""
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <span
                  className="text-base font-semibold text-[#F0EAE2]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t("brand")}
                </span>
              </div>
              <button
                onClick={closeMobileMenu}
                aria-label="Close menu"
                className="rounded-full bg-[#2A2534] p-1.5 text-[#B7B2C4] transition-colors hover:text-[#E0B93A]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="relative flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-[15px] font-medium transition-colors ${
                      active
                        ? "border-[#C9A227]/50 bg-[#C9A227]/10 text-[#E0B93A]"
                        : "border-transparent text-[#CFCADB] hover:bg-[#1B1823]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        active
                          ? "bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707]"
                          : "bg-[#2A2534] text-[#C9A227]"
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Buyer auth section in drawer */}
            <div className="relative mt-6 border-t border-[#2E2938] pt-4">
              {buyerLoaded && buyer ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/5 px-3.5 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707]">
                      <UserIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#F0EAE2]">
                        {buyer.full_name || "Buyer"}
                      </p>
                      {buyer.email || buyer.phone ? (
                        <p className="truncate text-[11px] text-[#9691A6]">
                          {buyer.email || buyer.phone}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl border border-transparent px-3.5 py-2.5 text-[15px] font-medium text-[#CFCADB] hover:bg-[#1B1823]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A2534] text-[#C9A227]">
                      <Receipt size={15} />
                    </span>
                    My orders
                  </Link>

                  <button
                    onClick={handleBuyerLogout}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3.5 py-2.5 text-start text-[15px] font-medium text-red-400 hover:bg-red-500/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                      <LogOut size={15} />
                    </span>
                    Sign out
                  </button>
                </div>
              ) : buyerLoaded ? (
                <Link
                  href={`/login?next=${encodeURIComponent(pathname || "/order")}`}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#C9A227] px-4 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20"
                >
                  <LogIn size={16} />
                  Sign in as buyer
                </Link>
              ) : null}
            </div>

            <div className="relative mt-auto pt-4 text-xs text-[#6E687A]">
              {currentLang?.flag} {currentLang?.label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
