import type { Question } from '../types';

export type SupportLevel = 'green' | 'yellow' | 'red';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
};

/** تصنيف الصعوبة: حقل اختياري في البيانات، وإلا اشتقاق منطقي من نوع السؤال ونقطته. */
export function getDifficulty(q: Question): Difficulty {
  if (q.difficulty) return q.difficulty;
  if (q.points >= 2 || q.type === 'document' || q.type === 'lien') return 'hard';
  if (q.type === 'vrai_faux') return 'easy';
  return 'medium';
}

export interface SkillResult {
  name: string;
  sujet: 'histoire' | 'geographie';
  score: number;
  total: number;
  percent: number;
  status: 'mastery' | 'mid' | 'weak';
}

export interface PlanWeek {
  week: string;
  title: string;
  items: string[];
}

export interface Diagnosis {
  historyScore: number;
  geoScore: number;
  historyMax: number;
  geoMax: number;
  totalScore: number;
  maxTotal: number;
  percent: number;
  correct: number;
  wrong: number;
  unanswered: number;
  mastery: { label: string; tone: SupportLevel };
  support: SupportLevel;
  supportLabel: string;
  supportReason: string;
  skills: SkillResult[];
  strengths: SkillResult[];
  weaknesses: SkillResult[];
  diagnosis: string[];
  recommendations: string[];
  plan: PlanWeek[];
  /** تصحيح مفصل لكل سؤال — يُعرض بعد إنهاء التقويم */
  review: ReviewItem[];
}

/** عنصر تصحيح: السؤال + إجابة التلميذ + الإجابة الصحيحة + التعليل */
export interface ReviewItem {
  index: number;
  question: string;
  type: Question['type'];
  sujet: 'histoire' | 'geographie';
  competence: string;
  difficulty: Difficulty;
  points: number;
  options?: string[];
  /** نص إجابة التلميذ (أو null إن لم يجب) */
  userText: string | null;
  /** نص الإجابة الصحيحة */
  correctText: string;
  ok: boolean;
  answered: boolean;
  explain?: string;
}

/** تحويل قيمة الإجابة إلى نص مقروء حسب نوع السؤال */
export function answerToText(q: Question, val: AnswerValue | undefined): string | null {
  if (val === undefined) return null;
  // ربط المفاهيم
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const pairs = val as Record<string, string>;
    const entries = Object.entries(pairs).filter(([, v]) => v);
    if (entries.length === 0) return null;
    return entries.map(([k, v]) => `${k} ← ${v}`).join(' · ');
  }
  // ترتيب الأحداث
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    const opts = q.options ?? [];
    return val.map((i, n) => `${n + 1}) ${opts[i] ?? '—'}`).join(' · ');
  }
  return String(val);
}

function buildReview(questions: Question[], answers: Record<number, AnswerValue>): ReviewItem[] {
  return questions.map((q, i) => {
    const user = answers[q.id];
    const ok = isCorrect(q, user);
    return {
      index: i + 1,
      question: q.texte,
      type: q.type,
      sujet: q.sujet,
      competence: q.competence,
      difficulty: getDifficulty(q),
      points: q.points,
      options: q.options,
      userText: answerToText(q, user),
      correctText:
        q.type === 'essay'
          ? 'سؤال تعبيري — يُصحَّح وفق معايير التنظيم والمفاهيم والربط المنطقي'
          : (answerToText(q, q.reponse as AnswerValue) ?? '—'),
      ok,
      answered: q.type === 'essay' ? (typeof user === 'string' && user.trim().length > 0) : user !== undefined,
      explain: q.explication,
    };
  });
}

export type AnswerValue = string | number[] | Record<string, string>;

