// מסגרת לכרטיסים (מעבדת הסגנונות, 2026-10-07): הגאומטריה, משתני ה-CSS,
// והחלה על כל האפליקציה. הכללים ב-styles/lab.css

// ארבע דרכים, לפי הסדר שהמשתמשת קבעה
export const VARIANTS = [
  { id: 'round',  title: '1. מסגרת מעוגלת' },
  { id: 'shadow', title: '2. מדרגה אחת, מצללים' },
  { id: 'clip',   title: '3. מדרגות, מחיתוך' },
  { id: 'img',    title: '4. מדרגות, מתמונה' }
]
// הדרכים שבהן כמות המדרגות משנה
export const STEPPED = ['clip', 'img']

// ברירת מחדל: צבע מסגרת c, צבע רקע bg, עובי ומדרגה b, מדרגות n,
// צל shadow (כן/לא), צבע הצל sh, עובי הצל so
export const FRAME_DEFAULTS = { c: '#8E70C9', bg: '#FFFDF8', b: 3, n: 2, shadow: true, sh: '#E9DEF7', so: 6 }

// פינה במדרגות: n מדרגות בגודל s פיקסלים. הנקודות של הפינה השמאלית העליונה, מלמטה למעלה
function cornerPoints(n, s) {
  const pts = []
  for (let i = 0; i < n; i++) pts.push([i * s, (n - i) * s], [(i + 1) * s, (n - i) * s])
  pts.push([n * s, 0])
  return pts
}

// clip-path לכל ארבע הפינות: הפינה השמאלית העליונה, ותמונות הראי שלה, עם כיוון השעון
export function stairPolygon(n, s) {
  const at = (v, flip) => flip ? (v ? `calc(100% - ${v}px)` : '100%') : `${v}px`
  const tl = cornerPoints(n, s)
  const back = [...tl].reverse()
  const pts = [
    ...tl.map(([a, b]) => [at(a), at(b)]),
    ...back.map(([a, b]) => [at(a, true), at(b)]),
    ...tl.map(([a, b]) => [at(a, true), at(b, true)]),
    ...back.map(([a, b]) => [at(a), at(b, true)])
  ]
  return `polygon(${pts.map(p => p.join(' ')).join(', ')})`
}

// clip-path עם מדרגות רק בשתי הפינות העליונות. לכותרת חלון בתוך מסגרת מתמונה (דרך 3)
export function stairTopPolygon(n, s) {
  const tl = cornerPoints(n, s)
  const tr = [...tl].reverse().map(([a, b]) => [a ? `calc(100% - ${a}px)` : '100%', `${b}px`])
  const pts = [...tl.map(([a, b]) => [`${a}px`, `${b}px`]), ...tr, ['100%', '100%'], ['0', '100%']]
  return `polygon(${pts.map(p => p.join(' ')).join(', ')})`
}

// תמונת SVG למסגרת עם n מדרגות (border-image), משבצת אחת לכל פיקסל בציור.
// לכל משבצת: המרחק מהקצה הקרוב בכל ציר. סכום קטן מ-n: מחוץ למסגרת. שווה ל-n, או על הקצה: מסגרת. אחרת: פנים
export function stairSvg(n, frame, fill) {
  const N = 2 * (n + 1) + 1
  const rects = []
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      const cx = Math.min(x, N - 1 - x)
      const cy = Math.min(y, N - 1 - y)
      if (cx + cy < n) continue
      const isFrame = cx + cy === n || cx === 0 || cy === 0
      rects.push(`<rect x='${x}' y='${y}' width='1' height='1' fill='${isFrame ? frame : fill}'/>`)
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${N}' height='${N}' viewBox='0 0 ${N} ${N}' shape-rendering='crispEdges'>${rects.join('')}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// משתני ה-CSS של מסגרת. בלי צל: הסטה 0, והצל מוסתר מתחת לכרטיס
export function frameVars(f) {
  const { variant, c, bg, b, n, shadow, sh, so } = { ...FRAME_DEFAULTS, ...f }
  const vars = {
    '--px-b': b + 'px', '--px-c': c, '--px-sh': sh, '--px-so': (shadow ? so : 0) + 'px', '--fr-bg': bg
  }
  if (variant === 'img') {
    vars['--fr-bw'] = (n + 1) * b + 'px'
    vars['--fr-bi'] = `url("${stairSvg(n, c, bg)}") ${n + 1} fill / ${(n + 1) * b}px stretch`
    // הכותרת של חלון נכנסת לעובי המסגרת עד הקו, ונחתכת במדרגות שבפנים: n-1 מדרגות בגודל b
    vars['--fr-extra'] = n * b + 'px'
    vars['--fr-head-clip'] = stairTopPolygon(n - 1, b)
  }
  if (variant === 'clip') {
    vars['--fr-clip'] = stairPolygon(n, b)
    // הכותרת מתחילה אחרי הקו (עובי אחד פנימה), ונחתכת כמו השכבה הפנימית
    vars['--fr-extra'] = -b + 'px'
    vars['--fr-head-clip'] = stairTopPolygon(n, b)
  }
  return vars
}

// ── המסגרת בכל האפליקציה: רק בעיצוב החדש, נשמרת במכשיר (כמו בחירת העיצוב) ──
const KEY = 'family_frame'
let appliedVars = []
// המסגרת שמוחלת עכשיו (גם כש-localStorage חסום)
let current = null
export const appliedFrame = () => current

export function readFrame() {
  try {
    const f = JSON.parse(localStorage.getItem(KEY))
    return f && VARIANTS.some(v => v.id === f.variant) ? f : null
  } catch { return null }
}

export function applyFrame(f) {
  const root = document.documentElement
  appliedVars.forEach(v => root.style.removeProperty(v))
  appliedVars = []
  current = f && VARIANTS.some(v => v.id === f.variant) ? f : null
  if (!f || !VARIANTS.some(v => v.id === f.variant)) { delete root.dataset.frame; window.dispatchEvent(new Event(FRAME_EVENT)); return }
  Object.entries(frameVars(f)).forEach(([k, v]) => { root.style.setProperty(k, v); appliedVars.push(k) })
  root.dataset.frame = f.variant
  window.dispatchEvent(new Event(FRAME_EVENT))
}

export function saveFrame(f) {
  applyFrame(f)
  try {
    if (f) localStorage.setItem(KEY, JSON.stringify(f))
    else localStorage.removeItem(KEY)
  } catch { /* בלי שמירה: נשאר עד רענון */ }
}

// ── PixelCard: כרטיס עם המסגרת שהוחלה, בצבעים משלו ──
// אירוע לכל שינוי במסגרת של האפליקציה, כדי שכרטיס עם צבעים משלו יבנה את המשתנים מחדש
export const FRAME_EVENT = 'family-frame'

// משתני CSS לכרטיס עם צבע מסגרת (color) ורקע (bg) משלו. בלי מסגרת שהוחלה: רק הצבעים
export function cardVars(frame, color, bg) {
  if (!color && !bg) return null
  if (!frame) return { '--card-c': color, '--card-bg': bg }
  return frameVars({ ...frame, c: color || frame.c, bg: bg || frame.bg })
}
