/* ==========================================================================
   مكتبة الامتحانات الوطنية والجهوية — مادة الاجتماعيات
   بنية قابلة للتوسع: إضافة سنة أو مدينة = عنصر واحد في المصفوفة
   ========================================================================== */

export type ExamCity =
  | 'الداخلة - وادي الذهب'
  | 'الدار البيضاء - سطات'
  | 'الرباط - سلا - القنيطرة'
  | 'بني ملال - خنيفرة'
  | 'درعة - تافيلالت'
  | 'سوس - ماسة'
  | 'كلميم - واد نون'
  | 'مراكش - آسفي';

export type ExamSession = 'الدورة العادية' | 'الدورة الاستدراكية';
export type ExamLevel = 'الأولى باكالوريا' | 'الثانية باكالوريا';

export interface ExamDoc {
  id: string;
  year: number;
  city: ExamCity;
  session: ExamSession;
  level: ExamLevel;
  branch: string;
  /** حجم الملف بالكيلوبايت (استرشادي) */
  subjectKb: number;
  correctionsKb?: number;
  /** محتوى مضمّن داخل الموقع — يُعرض في العارض */
  inline: {
    intro: string;
    questions: {
      q: string;
      options: string[];
      answer: number;
      explain: string;
      level: 'معرفة' | 'فهم' | 'استنتاج';
    }[];
  };
}

/* ---------- مولّد محتوى مضمّن حسب السنة والمدينة ---------- */
function buildInline(year: number, city: string, session: ExamSession) {
  return {
    intro: `امتحان ${session} — ${year} — مركز ${city}. نموذج تدريبي مطابق لبنية الامتحان الرسمي في مادة الاجتماعيات (التاريخ والجغرافيا)، مع التصحيح والتعليل لكل سؤال.`,
    questions: [
      {
        q: 'ما المقصود بنظام «الحماية» الذي فُرض على المغرب سنة 1912؟',
        options: [
          'استعمار مباشر بإلغاء العرش',
          'استعمار غير مباشر مع بقاء السلطان شكلياً',
          'استقلال تام تحت الوصية',
          'اتحاد فيدرالي مع فرنسا',
        ],
        answer: 1,
        explain: 'نظام الحماية أبقى للسلطان الواجهة الرسمية بينما انتقلت الصلاحيات الفعلية إلى المقيم العام — وهو استعمار غير مباشر. (مستوى: فهم)',
        level: 'فهم' as const,
      },
      {
        q: 'رتب الأحداث التالية ترتيباً زمنياً: (1) المسيرة الخضراء (2) معاهدة الحماية (3) الاستقلال (4) نفي محمد الخامس',
        options: [
          '2 ← 4 ← 3 ← 1',
          '4 ← 2 ← 3 ← 1',
          '2 ← 3 ← 4 ← 1',
          '1 ← 2 ← 3 ← 4',
        ],
        answer: 0,
        explain: 'الحماية (1912) ← نفي محمد الخامس (1953) ← الاستقلال (1956) ← المسيرة الخضراء (1975). (مستوى: توطين زمني)',
        level: 'فهم' as const,
      },
      {
        q: 'من خلال الجدول: طنجة 850 مم / الدار البيضاء 420 مم / مراكش 240 مم — استنتج التوزيع المكاني للمطرية بالمغرب.',
        options: [
          'المطرية تتوزع بانتظام على التراب الوطني',
          'المطرية تنخفض من الشمال الغربي نحو الجنوب والشرق',
          'المطرية ترتفع في الداخل وتنخفض في الساحل',
          'المطرية مرتبطة بالارتفاع فقط',
        ],
        answer: 1,
        explain: 'المعطيات تُظهر تدرجاً تنازلياً من طنجة (850) إلى مراكش (240)، ما يعكس تأثير المنخفضات المتوسطية والقرب من البحر. (مستوى: استنتاج)',
        level: 'استنتاج' as const,
      },
      {
        q: 'ما الدور المناخي للسلاسل الأطلسية في المغرب؟',
        options: [
          'زيادة المطرية في المجال الصحراوي',
          'حاجز بين المجال الشمالي الرطب والجنوبي الجاف',
          'لا دور مناخي يُذكر',
          'تخفيف البرودة في المناطق الجبلية',
        ],
        answer: 1,
        explain: 'تحجب السلاسل الأطلسية الكتل الهوائية الرطبة القادمة من الشمال الغربي، فيصبح المجال الجنوبي والشرقي جافاً. (مستوى: تحليل)',
        level: 'فهم' as const,
      },
      {
        q: 'ما المقصود بـ «التمدين» في الجغرافيا البشرية؟',
        options: [
          'تمدد المساحات المبنية داخل المدن',
          'ارتفاع نسبة السكان الحضريين من مجموع السكان',
          'هجرة السكان من المدن إلى القرى',
          'توزيع السكان بانسجام على التراب',
        ],
        answer: 1,
        explain: 'التمدين مؤشر كمي: نسبة سكان المدن من مجموع السكان. أما التوسع الحضري فيعني تمدد المساحة المبنية. (مستوى: مفاهيم)',
        level: 'معرفة' as const,
      },
      {
        q: 'بماذا تميزت الدولة المرينية في المجال الحضاري والعلمي؟',
        options: [
          'بناء المدارس العلمية ودعم الحركة العلمية',
          'فتح المغرب على الأندلس عسكرياً',
          'إنشاء أول جامعة بالمغرب',
          'توحيد المغرب والأندلس سياسياً',
        ],
        answer: 0,
        explain: 'عرفت الدولة المرينية (1244-1465) ازدهاراً في بناء المدارس (المدرسة العطارين، المدرسة المرينية) ودعماً للعلماء. (مستوى: معرفة)',
        level: 'معرفة' as const,
      },
    ],
  };
}