export function isCorrect(q: Question, user: AnswerValue | undefined): boolean {
  if (user === undefined) return false;

  // سؤال التعبير الكتابي: يُعتبر مستجيباً (لا يُصحَّح آلياً، بل تقويم ذاتي)
  if (q.type === 'essay') {
    return typeof user === 'string' && user.trim().split(/\s+/).filter(Boolean).length >= 25;
  }

  // سؤال الإجابة القصيرة: مطابقة مرنة عبر الكلمات المفتاحية
  if (q.type === 'short_answer' && typeof user === 'string') {
    const norm = (s: string) => s.trim().toLowerCase().replace(/[؟?!.,،:]/g, '');
    const given = norm(user);
    if (!given) return false;
    // مطابقة مباشرة مع الإجابة النموذجية
    if (norm(String(q.reponse)) && given.includes(norm(String(q.reponse)))) return true;
    // مطابقة عبر الكلمات المفتاحية: تكفي كلمة واحدة صحيحة
    if (q.keywords && q.keywords.length) {
      return q.keywords.some((k) => given.includes(norm(k)));
    }
    return given === norm(String(q.reponse));
  }

  // order-independent comparison for matching (lien) answers
  if (
    user && typeof user === 'object' && !Array.isArray(user) &&
    q.reponse && typeof q.reponse === 'object' && !Array.isArray(q.reponse)
  ) {
    const a = user as Record<string, string>;
    const b = q.reponse as Record<string, string>;
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    return keys.every((k) => a[k] === b[k]);
  }
  return JSON.stringify(user) === JSON.stringify(q.reponse);
}

export function computeScores(questions: Question[], answers: Record<number, AnswerValue>) {
  let historyScore = 0;
  let geoScore = 0;
  let historyMax = 0;
  let geoMax = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  const skillMap = new Map<string, SkillResult>();

  questions.forEach((q) => {
    const user = answers[q.id];
    const ok = isCorrect(q, user);
    const pts = ok ? q.points : 0;
    if (q.sujet === 'histoire') {
      historyScore += pts;
      historyMax += q.points;
    } else {
      geoScore += pts;
      geoMax += q.points;
    }
    if (user === undefined) unanswered += 1;
    else if (ok) correct += 1;
    else wrong += 1;

    const key = `${q.sujet}|${q.competence}`;
    const cur = skillMap.get(key) || {
      name: q.competence,
      sujet: q.sujet,
      score: 0,
      total: 0,
      percent: 0,
      status: 'weak' as const,
    };
    cur.total += q.points;
    cur.score += pts;
    skillMap.set(key, cur);
  });

  const skills: SkillResult[] = Array.from(skillMap.values()).map((s) => {
    const percent = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
    const status = percent >= 70 ? 'mastery' : percent >= 50 ? 'mid' : 'weak';
    return { ...s, percent, status };
  });

  const maxTotal = questions.reduce((s, q) => s + q.points, 0);
  const totalScore = historyScore + geoScore;
  const percent = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;
  return { historyScore, geoScore, historyMax, geoMax, totalScore, maxTotal, percent, correct, wrong, unanswered, skills };
}

/** مستويات التحكم الخمسة وفق سلم النقاط /20 المطلوب */
export function masteryBand(score: number, max: number): { label: string; tone: SupportLevel } {
  const p = max > 0 ? (score / max) * 20 : 0; // توحيد على سلم /20
  if (p >= 17) return { label: 'ممتاز', tone: 'green' };
  if (p >= 14) return { label: 'جيد', tone: 'green' };
  if (p >= 10) return { label: 'متوسط', tone: 'yellow' };
  if (p >= 6) return { label: 'ضعيف', tone: 'red' };
  return { label: 'ضعيف جداً', tone: 'red' };
}

export function masteryOf(percent: number) {
  // توحيد النسبة المئوية على السلم الخماسي المطلوب
  if (percent >= 85) return { label: 'مستوى ممتاز', tone: 'green' as SupportLevel };
  if (percent >= 70) return { label: 'مستوى جيد', tone: 'green' as SupportLevel };
  if (percent >= 50) return { label: 'مستوى متوسط — يحتاج إلى دعم جزئي', tone: 'yellow' as SupportLevel };
  if (percent >= 30) return { label: 'مستوى ضعيف', tone: 'red' as SupportLevel };
  return { label: 'ضعيف جداً — يحتاج إلى الدعم والمعالجة', tone: 'red' as SupportLevel };
}

