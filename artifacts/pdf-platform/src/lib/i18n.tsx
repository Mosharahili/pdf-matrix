import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'ar' | 'fr' | 'es' | 'tr' | 'ur';

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
  },
  fr: {
    appTitle: "PDF Matrix",
    heroTitle: "Transformez vos PDF instantanément",
    heroSubtitle: "La façon rapide, sécurisée et professionnelle de convertir vos fichiers PDF en Word, Excel, PowerPoint et images haute qualité.",
    uploadDragDrop: "Glissez-déposez votre PDF ici",
    uploadBrowse: "ou cliquez pour parcourir",
    uploading: "Téléchargement sécurisé...",
    supportedFormats: "Supporte les PDF jusqu'à 50 Mo. Sortie en DOCX, XLSX, PPTX, PNG, JPG, TXT.",
    myFiles: "Mes Documents",
    noFilesTitle: "Aucun fichier téléchargé",
    noFilesDesc: "Téléchargez votre premier PDF ci-dessus pour commencer la conversion.",
    size: "Taille",
    uploaded: "Téléchargé le",
    convert: "Convertir",
    downloadOriginal: "Original",
    downloadConverted: "Télécharger",
    delete: "Supprimer",
    deleting: "Suppression...",
    statusPending: "En attente",
    statusProcessing: "En cours",
    statusCompleted: "Terminé",
    statusFailed: "Échoué",
    selectFormat: "Choisir le format de sortie",
    convertTo: "Convertir en",
    actions: "Actions",
    converting: "Démarrage de la conversion...",
    error: "Une erreur s'est produite",
    success: "Succès",
  },
  es: {
    appTitle: "PDF Matrix",
    heroTitle: "Transforma tus PDFs al instante",
    heroSubtitle: "La forma rápida, segura y profesional de convertir tus archivos PDF a Word, Excel, PowerPoint e imágenes de alta calidad.",
    uploadDragDrop: "Arrastra y suelta tu PDF aquí",
    uploadBrowse: "o haz clic para buscar",
    uploading: "Subiendo de forma segura...",
    supportedFormats: "Compatible con PDF de hasta 50 MB. Salida en DOCX, XLSX, PPTX, PNG, JPG, TXT.",
    myFiles: "Mis Documentos",
    noFilesTitle: "No hay archivos subidos aún",
    noFilesDesc: "Sube tu primer PDF arriba para empezar a convertir.",
    size: "Tamaño",
    uploaded: "Subido",
    convert: "Convertir",
    downloadOriginal: "Original",
    downloadConverted: "Descargar",
    delete: "Eliminar",
    deleting: "Eliminando...",
    statusPending: "Pendiente",
    statusProcessing: "Procesando",
    statusCompleted: "Completado",
    statusFailed: "Fallido",
    selectFormat: "Seleccionar formato de salida",
    convertTo: "Convertir a",
    actions: "Acciones",
    converting: "Iniciando conversión...",
    error: "Ocurrió un error",
    success: "Éxito",
  },
  tr: {
    appTitle: "PDF Matrix",
    heroTitle: "PDF Dosyalarınızı Anında Dönüştürün",
    heroSubtitle: "PDF dosyalarınızı Word, Excel, PowerPoint ve yüksek kaliteli görüntülere dönüştürmenin hızlı, güvenli ve profesyonel yolu.",
    uploadDragDrop: "PDF'inizi buraya sürükleyip bırakın",
    uploadBrowse: "veya göz atmak için tıklayın",
    uploading: "Güvenli yükleme yapılıyor...",
    supportedFormats: "50 MB'a kadar PDF desteklenir. DOCX, XLSX, PPTX, PNG, JPG, TXT çıktısı.",
    myFiles: "Belgelerim",
    noFilesTitle: "Henüz dosya yüklenmedi",
    noFilesDesc: "Dönüştürmeye başlamak için yukarıya ilk PDF'inizi yükleyin.",
    size: "Boyut",
    uploaded: "Yüklendi",
    convert: "Dönüştür",
    downloadOriginal: "Orijinal",
    downloadConverted: "İndir",
    delete: "Sil",
    deleting: "Siliniyor...",
    statusPending: "Bekliyor",
    statusProcessing: "İşleniyor",
    statusCompleted: "Tamamlandı",
    statusFailed: "Başarısız",
    selectFormat: "Çıktı formatını seçin",
    convertTo: "Dönüştür:",
    actions: "İşlemler",
    converting: "Dönüştürme başlatılıyor...",
    error: "Bir hata oluştu",
    success: "Başarılı",
  },
  ur: {
    appTitle: "پی ڈی ایف میٹرکس",
    heroTitle: "اپنی پی ڈی ایف فوری تبدیل کریں",
    heroSubtitle: "اپنی پی ڈی ایف فائلوں کو ورڈ، ایکسل، پاور پوائنٹ اور اعلیٰ معیار کی تصاویر میں تبدیل کرنے کا تیز، محفوظ اور پیشہ ورانہ طریقہ۔",
    uploadDragDrop: "اپنی پی ڈی ایف یہاں گھسیٹ کر چھوڑیں",
    uploadBrowse: "یا براؤز کرنے کے لیے کلک کریں",
    uploading: "محفوظ طریقے سے اپلوڈ ہو رہا ہے...",
    supportedFormats: "50 ایم بی تک پی ڈی ایف سپورٹ کرتا ہے۔ آؤٹ پٹ: DOCX, XLSX, PPTX, PNG, JPG, TXT۔",
    myFiles: "میرے دستاویزات",
    noFilesTitle: "ابھی تک کوئی فائل اپلوڈ نہیں ہوئی",
    noFilesDesc: "تبدیل کرنا شروع کرنے کے لیے اوپر اپنی پہلی پی ڈی ایف اپلوڈ کریں۔",
    size: "سائز",
    uploaded: "اپلوڈ تاریخ",
    convert: "تبدیل کریں",
    downloadOriginal: "اصل",
    downloadConverted: "ڈاؤن لوڈ",
    delete: "حذف کریں",
    deleting: "حذف ہو رہا ہے...",
    statusPending: "زیر التواء",
    statusProcessing: "پروسیسنگ",
    statusCompleted: "مکمل",
    statusFailed: "ناکام",
    selectFormat: "آؤٹ پٹ فارمیٹ منتخب کریں",
    convertTo: "تبدیل کریں:",
    actions: "اقدامات",
    converting: "تبدیلی شروع ہو رہی ہے...",
    error: "ایک خرابی پیش آئی",
    success: "کامیاب",
  },
};

export const RTL_LANGUAGES: Language[] = ['ar', 'ur'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  ar: 'العربية',
  fr: 'Français',
  es: 'Español',
  tr: 'Türkçe',
  ur: 'اردو',
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
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') as Language;
    if (urlLang && urlLang in translations) return urlLang;
    const saved = localStorage.getItem('app_language') as Language;
    if (saved && saved in translations) return saved;
    const browser = navigator.language.slice(0, 2) as Language;
    return browser in translations ? browser : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const isRTL = RTL_LANGUAGES.includes(language);
  const dir: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr';

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
