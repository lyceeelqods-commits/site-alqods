# الثانوية التأهيلية القدس — القنيطرة | Site officiel + Plateforme d'évaluation

Site officiel du **Lycée Qualifiant Al Qods (Kénitra, Maroc)** avec une plateforme
interactive de **تقويم تشخيصي** en Histoire-Géographie, supervisée par **الأستاذ عماد طليل**.

> Interface 100% arabe RTL · Responsive (mobile + desktop) · Mode sombre · Données locales (LocalStorage, sans serveur).

## Stack technique

- **React 19 + TypeScript + Vite 7** (build monofichier via `vite-plugin-singlefile`)
- **Tailwind CSS 4** + **Framer Motion** + **Lucide Icons**
- Données pédagogiques intégrées dans `src/data/` (niveaux, banques de questions, bibliothèque, examens)

## Démarrage rapide

```bash
npm install
npm run dev      # développement : http://localhost:5173
npm run build    # build production -> dossier dist/
npm run preview  # prévisualiser le build
```

## Sauvegarde sur GitHub (pas à pas)

Dans le dossier du projet, exécutez :

```bash
# 1. Initialiser le dépôt (une seule fois)
git init
git add .
git commit -m "Sauvegarde initiale - site Lycee Al Qods"

# 2. Créer le dépôt sur github.com (ex: lycee-al-qods), SANS README ni .gitignore
# 3. Lier et pousser
git branch -M main
git remote add origin https://github.com/VOTRE-USER/lycee-al-qods.git
git push -u origin main
```

Mises à jour suivantes :

```bash
git add .
git commit -m "Description de la modification"
git push
```

> Le fichier `dist/` est exclu via `.gitignore` (il est régénéré par `npm run build`).
> La sauvegarde **des données utilisateurs** (résultats des élèves, config) se fait
> depuis la page **« نسخة احتياطية » (Sauvegarde)** intégrée au site (export JSON/CSV).

## Déploiement

- **Netlify / Hostinger / Vercel** : publiez le dossier `dist/` (le fichier `dist/index.html`
  est autonome : JS + CSS intégrés, aucune base de données requise).
- **GitHub Pages** : comme le build est un fichier HTML unique, il fonctionne tel quel
  après déploiement du dossier `dist/`.

## Structure

```
src/
  App.tsx            # routage interne (PageKey)
  main.tsx           # entrée React
  index.css          # Tailwind + thème + animations
  components/        # Header, Footer, TestEngine, ResultPage, DocLibrary, Dashboard...
  pages/             # Home, About, Life, Learning, Assessment, Exams, LibraryPortal...
  data/              # levels, tracks, library, exams, resources, lessons
  lib/               # diagnosis (correction), store (LocalStorage), site (config)
```

## Données locales (navigateur)

| Clé | Contenu |
|---|---|
| `amjad_records_v1` | Résultats des évaluations (élèves) |
| `quds_student_identity_v1` | Identité élève (nom, massar, classe) |
| `quds_school_config_v1` | Configuration de l'institution |
| `quds_messages_v1` | Messages du formulaire de contact |
| `quds_test_session_v1` | Session d'examen en cours (reprise auto) |
| `quds_lib_favorites` | Favoris de la bibliothèque |
| `quds_dark` | Préférence mode sombre |

© 2025 الثانوية التأهيلية القدس — القنيطرة، المملكة المغربية.
