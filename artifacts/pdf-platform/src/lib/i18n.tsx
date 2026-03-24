import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ar';

type Dictionary = {
  appTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  uploadDragDrop: string;
  uploadBrowse: string;
  uploading: string;
  supportedFormats: string;
  myFiles: string;
  noFilesTitle: string;
  noFilesDesc: string;
  size: string;
  uploaded: string;
  convert: string;
  downloadOriginal: string;
  downloadConverted: string;
  delete: string;
  deleting: string;
  statusPending: string;
  statusProcessing: string;
  statusCompleted: string;
  statusFailed: string;
  selectFormat: string;
  convertTo: string;
  actions: string;
  converting: string;
  error: string;
  success: string;
};

const translations: Record<Language, Dictionary> = {
  en: {
    appTitle: "PDF Matrix",
    heroTitle: "Transform Your PDFs Instantly",
    heroSubtitle: "The fast, secure, and professional way to convert your PDF files into Word, Excel, PowerPoint, and high-quality images.",
    uploadDragDrop: "Drag & drop your PDF here",
    uploadBrowse: "or click to browse",
    uploading: "Uploading securely...",
    supportedFormats: "Supports PDF up to 50MB. Output to DOCX, XLSX, PPTX, PNG, JPG, TXT.",
    myFiles: "My Documents",
    noFilesTitle: "No files uploaded yet",
    noFilesDesc: "Upload your first PDF above to start converting.",
    size: "Size",
    uploaded: "Uploaded",
    convert: "Convert",
    downloadOriginal: "Original",
    downloadConverted: "Download",
    delete: "Delete",
    deleting: "Deleting...",
    statusPending: "Pending",
    statusProcessing: "Processing",
    statusCompleted: "Completed",
    statusFailed: "Failed",
    selectFormat: "Select output format",
    convertTo: "Convert to",
    actions: "Actions",
    converting: "Starting conversion...",
    error: "An error occurred",
    success: "Success",
  },
  ar: {
    appTitle: "ماتريكس PDF",
    heroTitle: "حوّل ملفات PDF الخاصة بك فوراً",
    heroSubtitle: "الطريقة السريعة، الآمنة، والاحترافية لتحويل ملفات PDF إلى وورد، إكسل، باوربوينت، وصور عالية الجودة.",
    uploadDragDrop: "اسحب وأفلت ملف PDF هنا",
    uploadBrowse: "أو انقر للتصفح",
    uploading: "جاري الرفع بأمان...",
    supportedFormats: "يدعم PDF حتى 50 ميجابايت. المخرجات: DOCX, XLSX, PPTX, PNG, JPG, TXT.",
    myFiles: "مستنداتي",
    noFilesTitle: "لم يتم رفع أي ملفات بعد",
    noFilesDesc: "قم برفع أول ملف PDF أعلاه للبدء بالتحويل.",
    size: "الحجم",
    uploaded: "تاريخ الرفع",
    convert: "تحويل",
    downloadOriginal: "الأصلي",
    downloadConverted: "تنزيل",
    delete: "حذف",
    deleting: "جاري الحذف...",
    statusPending: "قيد الانتظار",
    statusProcessing: "جاري المعالجة",
    statusCompleted: "مكتمل",
    statusFailed: "فشل",
    selectFormat: "اختر صيغة المخرجات",
    convertTo: "تحويل إلى",
    actions: "الإجراءات",
    converting: "جاري بدء التحويل...",
    error: "حدث خطأ",
    success: "نجاح",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'ar') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    dir,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
