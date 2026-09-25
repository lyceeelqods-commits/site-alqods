export interface SiteConfig {
  schoolName: string;
  shortName: string;
  city: string;
  sector: string;
  director: string;
  viceDirector: string;
  cpe: string;
  headOfLibrary: string;
  phone: string;
  email: string;
  description: string;
  foundedInfo: string;
  studentsInfo: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  announcements: string[];
  editable: boolean;
}

export const DEFAULT_CONFIG: SiteConfig = {
  schoolName: 'الثانوية التأهيلية القدس',
  shortName: 'الثانوية التأهيلية القدس',
  city: 'القنيطرة',
  sector: 'المديرية الإقليمية بالقنيطرة',
  director: '',
  viceDirector: '',
  cpe: '',
  headOfLibrary: '',
  phone: '',
  email: '',
  description:
    'مؤسسة تعليمية تأهيلية بمدينة القنيطرة، تروم تكوين متعلمين مبادرين ومتمكنين من المكتسبات المعرفية والمهارية والقيمية، ومواطنين أوفياء للوطن ومسؤولين تجاه مجتمعهم.',
  foundedInfo: 'سيُحدَّد من لوحة الإعدادات',
  studentsInfo: 'سيُحدَّد من لوحة الإعدادات',
  lat: 34.2517086,
  lng: -6.591787,
  mapsUrl: 'https://www.google.com/maps/place/ثانوية+القدس+التأهيلية',
  announcements: [
    'مرحباً بكم في الموقع الرسمي للثانوية التأهيلية القدس بالقنيطرة',
    'التقويم التشخيصي الذاتي متاح الآن في فضاء التلاميذ لكل مستويات الثانوي التأهيلي',
    'يمكن إدارة النصوص والإعلانات من «لوحة الإعدادات» الموجودة في أسفل الموقع',
  ],
  editable: true,
};

const KEY = 'quds_school_config_v1';

