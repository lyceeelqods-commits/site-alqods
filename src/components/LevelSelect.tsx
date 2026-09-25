import { useState } from 'react';
import {
  BookOpen, GraduationCap, Landmark, Globe2, FlaskConical,
  Scale, ScrollText, ArrowLeft, User, Clock,
} from 'lucide-react';
import { levels } from '../data/levels';
import Reveal from './Reveal';

const ICONS = [BookOpen, Landmark, BookOpen, Globe2, FlaskConical, Scale, ScrollText];

export default function LevelSelect({
  onConfirm,
}: {
  onConfirm: (levelId: string, code: string) => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const pendingLevel = levels.find((l) => l.id === pending);

  const confirm = () => {
    if (!pending) return;
    onConfirm(pending, code.trim() || 'تلميذ بدون رمز');
    setPending(null);
    setCode('');
  };

  return (
    <section id="levels" className="py-20 md:py-28 bg-paper">
      <div className="max-w-6xl mx-auto px-5 md:px-6">
        <Reveal className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-soft text-amber-deep text-sm font-bold mb-4">
            <GraduationCap className="w-4 h-4" /> الثانوية التأهيلية — المغرب
          </div>
          <h2 className="font-display font-black text-3xl md:text-5xl text-ink">اختر مستواك الدراسي</h2>
          <p className="text-ink-soft text-lg mt-4 max-w-2xl mx-auto">
            لكل مستوى تقويم تشخيصي مستقل مبني على المكتسبات المرجعية الخاصة به فقط —
            الجذع المشترك (مكتسبات الإعدادي)، الأولى (مكتسبات الجذع)، والثانية (مكتسبات الأولى).
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {levels.map((level, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            return (
              <Reveal key={level.id} delay={(idx % 3) * 90}>
                <button
                  onClick={() => setPending(level.id)}
                  className="group w-full text-right p-7 rounded-3xl bg-white border border-line hover:border-forest/40 card-surface h-full"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-[52px] h-[52px] rounded-2xl bg-forest text-amber flex items-center justify-center shadow-lg shadow-forest/25 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[11px] font-bold text-leaf bg-leaf-soft px-2.5 py-1 rounded-full">20 نقطة</span>
                      <span className="text-[11px] font-bold text-ink-soft flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 20 دقائق
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display font-extrabold text-xl text-ink mb-2 group-hover:text-forest transition-colors">
                    {level.label}
                  </h3>
                  <p className="text-sm text-ink-soft leading-relaxed mb-5">{level.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-deep bg-amber-soft px-3 py-1.5 rounded-lg">
                      {level.reference.split(':')[1]?.trim() || level.reference}
                    </span>
                    <span className="w-9 h-9 rounded-full bg-cream text-forest flex items-center justify-center group-hover:bg-amber group-hover:translate-x-[-4px] transition-all duration-300">
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* student code modal */}
      {pending && pendingLevel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-night/70 backdrop-blur-sm" onClick={() => setPending(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 anim-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-forest text-amber flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl text-ink">قبل البدء</h3>
                <p className="text-sm text-ink-soft">{pendingLevel.label}</p>
              </div>
            </div>

            <label className="block text-sm font-bold text-ink mb-2">اسم التلميذ أو رمز خاص به (اختياري)</label>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
              placeholder="مثال: تلميذ 07 أو ياسين ب."
              className="w-full px-5 py-3.5 rounded-2xl border-2 border-line bg-paper/50 focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10 transition-all text-ink font-medium"
            />
            <p className="text-xs text-ink-soft mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf inline-block" />
              لن يُطلب منك أي معلومات حساسة — هذا الرمز يظهر فقط في لوحة الأستاذ.
            </p>

            <div className="grid grid-cols-3 gap-2 my-6 text-center text-xs font-bold">
              <div className="p-3 rounded-xl bg-cream text-ink-soft">
                <div className="font-display text-lg text-ink">10</div>تاريخ
              </div>
              <div className="p-3 rounded-xl bg-cream text-ink-soft">
                <div className="font-display text-lg text-ink">10</div>جغرافيا
              </div>
              <div className="p-3 rounded-xl bg-amber-soft text-amber-deep">
                <div className="font-display text-lg">20</div>المجموع
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPending(null)} className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-line text-ink font-bold hover:bg-cream transition-colors">
                رجوع
              </button>
              <button onClick={confirm} className="btn-primary flex-1 px-4 py-3.5 rounded-2xl font-display font-extrabold">
                ابدأ الاختبار
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