export function supportOf(percent: number, weaknesses: SkillResult[]): { level: SupportLevel; label: string; reason: string } {
  if (percent < 50 || weaknesses.length >= 3) {
    return {
      level: 'red',
      label: 'يحتاج إلى دعم ومعالجة',
      reason: 'النتيجة الإجمالية ضعيفة أو ظهرت تعثرات متعددة في أكثر من مهارة. يُنصح بخطة معالجة مكثفة مع متابعة أسبوعية.',
    };
  }
  if (percent < 80 || weaknesses.length >= 1) {
    return {
      level: 'yellow',
      label: 'يحتاج إلى دعم جزئي',
      reason: 'أداء مقبول مع تعثرات محددة في بعض المهارات. يكفي دعم موجّه يستهدف مواطن الضعف المكتشفة.',
    };
  }
  return {
    level: 'green',
    label: 'لا يحتاج إلى دعم مكثف',
    reason: 'النتائج جيدة جداً في جميع المهارات. يمكن المتابعة بالتقويم الدوري وتثبيت المكتسبات.',
  };
}

/** تشخيص سردي تربوي مرتبط بالمهارات (لا بالعلامة فقط). */
export function narrative(skills: SkillResult[], subjectLabel: string): string | null {
  if (skills.length === 0) return null;
  const sorted = [...skills].sort((a, b) => b.percent - a.percent);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const secondWorst = sorted[sorted.length - 2];

  if (worst.percent >= 60) {
    return `يتحكم المتعلم بشكل جيد في مهارات ${subjectLabel}، ويُبرز أداءً متميزاً في «${best.name}» (${best.percent}%).`;
  }
  if (best.percent >= 60 && worst.percent < 60) {
    return `مستوى التحكّم جيد في «${best.name}»، بينما يحتاج المتعلم إلى دعم في «${worst.name}» (${worst.percent}%) ضمن ${subjectLabel}.`;
  }
  if (best.percent >= 50) {
    return `تحكّم متوسط في ${subjectLabel}: تتضح نقطة القوة في «${best.name}»، مع ضرورة تطوير «${worst.name}» و«${secondWorst?.name ?? 'مهارات أخرى'}» أولاً.`;
  }
  return `مهارات ${subjectLabel} تحتاج إلى دعم ومعالجة، وعلى رأسها «${worst.name}»${secondWorst ? ` و«${secondWorst.name}»` : ''} — يُنصح بالبدء بها في خطة الدعم.`;
}

export function buildRecommendations(weaknesses: SkillResult[], percent: number): string[] {
  if (weaknesses.length === 0) {
    return ['مراجعة عامة خفيفة لتثبيت المكتسبات', 'تمارين تركيبية لصقل صياغة الجواب', 'الانتقال إلى تقويم المستوى الموالي عند جاهزيته'];
  }
  const recs = weaknesses
    .sort((a, b) => a.percent - b.percent)
    .map((w) => ({
      text:
        w.sujet === 'histoire'
          ? `مراجعة ${w.name} في التاريخ (نشاط موجه + تمارين)`
          : `تدريب على ${w.name} في الجغرافيا (قراءات وتفسيرات)`,
    }))
    .map((r) => r.text);
  if (percent < 50) recs.unshift('جلسة دعم مع أستاذ(ة) المادة لمعالجة التعثرات الأساسية');
  return recs.slice(0, 6);
}

