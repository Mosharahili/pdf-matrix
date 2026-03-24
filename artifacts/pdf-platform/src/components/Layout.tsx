import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Languages, Layers } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export function Layout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

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

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-secondary text-sm font-medium text-foreground transition-colors duration-200"
            aria-label="Toggle language"
          >
            <Languages className="w-4 h-4 text-muted-foreground" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
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
