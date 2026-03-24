import React, { useEffect, useState } from 'react';
import { useListFiles } from '@workspace/api-client-react';
import { FileCard } from './FileCard';
import { useTranslation } from '@/lib/i18n';
import { Loader2, FileX } from 'lucide-react';
import { motion } from 'framer-motion';

export function FileManager() {
  const { t } = useTranslation();
  const [shouldPoll, setShouldPoll] = useState(false);
  
  // Use a refetch interval if any conversion is processing
  const { data, isLoading, isError } = useListFiles({
    query: {
      refetchInterval: shouldPoll ? 2000 : false,
    }
  });

  // Check if we need to poll
  useEffect(() => {
    if (data?.files) {
      const hasActiveConversions = data.files.some(f => 
        f.conversions?.some(c => c.status === 'pending' || c.status === 'processing')
      );
      setShouldPoll(hasActiveConversions);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full text-center py-12 text-destructive">
        <p>{t.error}</p>
      </div>
    );
  }

  const files = data?.files || [];

  if (files.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl mx-auto mt-12 p-12 bg-white/50 backdrop-blur-sm rounded-3xl border border-border/50 text-center flex flex-col items-center justify-center shadow-lg shadow-blue-900/5"
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/empty-state.png`} 
          alt="No files" 
          className="w-48 h-48 object-contain mb-6 opacity-80"
        />
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">{t.noFilesTitle}</h3>
        <p className="text-muted-foreground">{t.noFilesDesc}</p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          {t.myFiles}
          <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-sans font-semibold">
            {files.length}
          </span>
        </h2>
      </div>
      
      <div className="space-y-4">
        {files.map((file, index) => (
          <FileCard key={file.id} file={file} index={index} />
        ))}
      </div>
    </div>
  );
}
