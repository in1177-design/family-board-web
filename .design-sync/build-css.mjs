// מחבר את קובצי הסגנון של האפליקציה לקובץ אחד לסנכרון, עם העיצוב החדש (פיקסלים) כברירת מחדל:
// כל ":root[data-theme=\"pixel\"]" הופך ל-":root", כי בעיצובים אין את הכפתור שמחליף עיצוב
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const styles = path.resolve(here, '../src/styles')
const parts = ['global.css', 'plain.css', 'theme-pixel.css', 'lab.css']
  .map(f => `/* ── ${f} ── */\n` + fs.readFileSync(path.join(styles, f), 'utf8'))
const fonts = "@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&family=Silkscreen:wght@400;700&display=swap');\n"
const css = fonts + parts.join('\n').replaceAll(':root[data-theme="pixel"]', ':root')
fs.mkdirSync(path.resolve(here, '../.ds-lib'), { recursive: true })
fs.writeFileSync(path.resolve(here, '../.ds-lib/family-board.css'), css)
console.log('wrote .ds-lib/family-board.css', css.length)

// הטיפוסים (נכתבו ביד) ו-package.json, כדי שהממיר יראה את .ds-lib כחבילה
fs.copyFileSync(path.join(here, 'src/index.d.ts'), path.resolve(here, '../.ds-lib/index.d.ts'))
fs.writeFileSync(path.resolve(here, '../.ds-lib/package.json'),
  JSON.stringify({ name: 'family-board', version: '1.0.0', module: './index.js', types: './index.d.ts' }, null, 2))
