# Family Board — איפיון מעבר ל-Web

## רקע ומטרה

האפליקציה קיימת כיום כ-Electron (דסקטופ בלבד).
המטרה: להפוך אותה ל-Web App נגיש מכל מכשיר — טלפון, טאבלט, מחשב.
בשלב ראשון: שימוש פנימי למשפחה. בשלב מאוחר יותר: מוצר מסחרי עם מנוי חודשי.

---

## קהל יעד

- **שלב 1:** משפחה אחת (המשפחה שלי) — מחשב, טאבלט, 4 טלפונים
- **שלב 2:** משפחות נוספות — גישה מאינטרנט, כל מכשיר
- **שלב עסקי:** מוצר SaaS עם מנוי חודשי

---

## ארכיטקטורה מוצעת

```
┌─────────────────────────────────────────────┐
│              Frontend (React)               │
│         Vercel — vercel.com (חינמי)         │
│   React + Zustand + Vite (כמו שיש כיום)    │
└─────────────────┬───────────────────────────┘
                  │ REST API (HTTPS)
┌─────────────────▼───────────────────────────┐
│             Backend (Node.js)               │
│         Render.com / Railway (חינמי)        │
│              Express + JWT                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           Database (PostgreSQL)             │
│         Supabase (חינמי עד 500MB)           │
│    כולל Auth מובנה לשלב המסחרי             │
└─────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           Google Calendar API               │
│     OAuth2 עם redirect ל-HTTPS             │
└─────────────────────────────────────────────┘
```

---

## Stack טכנולוגי

| שכבה | כלי | עלות |
|---|---|---|
| Frontend | React + Zustand + Vite | חינמי |
| Hosting Frontend | Vercel | חינמי |
| Backend | Node.js + Express | חינמי |
| Hosting Backend | Render.com | חינמי |
| Database | Supabase (PostgreSQL) | חינמי עד 500MB |
| Auth (שלב 2) | Supabase Auth | חינמי |
| Google Calendar | googleapis | חינמי |
| Domain (שלב 2) | Namecheap / GoDaddy | ~$10/שנה |

---

## פיצ'רים — מה קיים ומה חדש

### קיים (מ-Electron) — יועבר כמעט ללא שינוי
- ✅ ניהול בני משפחה (שם, avatar, צבע, PIN, תפקיד)
- ✅ משימות לילדים (יצירה, עריכה, מחיקה, השלמה)
- ✅ מערכת נקודות + היסטוריה
- ✅ לוח שנה שבועי עם גריד שעות (05:00–23:00)
- ✅ חיבור Google Calendar לכל בן משפחה
- ✅ תצוגה משותפת / נפרדת בלוח שנה
- ✅ תצוגת ילד (PIN + משימות + נקודות + יומן)
- ✅ תצוגת הורה (ניהול מלא)

### חדש — נדרש ל-Web
- 🆕 **Login למשפחה** — כדי שרק המשפחה שלך תגיש לנתונים
- 🆕 **Responsive Design** — עיצוב מותאם לטלפון וטאבלט
- 🆕 **PWA** — אפשרות "התקן על המסך הראשי" בטלפון
- 🆕 **Google OAuth ב-HTTPS** — redirect לדומיין אמיתי
- 🆕 **Multi-tenant** (שלב 2) — כל משפחה עם נתונים נפרדים

### נדחה לשלב מאוחר יותר
- ⏳ תשלומים / מנוי
- ⏳ אימות Google App (Google review)
- ⏳ התראות / push notifications
- ⏳ ניהול מנהל (admin panel)

---

## שלבי הפיתוח

### שלב 0 — הכנה (יום 1)
- [ ] הקמת Supabase project + יצירת טבלאות (families, members, tasks, google_tokens)
- [ ] הקמת Render project לbackend
- [ ] Vercel לfrontend

### שלב 1 — Backend (ימים 1–2)
- [ ] Node.js + Express עם כל ה-endpoints
- [ ] חיבור ל-Supabase
- [ ] Login פשוט למשפחה (סיסמה אחת לכל המשפחה + JWT)
- [ ] העברת כל לוגיקת ה-IPC ל-REST API

```
POST /api/family/setup
GET  /api/family
GET  /api/members
POST /api/members
PUT  /api/members/:id
DEL  /api/members/:id
GET  /api/tasks
POST /api/tasks
PUT  /api/tasks/:id
DEL  /api/tasks/:id
POST /api/tasks/:id/complete
GET  /api/points/history
POST /api/points/manual
GET  /api/google/auth-url/:memberId
GET  /api/google/callback
GET  /api/google/calendars/:memberId
GET  /api/google/events/:memberId
```

### שלב 2 — Frontend (ימים 2–3)
- [ ] החלפת `window.api` (IPC) ב-`fetch` ל-REST API
- [ ] הוספת Login screen (סיסמת משפחה)
- [ ] שמירת JWT ב-localStorage
- [ ] התאמת Zustand store לcalls חדשים

### שלב 3 — Google Calendar ב-Web (יום 3–4)
- [ ] redirect_uri → `https://your-backend.render.com/api/google/callback`
- [ ] עדכון ב-Google Cloud Console
- [ ] שמירת tokens ב-Supabase

### שלב 4 — Responsive + PWA (יום 4–5)
- [ ] CSS responsive לטלפון (media queries)
- [ ] תפריט hamburger לנייד
- [ ] manifest.json + service worker (PWA)
- [ ] בדיקה על טלפון אמיתי

### שלב 5 — בדיקות ו-Deploy (ימים 5–7)
- [ ] Deploy ל-Vercel + Render
- [ ] בדיקה מכל מכשיר (מחשב, טלפון, טאבלט)
- [ ] תיקון בעיות

---

## מה *לא* צריך לכתוב מחדש

- כל רכיבי ה-React (ParentView, KidsView, TaskManager, PointsManager, Settings, WeeklyCalendarGrid וכו')
- Zustand store — רק לשנות את מה ש-`$api` קורא
- עיצוב (CSS) — נשאר זהה
- לוגיקת Google Calendar — עובר לbackend

---

## הערכת זמן

| שלב | זמן |
|---|---|
| Backend + DB | 2 ימים |
| Frontend adaptation | 1 יום |
| Google OAuth ל-Web | 1 יום |
| Responsive + PWA | 1 יום |
| בדיקות + תיקונים | 1–2 ימים |
| **סה"כ** | **~1 שבוע** |

---

## שיקולים עסקיים (לעתיד)

- **מנוי מוצע:** ~30–50 ₪/חודש למשפחה
- **כלי תשלום:** Stripe / Tranzila (ישראלי)
- **Google App Verification:** נדרש לפני פתיחה לציבור (תהליך של 2–4 שבועות)
- **שם מוצר:** Family Board (לבדוק זמינות דומיין)

---

## סדר עדיפויות לשלב הבא

1. **עכשיו:** לסיים ולבדוק את ה-Electron (בעיקר: לוח שנה + Google Calendar)
2. **אחר כך:** להתחיל שלב 0 — הקמת תשתית Web