/* ---------- توليد بنك الامتحانات (2012 — 2024) ---------- */
export const REGION_COUNTS: Record<ExamCity, number> = {
  'الداخلة - وادي الذهب': 14,
  'الدار البيضاء - سطات': 6,
  'الرباط - سلا - القنيطرة': 10,
  'بني ملال - خنيفرة': 17,
  'درعة - تافيلالت': 12,
  'سوس - ماسة': 12,
  'كلميم - واد نون': 15,
  'مراكش - آسفي': 8,
};

const CITIES: ExamCity[] = [
  'الداخلة - وادي الذهب',
  'الدار البيضاء - سطات',
  'الرباط - سلا - القنيطرة',
  'بني ملال - خنيفرة',
  'درعة - تافيلالت',
  'سوس - ماسة',
  'كلميم - واد نون',
  'مراكش - آسفي',
];

function generateExams(): ExamDoc[] {
  const exams: ExamDoc[] = [];
  const years = Array.from({ length: 13 }, (_, i) => 2024 - i); // 2024 → 2012

  // Distinct distribution matching REGION_COUNTS (Total = 94 exams)
  const targetCounts: Record<ExamCity, number> = {
    'بني ملال - خنيفرة': 17,
    'كلميم - واد نون': 15,
    'الداخلة - وادي الذهب': 14,
    'درعة - تافيلالت': 12,
    'سوس - ماسة': 12,
    'الرباط - سلا - القنيطرة': 10,
    'مراكش - آسفي': 8,
    'الدار البيضاء - سطات': 6,
  };

  const currentCounts: Record<ExamCity, number> = {
    'بني ملال - خنيفرة': 0,
    'كلميم - واد نون': 0,
    'الداخلة - وادي الذهب': 0,
    'درعة - تافيلالت': 0,
    'سوس - ماسة': 0,
    'الرباط - سلا - القنيطرة': 0,
    'مراكش - آسفي': 0,
    'الدار البيضاء - سطات': 0,
  };

  // 2024 specific top entries to match the screenshot precisely
  exams.push({
    id: 'ex-2024-bmk-1',
    year: 2024,
    city: 'بني ملال - خنيفرة',
    session: 'الدورة العادية',
    level: 'الأولى باكالوريا',
    branch: 'التاريخ والجغرافيا · الأولى باكالوريا',
    subjectKb: 372,
    correctionsKb: 337,
    inline: buildInline(2024, 'بني ملال - خنيفرة', 'الدورة العادية'),
  });
  currentCounts['بني ملال - خنيفرة']++;

  exams.push({
    id: 'ex-2024-dakhla-1',
    year: 2024,
    city: 'الداخلة - وادي الذهب',
    session: 'الدورة العادية',
    level: 'الأولى باكالوريا',
    branch: 'التاريخ والجغرافيا · الأولى باكالوريا',
    subjectKb: 284,
    correctionsKb: 421,
    inline: buildInline(2024, 'الداخلة - وادي الذهب', 'الدورة العادية'),
  });
  currentCounts['الداخلة - وادي الذهب']++;

  // 4 other exams for 2024 to make it exactly 6 exams in 2024 (as shown in badge "6 امتحانات")
  const other2024Cities: ExamCity[] = ['كلميم - واد نون', 'درعة - تافيلالت', 'سوس - ماسة', 'الرباط - سلا - القنيطرة'];
  other2024Cities.forEach((c, idx) => {
    exams.push({
      id: `ex-2024-${idx + 3}`,
      year: 2024,
      city: c,
      session: 'الدورة العادية',
      level: 'الأولى باكالوريا',
      branch: 'التاريخ والجغرافيا · الأولى باكالوريا',
      subjectKb: 310 + (idx * 25),
      correctionsKb: 340 + (idx * 15),
      inline: buildInline(2024, c, 'الدورة العادية'),
    });
    currentCounts[c]++;
  });

  // Distribute the remaining exams across 2023 down to 2012
  const remainingYears = years.filter((y) => y !== 2024);
  let yearIndex = 0;

  (Object.keys(targetCounts) as ExamCity[]).forEach((c) => {
    while (currentCounts[c] < targetCounts[c]) {
      const y = remainingYears[yearIndex % remainingYears.length];
      const isRetake = currentCounts[c] % 3 === 0;
      const session: ExamSession = isRetake ? 'الدورة الاستدراكية' : 'الدورة العادية';
      exams.push({
        id: `ex-${y}-${c}-${currentCounts[c]}`,
        year: y,
        city: c,
        session,
        level: 'الأولى باكالوريا',
        branch: 'التاريخ والجغرافيا · الأولى باكالوريا',
        subjectKb: 260 + ((currentCounts[c] * 19) % 180),
        correctionsKb: 300 + ((currentCounts[c] * 23) % 160),
        inline: buildInline(y, c, session),
      });
      currentCounts[c]++;
      yearIndex++;
    }
  });

  return exams;
}

