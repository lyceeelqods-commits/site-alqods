import { useCallback, useEffect, useState } from 'react';
import Header, { type PageKey } from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { AboutPage, AdminPage, LevelsPage } from './pages/About';
import { ActivitiesPage, GalleryPage, ProjectsPage } from './pages/Life';
import { ResourcesPage, StudentsPage, TeachersPage } from './pages/Learning';
import AssessmentPage from './pages/Assessment';
import ExamsPage from './pages/Exams';
import { NewsPage, ContactPage, SettingsPage } from './pages/Info';
import BackupPage from './pages/Backup';
import { loadConfig, type SiteConfig } from './lib/site';

export default function App() {
  const [page, setPage] = useState<PageKey>('home');
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('quds_dark') === '1';
    } catch {
      return false;
    }
  });
  const [cfg, setCfg] = useState<SiteConfig>(() => loadConfig());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('quds_dark', dark ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [dark]);

  const navigate = useCallback((p: PageKey) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  }, []);

  const toggleDark = useCallback(() => setDark((d) => !d), []);

  return (
    <div className="min-h-screen font-body" style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>
      <Header page={page} onNavigate={navigate} dark={dark} onToggleDark={toggleDark} />

      <main>
        {page === 'home' && <Home cfg={cfg} onNavigate={navigate} />}
        {page === 'about' && <AboutPage cfg={cfg} onNavigate={navigate} />}
        {page === 'administration' && <AdminPage cfg={cfg} onNavigate={navigate} />}
        {page === 'levels' && <LevelsPage cfg={cfg} onNavigate={navigate} />}
        {page === 'activities' && <ActivitiesPage cfg={cfg} onNavigate={navigate} />}
        {page === 'gallery' && <GalleryPage cfg={cfg} onNavigate={navigate} />}
        {page === 'projects' && <ProjectsPage cfg={cfg} onNavigate={navigate} />}
        {page === 'personal' && <AssessmentPage onNavigate={navigate} />}
        {page === 'exams' && <ExamsPage />}
        {page === 'resources' && <ResourcesPage cfg={cfg} onNavigate={navigate} />}
        {page === 'students' && <StudentsPage cfg={cfg} onNavigate={navigate} />}
        {page === 'teachers' && <TeachersPage cfg={cfg} onNavigate={navigate} />}
        {page === 'news' && <NewsPage cfg={cfg} onNavigate={navigate} />}
        {page === 'contact' && <ContactPage cfg={cfg} onNavigate={navigate} />}
        {page === 'settings' && <SettingsPage cfg={cfg} onCfgChange={setCfg} onNavigate={navigate} />}
        {page === 'backup' && <BackupPage />}
      </main>

      <Footer onNavigate={navigate} cfg={cfg} />
    </div>
  );
}
