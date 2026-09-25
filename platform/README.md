# منصة الحراسة العامة — الثانوية التأهيلية القدس (القنيطرة)

منصة تدبير داخلي كاملة: التلاميذ، الأقسام، رصد الحضور والغياب، التأخرات، إشعارات الأولياء عبر واتساب، التقارير، المستخدمون بالصلاحيات، وسجل تدقيق كامل.

## Stack

- **Backend** : Node.js + Express + SQLite (`node:sqlite` — sans compilation native)
- **Frontend** : React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + Lucide Icons
- **Auth** : sessions par cookies HttpOnly, mots de passe hachés (scrypt + sel), RBAC 4 rôles
- **RTL 100%** — Interface intégralement en arabe

## Démarrage

```bash
npm install        # dépendances
npm run build      # construit l'interface → dist/
npm start          # démarre le serveur sur http://localhost:3000
npm run seed       # (optionnel) reconstruit la base avec les données de démo
```

Au premier démarrage, si la base est vide, elle est initialisée automatiquement avec des données de démonstration réalistes (~188 élèves, 12 classes, ~11 000 lignes de présence sur 15 jours scolaires).

> La base SQLite vit dans `data/alqods.db` (hors Git — régénérable via `npm run seed`).

## Comptes de démonstration (mot de passe : `alqods123`)

| Utilisateur | Rôle | Accès |
|---|---|---|
| `moudir` | مدير المؤسسة | Tout : utilisateurs, réglages, audit |
| `haraka` | الحراسة العامة | Opérationnel : élèves, pointage, retards, notifications |
| `idara` | الإدارة | Élèves, classes, rapports, notifications |
| `prof` | أستاذ(ة) | Pointage des présences uniquement |

> ⚠️ **Changer ces mots de passe en production** (page المستخدمون → كلمة السر).

## Automatisations (seuils configurables dans الإعدادات)

- **Retard > 10 min** (par défaut) : badge d'alerte, inscription à la liste « يتطلب إشعار الولي », préparation du message WhatsApp parent avec modèle pré-rempli.
- **Absences > 20 h** (par défaut) : l'élève apparaît dans « تلاميذ يحتاجون إلى تنبيه » + message parent prêt à envoyer.

## WhatsApp (honnête par conception)

La plateforme est **structurée pour le WhatsApp Business Cloud API** (Meta Graph) : renseigner Phone Number ID + Token dans الإعدادات → واتساب.

- **Non connectée** (par défaut) : la plateforme affiche « غير مرتبط بخدمة WhatsApp », les notifications restent *قيد الانتظار* et un lien `wa.me` pré-rempli permet l'envoi manuel, confirmé explicitement par l'agent.
- **Connectée** : envoi réel via `graph.facebook.com/v21.0/{phone-id}/messages` ; tout échec est enregistré avec sa cause. **Aucun envoi n'est simulé.**

## Sécurité

- Sessions cookies HttpOnly + SameSite=Lax, expiration 1 j (30 j si « تذكرني »)
- Mots de passe : scrypt + sel aléatoire, comparaison à temps constant
- RBAC serveur sur chaque route + UI filtrée par rôle
- Journal d'audit : qui a fait quoi, quand (login, créations, modifications, envois, rapports…)
- Suppression = **archivage** (élèves et classes) ; restauration possible ; confirmation avant chaque action sensible
- Traçabilité du pointage : `recorded_by` sur chaque séance

## Schéma relationnel

`users, sessions, academic_years, levels, classes, subjects, teachers, students, attendance, late_arrivals, notifications, notification_templates, settings, audit_logs` — voir `server/db.js`.
