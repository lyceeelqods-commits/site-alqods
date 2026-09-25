import { levels } from '../data/levels';
import type { SkillResult, SupportLevel } from './diagnosis';

export type Domain = 'histoire' | 'geographie' | 'both';
export type AssessmentKind = 'diagnostic' | 'skills' | 'review';

export const DOMAIN_LABEL: Record<Domain, string> = {
  histoire: 'التاريخ',
  geographie: 'الجغرافيا',
  both: 'المجالان',
};

export const KIND_LABEL: Record<AssessmentKind, string> = {
  diagnostic: 'تقويم تشخيصي',
  skills: 'تقويم المهارات',
  review: 'اختبار شامل',
};

export interface StudentRecord {
  id: string;
  code: string;
  levelId: string;
  levelLabel: string;
  date: string;
  historyScore: number;
  geoScore: number;
  totalScore: number;
  percent: number;
  skills: SkillResult[];
  support: SupportLevel;
  isRetest?: boolean;
  previousScore?: number;
  domain?: Domain;
  kind?: AssessmentKind;
  historyMax?: number;
  geoMax?: number;
  maxTotal?: number;
  correct?: number;
  wrong?: number;
  unanswered?: number;
  /** رقم مسار التلميذ والقسم — للتعريف في لوحة الأستاذ */
  massar?: string;
  clazz?: string;
}

const KEY = 'amjad_records_v1';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CODES = [
  'تلميذ 01', 'تلميذ 02', 'تلميذ 03', 'تلميذ 04', 'تلميذ 05', 'تلميذ 06',
  'تلميذ 07', 'تلميذ 08', 'تلميذ 09', 'تلميذ 10', 'تلميذ 11', 'تلميذ 12',
  'تلميذ 13', 'تلميذ 14', 'تلميذ 15', 'تلميذ 16', 'تلميذ 17', 'تلميذ 18',
  'تلميذ 19', 'تلميذ 20', 'تلميذ 21', 'تلميذ 22', 'تلميذ 23', 'تلميذ 24',
];

function seedRecords(): StudentRecord[] {
  const rng = mulberry32(20250112);
  const records: StudentRecord[] = [];
  let codeIdx = 0;

  levels.forEach((level, li) => {
    const count = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const base = 0.32 + rng() * 0.5;
      const historyScore = Math.max(2, Math.min(9, Math.round(10 * base * (0.85 + rng() * 0.3))));
      const geoScore = Math.max(2, Math.min(9, Math.round(10 * base * (0.8 + rng() * 0.35))));
      const totalScore = Math.min(10, historyScore) + Math.min(10, geoScore);
      const percent = Math.round((totalScore / 20) * 100);
      const support: SupportLevel = percent < 50 ? 'red' : percent < 80 ? 'yellow' : 'green';

      const histComps = Array.from(new Set(level.questions.filter((q) => q.sujet === 'histoire').map((q) => q.competence)));
      const geoComps = Array.from(new Set(level.questions.filter((q) => q.sujet === 'geographie').map((q) => q.competence)));
      const skills: SkillResult[] = [
        ...histComps,
        ...geoComps.map((c) => c),
      ].slice(0, 12).map((name, si) => {
        const isHist = si < histComps.length;
        const p = Math.max(4, Math.min(98, Math.round(percent + (rng() * 44 - 22))));
        return {
          name,
          sujet: (isHist ? 'histoire' : 'geographie') as 'histoire' | 'geographie',
          score: 0,
          total: 1,
          percent: p,
          status: (p >= 70 ? 'mastery' : p >= 50 ? 'mid' : 'weak') as 'mastery' | 'mid' | 'weak',
        };
      });

      const day = 3 + Math.floor(rng() * 24);
      const month = 10 + (li % 3);
      const date = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const rec: StudentRecord = {
        id: `seed-${li}-${i}`,
        code: CODES[codeIdx % CODES.length],
        levelId: level.id,
        levelLabel: level.label,
        date,
        historyScore,
        geoScore,
        totalScore,
        percent,
        skills,
        support,
      };
      codeIdx++;
      records.push(rec);

      // retest for a few struggling students
      if (rec.support === 'red' && i === 0) {
        const newTotal = Math.min(19, totalScore + 3 + Math.floor(rng() * 4));
        records.push({
          ...rec,
          id: `seed-${li}-${i}-re`,
          code: rec.code,
          totalScore: newTotal,
          historyScore: Math.min(10, rec.historyScore + Math.ceil((newTotal - totalScore) / 2)),
          geoScore: Math.min(10, newTotal - Math.min(10, rec.historyScore + Math.ceil((newTotal - totalScore) / 2))),
          percent: Math.round((newTotal / 20) * 100),
          support: newTotal < 50 ? 'red' : newTotal < 16 ? 'yellow' : 'green',
          isRetest: true,
          previousScore: totalScore,
          date: `2025-${String(month + 1).padStart(2, '0')}-0${1 + (day % 9)}`,
          skills: rec.skills.map((s) => {
            const p = Math.min(98, s.percent + Math.round(8 + rng() * 18));
            return { ...s, percent: p, status: (p >= 70 ? 'mastery' : p >= 50 ? 'mid' : 'weak') as 'mastery' | 'mid' | 'weak' };
          }),
        });
      }
    }
  });
  return records;
}

