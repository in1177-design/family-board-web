# Family Board – handoff ל-Claude Code

## מה יש כאן

- `SPEC.md` – האפיון המלא: שלוש השכבות (לו״ז, שגרות, משימות), ניקוד, תצוגות, מודל נתונים ב-TypeScript וכללי חישוב. שלב 1 ושלב 2 מסומנים.
- `screens/` – מסכי עיצוב לדוגמה (HTML עם סגנונות inline). רפרנס חזותי בלבד, לא קוד להעתקה.
  - `Main.dc.html` – מלוח השגרות
  - `Editor.dc.html` – הכנסת שגרה: ימים, צעדים ותצוגה מקדימה
  - `Suggest.dc.html` – הצעת צעד ע״י ילד ואישור הורה
  - `Flex.dc.html` – שגרה גמישה: הילד בוחר שעה

## פרומפט פתיחה ל-Claude Code

```
Read docs/family-board/SPEC.md and the reference screens in docs/family-board/screens/.
Build Phase 1 only (skip "שלב 2: הסעות").
Before writing code:
1. Compare the data model in SPEC.md to the existing code and database, and list what changes.
2. Propose how data syncs between the desktop app and phones (see the open question in SPEC.md).
3. Propose an implementation order.
Wait for my approval before you start implementing.
UI is Hebrew, RTL.
```
