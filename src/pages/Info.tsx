import { useState } from 'react';
import {
  Newspaper, Megaphone, MapPin, Phone, Mail, ExternalLink,
  Send, Settings, RotateCcw, Save, Info, Landmark, Building2, ScrollText,
  CalendarDays, CalendarHeart, Flag,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import { PageHeader, Chip } from '../components/ui';
import type { PageKey } from '../components/Header';
import {
  NEWS_ITEMS, MINISTRY_NEWS, MINISTRY_URL, SCHOOL_YEAR,
  HOLIDAYS, NATIONAL_DAYS, holidayStatus, nextHoliday,
  type SiteConfig, saveConfig, resetConfig,
} from '../lib/site';
import { formatDate } from '../lib/store';

/* ==================== العطل المدرسية ==================== */
function HolidaysSection() {
  const next = nextHoliday();
  const today = new Date();

  return (
    <div className="space-y-8">
      {/* بطاقة أقرب عطلة */}
      {next && (
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-navy text-white p-7 md:p-9">
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0">
                <CalendarHeart className="w-7 h-7 text-gold" />
              </div>
              <div className="flex-1">
                <Chip tone="gold">{next.s.state === 'ongoing' ? 'العطلة جارية' : 'أقرب عطلة مدرسية'}</Chip>
                <h3 className="font-display font-extrabold text-2xl mt-3 mb-1">{next.h.name}</h3>
                <p className="text-white/60 text-sm">
                  من {formatDate(next.h.from)} إلى {formatDate(next.h.to)} — {next.h.days}
                </p>
              </div>
              <div className="text-center shrink-0">
                <div className="font-display font-black text-5xl text-gold leading-none">{next.s.left}</div>
                <div className="text-xs text-white/60 mt-1.5 font-bold">
                  {next.s.state === 'ongoing' ? 'يوماً متبقياً' : 'يوماً للانطلاق'}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* تنويه المرجعية */}
      <Reveal>
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-soft border border-gold/30">
          <Info className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" />
          <div className="text-sm text-gold-deep leading-relaxed">
            <b>المرجعية:</b> العطل المدرسية تُحدَّد سنوياً بمقتضى <b>المقرر الوزاري المنظم للدخول المدرسي والسلم الزمني للدورة</b>،
            الصادر عن وزارة التربية الوطنية والتعليم الأولي والرياضة. التواريخ المعروضة هنا استرشادية — يُرجى الرجوع إلى
            المقرر الرسمي لكل موسم دراسي، أو <a href={MINISTRY_URL} target="_blank" rel="noreferrer" className="underline font-bold">الموقع الرسمي للوزارة</a>.
          </div>
        </div>
      </Reveal>

      {/* جدول العطل */}
      <Reveal>
        <div className="surface rounded-3xl border border-line overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-line bg-[var(--c-tint)] dark:bg-white/5">
            <h3 className="font-display font-extrabold text-xl flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center">
                <CalendarDays className="w-4.5 h-4.5 w-5 h-5" />
              </span>
              جدول العطل المدرسية — {SCHOOL_YEAR}
            </h3>
            <Chip tone="muted">{HOLIDAYS.length} عطل ومناسبات</Chip>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b-2 border-line t-muted">
                  <th className="text-right py-3.5 px-5 font-display text-xs">العطلة</th>
                  <th className="text-center py-3.5 px-3 font-display text-xs">من</th>
                  <th className="text-center py-3.5 px-3 font-display text-xs">إلى</th>
                  <th className="text-center py-3.5 px-3 font-display text-xs">المدة</th>
                  <th className="text-center py-3.5 px-5 font-display text-xs">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {HOLIDAYS.map((h) => {
                  const st = holidayStatus(h, today);
                  const isNext = next?.h.id === h.id;
                  return (
                    <tr key={h.id} className={`border-b border-line transition-colors ${isNext ? 'bg-gold-soft/40' : 'hover:bg-[var(--c-tint)] dark:hover:bg-white/5'}`}>
                      <td className="py-4 px-5">
                        <div className="font-bold text-ink">{h.name}</div>
                        <div className="text-[11px] t-muted mt-0.5">{h.scope}</div>
                        {h.note && <div className="text-[11px] text-gold-deep mt-1">↳ {h.note}</div>}
                      </td>
                      <td className="py-4 px-3 text-center font-bold whitespace-nowrap">{formatDate(h.from)}</td>
                      <td className="py-4 px-3 text-center font-bold whitespace-nowrap">{formatDate(h.to)}</td>
                      <td className="py-4 px-3 text-center font-black text-azure dark:text-gold whitespace-nowrap">{h.days}</td>
                      <td className="py-4 px-5 text-center">
                        {st.state === 'ongoing' ? (
                          <span className="text-[11px] font-black px-2.5 py-1.5 rounded-full bg-leaf-soft text-leaf whitespace-nowrap">جارية — {st.left} يوم</span>
                        ) : st.state === 'upcoming' ? (
                          <span className="text-[11px] font-black px-2.5 py-1.5 rounded-full bg-gold-soft text-gold-deep whitespace-nowrap">بعد {st.left} يوم</span>
                        ) : (
                          <span className="text-[11px] font-black px-2.5 py-1.5 rounded-full surface-tint t-muted whitespace-nowrap">انتهت</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* المناسبات الوطنية */}
      <Reveal>
        <div className="surface rounded-3xl border border-line p-6 md:p-7">
          <h3 className="font-display font-extrabold text-xl mb-5 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-leaf-soft text-leaf flex items-center justify-center">
              <Flag className="w-4.5 h-4.5 w-5 h-5" />
            </span>
            المناسبات الوطنية خلال الموسم
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {NATIONAL_DAYS.map((d) => (
              <div key={d.name + d.date} className="flex items-center gap-3 p-4 rounded-2xl surface-tint">
                <span className="w-11 h-11 rounded-xl bg-white dark:bg-white/10 border border-line flex flex-col items-center justify-center shrink-0">
                  <span className="font-display font-black text-base leading-none text-azure dark:text-gold">{d.date.split('-')[2]}</span>
                  <span className="text-[9px] font-bold t-muted">{d.date.split('-')[1]}</span>
                </span>
                <div>
                  <div className="text-sm font-bold text-ink leading-snug">{d.name}</div>
                  <div className="text-[11px] t-muted">{d.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ==================== الأخبار والإعلانات ==================== */
export function NewsPage({ cfg, onNavigate }: { cfg: SiteConfig; onNavigate: (p: PageKey) => void }) {
  void cfg; void onNavigate;
  const [source, setSource] = useState<'school' | 'ministry' | 'holidays'>('school');
  const [filter, setFilter] = useState<'الكل' | 'خبر' | 'إعلان' | 'دائري'>('الكل');

  const schoolShown = NEWS_ITEMS.filter((n) => filter === 'الكل' || n.type === filter);
  const ministryShown = MINISTRY_NEWS.filter((n) => filter === 'الكل' || n.type === filter);
  const filters: ('الكل' | 'خبر' | 'إعلان' | 'دائري')[] = source === 'school' ? ['الكل', 'خبر', 'إعلان'] : ['الكل', 'إعلان', 'دائري', 'خبر'];

  return (
    <>
      <PageHeader
        eyebrow="المنشورات الرسمية"
        title="الأخبار والإعلانات"
        subtitle="آخر المستجدات والتنظيمات: منشورات المؤسسة، وأخبار وإعلانات قطاع التربية الوطنية"
        crumb="الأخبار والإعلانات"
      />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          {/* source switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="inline-flex p-1.5 rounded-2xl surface-tint self-start">
              <button
                onClick={() => { setSource('school'); setFilter('الكل'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  source === 'school' ? 'bg-azure text-white shadow-lg shadow-azure/25' : 't-muted hover:text-azure'
                }`}
              >
                <Landmark className="w-4 h-4" />
                أخبار وإعلانات المؤسسة
              </button>
              <button
                onClick={() => { setSource('ministry'); setFilter('الكل'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  source === 'ministry' ? 'bg-forest text-white shadow-lg shadow-forest/25' : 't-muted hover:text-azure'
                }`}
              >
                <Building2 className="w-4 h-4" />
                وزارة التربية الوطنية
              </button>
              <button
                onClick={() => { setSource('holidays'); setFilter('الكل'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  source === 'holidays' ? 'bg-gold-deep text-white shadow-lg shadow-gold-deep/25' : 't-muted hover:text-azure'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                العطل المدرسية
              </button>
            </div>
            <Chip tone="gold">
              <Info className="w-3.5 h-3.5" />
              {source === 'school'
                ? 'محتوى تجريبي — يُدار من «لوحة الإعدادات»'
                : source === 'ministry'
                ? 'محتوى تجريبي — يُستبدل بالنصوص والروابط الرسمية للوزارة'
                : 'وفق المقرر الوزاري — تُحدَّث بنشر المقرر الرسمي لكل موسم'}
            </Chip>
          </div>

          {source === 'holidays' && <HolidaysSection />}

          {/* type filters */}
          <div className={`flex flex-wrap gap-2 mb-8 ${source === 'holidays' ? 'hidden' : ''}`}>
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  filter === f ? 'bg-azure text-white shadow-lg shadow-azure/25' : 'surface-tint t-muted hover:text-azure'
                }`}
              >
                {f === 'الكل' ? 'الكل' : f + 'ات'}
              </button>
            ))}
          </div>

          {source === 'school' ? (
            <div className="grid md:grid-cols-2 gap-5">
              {schoolShown.map((n, i) => (
                <Reveal key={n.id} delay={(i % 2) * 80}>
                  <article className="card-surface rounded-3xl p-7 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <Chip tone={n.type === 'إعلان' ? 'gold' : 'green'}>
                        {n.type === 'إعلان' ? <Megaphone className="w-3.5 h-3.5" /> : <Newspaper className="w-3.5 h-3.5" />}
                        {n.type}
                      </Chip>
                      <span className="text-xs t-muted font-bold">{formatDate(n.date)}</span>
                    </div>
                    <h3 className="font-display font-extrabold text-xl mb-3 leading-snug">{n.title}</h3>
                    <p className="t-muted leading-relaxed mb-5">{n.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <Chip tone="muted">{n.tag}</Chip>
                      <span className="text-xs t-muted">الثانوية التأهيلية القدس</span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-5">
                {ministryShown.map((n, i) => (
                  <Reveal key={n.id} delay={(i % 2) * 80}>
                    <article className="card-surface rounded-3xl p-7 h-full border-r-4 border-r-forest">
                      <div className="flex items-center justify-between mb-4">
                        <Chip tone={n.type === 'دائري' ? 'blue' : n.type === 'إعلان' ? 'gold' : 'green'}>
                          {n.type === 'دائري' ? <ScrollText className="w-3.5 h-3.5" /> : n.type === 'إعلان' ? <Megaphone className="w-3.5 h-3.5" /> : <Newspaper className="w-3.5 h-3.5" />}
                          {n.type}
                        </Chip>
                        <span className="text-xs t-muted font-bold">{formatDate(n.date)}</span>
                      </div>
                      <h3 className="font-display font-extrabold text-xl mb-3 leading-snug">{n.title}</h3>
                      <p className="t-muted leading-relaxed mb-5">{n.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <Chip tone="muted">{n.tag}</Chip>
                        <a
                          href={MINISTRY_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-forest dark:text-gold hover:underline"
                        >
                          المصدر: وزارة التربية الوطنية
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>

              <Reveal>
                <div className="mt-8 surface-tint rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-forest text-gold flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-extrabold text-lg mb-1">للاطلاع على النصوص الرسمية كاملة</h3>
                    <p className="text-sm t-muted leading-relaxed">
                      الدوائر والمذكرات والإعلانات الرسمية المنشورة تُتبع من الموقع الرسمي لوزارة التربية الوطنية —
                      يُستحسن اطلاع الأسر والأطر على النصوص الصادرة هناك قبل اعتماد أي مقتضى تنظيمي.
                    </p>
                  </div>
                  <a
                    href={MINISTRY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary px-6 py-3.5 rounded-2xl font-display font-extrabold text-sm inline-flex items-center gap-2 shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    الموقع الرسمي للوزارة
                  </a>
                </div>
              </Reveal>
            </>
          )}
        </div>
      </section>
    </>
  );
}

/* ==================== تواصل معنا ==================== */
export function ContactPage({ cfg }: { cfg: SiteConfig; onNavigate: (p: PageKey) => void }) {
  const [form, setForm] = useState({ name: '', email: '', subject: 'استفسار عام', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    try {
      const box = JSON.parse(localStorage.getItem('quds_messages_v1') || '[]') as unknown[];
      box.push({ ...form, date: new Date().toISOString() });
      localStorage.setItem('quds_messages_v1', JSON.stringify(box));
    } catch { /* ignore */ }
    setSent(true);
    setForm({ name: '', email: '', subject: 'استفسار عام', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  const embedSrc = `https://maps.google.com/maps?q=${cfg.lat},${cfg.lng}&z=15&output=embed`;

  return (
    <>
      <PageHeader
        eyebrow="نحن في خدمتكم"
        title="تواصل معنا"
        subtitle="للاستفسار عن أي موضوع تربوي أو إداري — أو لزيارة المؤسسة، موقعها على الخريطة أدناه"
        crumb="تواصل معنا"
      />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6 grid lg:grid-cols-2 gap-8">
          {/* info + form */}
          <div className="space-y-6">
            <Reveal>
              <div className="surface rounded-3xl shadow-lg p-7 space-y-5">
                <h3 className="font-display font-extrabold text-xl">معلومات الاتصال</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: MapPin, l: 'العنوان', v: `مدينة ${cfg.city} — المملكة المغربية` },
                    { icon: Phone, l: 'الهاتف', v: cfg.phone || 'سيُحدَّد من لوحة الإعدادات' },
                    { icon: Mail, l: 'البريد الإلكتروني', v: cfg.email || 'سيُحدَّد من لوحة الإعدادات' },
                    { icon: Newspaper, l: 'القطاع', v: cfg.sector },
                  ].map((r) => (
                    <div key={r.l} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center shrink-0">
                        <r.icon className="w-4.5 h-4.5 w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs t-muted font-bold">{r.l}</div>
                        <div className="font-bold text-sm">{r.v}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href={cfg.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full btn-gold px-5 py-3.5 rounded-2xl font-display font-extrabold text-center inline-flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4.5 h-4.5 w-5 h-5" />
                  فتح الموقع في Google Maps
                </a>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <form onSubmit={submit} className="surface rounded-3xl shadow-lg p-7 space-y-4">
                <h3 className="font-display font-extrabold text-xl">أرسل رسالة</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="الاسم الكامل"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="البريد الإلكتروني (اختياري)"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm"
                  />
                </div>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm"
                >
                  {['استفسار عام', 'مسألة تربوية', 'مسألة إدارية', 'اقتراح', 'شكوى'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="نص الرسالة…"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm resize-none"
                />
                <button type="submit" className="w-full btn-primary px-5 py-3.5 rounded-2xl font-display font-extrabold inline-flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  إرسال الرسالة
                </button>
                {sent && (
                  <div className="p-3.5 rounded-xl bg-leaf-soft text-leaf text-sm font-bold anim-pop text-center">
                    تم استلام رسالتك (تجريبي — تُحفظ محلياً إلى حين ربط الخادم)
                  </div>
                )}
              </form>
            </Reveal>
          </div>

          {/* map */}
          <Reveal delay={80}>
            <div className="surface rounded-3xl shadow-lg overflow-hidden h-full flex flex-col">
              <div className="p-6 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-xl">موقع المؤسسة</h3>
                  <p className="text-xs t-muted mt-1">
                    الإحداثيات: {cfg.lat}، {cfg.lng}
                  </p>
                </div>
                <Chip tone="blue"><MapPin className="w-3.5 h-3.5" /> {cfg.city}</Chip>
              </div>
              <div className="flex-1 min-h-[380px]">
                <iframe
                  title="موقع الثانوية التأهيلية القدس"
                  src={embedSrc}
                  className="w-full h-full min-h-[380px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ==================== لوحة الإعدادات ==================== */
export function SettingsPage({ cfg, onCfgChange }: { cfg: SiteConfig; onCfgChange: (c: SiteConfig) => void; onNavigate: (p: PageKey) => void }) {
  const [draft, setDraft] = useState<SiteConfig>(cfg);
  const [ann, setAnn] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (k: keyof SiteConfig, v: string) => setDraft({ ...draft, [k]: v });

  const doSave = () => {
    saveConfig(draft);
    onCfgChange(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const doReset = () => {
    const fresh = resetConfig();
    setDraft(fresh);
    onCfgChange(fresh);
  };

  return (
    <>
      <PageHeader
        eyebrow="خدمة إدارية"
        title="لوحة إعدادات المؤسسة"
        subtitle="من هنا تُسند المعلومات الرسمية (الأطر، الهواتف، الإعلانات…) — تُحفظ محلياً على هذا الجهاز"
        crumb="لوحة الإعدادات"
      />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-5 md:px-6 space-y-6">
          <Reveal>
            <div className="surface rounded-3xl shadow-lg p-7 space-y-5">
              <h3 className="font-display font-extrabold text-xl flex items-center gap-2">
                <Settings className="w-5 h-5 text-azure dark:text-gold" />
                معلومات عامة
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(
                  [
                    ['schoolName', 'اسم المؤسسة'],
                    ['city', 'المدينة'],
                    ['sector', 'القطاع / المديرية'],
                    ['description', 'وصف مختصر (يظهر في التذييل)'],
                  ] as [keyof SiteConfig, string][]
                ).map(([k, label]) => (
                  <div key={k} className={k === 'description' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold t-muted mb-1.5">{label}</label>
                    {k === 'description' ? (
                      <textarea rows={3} value={draft.description} onChange={(e) => set(k, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm resize-none" />
                    ) : (
                      <input value={draft[k] as string} onChange={(e) => set(k, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="surface rounded-3xl shadow-lg p-7 space-y-5">
              <h3 className="font-display font-extrabold text-xl">الأطر والمعلومات الرسمية</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(
                  [
                    ['director', 'اسم المدير(ة)'],
                    ['viceDirector', 'اسم نائب(ة) المدير'],
                    ['cpe', 'رئيس(ة) قسم الحياة المدرسية'],
                    ['headOfLibrary', 'مشرف(ة) المكتبة'],
                    ['phone', 'رقم الهاتف'],
                    ['email', 'البريد الإلكتروني'],
                  ] as [keyof SiteConfig, string][]
                ).map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-xs font-bold t-muted mb-1.5">{label}</label>
                    <input
                      value={draft[k] as string}
                      onChange={(e) => set(k, e.target.value)}
                      placeholder="اتركه فارغاً إن لم يتوفر بعد"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs t-muted leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-gold-deep" />
                القيم الفارغة تظهر في الموقع بصياغة «سيُحدَّد من لوحة الإعدادات» — لا تُدرَج أي معلومات غير مؤكدة تلقائياً.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="surface rounded-3xl shadow-lg p-7 space-y-4">
              <h3 className="font-display font-extrabold text-xl">شريط الإعلانات</h3>
              <div className="space-y-3">
                {draft.announcements.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex-1 text-sm px-4 py-3 rounded-xl surface-tint">{a}</span>
                    <button
                      onClick={() => setDraft({ ...draft, announcements: draft.announcements.filter((_, x) => x !== i) })}
                      className="text-xs font-bold text-terra hover:underline shrink-0"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  value={ann}
                  onChange={(e) => setAnn(e.target.value)}
                  placeholder="نص إعلان جديد…"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm"
                />
                <button
                  onClick={() => {
                    if (!ann.trim()) return;
                    setDraft({ ...draft, announcements: [...draft.announcements, ann.trim()] });
                    setAnn('');
                  }}
                  className="px-5 py-3 rounded-xl bg-sky-soft text-azure font-bold text-sm hover:bg-azure hover:text-white transition-colors"
                >
                  إضافة
                </button>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="flex flex-wrap gap-3">
              <button onClick={doSave} className="btn-primary flex-1 min-w-44 px-6 py-4 rounded-2xl font-display font-extrabold inline-flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </button>
              <button onClick={doReset} className="px-6 py-4 rounded-2xl border-2 border-[var(--c-border)] font-bold text-sm inline-flex items-center gap-2 hover:border-terra/50 transition-colors">
                <RotateCcw className="w-4 h-4" />
                استعادة الافتراضي
              </button>
              {saved && <span className="self-center text-sm font-bold text-leaf anim-pop">تم الحفظ بنجاح</span>}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