export function loadRecords(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudentRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seeded = seedRecords();
  try {
    localStorage.setItem(KEY, JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

export function saveRecord(rec: Omit<StudentRecord, 'id' | 'date'>) {
  const records = loadRecords();
  const full: StudentRecord = {
    ...rec,
    id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toISOString().split('T')[0],
  };
  records.push(full);
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
  return full;
}

/** سجل تقويمات متعلم واحد (حسب الرمز)، مرتباً تصاعدياً زمنياً. */
export function studentHistory(code: string): StudentRecord[] {
  if (!code) return [];
  return loadRecords()
    .filter((r) => r.code === code)
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1));
}

/* ---------- personal code (رمز المتعلم) ---------- */
const CODE_KEY = 'quds_personal_code';

export function loadPersonalCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) || '';
  } catch {
    return '';
  }
}

export function savePersonalCode(code: string) {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* ignore */
  }
}

/* ---------- بيانات هوية التلميذ (الاسم + رقم مسار + القسم) ---------- */
export interface StudentIdentity {
  name: string;
  massar: string;
  clazz: string;
}

const STUDENT_KEY = 'quds_student_identity_v1';
const EMPTY_STUDENT: StudentIdentity = { name: '', massar: '', clazz: '' };

export function loadStudent(): StudentIdentity {
  try {
    const raw = localStorage.getItem(STUDENT_KEY);
    if (raw) return { ...EMPTY_STUDENT, ...(JSON.parse(raw) as Partial<StudentIdentity>) };
  } catch {
    /* ignore */
  }
  return EMPTY_STUDENT;
}

export function saveStudentIdentity(s: StudentIdentity) {
  try {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function clearStudentIdentity() {
  try {
    localStorage.removeItem(STUDENT_KEY);
  } catch {
    /* ignore */
  }
}

/** الرمز المعروض في السجل: الاسم إن وُجد، وإلا رقم مسار، وإلا صيغة افتراضية */
export function studentDisplayName(s: StudentIdentity, fallback = 'تلميذ بدون رمز'): string {
  if (s.name.trim()) return s.name.trim();
  if (s.massar.trim()) return `مسار ${s.massar.trim()}`;
  return fallback;
}

export interface LevelStat {
  levelId: string;
  label: string;
  count: number;
  avg: number;
  avgHist: number;
  avgGeo: number;
  needPercent: number;
}

export function computeDashboard(records: StudentRecord[]) {
  const firstAttempts = records.filter((r) => !r.isRetest);
  const all = records;

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const byLevel = levels.map((lv) => {
    const rs = firstAttempts.filter((r) => r.levelId === lv.id);
    return {
      levelId: lv.id,
      label: lv.label,
      count: rs.length,
      avg: avg(rs.map((r) => r.totalScore)),
      avgHist: avg(rs.map((r) => r.historyScore)),
      avgGeo: avg(rs.map((r) => r.geoScore)),
      needPercent: rs.length ? Math.round((rs.filter((r) => r.support !== 'green').length / rs.length) * 100) : 0,
    };
  });

  const bins = [
    { label: '0 – 7.9', min: 0, max: 7.9, count: 0 },
    { label: '8 – 11.9', min: 8, max: 11.9, count: 0 },
    { label: '12 – 15.9', min: 12, max: 15.9, count: 0 },
    { label: '16 – 20', min: 16, max: 20, count: 0 },
  ];
  all.forEach((r) => {
    const b = bins.find((bin) => r.totalScore >= bin.min && r.totalScore <= bin.max);
    if (b) b.count++;
  });

  const weakCount = new Map<string, number>();
  const skillPct = new Map<string, { sum: number; n: number }>();
  all.forEach((r) =>
    r.skills.forEach((s) => {
      if (s.status === 'weak') weakCount.set(s.name, (weakCount.get(s.name) || 0) + 1);
      const cur = skillPct.get(s.name) || { sum: 0, n: 0 };
      cur.sum += s.percent;
      cur.n += 1;
      skillPct.set(s.name, cur);
    })
  );
  const topWeak = Array.from(weakCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  const skillMastery = Array.from(skillPct.entries())
    .map(([name, v]) => ({ name, percent: Math.round(v.sum / v.n), n: v.n }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 8);
  const supportSplit = {
    green: all.filter((r) => r.support === 'green').length,
    yellow: all.filter((r) => r.support === 'yellow').length,
    red: all.filter((r) => r.support === 'red').length,
  };

  return {
    totalAttempts: all.length,
    totalStudents: new Set(all.map((r) => r.code)).size,
    avgTotal: avg(all.map((r) => r.totalScore)),
    avgHist: avg(all.map((r) => r.historyScore)),
    avgGeo: avg(all.map((r) => r.geoScore)),
    needPercent: all.length ? Math.round((all.filter((r) => r.support !== 'green').length / all.length) * 100) : 0,
    byLevel: byLevel.filter((l) => l.count > 0),
    bins,
    topWeak,
    skillMastery,
    supportSplit,
  };
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
