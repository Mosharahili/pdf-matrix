import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useUploadFile } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListFilesQueryKey } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function Dropzone() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const uploadMutation = useUploadFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
        toast({
          title: t.success,
          description: "File uploaded successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: t.error,
          description: error.message || "Failed to upload file.",
          variant: "destructive",
        });
      }
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: t.error,
          description: "Only PDF files are allowed.",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate({ data: { file } });
    }
  }, [uploadMutation, toast, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-3xl mx-auto mt-12"
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300",
          "bg-white/50 backdrop-blur-sm hover:bg-blue-50/50",
          isDragActive ? "border-primary bg-blue-50/80 shadow-2xl shadow-primary/20 scale-[1.02]" : "border-border shadow-lg shadow-black/5 hover:border-primary/50 hover:shadow-xl",
          uploadMutation.isPending && "pointer-events-none opacity-80"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {uploadMutation.isPending ? (
              <motion.div
                key="loading"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">{t.uploading}</h3>
              </motion.div>
            ) : isSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-display font-bold text-green-700 mb-2">{t.success}</h3>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300",
                  isDragActive ? "bg-primary text-white scale-110" : "bg-blue-100 text-primary group-hover:scale-110 group-hover:bg-blue-200"
                )}>
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                  {t.uploadDragDrop}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {t.uploadBrowse}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground/80 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                  <FileText className="w-4 h-4" />
                  {t.supportedFormats}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Animated border gradient effect */}
        <div className="absolute inset-0 z-[-1] bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
      </div>
    </motion.div>
  );
}
