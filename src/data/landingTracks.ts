/* بطاقات المسالك الثمانية كما تعرض في صفحة التقويم التشخيصي */
export type LandingLevel = 'jc' | 'bac1' | 'bac2';

export interface LandingTrack {
  level: LandingLevel;
  levelId: string;
  title: string;
  desc: string;
  tags: [string, string];
  available: boolean;
  featured?: boolean;
}

export const LANDING_LEVELS: { id: LandingLevel; num: number; title: string }[] = [
  { id: 'jc', num: 1, title: 'الجذع المشترك' },
  { id: 'bac1', num: 2, title: 'الأولى بكالوريا' },
  { id: 'bac2', num: 3, title: 'الثانية بكالوريا' },
];

export const LANDING_TRACKS: LandingTrack[] = [
  /* الجذع المشترك */
  {
    level: 'jc', levelId: 'jc_adab',
    title: 'الجذع المشترك آداب وعلوم إنسانية',
    desc: 'مكتسبات الإعدادي مع تعمق في تحليل الوثائق والاستنتاج',
    tags: ['وثائق وزمنيات', 'تطور العالم 15–18م'],
    available: true,
  },
  {
    level: 'jc', levelId: 'jc_sciences',
    title: 'الجذع المشترك العلمي',
    desc: 'تقويم شامل للمكتسبات القبلية بالمسلك العلمي والتكنولوجي',
    tags: ['مكتسبات إعدادي للتاريخ والجغرافيا', 'قراءة وثائق ومبيانات'],
    available: true, featured: true,
  },
  {
    level: 'jc', levelId: 'jc_originel',
    title: 'الجذع المشترك للتعليم الأصيل',
    desc: 'تقويم منطلق لعالم التعليم الأصيل مع وثائق منسجمة',
    tags: ['مفاهيم وثوابت تاريخية', 'بنية الدروس بالمجال الإسلامي'],
    available: true,
  },
  /* الأولى بكالوريا */
  {
    level: 'bac1', levelId: 'bac1_adab',
    title: 'الأولى بكالوريا آداب وعلوم إنسانية',
    desc: 'مكتسبات عام 1945 والتاريخ المعاصر + جغرافيا السكان والموارد',
    tags: ['الحربان والأنظمة الدولية', 'سكان العالم'],
    available: true,
  },
  {
    level: 'bac1', levelId: 'bac1_sciences',
    title: 'الأولى بكالوريا علوم',
    desc: 'تقويم مكتسبات الجذع المشترك مع ميل لمهارات البيئة والمنهج العلمي',
    tags: ['تاريخ 15–20م', 'كوارث ووسط طبيعي'],
    available: true,
  },
  {
    level: 'bac1', levelId: 'bac1_sciences_exp',
    title: 'الأولى بكالوريا علوم تجريبية',
    desc: 'تشخيص مهارات الوثائق والتحليل التجريبي بمفاهيم المادة وقواعد التكنولوجية',
    tags: ['منهجيته العلمية', 'وثائق وجداول بيانية'],
    available: true,
  },
  /* الثانية بكالوريا */
  {
    level: 'bac2', levelId: 'bac2_adab',
    title: 'الثانية بكالوريا آداب',
    desc: 'مكتسبات الأولى بكالوريا: الحماية والحركة الوطنية + العالم بعد 1945 + جغرافيا المغرب',
    tags: ['المغرب من 1912 إلى اليوم', 'العالم بعد 1945'],
    available: true,
  },
  {
    level: 'bac2', levelId: 'bac2_sciences_humaines',
    title: 'الثانية بكالوريا علوم',
    desc: 'نفس محاور الآداب مع تعمق في الجغرافيا الاقتصادية والاجتماعية وقضايا التنمية',
    tags: ['الحركة الوطنية', 'العالم بعد 1945'],
    available: true,
  },
];

export const QUESTION_TYPES = [
  'اختيار من متعدد',
  'صح / خطأ',
  'ترتيب أحداث',
  'ربط مفاهيم',
  'تحليل وثيقة',
  'قراءة جدول ومبيان',
  'كتابة فقرة',
];
