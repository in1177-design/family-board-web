# 🏠 Family Board — לוח המשפחה החכם

אפליקציית דסקטופ לניהול לוח משפחתי: יומן, משימות ומערכת נקודות לילדים.

---

## 🚀 התקנה והפעלה

### 1. דרישות מוקדמות
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+

### 2. התקנת תלויות
```bash
npm install
```

### 3. הפעלה במצב פיתוח
```bash
npm run dev
```
פקודה זו מפעילה את Vite (React) ואת Electron בו-זמנית.

### 4. בנייה לייצור
```bash
npm run pack
```
הקובץ הסופי יימצא בתיקיית `dist-electron/`.

---

## 📅 חיבור Google Calendar (אופציונלי)

### שלב 1: יצירת פרויקט Google Cloud
1. גש ל-[Google Cloud Console](https://console.cloud.google.com)
2. צור פרויקט חדש (New Project)
3. חפש "Google Calendar API" והפעל אותו
4. לך ל-**APIs & Services → Credentials**
5. לחץ **Create Credentials → OAuth 2.0 Client ID**
6. בחר סוג: **Desktop App**
7. העתק את **Client ID** ו-**Client Secret**

### שלב 2: הגדרה באפליקציה
1. פתח את Family Board
2. היכנס לתצוגת הורה
3. לך לטאב **⚙️ הגדרות → 📅 Google Calendar**
4. הכנס את ה-Client ID ו-Client Secret ולחץ **שמור**

### שלב 3: חיבור כל בן משפחה
1. לחץ על **"חבר ל-Google Calendar"** ליד כל בן משפחה
2. הדפדפן ייפתח עם דף הרשאות Google
3. אשר את ההרשאות — Google יציג **קוד הרשאה**
4. העתק את הקוד לאפליקציה ולחץ **אישור**
5. לחץ **"טען יומנים"** ובחר את היומן הרצוי

---

## 🗂️ מבנה הפרויקט

```
family-board/
├── electron/
│   ├── main.js          # תהליך ראשי של Electron + IPC handlers
│   ├── preload.js       # גשר מאובטח בין Electron ל-React
│   ├── database.js      # SQLite schema + אתחול
│   └── googleAuth.js    # OAuth2 + שליפת אירועים
├── src/
│   ├── App.jsx          # ניתוב ראשי
│   ├── store/index.js   # ניהול מצב (Zustand)
│   ├── components/
│   │   ├── shared/      # HomeScreen, SetupWizard, Loader, Toast
│   │   ├── KidsView/    # KidsView, WeeklyCalendar, TaskList, PointsDisplay
│   │   └── ParentView/  # ParentView, FamilyOverview, TaskManager, PointsManager, Settings
│   └── styles/global.css
├── package.json
└── vite.config.js
```

---

## 🗄️ מסד הנתונים (SQLite)

הנתונים נשמרים ב:
- **Windows**: `%APPDATA%\family-board\familyboard.db`
- **macOS**: `~/Library/Application Support/family-board/familyboard.db`
- **Linux**: `~/.config/family-board/familyboard.db`

### טבלאות:
| טבלה | תיאור |
|------|-------|
| `families` | פרטי המשפחה (multi-tenant ready עם `family_id`) |
| `members` | בני משפחה — הורים וילדים |
| `tasks` | משימות עם נקודות, תאריכים וחזרות |
| `points_history` | היסטוריית כל הנקודות שנצברו |
| `google_tokens` | טוקני OAuth2 של Google |

---

## 🎯 תכונות עיקריות

| תכונה | תיאור |
|-------|-------|
| 🏠 **מסך בית** | כרטיסי בני המשפחה עם קוד PIN לילדים |
| 📅 **יומן שבועי** | אירועי Google Calendar + משימות לפי תאריך |
| ✅ **משימות** | רשימת משימות אישית עם נקודות, סימון ואנימציה |
| ⭐ **נקודות** | צבירת נקודות, מיילסטונים ולוח מובילים |
| 👑 **פאנל הורה** | ניהול משימות, הוספת נקודות ידנית, הגדרות |
| 🔐 **קוד PIN** | כניסה מוגנת לחשבון כל ילד |
| 🌐 **עברית RTL** | ממשק מלא בעברית עם RTL |

---

## 🛠️ טכנולוגיות

- **Electron 31** — אפליקציית דסקטופ cross-platform
- **React 18 + Vite** — ממשק משתמש מהיר
- **Zustand** — ניהול מצב פשוט
- **better-sqlite3** — מסד נתונים מקומי מהיר
- **Google APIs** — חיבור ל-Google Calendar
- **date-fns** — עיבוד תאריכים
- **Rubik font** — גופן עברי יפה