export function buildPlan(skills: SkillResult[], percent: number): PlanWeek[] {
  const weak = skills.filter((s) => s.status === 'weak');
  const histWeak = weak.filter((s) => s.sujet === 'histoire').map((s) => s.name);
  const geoWeak = weak.filter((s) => s.sujet === 'geographie').map((s) => s.name);
  const plan: PlanWeek[] = [];

  if (histWeak.length > 0) {
    plan.push({
      week: 'الأسبوع الأول',
      title: 'معالجة التعثرات في التاريخ',
      items: [
        'مراجعة المفاهيم التاريخية الأساسية وتلخيص الأحداث الكبرى في خط زمني',
        `نشاط مقترح: ${histWeak[0]}`,
        'تمرين عملي في قراءة وثيقة تاريخية واستخراج المعلومات والربط والاستنتاج',
      ],
    });
  }
  if (geoWeak.length > 0) {
    plan.push({
      week: plan.length === 0 ? 'الأسبوع الأول' : 'الأسبوع الثاني',
      title: 'تدريب على المهارات الجغرافية',
      items: [
        'مراجعة المصطلحات والمفاهيم الجغرافية الأساسية',
        `نشاط مقترح: ${geoWeak[0]}`,
        'تمارين تطبيقية في قراءة الخريطة والمبيان واستثمار المعطيات والمقارنة',
      ],
    });
  }
  if (weak.length >= 3 || percent < 50) {
    plan.push({
      week: `الأسبوع ${plan.length + 1}`,
      title: 'تمارين مركبة وتحقق من التحسن',
      items: [
        'حل تمرين مركب يجمع بين وثيقة تاريخية ومعطى جغرافي',
        'تمارين تركيبية قصيرة (جواب من 5 إلى 8 أسطر)',
        'اختبار قصير تشخيصي للتأكد من تحسّن المكتسبات',
      ],
    });
  }
  if (plan.length === 0) {
    plan.push({
      week: 'الأسبوع الأول',
      title: 'تثبيت المكتسبات',
      items: [
        'مراجعة عامة خفيفة للمفاهيم الأساسية في التاريخ والجغرافيا',
        'تمارين متنوعة للتدرب على صياغة الجواب',
        'الانتقال إلى تقويم المستوى الموالي',
      ],
    });
  }
  return plan;
}

export function diagnose(questions: Question[], answers: Record<number, AnswerValue>): Diagnosis {
  const c = computeScores(questions, answers);
  const { historyScore, geoScore, historyMax, geoMax, totalScore, maxTotal, percent, correct, wrong, unanswered, skills } = c;
  const strengths = skills.filter((s) => s.status === 'mastery');
  const weaknesses = skills.filter((s) => s.status === 'weak');
  const mastery = masteryOf(percent);
  const support = supportOf(percent, weaknesses);
  const plan = buildPlan(skills, percent);

  return {
    historyScore,
    geoScore,
    historyMax,
    geoMax,
    totalScore,
    maxTotal,
    percent,
    correct,
    wrong,
    unanswered,
    mastery,
    support: support.level,
    supportLabel: support.label,
    supportReason: support.reason,
    skills,
    strengths,
    weaknesses,
    diagnosis: skillNarratives(skills),
    recommendations: buildRecommendations(weaknesses, percent),
    plan,
    review: buildReview(questions, answers),
  };
}

export function skillNarratives(skills: SkillResult[]): string[] {
  return [
    narrative(skills.filter((s) => s.sujet === 'histoire'), 'التاريخ'),
    narrative(skills.filter((s) => s.sujet === 'geographie'), 'الجغرافيا'),
  ].filter((x): x is string => x !== null);
}

/** إعادة بناء تشخيص كامل من سجل محفوظ — لعرض «نتيجتي» من السجل. */
export interface StoredAssessment {
  historyScore: number;
  geoScore: number;
  historyMax?: number;
  geoMax?: number;
  totalScore: number;
  maxTotal?: number;
  percent: number;
  correct?: number;
  wrong?: number;
  unanswered?: number;
  skills: SkillResult[];
  support: SupportLevel;
}

export function diagnosisFromRecord(r: StoredAssessment): Diagnosis {
  const skills = r.skills;
  const strengths = skills.filter((s) => s.status === 'mastery');
  const weaknesses = skills.filter((s) => s.status === 'weak');
  const mastery = masteryOf(r.percent);
  const support = supportOf(r.percent, weaknesses);
  return {
    historyScore: r.historyScore,
    geoScore: r.geoScore,
    historyMax: r.historyMax ?? 10,
    geoMax: r.geoMax ?? 10,
    totalScore: r.totalScore,
    maxTotal: r.maxTotal ?? 20,
    percent: r.percent,
    correct: r.correct ?? 0,
    wrong: r.wrong ?? 0,
    unanswered: r.unanswered ?? 0,
    mastery,
    support: support.level,
    supportLabel: support.label,
    supportReason: support.reason,
    skills,
    strengths,
    weaknesses,
    diagnosis: skillNarratives(skills),
    recommendations: buildRecommendations(weaknesses, r.percent),
    plan: buildPlan(skills, r.percent),
    review: [], // السجلات المحفوظة لا تخزّن تفاصيل الأسئلة
  };
}
