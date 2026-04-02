import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, LANGUAGE_LABELS, Language } from '@/lib/i18n';
import { Languages, Layers, ChevronDown } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

const LANGUAGES = Object.entries(LANGUAGE_LABELS) as [Language, string][];

export function Layout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] z-0 opacity-40 pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}hero-bg.png`} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              {t.appTitle}
            </span>
          </Link>

          {/* Language Dropdown */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-secondary text-sm font-medium text-foreground transition-colors duration-200"
              aria-label="Select language"
              aria-expanded={open}
            >
              <Languages className="w-4 h-4 text-muted-foreground" />
              <span>{LANGUAGE_LABELS[language]}</span>
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute end-0 mt-1 w-40 rounded-xl border border-border bg-white shadow-lg shadow-black/5 overflow-hidden z-50"
              >
                {LANGUAGES.map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => { setLanguage(code); setOpen(false); }}
                    className={`w-full text-start px-4 py-2.5 text-sm transition-colors hover:bg-secondary ${
                      language === code ? 'font-semibold text-primary bg-blue-50' : 'text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white/50 backdrop-blur-sm mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-80">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-foreground">{t.appTitle}</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-start">
            &copy; {new Date().getFullYear()} {t.appTitle}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
