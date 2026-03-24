import React from 'react';
import { Dropzone } from '@/components/Dropzone';
import { FileManager } from '@/components/FileManager';
import { SEO } from '@/components/SEO';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <SEO />
      <div className="pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Premium PDF Tools
          </div>
          <h1 className="text-5xl sm:text-6xl font-display font-extrabold text-foreground mb-6 leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {t.heroSubtitle}
          </p>
        </motion.div>

        {/* Upload Zone */}
        <Dropzone />

        {/* Dashboard / File Manager */}
        <FileManager />

      </div>
    </>
  );
}
