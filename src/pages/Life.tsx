import { useState } from 'react';
import {
  Drama, Trophy, Microscope, Globe2, BookOpenCheck, Radio,
  Leaf, Rocket, Flag, Lightbulb, ArrowLeft, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import { PageHeader, SectionHead, Chip, IMG, Modal } from '../components/ui';
import type { PageKey } from '../components/Header';

/* ==================== الأنشطة التربوية ==================== */
export function ActivitiesPage({ onNavigate }: { cfg: any; onNavigate: (p: PageKey) => void }) {
  const activities = [
    { icon: Drama, cat: 'ثقافي', title: 'نادي المسرح', desc: 'ورشات في التعبير والإلقاء والعروض المسرحية المدرسية، وتفعيل فضاء الإبداع الأدائي بالمؤسسة.' },
    { icon: Radio, cat: 'ثقافي', title: 'نادي الراديو والتوثيق', desc: 'إنتاج نشرات مدرسية صوتية، وتوثيق حياة المؤسسة، وتقريب المتعلم من مهنة إعلامية مسؤولة.' },
    { icon: BookOpenCheck, cat: 'ثقافي', title: 'نادي القراءة', desc: 'معاشات قرائية شهرية، ونقاش جماعي في أعمال مختارة، وتفعيل اليوم الوطني للكتاب.' },
    { icon: Trophy, cat: 'رياضي', title: 'الدورة الرياضية الداخلية', desc: 'بطولات في ألعاب القوى، كرة القدم، وكرة السلة — تعزيز روح المنافسة الشريفة والعمل الجماعي.' },
    { icon: Microscope, cat: 'علمي', title: 'المسابقات العلمية', desc: 'تأطير المتعلمين المتفوقين للتباري في الأولمبياد الوطني للعلوم والرياضيات.' },
    { icon: Globe2, cat: 'مواطنة', title: 'المواطنة الرقمية', desc: 'محاضرات توعوية حول الاستخدام الآمن للتقنيات، ومكافحة الإشاعة، ومواجهة الخطاب الكراهية.' },
    { icon: Leaf, cat: 'بيئة', title: 'مشروع مدرسة صديقة للبيئة', desc: 'تحسيس بأهمية التدبير العقلاني للموارد، وفصل النفايات، والاعتناء بفضاء المؤسسة.' },
    { icon: Flag, cat: 'مواطنة', title: 'المناسبات الوطنية', desc: 'برنامج خاص بالمواعيد الوطنية: تربية على المواطنة والانتماء والقيم الديمقراطية.' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="الحياة المدرسية"
        title="الأنشطة التربوية والإبداعية"
        subtitle="برنامج غني بالنوادي والمسابقات والبرنامج التوعوي — فضاءات لتفجير طاقات المتعلمين وبناء مواطنتهم"
        crumb="الأنشطة التربوية"
      />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {activities.map((a, i) => (
              <Reveal key={a.title} delay={(i % 4) * 80}>
                <div className="card-surface rounded-3xl p-6 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center mb-5">
                    <a.icon className="w-6 h-6" strokeWidth={1.9} />
                  </div>
                  <Chip tone={a.cat === 'ثقافي' ? 'gold' : a.cat === 'رياضي' ? 'green' : a.cat === 'علمي' ? 'blue' : 'red'}>{a.cat}</Chip>
                  <h3 className="font-display font-extrabold text-lg mt-3 mb-2">{a.title}</h3>
                  <p className="text-sm t-muted leading-relaxed">{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-12 surface-tint rounded-[2rem] p-8 md:p-10 grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
              <div className="space-y-4">
                <Chip tone="blue">برنامج الدعم والمواكبة</Chip>
                <h3 className="font-display font-black text-2xl md:text-3xl">التقويم التشخيصي: من أنشطة الدعم</h3>
                <p className="t-muted leading-relaxed">
                  ضمن برنامج الدعم التربوي، تتوفر المؤسسة على <b>أداة رقمية للتقويم الذاتي</b> في مادة
                  الاجتماعيات تقيس المكتسبات السابقة لكل مستوى، وتولّد تشخيصاً فورياً وخطة دعم فردية،
                  مع إمكانية إعادة التقويم لقياس التطور.
                </p>
                <button onClick={() => onNavigate('students')} className="btn-primary px-6 py-3.5 rounded-2xl font-display font-extrabold inline-flex items-center gap-2">
                  جرب الأداة من فضاء التلاميذ
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
              <img src={IMG.sunlitStudent} alt="تعلّم ذاتي" className="rounded-3xl h-64 w-full object-cover shadow-xl" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ==================== معرض الصور ==================== */
export function GalleryPage({ cfg, onNavigate }: { cfg: any; onNavigate: (p: PageKey) => void }) {
  void cfg; void onNavigate;
  const photos = [
    { src: IMG.heroBuilding, title: 'فضاء المؤسسة', cat: 'المنشآت' },
    { src: IMG.classroomHands, title: 'التفاعل داخل القسم', cat: 'الحياة المدرسية' },
    { src: IMG.brightClass, title: 'لحظة تعليمية', cat: 'الحياة المدرسية' },
    { src: IMG.uniformClass, title: 'حصة منظمة', cat: 'الأقسام' },
    { src: IMG.lessonBoard, title: 'العمل مع الأستاذ(ة)', cat: 'الأقسام' },
    { src: IMG.sunlitStudent, title: 'التعلم الذاتي', cat: 'الفضاءات' },
    { src: IMG.listeningStudent, title: 'تركيز وانتباه', cat: 'الأقسام' },
    { src: IMG.teacherDesk, title: 'المواكبة التربوية', cat: 'الحياة المدرسية' },
    { src: IMG.international, title: 'تفاعل جماعي', cat: 'الحياة المدرسية' },
    { src: IMG.glassFacade, title: 'مجال تعليمي حديث', cat: 'المنشآت' },
    { src: IMG.facadeBlue, title: 'مدخل المؤسسة', cat: 'المنشآت' },
  ];
  const cats = ['الكل', ...Array.from(new Set(photos.map((p) => p.cat)))];
  const [cat, setCat] = useState('الكل');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const shown = photos.filter((p) => cat === 'الكل' || p.cat === cat);

  return (
    <>
      <PageHeader
        eyebrow="من حياة المؤسسة"
        title="معرض الصور"
        subtitle="لقطات من الفضاءات والحياة اليومية للمؤسسة — صور توضيحية قابلة للتعويض بصور المؤسسة الحقيقية"
        crumb="معرض الصور"
      />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <div className="flex flex-wrap gap-2 mb-8">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  cat === c ? 'bg-azure text-white shadow-lg shadow-azure/25' : 'surface-tint t-muted hover:text-azure'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {shown.map((p, i) => (
              <Reveal key={p.src + i} delay={(i % 3) * 70}>
                <button
                  onClick={() => setOpenIdx(i)}
                  className="relative w-full rounded-2xl overflow-hidden group h-52 md:h-56 block"
                >
                  <img src={p.src} alt={p.title} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-0 inset-x-0 p-4 text-right">
                    <Chip tone="gold">{p.cat}</Chip>
                    <div className="text-white font-display font-extrabold mt-2">{p.title}</div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {openIdx !== null && shown[openIdx] && (
        <Modal title={shown[openIdx].title} onClose={() => setOpenIdx(null)} wide>
          <div className="space-y-4">
            <img src={shown[openIdx].src} alt={shown[openIdx].title} className="rounded-2xl w-full max-h-[55vh] object-cover" />
            <div className="flex items-center justify-between">
              <Chip tone="gold">{shown[openIdx].cat}</Chip>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpenIdx((openIdx - 1 + shown.length) % shown.length)}
                  className="p-2.5 rounded-xl surface-tint hover:text-azure"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setOpenIdx((openIdx + 1) % shown.length)}
                  className="p-2.5 rounded-xl surface-tint hover:text-azure"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================== المشاريع والتطلعات ==================== */
export function ProjectsPage({ cfg, onNavigate }: { cfg: any; onNavigate: (p: PageKey) => void }) {
  void cfg; void onNavigate;
  const projects = [
    { status: 'جارٍ', title: 'الرقمنة التربوية', desc: 'تعميم استعمال الموارد الرقمية داخل الأقسام، وتفعيل الموقع الرسمي كنافذة دائمة بين المؤسسة والمرتفقين.', progress: 65 },
    { status: 'جارٍ', title: 'مدرسة صديقة للبيئة', desc: 'محطات عملية لفصل النفايات وتدبير استهلاك الماء والكهرباء، وتبني ميثاق بيئي مشترك.', progress: 40 },
    { status: 'مُخطَّط له', title: 'فصل المعلوميات والمهارات الرقمية', desc: 'تجهيز فضاء رقمي للتدريب على أساسيات البرمجة والأمن الرقمي بالمدرسة.', progress: 15 },
    { status: 'مُخطَّط له', title: 'تفعيل بنك التعلم الذاتي', desc: 'خزانة رقمية متكاملة من الدروس والمذكرات والتمارين حسب كل مستوى ومادة، مع أدوات التقويم التشخيصي.', progress: 30 },
  ];

  const aspirations = [
    { icon: Lightbulb, t: 'الإبداع', d: 'فضاءات حرة تفجّر المواهب الفكرية والفنية والعلمية' },
    { icon: Flag, t: 'المواطنة', d: 'تربية على القيم الديمقراطية والانتماء والمسؤولية' },
    { icon: Trophy, t: 'التميّز', d: 'مرافقة المتفوقين والمسابقات والتألق الوطني' },
    { icon: Rocket, t: 'الرقمنة', d: 'دخول المؤسسة إلى عصر التعليم الرقمي بكل تميز' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="نحو مزيد من التميّز"
        title="المشاريع والتطلعات"
        subtitle="مشاريع مفتوحة في أفق تجديد الحياة المدرسية وترقية جودة التعلّم"
        crumb="المشاريع والتطلعات"
      />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <SectionHead eyebrow="على أرض الواقع" title="المشاريع الجارية" />
          <div className="grid md:grid-cols-2 gap-5">
            {projects.map((p, i) => (
              <Reveal key={p.title} delay={i * 90}>
                <div className="card-surface rounded-3xl p-7 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <Chip tone={p.status === 'جارٍ' ? 'green' : 'gold'}>{p.status}</Chip>
                    <span className="font-display font-black text-2xl text-azure dark:text-gold">{p.progress}%</span>
                  </div>
                  <h3 className="font-display font-extrabold text-xl mb-2">{p.title}</h3>
                  <p className="text-sm t-muted leading-relaxed mb-5">{p.desc}</p>
                  <div className="h-2.5 bg-[var(--c-tint)] dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-azure to-navy rounded-full bar-grow" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-16 bg-navy rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-azure/25 blur-[90px] rounded-full" />
              <div className="relative">
                <div className="text-center mb-10">
                  <Chip tone="gold">تطلعاتنا</Chip>
                  <h3 className="font-display font-black text-2xl md:text-3xl text-white mt-4">نحو مدرسة الغد</h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {aspirations.map((a, i) => (
                    <Reveal key={a.t} delay={i * 80}>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-gold/40 transition-colors h-full">
                        <a.icon className="w-8 h-8 text-gold mx-auto mb-3" strokeWidth={1.7} />
                        <h4 className="font-display font-extrabold text-white text-lg mb-1.5">{a.t}</h4>
                        <p className="text-sm text-white/55 leading-relaxed">{a.d}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
