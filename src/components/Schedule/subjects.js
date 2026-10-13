// קבוצות מקצועות במערכת השבועית (2026-10-13, לפי העיצוב של המשתמשת): צבע ואייקון לכל שיעור וחוג.
// הקבוצה נקבעת לפי השם (מילות מפתח). צבע שנבחר בחלון (item.color) גובר, ונותן את הסגנון של הצבע הזה.
// color: רקע הכרטיס. edge: מסגרת וצל. ink: הכותרת

export const GROUPS = [
  { id: 'lang',     label: 'שפות',           icon: 'book-open', color: '#DCEBFF', edge: '#7FA8E0', ink: '#24518F' },
  { id: 'math',     label: 'מתמטיקה',        icon: 'pencil',    color: '#FFE4F3', edge: '#E58BB8', ink: '#9C2F68' },
  { id: 'world',    label: 'עולם ודעת',      icon: 'tree',      color: '#DDF5E8', edge: '#6FC08F', ink: '#23704A' },
  { id: 'move',     label: 'תנועה ואומנות',  icon: 'trophy',    color: '#FFF1C2', edge: '#E3B33A', ink: '#7F5A00' },
  { id: 'activity', label: 'חוגים',          icon: 'smile',     color: '#EDE3FF', edge: '#A88BE0', ink: '#51379A' }
]
// צבע נוסף בחלון, בלי קבוצה
const EXTRA = [{ id: 'coral', label: 'אלמוג', color: '#FFE3E0', edge: '#E9917F', ink: '#9A3B27' }]

// הצבעים לבחירה בחלון: "לפי השם" (בלי צבע שמור), ואז כל הקבוצות והאלמוג
export const COLOR_CHOICES = [
  { value: null, label: 'לפי השם' },
  ...[...GROUPS, ...EXTRA].map(g => ({ value: g.color, label: g.label }))
]

const byId = Object.fromEntries(GROUPS.map(g => [g.id, g]))

// לפי הסדר: "מתמטיקה / אומנות" נכנס למתמטיקה, "אמירים - מוזיקה" לתנועה ואומנות
const RULES = [
  { re: /מתמטיקה|גיאומטריה|חשבון/, group: 'math' },
  { re: /שפה|אנגלית|ערבית|אוריינות|לשון|קריאה|צרפתית/, group: 'lang' },
  { re: /חינוך גופני|גו ?- ?פד|ספורט|מקצב|מוזיקה|אומנות|אמנות|ציור|מחול|תיאטרון/, group: 'move' },
  { re: /מולדת|תנ["״]ך|מדעים|מפתח הלב|כישורי חיים|היסטוריה|גיאוגרפיה|מורשת|תורה/, group: 'world' }
]

// אייקון לפי השם, לפני האייקון של הקבוצה
const ICONS = [
  { re: /מוזיקה|מקצב/, icon: 'music' },
  { re: /אומנות|אמנות|ציור/, icon: 'brush' },
  { re: /תנ["״]ך|תורה/, icon: 'notebook' },
  { re: /מדעים/, icon: 'sparkles' },
  { re: /מפתח הלב/, icon: 'heart' },
  { re: /כישורי חיים/, icon: 'smile' },
  { re: /שחייה.*מים|מים/, icon: 'cloud-sun' },
  { re: /יבש/, icon: 'trophy' },
  { re: /הישרדות|צופים/, icon: 'fire' },
  { re: /מתמטיקה|גיאומטריה/, icon: 'pencil' }
]

// הסגנון של שיעור או חוג: { color, edge, ink, icon, group }
export function subjectStyle(item) {
  const title = item?.title || ''
  const group = item?.kind === 'activity'
    ? byId.activity
    : byId[RULES.find(r => r.re.test(title))?.group] || null
  const chosen = item?.color && [...GROUPS, ...EXTRA].find(g => g.color.toLowerCase() === item.color.toLowerCase())
  const look = chosen || group || { color: '#F4F1EA', edge: '#CFC8BA', ink: 'var(--pl-text)' }
  const icon = ICONS.find(r => r.re.test(title))?.icon || group?.icon || (chosen?.icon) || 'star'
  return { color: item?.color && !chosen ? item.color : look.color, edge: look.edge, ink: look.ink, icon, group: group?.id || null }
}

// משתני CSS לכרטיס
export const subjectVars = (s) => ({ '--sg-bg': s.color, '--sg-edge': s.edge, '--sg-ink': s.ink })
