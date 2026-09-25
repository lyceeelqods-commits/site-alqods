import { useState } from 'react';
import {
  Download, Upload, CheckCircle2, AlertCircle, Archive,
  HardDrive, Copy, Check, Info, FileSpreadsheet
} from 'lucide-react';
import Reveal from '../components/Reveal';
import { PageHeader, Chip } from '../components/ui';
import { loadConfig, saveConfig } from '../lib/site';
import { loadRecords, loadStudent, saveStudentIdentity } from '../lib/store';

export default function BackupPage() {
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Collect all project data stored locally
  const getFullProjectData = () => {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      institution: 'الثانوية التأهيلية القدس — القنيطرة',
      supervisor: 'الأستاذ عماد طليل',
      data: {
        config: loadConfig(),
        studentIdentity: loadStudent(),
        testRecords: loadRecords(),
        localMessages: JSON.parse(localStorage.getItem('quds_messages_v1') || '[]'),
      }
    };
  };

  // Download complete project backup as JSON
  const handleDownloadJSON = () => {
    const backup = getFullProjectData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sauvegarde-lycee-al-qods-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download clean CSV of student diagnostic results
  const handleDownloadCSV = () => {
    const records = loadRecords();
    const headers = ['المعرف', 'اسم التلميذ', 'المستوى', 'التاريخ', 'نقطة التاريخ', 'نقطة الجغرافيا', 'المجموع /20', 'النسبة المئوية', 'القرار التربوي'];
    const rows = records.map(r => [
      r.id,
      r.code,
      r.levelLabel,
      r.date,
      r.historyScore,
      r.geoScore,
      r.totalScore,
      `${r.percent}%`,
      r.support === 'green' ? 'تحكم جيد' : r.support === 'yellow' ? 'دعم جزئي' : 'معالجة'
    ]);

    const csvContent = '\ufeff' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resultats-eleves-al-qods-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Copy raw JSON to clipboard
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getFullProjectData(), null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  // Handle restoring backup file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.data) {
            if (parsed.data.config) saveConfig(parsed.data.config);
            if (parsed.data.studentIdentity) saveStudentIdentity(parsed.data.studentIdentity);
            if (parsed.data.testRecords) localStorage.setItem('amjad_records_v1', JSON.stringify(parsed.data.testRecords));
            if (parsed.data.localMessages) localStorage.setItem('quds_messages_v1', JSON.stringify(parsed.data.localMessages));
            
            setImportStatus({ ok: true, msg: 'تم استرجاع نسخة المشروع والبيانات بنجاح!' });
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setImportStatus({ ok: false, msg: 'صيغة الملف غير متوافقة مع نسخة المشروع.' });
          }
        } catch {
          setImportStatus({ ok: false, msg: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.' });
        }
      };
    }
  };

  const records = loadRecords();

  return (
    <div className="min-h-screen bg-paper pb-20 pt-28">
      <PageHeader
        eyebrow="Sauvegarde & Exportation du Projet"
        title="تنزيل نسخة احتياطية للمشروع"
        subtitle="Télécharger la sauvegarde complète des données, résultats des évaluations et configuration du site"
        crumb="نسخة احتياطية"
      />

      <div className="max-w-5xl mx-auto px-5 md:px-6 pt-12 space-y-10">
        
        {/* Intro Banner */}
        <Reveal>
          <div className="surface rounded-3xl p-6 md:p-8 border-2 border-[#e9dcc3] dark:border-[#3b3222] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0c3b2e] to-[#14553f] text-[#d9a441] flex items-center justify-center shrink-0 shadow-md">
                <HardDrive className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display font-black text-xl md:text-2xl text-ink">مركز النسخ الاحتياطي والأرشفة</h2>
                <p className="text-xs md:text-sm t-muted mt-1">
                  يمكنك تحميل كافة إعدادات الموقع، نتائج التلاميذ في التقويم، وبنك المعطيات وحفظها على حاسوبك أو استرجاعها لاحقاً.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-leaf-soft text-leaf shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              جاهز للتصدير
            </div>
          </div>
        </Reveal>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Full JSON Backup */}
          <Reveal delay={100}>
            <div className="card-surface rounded-3xl p-7 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center">
                  <Archive className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-xl text-ink">النسخة الشاملة (JSON)</h3>
                  <Chip tone="gold">Sauvegarde Complète</Chip>
                </div>
                <p className="text-xs md:text-sm t-muted leading-relaxed">
                  تتضمن كافة إعدادات المؤسسة، شريط الإعلانات، بيانات التلاميذ، وسجل كل التقويمات التشخيصية المنجزة مع الإحصائيات الكاملة.
                </p>
                
                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="surface-tint p-3 rounded-xl text-center">
                    <span className="text-[11px] t-muted block">عدد التقويمات</span>
                    <b className="font-display text-lg text-ink">{records.length}</b>
                  </div>
                  <div className="surface-tint p-3 rounded-xl text-center">
                    <span className="text-[11px] t-muted block">حالة الإعدادات</span>
                    <b className="font-display text-xs text-leaf">مُعدّلة ومحفوظة</b>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-[var(--c-border)]">
                <button
                  onClick={handleDownloadJSON}
                  className="btn-primary w-full py-4 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le fichier .JSON
                </button>
                <button
                  onClick={handleCopyJSON}
                  className="w-full py-3 rounded-2xl border-2 border-[var(--c-border)] text-xs font-bold flex items-center justify-center gap-2 surface hover:border-[#b5832a] transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-leaf" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'تم نسخ الشفرة للحافظة' : 'نسخ شفرة البيانات (Copier)'}
                </button>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Excel / CSV Export */}
          <Reveal delay={200}>
            <div className="card-surface rounded-3xl p-7 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-xl text-ink">سجل النقط (Excel / CSV)</h3>
                  <Chip tone="green">Tableau Excel</Chip>
                </div>
                <p className="text-xs md:text-sm t-muted leading-relaxed">
                  تصدير مباشر لنتائج وتفريغ نقاط التلاميذ في مادة التاريخ والجغرافيا إلى جدول Excel منظم وقابل للطباعة والمشاركة مع الإدارة أو المفتش التربوي.
                </p>

                <div className="p-4 rounded-2xl surface-tint text-xs t-muted space-y-1">
                  <div className="font-bold text-ink">الأعمدة المتضمنة في الملف:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>اسم التلميذ / الرمز التعريفي</li>
                    <li>المستوى الدراسي والمسلك</li>
                    <li>نقطة التاريخ ونقطة الجغرافيا والمجموع /20</li>
                    <li>النسبة المئوية ومستوى التحكم التربوي</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--c-border)]">
                <button
                  onClick={handleDownloadCSV}
                  className="btn-gold w-full py-4 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exporter les Résultats (.CSV / Excel)
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Restore / Import Section */}
        <Reveal delay={250}>
          <div className="surface rounded-3xl p-7 md:p-8 border-2 border-dashed border-[#b5832a]/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-black text-[#8c5f1f] dark:text-[#e0b256]">
                  <Upload className="w-4 h-4" />
                  استرجاع نسخة سابقة (Restaurer une sauvegarde)
                </div>
                <h3 className="font-display font-black text-xl text-ink">هل تملك ملف نسخة احتياطية سابق؟</h3>
                <p className="text-xs md:text-sm t-muted max-w-xl">
                  يمكنك إعادة رفع ملف JSON قمت بتحميله سابقاً لاستعادة جميع البيانات والنتائج وإعدادات المؤسسة في ثوانٍ.
                </p>
              </div>

              <label className="btn-primary cursor-pointer px-7 py-4 rounded-2xl font-display font-black text-sm flex items-center gap-2 shrink-0">
                <Upload className="w-4 h-4" />
                <span>اختيار ملف النسخة (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className={`mt-5 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 anim-pop ${
                importStatus.ok ? 'bg-leaf-soft text-leaf border border-leaf/30' : 'bg-terra-soft text-terra border border-terra/30'
              }`}>
                {importStatus.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {importStatus.msg}
              </div>
            )}
          </div>
        </Reveal>

        {/* Technical Notice for Hostinger / Deployment */}
        <Reveal delay={300}>
          <div className="surface-tint rounded-2xl p-5 text-xs t-muted leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-azure shrink-0 mt-0.5" />
            <div>
              <b className="text-ink font-bold block mb-1">معلومة تقنية للنشر على Hostinger أو أي استضافة:</b>
              الموقع مبرمج وفق تقنية Single Page Application المستقلة بالكامل (Vite SingleFile). ملف النشر النهائي <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-azure font-mono">dist/index.html</code> يتضمن كامل الأكواد والأنماط والأيقونات المدمجة دون الحاجة لقاعدة بيانات خارجية.
            </div>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