export function loadConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<SiteConfig>) };
  } catch {
    /* ignore */
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(cfg: SiteConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

export function resetConfig(): SiteConfig {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return DEFAULT_CONFIG;
}

/** Sample news/announcements — clearly demo content, editable later. */
export interface NewsItem {
  id: number;
  type: 'خبر' | 'إعلان';
  title: string;
  excerpt: string;
  date: string;
  tag: string;
}

/* أخبار وإعلانات قطاع التربية الوطنية — محتوى تجريبي يُستبدل بالنصوص والروابط الرسمية. */
export interface MinistryNews {
  id: number;
  type: 'إعلان' | 'دائري' | 'خبر';
  title: string;
  excerpt: string;
  date: string;
  tag: string;
}

export const MINISTRY_NEWS: MinistryNews[] = [
  {
    id: 1,
    type: 'دائري',
    title: 'دائري تنظيم الدخول المدرسي',
    excerpt: 'توجيهات عامة لضمان دخول مدرسي ناجح: استقبال التلاميذ، تتبع المسار الدراسي، تفعيل خلايا اليقظة، وتكريس الحياة المدرسية في جميع المؤسسات.',
    date: '2025-08-25',
    tag: 'الدخول المدرسي',
  },
  {
    id: 2,
    type: 'إعلان',
    title: 'إعلان انطلاق برنامج التقويم المرحلي',
    excerpt: 'تنزيل مقتضيات التقويم المرحلي وفق المذكرات التنظيمية: التقويم التشخيصي في بداية الوحدات، التقويم التكويني، والتقويم الختامي، مع معالجة التعثرات.',
    date: '2025-09-05',
    tag: 'التقويم',
  },
  {
    id: 3,
    type: 'خبر',
    title: 'تعميم التوجيهات الخاصة بالامتحانات الوطنية',
    excerpt: 'تعميم مذكرات تنظيم الامتحانات والمباريات الوطنية: ظروف إجراء الامتحانات، لجان المراقبة، وضبط التتبع المعلوماتي لنتائج التلاميذ.',
    date: '2025-06-10',
    tag: 'الامتحانات',
  },
  {
    id: 4,
    type: 'إعلان',
    title: 'إعلان مباريات ولوج مؤسسات التكوين',
    excerpt: 'فتح باب الترشيح لمباريات الولوج إلى مؤسسات تكوين الأساتذة والأكاديميات، مع التذكير بشروط الترشيح ومعايير الانتقاء.',
    date: '2025-05-18',
    tag: 'التكوين',
  },
  {
    id: 5,
    type: 'خبر',
    title: 'المشروع الرقمي: إغناء المنصات المفتوحة للموارد',
    excerpt: 'متابعة تنزيل المشروع الرقمي المدرسي: رقمنة الموارد التعليمية، وتفعيل فضاءات الدعم الذاتي للتلاميذ في جميع السلك التعليمية.',
    date: '2025-03-30',
    tag: 'الرقمنة',
  },
  {
    id: 6,
    type: 'دائري',
    title: 'دائري تعزيز المقاربة بالأكساب داخل الأقسام',
    excerpt: 'تفعيل المقاربة الديداكتيكية المبنية على الأكساب (المعارف، المهارات، الكفايات) في جميع المواد، مع ملاءمة الأنشطة لخصوصية كل مستوى.',
    date: '2025-01-12',
    tag: 'التعلمات',
  },
];

export const MINISTRY_URL = 'https://www.men.gov.ma';

/* ==========================================================================
   العطل المدرسية — وفق المقرر الوزاري (محتوى تجريبي قابل للتعديل)
   تواريخ استرشادية: تُحدَّث بنشر المقرر الوزاري الرسمي لكل موسم دراسي.
   ========================================================================== */
export interface Holiday {
  id: number;
  name: string;
  from: string;   // YYYY-MM-DD
  to: string;     // YYYY-MM-DD
  days: string;
  scope: string;  // نطاق العطلة
  note?: string;
}

export const SCHOOL_YEAR = 'الموسم الدراسي 2025 / 2026';

export const HOLIDAYS: Holiday[] = [
  {
    id: 1,
    name: 'عطلة عرفة وعيد الأضحى المبارك',
    from: '2025-06-05',
    to: '2025-06-09',
    days: '5 أيام',
    scope: 'جميع الوسطين (حضري وقروي)',
    note: 'تُحتسب أيام العطلة ابتداءً من يوم عرفة',
  },
  {
    id: 2,
    name: 'عطلة عاشوراء',
    from: '2025-07-04',
    to: '2025-07-05',
    days: 'يومان',
    scope: 'جميع الوسطين',
  },
  {
    id: 3,
    name: 'العطلة السنوية الأولى (عطلة نهاية الدورة الأولى)',
    from: '2025-12-21',
    to: '2026-01-04',
    days: '15 يوماً',
    scope: 'جميع الوسطين',
    note: 'استئناف الدراسة يوم الاثنين الموافق 5 يناير 2026',
  },
  {
    id: 4,
    name: 'عطلة نصف السنة (الدورة الثانية)',
    from: '2026-02-08',
    to: '2026-02-15',
    days: '8 أيام',
    scope: 'جميع الوسطين',
  },
  {
    id: 5,
    name: 'عطلة عيد الفطر المبارك',
    from: '2026-03-19',
    to: '2026-03-22',
    days: '4 أيام',
    scope: 'جميع الوسطين',
  },
  {
    id: 6,
    name: 'عطلة الربيع (الأسبوع الوطني للعطل الربيعية)',
    from: '2026-04-05',
    to: '2026-04-12',
    days: '8 أيام',
    scope: 'جميع الوسطين',
  },
  {
    id: 7,
    name: 'عطلة عيد العمال (1 ماي)',
    from: '2026-05-01',
    to: '2026-05-01',
    days: 'يوم واحد',
    scope: 'جميع الوسطين',
  },
  {
    id: 8,
    name: 'العطلة السنوية الثانية (نهاية الدورة الثانية)',
    from: '2026-07-04',
    to: '2026-08-30',
    days: '58 يوماً',
    scope: 'جميع الوسطين',
    note: 'بداية الدخول المدرسي الجديد في شتنبر 2026',
  },
];

/** اليوم الوطني والمناسبات غير المدرسية (يُدرج للتوثيق) */
export const NATIONAL_DAYS: { name: string; date: string; note: string }[] = [
  { name: 'ذكرى مسيرة الخضراء', date: '2025-11-06', note: 'مناسبة وطنية' },
  { name: 'عيد الاستقلال', date: '2025-11-18', note: 'مناسبة وطنية' },
  { name: 'ذكرى تقديم وثيقة المطالبة بالاستقلال', date: '2026-01-11', note: 'مناسبة وطنية' },
  { name: 'عيد الشغل', date: '2026-05-01', note: 'يوم عطلة' },
  { name: 'عيد العرش', date: '2026-07-30', note: 'مناسبة وطنية' },
  { name: 'ذكرى استرجاع إقليم وادي الذهب', date: '2026-08-14', note: 'مناسبة وطنية' },
];

/** حساب الأيام المتبقية إلى بداية عطلة (أو أن العطلة جارية) */
export function holidayStatus(h: Holiday, today = new Date()) {
  const start = new Date(h.from + 'T00:00:00');
  const end = new Date(h.to + 'T23:59:59');
  const dayMs = 86400000;
  if (today >= start && today <= end) {
    const left = Math.ceil((end.getTime() - today.getTime()) / dayMs);
    return { state: 'ongoing' as const, left: Math.max(0, left) };
  }
  if (today < start) {
    const left = Math.ceil((start.getTime() - today.getTime()) / dayMs);
    return { state: 'upcoming' as const, left };
  }
  return { state: 'past' as const, left: 0 };
}

export function nextHoliday(today = new Date()) {
  const upcoming = HOLIDAYS.map((h) => ({ h, s: holidayStatus(h, today) })).find((x) => x.s.state !== 'past');
  return upcoming ?? null;
}

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    type: 'إعلان',
    title: 'فتح فضاء التقويم التشخيصي الذاتي',
    excerpt: 'أصبح بإمكان التلاميذ في جميع مستويات الثانوي التأهيلي إنجاز التقويم التشخيصي الرقمي في مادة الاجتماعيات من فضاء التلاميذ، والحصول على تشخيص فوري لمهاراتهم وخطة دعم فردية.',
    date: '2025-09-15',
    tag: 'رقمنة التعليم',
  },
  {
    id: 2,
    type: 'إعلان',
    title: 'الدخول المدرسي: تنظيم الأقسام والحصص',
    excerpt: 'يُعلِن المكتب التربوي أنه تم اعتماد الجدولة الزمنية الجديدة للأقسام، ويتوفر عرض الحصص داخل فضاء الأساتذة. يُرجى من الجميع التأكيد على احترام المواقيت.',
    date: '2025-09-10',
    tag: 'تنظيم',
  },
  {
    id: 3,
    type: 'خبر',
    title: 'انطلاق أنشطة الأندية التربوية',
    excerpt: 'انطلقت برمجية الأندية التربوية للموسم الجاري: نادي المسرح، نادي الراديو، نادي البيئة، نادي القراءة…، وفق جذاذة الأنشطة المعتمدة داخل الحياة المدرسية.',
    date: '2025-09-08',
    tag: 'الحياة المدرسية',
  },
  {
    id: 4,
    type: 'خبر',
    title: 'حصة توعوية حول الأمن الرقمي والوعي الإخباري',
    excerpt: 'نظمت المؤسسة حصة تربوية حول الاستخدام الآمن للتقنيات الرقمية، ومسؤوليات المتعلم في الفضاء الرقمي، بإشراف هيئة الأساتذة وبمبادرة من نادي المواطنة.',
    date: '2025-09-02',
    tag: 'المواطنة',
  },
  {
    id: 5,
    type: 'إعلان',
    title: 'تفعيل الموارد التعليمية الرقمية',
    excerpt: 'تم إغناء خزانة الموارد الرقمية بالموقع (دروس، أوراق مذكرية، تمارين موجهة) موزعة حسب المستويات والمواد، وتتجدد باستمرار بدعم من أساتذة المؤسسة.',
    date: '2025-08-28',
    tag: 'الرقمنة',
  },
  {
    id: 6,
    type: 'خبر',
    title: 'تظاهرة اليوم الوطني للكتاب',
    excerpt: 'تحيي المؤسسة اليوم الوطني للكتاب بأنشطة: معارض للقراءة، ورشات للكتابة الإبداعية، وقراءات صامتة جماعية، في إطار شراكة مفتوحة مع فضاءات القراءة بالمدينة.',
    date: '2025-03-12',
    tag: 'قراءة',
  },
];
