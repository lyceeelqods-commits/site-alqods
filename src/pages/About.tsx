import {
  Target, Eye, HeartHandshake, Shield, PencilRuler, Users,
  Landmark, MapPin, Phone, Mail, AlertCircle, ArrowLeft,
  ClipboardList, Brain, FlaskConical, ScrollText, Compass,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import { PageHeader, SectionHead, Chip, IMG, Avatar } from '../components/ui';
import type { PageKey } from '../components/Header';
import type { SiteConfig } from '../lib/site';
import { levels } from '../data/levels';

/* ==================== عن المؤسسة ==================== */
export function AboutPage({ cfg }: { cfg: SiteConfig; onNavigate?: (p: PageKey) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="هوية المؤسسة"
        title="عن الثانوية التأهيلية القدس"
        subtitle="تعرف على هويتنا، رسالتنا، وقيمنا التربوية — مؤسسة تكرس كل إمكانياتها لخدمة المتعلم ومواطنته"
        crumb="عن المؤسسة"
      />

      {/* identity card */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <Reveal>
            <div className="surface rounded-[2rem] shadow-lg p-8 grid md:grid-cols-2 gap-8 relative overflow-hidden">
              <div className="space-y-5">
                <Chip tone="gold">بطاقة تعريفية</Chip>
                <div className="space-y-4">
                  {[
                    { icon: Landmark, label: 'اسم المؤسسة', value: cfg.schoolName },
                    { icon: MapPin, label: 'الموقع', value: `مدينة ${cfg.city} — المملكة المغربية` },
                    { icon: ClipboardList, label: 'القطاع', value: cfg.sector },
                    { icon: Phone, label: 'الهاتف', value: cfg.phone || '— سيُحدَّد من لوحة الإعدادات' },
                    { icon: Mail, label: 'البريد الإلكتروني', value: cfg.email || '— سيُحدَّد من لوحة الإعدادات' },
                    { icon: Users, label: 'المدير', value: cfg.director || '— سيُحدَّد من لوحة الإعدادات' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-soft text-azure dark:bg-white/5 flex items-center justify-center shrink-0">
                        <row.icon className="w-4.5 h-4.5 w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs t-muted font-bold">{row.label}</div>
                        <div className="font-display font-extrabold">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <img src={IMG.facadeBlue} alt="المؤسسة" className="rounded-3xl w-full h-full min-h-[280px] object-cover shadow-xl" />
                <div className="absolute -bottom-4 -right-4 bg-navy text-white rounded-2xl px-5 py-3 shadow-2xl anim-floaty">
                  <div className="text-xs text-white/60">سنة التأسيس / عدد المتعلمين</div>
                  <div className="font-display font-extrabold text-sm text-gold">{cfg.foundedInfo}</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-6 flex items-start gap-3 p-5 rounded-2xl bg-gold-soft border border-gold/30">
              <AlertCircle className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" />
              <p className="text-sm text-gold-deep leading-relaxed">
                <b>تنويه:</b> المعلومات الرسمية غير المؤكدة (تاريخ التأسيس، عدد المتعلمين، أسماء الأطر…)
                لم تُدرَج افتراضياً حفاظاً على الدقة — ويمكن سندها من <b>«لوحة الإعدادات»</b> في أسفل الموقع.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* mission / vision / values */}
      <section className="py-16 bg-[var(--c-tint)] dark:bg-[#0d1830]">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <SectionHead eyebrow="مؤشراتنا" title="رسالتنا ورؤيتنا وقيمنا" />
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Target, title: 'رسالتنا', tone: 'bg-sky-soft text-azure', text: 'تكوين متعلمين مبادرين، متمكنين من المكتسبات المعرفية والمهارية، ومتمسكين بالقيم والقيم الديمقراطية والمواطنة، من خلال تعليم متميز ورقمنة متجددة ودعم للتعلم الذاتي.' },
              { icon: Eye, title: 'رؤيتنا', tone: 'bg-gold-soft text-gold-deep', text: 'أن تكون المؤسسة نموذجاً في الحياة المدرسية والرقمنة التربوية بمدينة القنيطرة، وأن يخرّج المتعلمون باكالوريا متميزة ومهارة مواطنة راسخة.' },
              { icon: HeartHandshake, title: 'قيمنا', tone: 'bg-leaf-soft text-leaf', text: 'العلم والمعرفة، المواطنة والمبادرة، الإبداع والتميّز، الاحترام والتعاون، الشفافية والمسؤولية.' },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 100}>
                <div className="card-surface rounded-3xl p-7 h-full">
                  <div className={`w-12 h-12 rounded-2xl ${c.tone} flex items-center justify-center mb-5`}>
                    <c.icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <h3 className="font-display font-extrabold text-xl mb-3">{c.title}</h3>
                  <p className="t-muted leading-relaxed">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* pillars */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <SectionHead eyebrow="أدواتنا" title="أعمدة العمل التربوي" desc="محاور نشتغل عليها باستمرار لضمان جودة التعلّم وجودة الحياة المدرسية" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Brain, t: 'تعليم ومناهج', d: 'مواكبة المنهاج الرسمي ودعم التعلم الذاتي بالتقويم التشخيصي' },
              { icon: Shield, t: 'مواطنة وسلوك', d: 'تأطير السلوك المدرسي وغرس قيم المواطنة والمسؤولية' },
              { icon: PencilRuler, t: 'رقمنة ووسائل', d: 'موقع وموارد رقمية وفضاءات افتراضية للتعلم' },
              { icon: Users, t: 'شراكة وأسر', d: 'قنوات تواصل دائمة مع الأسر وارتباط بالمحيط' },
            ].map((p, i) => (
              <Reveal key={p.t} delay={i * 80}>
                <div className="surface-tint rounded-3xl p-6 h-full">
                  <p.icon className="w-7 h-7 text-azure dark:text-gold mb-4" strokeWidth={1.8} />
                  <h4 className="font-display font-extrabold mb-2">{p.t}</h4>
                  <p className="text-sm t-muted leading-relaxed">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ==================== الإدارة والأطر ==================== */
export function AdminPage({ cfg, onNavigate }: { cfg: SiteConfig; onNavigate: (p: PageKey) => void }) {
  void onNavigate;
  const leadership = [
    { name: cfg.director, role: 'مدير المؤسسة', note: 'يتولى الإشراف على التدبير الإداري والتربوي للمؤسسة' },
    { name: cfg.viceDirector, role: 'نائب المدير', note: 'يمارس مهام التأطير والتنسيق بقرار من المدير' },
    { name: cfg.cpe, role: 'رئيس(ة) قسم الحياة المدرسية', note: 'يشرف على تتبع المسار التعلّمي والحياة المدرسية' },
    { name: cfg.headOfLibrary, role: 'مشرف(ة) على المكتبة والوثائق', note: 'يرعى فضاء القراءة والوثائق المدرسية' },
  ];

  const categories = [
    { icon: ScrollText, t: 'أطر التربوية — الآداب والعلوم الإنسانية', d: 'مجموعة الأساتذة المتخصصين في المواد الإنسانية والإنسانية والعلوم الإنسانية' },
    { icon: FlaskConical, t: 'أطر التربوية — العلوم والتكنولوجيا', d: 'مجموعة الأساتذة المتخصصين في العلوم الفيزيائية والحيوية والرياضيات والتكنولوجيا' },
    { icon: ClipboardList, t: 'أطر التربوية — الدعم التربوي', d: 'مجموعة الأساتذة المتخصصين في الدعم التربوي والتقويم التشخيصي والمواكبة الفردية' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="الفريق الإداري"
        title="الإدارة والأطر التربوية"
        subtitle="هيئة إدارية وتربوية تشتغل بتفانٍ في خدمة المتعلم والمؤسسة"
        crumb="الإدارة والأطر"
      />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <SectionHead eyebrow="القيادة" title="الهيكل الإداري للمؤسسة" desc="الأسماء الرسمية تُسند من إدارة المؤسسة عبر «لوحة الإعدادات»" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {leadership.map((p, i) => (
              <Reveal key={p.role} delay={i * 90}>
                <div className="card-surface rounded-3xl p-6 text-center h-full">
                  <Avatar name={p.name} className="w-16 h-16 mx-auto text-2xl" />
                  <h3 className="font-display font-extrabold text-lg mt-4 mb-1">
                    {p.name || <span className="text-gold-deep">— الاسم غير مسجَّل —</span>}
                  </h3>
                  <Chip tone="blue">{p.role}</Chip>
                  <p className="text-xs t-muted mt-3 leading-relaxed">{p.note}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-12">
              <h3 className="font-display font-black text-2xl mb-6">الأقسام التربوية</h3>
              <div className="grid md:grid-cols-3 gap-5">
                {categories.map((c) => (
                  <div key={c.t} className="surface-tint rounded-3xl p-6">
                    <c.icon className="w-7 h-7 text-azure dark:text-gold mb-3" strokeWidth={1.8} />
                    <h4 className="font-display font-extrabold mb-2">{c.t}</h4>
                    <p className="text-sm t-muted leading-relaxed">{c.d}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {[...Array(4)].map((_, k) => (
                        <span key={k} className="w-8 h-8 rounded-full bg-white/60 dark:bg-white/10 border border-line flex items-center justify-center text-[10px] font-bold t-muted">
                          أ{['1', '2', '3', '4'][k]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ==================== المستويات الدراسية ==================== */
export function LevelsPage({ onNavigate }: { cfg: SiteConfig; onNavigate: (p: PageKey) => void }) {
  const groups = [
    {
      title: 'الجذع المشترك',
      sub: 'سنة التوطئة',
      icon: Compass,
      desc: 'توطئة منهجية: بناء المكتسبات الأساسية ومناهج البحث قبل التخصص',
      tracks: levels.filter((l) => l.id.startsWith('jc')),
      subjects: ['اللغة العربية', 'الفرنسية', 'الإنجليزية', 'الرياضيات', 'الفيزياء', 'علوم الحياة والأرض', 'الاجتماعيات', 'الفلسفة (مقدمات)', 'التربية الإسلامية'],
    },
    {
      title: 'الأولى باكالوريا',
      sub: 'سنة تعميق التخصص',
      icon: Brain,
      desc: 'تعميق التخصص ومراكمة الكفايات مع تمارين التقويم المستمر',
      tracks: levels.filter((l) => l.id.startsWith('bac1')),
      subjects: ['اللغة العربية', 'الفرنسية', 'الإنجليزية', 'الرياضيات', 'الفيزياء', 'علوم الحياة والأرض', 'الاجتماعيات', 'الفلسفة', 'التربية البدنية'],
    },
    {
      title: 'الثانية باكالوريا',
      sub: 'سنة الإعداد للامتحان الوطني',
      icon: ScrollText,
      desc: 'إعداد نهائي لاختبارات الباكالوريا الوطنية بكل أدق ما يكون',
      tracks: levels.filter((l) => l.id.startsWith('bac2')),
      subjects: ['اللغة العربية', 'الفرنسية', 'الرياضيات / الفلسفة', 'الاجتماعيات', 'العلوم (حسب المسلك)', 'المشروع الشخصي الموجه'],
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="المسار الدراسي"
        title="المستويات الدراسية"
        subtitle="مسار تأهيلي متكامل: من الجذع المشترك إلى الباكالوريا — مسالك الآداب والعلوم الإنسانية والعلوم التجريبية"
        crumb="المستويات الدراسية"
      />

      <section className="py-16 space-y-16">
        {groups.map((g, gi) => (
          <div key={g.title} className="max-w-6xl mx-auto px-5 md:px-6">
            <Reveal>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-azure to-navy text-gold flex items-center justify-center shadow-lg shadow-azure/25">
                    <g.icon className="w-7 h-7" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gold-deep">{g.sub} — المرحلة {gi + 1}</div>
                    <h2 className="font-display font-black text-2xl md:text-3xl">{g.title}</h2>
                  </div>
                </div>
                <p className="t-muted max-w-sm leading-relaxed">{g.desc}</p>
              </div>
            </Reveal>

            <Reveal>
              <div className="surface-tint rounded-3xl p-6 mb-6">
                <div className="text-xs font-black t-muted mb-3">المواد الأساسية في هذا المستوى</div>
                <div className="flex flex-wrap gap-2">
                  {g.subjects.map((s) => (
                    <Chip key={s} tone="muted">{s}</Chip>
                  ))}
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5">
              {g.tracks.map((t, i) => (
                <Reveal key={t.id} delay={i * 90}>
                  <div className="card-surface rounded-3xl p-7 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-extrabold text-xl">{t.label}</h3>
                      <Chip tone="gold">مسلك</Chip>
                    </div>
                    <p className="text-sm t-muted leading-relaxed mb-4">{t.description}</p>
                    <div className="text-xs t-muted mb-6">
                      <b className="text-azure dark:text-gold">التقويم التشخيصي:</b> {t.reference}
                    </div>
                    <button
                      onClick={() => onNavigate('personal')}
                      className="mt-auto btn-primary px-5 py-3 rounded-xl font-display font-extrabold text-sm inline-flex items-center justify-center gap-2"
                    >
                      التقويم الشخصي لهذا المسلك
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
