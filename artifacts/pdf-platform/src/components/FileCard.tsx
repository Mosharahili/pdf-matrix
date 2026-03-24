import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { formatBytes, downloadBlob } from '@/lib/utils';
import { FileRecord, OutputFormat, ConversionRecord } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { 
  File, FileText, FileImage, FileSpreadsheet, FileIcon, 
  Trash2, Download, RefreshCw, ChevronDown, CheckCircle2, XCircle, Clock, Loader2
} from 'lucide-react';
import { useDeleteFile, useStartConversion, downloadOriginalFile, downloadConvertedFile, getListFilesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FileCardProps {
  file: FileRecord;
  index: number;
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  docx: <FileText className="w-4 h-4 text-blue-600" />,
  xlsx: <FileSpreadsheet className="w-4 h-4 text-green-600" />,
  pptx: <FileIcon className="w-4 h-4 text-orange-500" />,
  png: <FileImage className="w-4 h-4 text-purple-500" />,
  jpg: <FileImage className="w-4 h-4 text-pink-500" />,
  txt: <FileText className="w-4 h-4 text-gray-500" />,
};

export function FileCard({ file, index }: FileCardProps) {
  const { t, dir } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('docx');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloadingOrig, setIsDownloadingOrig] = useState(false);
  const [downloadingConvId, setDownloadingConvId] = useState<number | null>(null);

  const deleteMutation = useDeleteFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        toast({ title: t.success, description: "File deleted successfully." });
      },
      onError: () => toast({ title: t.error, description: "Failed to delete file.", variant: "destructive" })
    }
  });

  const convertMutation = useStartConversion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        toast({ title: t.success, description: "Conversion started." });
      },
      onError: () => toast({ title: t.error, description: "Failed to start conversion.", variant: "destructive" })
    }
  });

  const handleConvert = () => {
    convertMutation.mutate({ data: { fileId: file.id, outputFormat: selectedFormat } });
  };

  const handleDownloadOriginal = async () => {
    try {
      setIsDownloadingOrig(true);
      const blob = await downloadOriginalFile(file.id);
      downloadBlob(blob, file.originalName);
    } catch (err) {
      toast({ title: t.error, description: "Failed to download original file.", variant: "destructive" });
    } finally {
      setIsDownloadingOrig(false);
    }
  };

  const handleDownloadConverted = async (conv: ConversionRecord) => {
    try {
      setDownloadingConvId(conv.id);
      const blob = await downloadConvertedFile(conv.id);
      const ext = conv.outputFormat;
      const baseName = file.originalName.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${baseName}.${ext}`);
    } catch (err) {
      toast({ title: t.error, description: "Failed to download converted file.", variant: "destructive" });
    } finally {
      setDownloadingConvId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card rounded-2xl p-5 shadow-lg shadow-black/5 border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
        
        {/* File Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
            <File className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground truncate" title={file.originalName}>
              {file.originalName}
            </h4>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="bg-secondary px-2 py-0.5 rounded-md font-medium">
                {formatBytes(file.sizeBytes)}
              </span>
              <span className="flex items-center gap-1 opacity-80">
                <Clock className="w-3 h-3" />
                {format(new Date(file.uploadedAt), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
          
          <div className="relative flex-1 sm:flex-none">
            <div className="flex items-center rounded-xl bg-secondary p-1 border border-border">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium hover:bg-white rounded-lg transition-colors min-w-[100px]"
                >
                  <span className="flex items-center gap-2 uppercase">
                    {FORMAT_ICONS[selectedFormat]} {selectedFormat}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "absolute top-full mt-2 w-40 bg-card rounded-xl shadow-xl border border-border py-2 z-20",
                        dir === 'rtl' ? 'right-0' : 'left-0'
                      )}
                    >
                      {(['docx', 'xlsx', 'pptx', 'png', 'jpg', 'txt'] as OutputFormat[]).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => { setSelectedFormat(fmt); setIsDropdownOpen(false); }}
                          className="w-full text-start px-4 py-2 text-sm hover:bg-secondary flex items-center gap-3 uppercase font-medium"
                        >
                          {FORMAT_ICONS[fmt]} {fmt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="w-[1px] h-6 bg-border mx-1"></div>
              <button
                onClick={handleConvert}
                disabled={convertMutation.isPending}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {convertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t.convert}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadOriginal}
              disabled={isDownloadingOrig}
              className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-gray-200 transition-colors tooltip-trigger"
              title={t.downloadOriginal}
            >
              {isDownloadingOrig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
            <button
              onClick={() => deleteMutation.mutate({ fileId: file.id })}
              disabled={deleteMutation.isPending}
              className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 hover:text-red-700 transition-colors"
              title={t.delete}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Conversions List */}
      {file.conversions && file.conversions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border/40 bg-secondary/30 -mx-5 px-5 -mb-5 pb-5 rounded-b-2xl">
          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            {t.actions} / {t.statusCompleted}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {file.conversions.map((conv) => (
              <div key={conv.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    {FORMAT_ICONS[conv.outputFormat]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold uppercase">{conv.outputFormat}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {conv.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                      {conv.status === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
                      {(conv.status === 'pending' || conv.status === 'processing') && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                      {conv.status === 'pending' ? t.statusPending : 
                       conv.status === 'processing' ? t.statusProcessing : 
                       conv.status === 'completed' ? t.statusCompleted : t.statusFailed}
                    </div>
                  </div>
                </div>
                {conv.status === 'completed' && (
                  <button
                    onClick={() => handleDownloadConverted(conv)}
                    disabled={downloadingConvId === conv.id}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center hover:bg-blue-100 transition-colors"
                  >
                    {downloadingConvId === conv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