export const EXAMS: ExamDoc[] = generateExams();

export const EXAM_YEARS: number[] = Array.from(new Set(EXAMS.map((e) => e.year))).sort((a, b) => b - a);

export const EXAM_CITIES: { name: ExamCity; count: number }[] =
  CITIES.map((name) => ({
    name,
    count: EXAMS.filter((e) => e.city === name).length,
  }));

export const EXAM_STATS = {
  total: EXAMS.length,
  totalKb: EXAMS.reduce((s, e) => s + e.subjectKb + (e.correctionsKb ?? 0), 0),
  years: EXAM_YEARS.length,
  cities: CITIES.length,
};

/** استخراج نص تقرير الامتحان (للتنزيل والنسخ) */
export function examToText(e: ExamDoc): string {
  const lines = [
    '══════════════════════════════════════════',
    ` امتحان ${e.session} — ${e.year}`,
    ` مركز: ${e.city}`,
    ` المستوى: ${e.level}`,
    ` المادة: الاجتماعيات (التاريخ والجغرافيا)`,
    ` إعداد: الأستاذ عماد طليل — الثانوية التأهيلية القدس، القنيطرة`,
    '══════════════════════════════════════════',
    '',
    e.inline.intro,
    '',
    '— الأسئلة والتصحيح —',
    '',
  ];
  e.inline.questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.q}`);
    q.options.forEach((o, j) => lines.push(`   ${String.fromCharCode(65 + j)}) ${o}`));
    lines.push(`   ✦ الجواب الصحيح: ${String.fromCharCode(65 + q.answer)}`);
    lines.push(`   ✦ التعليل: ${q.explain}`);
    lines.push('');
  });
  lines.push('— انتهى —');
  return lines.join('\n');
}
