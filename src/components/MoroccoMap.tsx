import { useState } from 'react';
import { CheckCircle2, XCircle, Compass, Layers, ShieldCheck, RotateCcw } from 'lucide-react';

/* ==========================================================================
   خريطة المغرب — SVG مبني على الإحداثيات الجغرافية الحقيقية
   المصدر المرجعي: الحدود الإدارية والتقسيم الجهوي المغربي الرسمي
   ======================================================================== */

/** تحويل إحداثيات جغرافية إلى نقاط SVG (إسقاط مسطح مبسّط) */
const BOX = { minLng: -17.2, maxLng: -0.8, minLat: 20.6, maxLat: 36.2 };
const W = 760;
const H = 900;
const project = (lng: number, lat: number): [number, number] => [
  ((lng - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * W,
  H - ((lat - BOX.minLat) / (BOX.maxLat - BOX.minLat)) * H,
];

const P = (coords: [number, number][]) => coords.map(([lng, lat]) => project(lng, lat).join(',')).join(' ');

/* ---------------------------------------------------------------------------
   محيط المملكة المغربية — كتلة ترابية واحدة متصلة
   من طنجة (35.79° شمالاً) إلى الكويرة (21.33° شمالاً) دون أي فاصل داخلي
--------------------------------------------------------------------------- */
const MOROCCO = P([
  /* 1) الساحل المتوسطي — من طنجة شرقاً نحو السعيدية */
  [-5.92, 35.79], [-5.28, 35.90], [-4.80, 35.45], [-4.32, 35.16],
  [-3.90, 35.26], [-3.20, 35.28], [-2.93, 35.25], [-2.42, 35.10], [-2.02, 35.08],

  /* 2) الحدود الشرقية مع الجزائر — من الشمال نحو الجنوب */
  [-1.79, 34.75], [-1.67, 34.10], [-1.06, 33.90], [-1.30, 33.28],
  [-1.52, 32.90], [-1.13, 32.48], [-1.24, 32.08],
  [-2.87, 32.08], [-3.65, 31.68], [-4.32, 31.38], [-4.98, 31.00],
  [-5.48, 30.62], [-6.02, 30.30], [-6.60, 29.90], [-7.20, 29.40],
  [-7.98, 28.82], [-8.67, 27.67],

  /* 3) الحدود الشرقية للأقاليم الجنوبية — نزولاً على خط الطول 8°40′ غرباً */
  [-8.67, 26.30], [-8.67, 24.40], [-8.67, 22.40], [-8.67, 21.86],

  /* 4) الحدود الجنوبية — على خط عرض 21°20′ شمالاً غرباً نحو الأطلسي */
  [-11.20, 21.33], [-13.40, 21.33], [-15.20, 21.33], [-16.95, 21.33],

  /* 5) الساحل الأطلسي — من الكويرة صعوداً نحو طنجة */
  [-17.05, 21.95], [-17.10, 22.90], [-16.52, 23.72], [-16.02, 24.22],
  [-15.60, 24.62], [-15.10, 25.10], [-14.70, 25.52], [-14.20, 26.00],
  [-13.60, 26.42], [-13.20, 27.15], [-12.60, 27.72], [-12.00, 28.12],
  [-11.40, 28.42], [-10.70, 28.72], [-10.10, 29.02], [-9.82, 29.52],
  [-9.66, 30.12], [-9.60, 30.44], [-9.82, 31.02], [-9.26, 31.52],
  [-9.28, 32.30], [-8.62, 33.02], [-8.22, 33.32], [-7.62, 33.60],
  [-6.92, 34.02], [-6.60, 34.32], [-6.26, 34.62], [-5.92, 35.79],
]);

/* ---------- الجهات الـ12 (مراكز تقريبية دقيقة) ---------- */
export const REGIONS: { id: string; name: string; lng: number; lat: number; label: string }[] = [
  { id: 'tanger', name: 'طنجة — تطوان — الحسيمة', lng: -5.6, lat: 35.4, label: 'طنجة' },
  { id: 'oriental', name: 'الشرق', lng: -2.4, lat: 34.3, label: 'وجدة' },
  { id: 'rabat', name: 'الرباط — سلا — القنيطرة', lng: -6.6, lat: 34.0, label: 'الرباط' },
  { id: 'fes', name: 'فاس — مكناس', lng: -5.0, lat: 33.7, label: 'فاس' },
  { id: 'casablanca', name: 'الدار البيضاء — سطات', lng: -7.8, lat: 33.2, label: 'الدار البيضاء' },
  { id: 'beni', name: 'بني ملال — خنيفرة', lng: -6.2, lat: 32.4, label: 'بني ملال' },
  { id: 'marrakech', name: 'مراكش — آسفي', lng: -8.2, lat: 31.6, label: 'مراكش' },
  { id: 'draa', name: 'درعة — تافيلالت', lng: -5.2, lat: 30.6, label: 'الراشيدية' },
  { id: 'souss', name: 'سوس — ماسة', lng: -9.0, lat: 30.2, label: 'أكادير' },
  { id: 'guelmim', name: 'كلميم — واد نون', lng: -10.4, lat: 28.6, label: 'كلميم' },
  { id: 'ayoun', name: 'العيون — الساقية الحمراء', lng: -13.0, lat: 26.6, label: 'العيون' },
  { id: 'dakhla', name: 'الداخلة — وادي الذهب', lng: -15.6, lat: 23.9, label: 'الداخلة' },
];

/* ---------- المدن الكبرى (مواقع دقيقة) ---------- */
export const CITIES: { name: string; lng: number; lat: number; big?: boolean }[] = [
  { name: 'طنجة', lng: -5.8, lat: 35.77, big: true },
  { name: 'تطوان', lng: -5.37, lat: 35.57 },
  { name: 'العرائش', lng: -6.15, lat: 35.19 },
  { name: 'وجدة', lng: -1.9, lat: 34.68, big: true },
  { name: 'الناظور', lng: -2.93, lat: 35.17 },
  { name: 'القنيطرة', lng: -6.59, lat: 34.26, big: true },
  { name: 'الرباط', lng: -6.84, lat: 34.02, big: true },
  { name: 'سلا', lng: -6.8, lat: 34.05 },
  { name: 'مكناس', lng: -5.55, lat: 33.9 },
  { name: 'فاس', lng: -5.0, lat: 34.03, big: true },
  { name: 'تازة', lng: -4.01, lat: 34.21 },
  { name: 'الدار البيضاء', lng: -7.62, lat: 33.57, big: true },
  { name: 'سطات', lng: -7.63, lat: 33.0 },
  { name: 'خريبكة', lng: -6.67, lat: 32.88 },
  { name: 'بني ملال', lng: -6.37, lat: 32.34 },
  { name: 'خنيفرة', lng: -5.66, lat: 32.94 },
  { name: 'مراكش', lng: -7.99, lat: 31.63, big: true },
  { name: 'آسفي', lng: -9.23, lat: 32.3 },
  { name: 'الجديدة', lng: -8.5, lat: 33.25 },
  { name: 'أكادير', lng: -9.6, lat: 30.42, big: true },
  { name: 'تارودانت', lng: -8.9, lat: 30.47 },
  { name: 'ورزازات', lng: -6.91, lat: 30.92 },
  { name: 'الراشيدية', lng: -4.43, lat: 31.43 },
  { name: 'بوجدور', lng: -14.48, lat: 26.13 },
  { name: 'الداخلة', lng: -15.93, lat: 23.68, big: true },
  { name: 'كلميم', lng: -10.06, lat: 28.84 },
  { name: 'طانطان', lng: -11.35, lat: 28.44 },
  { name: 'السمارة', lng: -12.0, lat: 26.74 },
  { name: 'العيون', lng: -13.2, lat: 27.15, big: true },
  { name: 'المدويعيش', lng: -10.5, lat: 27.0 },
  { name: 'الزميل', lng: -15.03, lat: 26.35 },
  { name: 'لكويرة', lng: -16.1, lat: 22.68 },
];

/* ---------- السلاسل الجبلية ---------- */
export const RANGES: { name: string; path: string; label: [number, number]; peak: string }[] = [
  {
    name: 'جبال الريف',
    peak: 'يدو 2456م',
    label: [-4.9, 35.1],
    path: P([
      [-5.85, 35.35], [-5.4, 35.3], [-4.9, 35.15], [-4.4, 34.95], [-3.9, 34.85],
      [-3.4, 34.75], [-2.95, 34.7], [-2.6, 34.85], [-2.9, 35.0], [-3.4, 35.05],
      [-4.0, 35.1], [-4.7, 35.15], [-5.4, 35.28], [-5.85, 35.35],
    ]),
  },
  {
    name: 'الأطلس المتوسط',
    peak: 'بوعبلان 3190م',
    label: [-5.1, 33.35],
    path: P([
      [-6.1, 33.75], [-5.7, 33.6], [-5.3, 33.45], [-4.9, 33.3], [-4.5, 33.15],
      [-4.1, 33.0], [-3.8, 32.9], [-3.7, 32.7], [-3.95, 32.55], [-4.4, 32.6],
      [-4.9, 32.75], [-5.4, 32.95], [-5.8, 33.2], [-6.1, 33.5], [-6.1, 33.75],
    ]),
  },
  {
    name: 'الأطلس الكبير',
    peak: 'توبقال 4167م',
    label: [-7.6, 31.2],
    path: P([
      [-8.9, 31.4], [-8.5, 31.3], [-8.0, 31.2], [-7.5, 31.1], [-7.0, 31.0],
      [-6.5, 30.95], [-6.0, 30.9], [-5.6, 30.85], [-5.3, 30.7], [-5.45, 30.5],
      [-5.9, 30.55], [-6.4, 30.65], [-6.9, 30.75], [-7.4, 30.85], [-7.9, 31.0],
      [-8.4, 31.15], [-8.9, 31.4],
    ]),
  },
  {
    name: 'الأطلس الصغير',
    peak: 'أكادير الجبل 3305م',
    label: [-8.7, 29.7],
    path: P([
      [-9.3, 29.8], [-8.9, 29.7], [-8.5, 29.6], [-8.1, 29.5], [-7.7, 29.4],
      [-7.3, 29.35], [-7.0, 29.25], [-7.1, 29.05], [-7.5, 29.1], [-7.9, 29.2],
      [-8.3, 29.3], [-8.7, 29.4], [-9.1, 29.55], [-9.3, 29.8],
    ]),
  },
];

/* ---------- السهول والمنخفضات ---------- */
export const PLAINS: { name: string; label: [number, number]; size: number }[] = [
  { name: 'سهل الغرب', label: [-6.15, 34.35], size: 26 },
  { name: 'سهل سايس', label: [-4.9, 33.95], size: 24 },
  { name: 'سهل الشاوية', label: [-7.3, 33.15], size: 26 },
  { name: 'سهل دكالة', label: [-8.3, 33.0], size: 24 },
  { name: 'سهل سوس', label: [-9.2, 30.05], size: 26 },
  { name: 'حوض وادي درعة', label: [-6.4, 29.8], size: 30 },
  { name: 'حوض وادي زيز', label: [-4.5, 30.9], size: 28 },
  { name: 'سهل تافيلالت', label: [-4.4, 31.9], size: 26 },
];

/* ---------- الأنهار الرئيسية ---------- */
export const RIVERS: { name: string; path: string }[] = [
  { name: 'وادي سبو', path: P([[-5.3, 34.0], [-5.7, 34.1], [-6.1, 34.25], [-6.4, 34.3], [-6.65, 34.35], [-6.5, 34.45]]) },
  { name: 'وادي أم الربيع', path: P([[-6.2, 32.9], [-6.6, 33.1], [-7.0, 33.3], [-7.35, 33.4], [-7.6, 33.35], [-8.05, 33.28]]) },
  { name: 'وادي أمزي', path: P([[-8.5, 31.1], [-8.6, 30.8], [-8.85, 30.5], [-9.25, 30.25]]) },
  { name: 'وادي درعة', path: P([[-5.2, 31.3], [-5.6, 30.9], [-6.1, 30.4], [-6.6, 29.9], [-7.2, 29.3], [-8.0, 28.9], [-8.6, 28.75]]) },
  { name: 'وادي ملوية', path: P([[-4.6, 32.7], [-4.3, 33.2], [-3.6, 33.7], [-2.7, 34.2], [-2.0, 34.5], [-1.95, 35.1]]) },
  { name: 'وادي زيز', path: P([[-4.9, 32.2], [-4.7, 31.7], [-4.5, 31.2], [-4.6, 30.7], [-5.0, 30.3]]) },
];



/* ---------- عناصر اللعبة: ما يجب توطينه ---------- */
type Quiz = { id: string; label: string; hint: string; lng: number; lat: number; kind: 'city' | 'range' | 'river' | 'plain' };

const QUIZ: Quiz[] = [
  { id: 'q1', label: 'الأطلس الكبير', hint: 'أعلى سلسلة، حاجز مناخي بين الشمال والجنوب', lng: -7.6, lat: 31.2, kind: 'range' },
  { id: 'q2', label: 'جبال الريف', hint: 'تمتد شرقاً-غرباً في أقصى الشمال', lng: -4.9, lat: 35.1, kind: 'range' },
  { id: 'q3', label: 'الأطلس المتوسط', hint: 'يفصل سهل سايس عن سهل الغرب', lng: -5.1, lat: 33.35, kind: 'range' },
  { id: 'q4', label: 'الأطلس الصغير', hint: 'جنوب سوس، حاجز مع الصحراء', lng: -8.7, lat: 29.7, kind: 'range' },
  { id: 'q5', label: 'الدار البيضاء', hint: 'أكبر مدينة اقتصادية على الساحل الأطلسي', lng: -7.62, lat: 33.57, kind: 'city' },
  { id: 'q6', label: 'القنيطرة', hint: 'سهل الغرب، قرب الرباط', lng: -6.59, lat: 34.26, kind: 'city' },
  { id: 'q7', label: 'أكادير', hint: 'قطب سياحي على الساحل الجنوبي', lng: -9.6, lat: 30.42, kind: 'city' },
  { id: 'q8', label: 'الداخلة', hint: 'أقصى الجنوب، الساحل الأطلسي', lng: -15.93, lat: 23.68, kind: 'city' },
  { id: 'q9', label: 'العيون', hint: 'مركز الساقية الحمراء', lng: -13.2, lat: 27.15, kind: 'city' },
  { id: 'q10', label: 'ورزازات', hint: 'بوابة الصحراء، قصور وآثار', lng: -6.91, lat: 30.92, kind: 'city' },
  { id: 'q11', label: 'وادي درعة', hint: 'أطول وادٍ، يصبّ جنوباً في الأطلسي', lng: -6.4, lat: 29.9, kind: 'river' },
  { id: 'q12', label: 'وادي سبو', hint: 'يصبّ في المحيط قرب القنيطرة', lng: -6.5, lat: 34.4, kind: 'river' },
  { id: 'q13', label: 'سهل سوس', hint: 'سهل رطب بين الأطلس الصغير والساحل', lng: -9.2, lat: 30.05, kind: 'plain' },
  { id: 'q14', label: 'سهل الغرب', hint: 'سهل فلاحي شمال الأطلس المتوسط', lng: -6.15, lat: 34.35, kind: 'plain' },
];


export default function MoroccoMap() {
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { x: number; y: number; ok: boolean }>>({});
  const [layer, setLayer] = useState<'relief' | 'regions' | 'rivers'>('relief');

  const q = QUIZ[current];
  const done = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.ok).length;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'quiz') return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const [tx, ty] = project(q.lng, q.lat);
    const dist = Math.hypot(x - tx, y - ty);
    const ok = dist < 46;
    setAnswers({ ...answers, [q.id]: { x, y, ok } });
    if (ok) setTimeout(() => setCurrent((c) => Math.min(QUIZ.length - 1, c + 1)), 900);
  };

  const reset = () => { setAnswers({}); setCurrent(0); };

  return (
    <div className="space-y-5">
      {/* ترويسة الخريطة */}
      <div className="flex items-start gap-3.5 pb-1">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d9a441] to-[#8c5f1f] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#8c5f1f]/25">
          <Compass className="w-6 h-6" strokeWidth={2} />
        </span>
        <div>
          <h3 className="font-display font-black text-xl leading-tight">خريطة تفاعلية — التوطين المجالي للمغرب</h3>
          <p className="text-[11.5px] t-muted mt-1 leading-relaxed">
            المملكة المغربية بوحدتها الترابية الكاملة · مبنية على الإحداثيات الجغرافية الحقيقية
          </p>
        </div>
      </div>

      {/* أدوات */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1.5 rounded-2xl surface-tint">
          <button
            onClick={() => setMode('explore')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'explore' ? 'bg-[#8c5f1f] text-white shadow-lg' : 't-muted'}`}
          >
            <Layers className="w-3.5 h-3.5 inline ml-1.5" /> استكشاف
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'quiz' ? 'bg-[#8c5f1f] text-white shadow-lg' : 't-muted'}`}
          >
            <Compass className="w-3.5 h-3.5 inline ml-1.5" /> توطين تفاعلي
          </button>
        </div>

        {mode === 'explore' ? (
          <div className="inline-flex p-1.5 rounded-2xl surface-tint">
            {(
              [
                { k: 'relief', l: 'التضاريس' },
                { k: 'regions', l: 'الجهات' },
                { k: 'rivers', l: 'الأنهار' },
              ] as const
            ).map((o) => (
              <button
                key={o.k}
                onClick={() => setLayer(o.k)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${layer === o.k ? 'bg-azure text-white' : 't-muted'}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black px-3 py-2 rounded-xl bg-leaf-soft text-leaf">
              {correct} / {done} صحيحة
            </span>
            <button onClick={reset} className="text-[11px] font-bold t-muted hover:text-terra transition-colors flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> إعادة
            </button>
          </div>
        )}
      </div>

      {/* الخريطة */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#c9b28a] dark:border-[#4a3d26] bg-[#dce9f7] dark:bg-[#101c2e] shadow-xl shadow-[#8c5f1f]/10">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair" onClick={handleClick}>
          <defs>
            <linearGradient id="mLand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8dcc0" />
              <stop offset="45%" stopColor="#dfd0ab" />
              <stop offset="100%" stopColor="#e3cf9f" />
            </linearGradient>
            <linearGradient id="mSahara" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0e2c0" />
              <stop offset="100%" stopColor="#eddcae" />
            </linearGradient>
          </defs>

          {/* البحر */}
          <rect x="0" y="0" width={W} height={H} fill="#b8d4ee" />
          <text x={W - 26} y={58} fontSize="17" fontWeight="900" fill="#1d5580" textAnchor="end" stroke="#ffffff" strokeWidth="3.5" paintOrder="stroke">المحيط الأطلسي</text>
          <text x={64} y={68} fontSize="15" fontWeight="900" fill="#1d5580" stroke="#ffffff" strokeWidth="3.5" paintOrder="stroke">البحر المتوسط</text>

          {/* دول الجوار (مرجع بصري فقط) — تُرسم قبل التراب الوطني */}
          {/* الجزائر شرقاً */}
          <polygon
            points={P([
              [-2.02, 35.08], [-1.79, 34.75], [-1.67, 34.10], [-1.06, 33.90], [-1.30, 33.28],
              [-1.52, 32.90], [-1.13, 32.48], [-1.24, 32.08], [-2.87, 32.08], [-3.65, 31.68],
              [-4.32, 31.38], [-4.98, 31.00], [-5.48, 30.62], [-6.02, 30.30], [-6.60, 29.90],
              [-7.20, 29.40], [-7.98, 28.82], [-8.67, 27.67], [-8.67, 21.86],
              [-0.80, 21.86], [-0.80, 35.08], [-2.02, 35.08],
            ])}
            fill="#e8e5db"
            opacity="0.7"
          />
          {/* موريتانيا جنوباً */}
          <polygon
            points={P([
              [-8.67, 21.86], [-11.20, 21.33], [-13.40, 21.33], [-15.20, 21.33], [-16.95, 21.33],
              [-17.15, 20.70], [-0.80, 20.70], [-0.80, 21.86], [-8.67, 21.86],
            ])}
            fill="#e3e0d5"
            opacity="0.7"
          />
          <text x={W - 52} y={H - 300} fontSize="15" fontWeight="900" fill="#6b6659" stroke="#ffffff" strokeWidth="3.5" paintOrder="stroke">الجزائر</text>
          <text x={W - 150} y={H - 22} fontSize="14" fontWeight="900" fill="#6b6659" stroke="#ffffff" strokeWidth="3.5" paintOrder="stroke">موريتانيا</text>

          {/* التراب الوطني المغربي — وحدة كاملة من طنجة إلى الكويرة */}
          <polygon points={MOROCCO} fill="url(#mLand)" stroke="#8c7a52" strokeWidth="2.4" />
          <polygon points={MOROCCO} fill="url(#mLand)" opacity="0.6" />

          {/* السهول */}
          {layer === 'relief' && PLAINS.map((p) => {
            const [x, y] = project(p.label[0], p.label[1]);
            return (
              <g key={p.name}>
                <ellipse cx={x} cy={y} rx={p.size} ry={p.size * 0.6} fill="#b5d18a" opacity="0.85" />
                <text x={x} y={y + 4} fontSize="10" fontWeight="900" fill="#2c3d18" stroke="#f3f8e8" strokeWidth="2.5" paintOrder="stroke" textAnchor="middle">{p.name}</text>
              </g>
            );
          })}

          {/* السلاسل */}
          {layer === 'relief' && RANGES.map((r) => (
            <g key={r.name}>
              <polygon points={r.path} fill="#a8a48c" stroke="#6f6b56" strokeWidth="1.4" opacity="0.9" />
              {(() => {
                const [x, y] = project(r.label[0], r.label[1]);
                return (
                  <>
                    <text x={x} y={y} fontSize="13" fontWeight="900" fill="#2b2818" stroke="#ffffff" strokeWidth="3.5" paintOrder="stroke" textAnchor="middle">{r.name}</text>
                    <text x={x} y={y + 16} fontSize="9.5" fontWeight="800" fill="#4a4636" stroke="#ffffff" strokeWidth="3" paintOrder="stroke" textAnchor="middle">{r.peak}</text>
                  </>
                );
              })()}
            </g>
          ))}

          {/* الأنهار */}
          {(layer === 'rivers' || layer === 'relief') && RIVERS.map((r) => (
            <g key={r.name}>
              <polyline points={r.path} fill="none" stroke="#4f9bd1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {(() => {
                const first = r.path.split(' ')[0].split(',');
                return (
                  <text x={Number(first[0]) + 8} y={Number(first[1]) - 6} fontSize="9.5" fontWeight="900" fill="#124a70" stroke="#ffffff" strokeWidth="3" paintOrder="stroke">{r.name}</text>
                );
              })()}
            </g>
          ))}



          {/* الجهات */}
          {layer === 'regions' && REGIONS.map((r) => {
            const [x, y] = project(r.lng, r.lat);
            return (
              <g key={r.id}>
                <circle cx={x} cy={y} r={7} fill="#8c5f1f" stroke="#fff" strokeWidth="2" />
                <text x={x + 12} y={y + 4} fontSize="11" fontWeight="900" fill="#3a2e17" stroke="#ffffff" strokeWidth="3" paintOrder="stroke">{r.label}</text>
              </g>
            );
          })}

          {/* المدن */}
          {(layer === 'relief' || layer === 'regions') && CITIES.map((c) => {
            const [x, y] = project(c.lng, c.lat);
            return (
              <g key={c.name}>
                <circle cx={x} cy={y} r={c.big ? 4.5 : 3} fill="#33291a" stroke="#fff" strokeWidth="1.2" />
                {c.big && <text x={x + 7} y={y - 5} fontSize="11" fontWeight="900" fill="#1a1408" stroke="#ffffff" strokeWidth="3.2" paintOrder="stroke">{c.name}</text>}
              </g>
            );
          })}

          {/* شبكة الإحداثيات */}
          {[24, 28, 32, 34].map((lat) => {
            const [, y] = project(BOX.minLng, lat);
            return (
              <g key={lat}>
                <line x1="0" x2={W} y1={y} y2={y} stroke="#7a9ec2" strokeWidth="0.6" strokeDasharray="6 6" opacity="0.5" />
                <text x={6} y={y - 4} fontSize="8.5" fontWeight="700" fill="#5a83a8">{lat}° شمالاً</text>
              </g>
            );
          })}
          {[-16, -12, -8, -4, -1].map((lng) => {
            const [x] = project(lng, BOX.minLat);
            return (
              <g key={lng}>
                <line x1={x} x2={x} y1="0" y2={H} stroke="#6b8fb3" strokeWidth="0.7" strokeDasharray="6 6" opacity="0.6" />
                <text x={x + 4} y={H - 8} fontSize="9" fontWeight="900" fill="#2b4f70" stroke="#ffffff" strokeWidth="2.5" paintOrder="stroke">{Math.abs(lng)}° غرباً</text>
              </g>
            );
          })}

          {/* نقاط اللاعب في الاختبار */}
          {Object.entries(answers).map(([id, a]) => (
            <g key={id}>
              <circle cx={a.x} cy={a.y} r={9} fill={a.ok ? '#2e8b57' : '#d96c47'} opacity="0.85" stroke="#fff" strokeWidth="2" />
              {a.ok
                ? <CheckCircle2 x={a.x - 6} y={a.y - 6} width={12} height={12} className="text-white" />
                : <XCircle x={a.x - 6} y={a.y - 6} width={12} height={12} className="text-white" />}
            </g>
          ))}

          {/* هدف السؤال الحالي */}
          {mode === 'quiz' && !answers[q.id] && (() => {
            const [tx, ty] = project(q.lng, q.lat);
            return (
              <>
                <circle cx={tx} cy={ty} r={26} fill="none" stroke="#d9a441" strokeWidth="2" strokeDasharray="5 5" opacity="0.5">
                  <animate attributeName="r" from="20" to="34" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              </>
            );
          })()}
        </svg>

        {/* مفتاح الخريطة */}
        <div className="absolute bottom-3 right-3 bg-white dark:bg-[#0f1a2b] rounded-2xl p-3.5 text-[11px] font-bold space-y-2 shadow-2xl border-2 border-[#c9b28a] dark:border-[#4a3d26] text-[#33291a] dark:text-[#f1e9db]">
          <div className="font-black mb-2 text-[12px] text-[#8c5f1f] dark:text-[#e0b256]">المفتاح</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-sm border border-[#6f6b56]" style={{ background: '#a8a48c' }} /> سلاسل جبلية</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-sm border border-[#4a5c2a]" style={{ background: '#c8dd9f' }} /> سهول</div>
          <div className="flex items-center gap-2"><span className="w-4 h-1.5 rounded bg-[#4f9bd1]" /> أنهار</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#33291a] ring-2 ring-white dark:ring-[#4a3d26]" /> مدن</div>
        </div>
      </div>

      {/* لوحة الاختبار */}
      {mode === 'quiz' && (
        <div className="rounded-3xl border-2 border-[#e9dcc3] dark:border-[#3b3222] surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-[11px] font-black t-muted">
              العنصر {current + 1} من {QUIZ.length}
            </div>
            <div className="flex-1 h-2 bg-[var(--c-border)] rounded-full overflow-hidden max-w-xs">
              <div className="h-full bg-[#b5832a] rounded-full transition-all duration-500" style={{ width: `${(done / QUIZ.length) * 100}%` }} />
            </div>
          </div>

          {answers[q.id] ? (
            <div className={`p-4 rounded-2xl text-sm font-bold leading-relaxed ${answers[q.id].ok ? 'bg-leaf-soft text-leaf' : 'bg-terra-soft text-terra'}`}>
              {answers[q.id].ok ? 'إجابة صحيحة! ' : 'إجابة غير دقيقة. '}
              {answers[q.id].ok ? 'توطين دقيق.' : `الموقع الصحيح مبين الآن في الخريطة.`}
              <button onClick={() => setCurrent((c) => Math.min(QUIZ.length - 1, c + 1))} className="underline mr-2">
                العنصر الموالي ←
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-display font-black text-lg text-[#8c5f1f] dark:text-[#e0b256]">أين يقع: {q.label}؟</div>
              <p className="text-sm t-muted">💡 {q.hint}</p>
              <p className="text-[11px] t-muted">انقر على الخريطة في الموقع الذي تراه صحيحاً.</p>
            </div>
          )}

          {/* شريط التقدم بالعناصر */}
          <div className="grid grid-cols-7 md:grid-cols-14 gap-1.5 mt-4">
            {QUIZ.map((qq, i) => {
              const a = answers[qq.id];
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={`h-7 rounded-lg text-[10px] font-black transition-colors ${
                    a ? (a.ok ? 'bg-leaf text-white' : 'bg-terra text-white') : i === current ? 'bg-[#8c5f1f] text-white' : 'surface-tint t-muted'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* دليل الاستعمال */}
      {mode === 'explore' && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { t: 'التضاريس', d: 'السلاسل الأربعة، السهول، والأنهار الرئيسية بأسمائها الدقيقة' },
            { t: 'الجهات', d: 'التقسيم الجهوي الـ12 مع مراكزه الإدارية' },
            { t: 'الأنهار', d: 'أهم الأودية: سبو، أم الربيع، درعة، ملوية، زيز' },
          ].map((x) => (
            <div key={x.t} className="surface-tint rounded-2xl p-4">
              <div className="font-display font-extrabold text-sm mb-1">{x.t}</div>
              <div className="text-[11px] t-muted leading-relaxed">{x.d}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-leaf-soft border border-leaf/25">
        <ShieldCheck className="w-5 h-5 text-leaf shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-leaf leading-relaxed">
          <b>التراب المغربي موحّد</b> — الخريطة تعرض المملكة من طنجة شمالاً إلى الكويرة جنوباً
          بوحدتها الكاملة، دون أي اقتطاع أو تمييز بصري بين أقاليمها. الصحراء المغربية جزء أصيل من التراب الوطني.
        </p>
      </div>

      <p className="text-[11px] t-muted">
        خريطة مبنية على الإحداثيات الجغرافية الحقيقية للمغرب (بين 20.6° و36.2° شمالاً، و0.8° و17.2° غرباً)
        بامتدادها الكامل. تُستعمل لمهارة التوطين المجالي: السلاسل، السهول، المدن الكبرى، والأنهار.
      </p>
    </div>
  );
}
