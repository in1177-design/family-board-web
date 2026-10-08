import mom from '../../assets/members/mom.jpg'
import tomer from '../../assets/members/tomer.jpg'
import natan from '../../assets/members/natan.jpg'
import riki from '../../assets/members/riki.jpg'
// אווטרים בפיקסלים לעיצוב החדש (2026-10-08, מהמשתמשת: pixel-portrait-*.png, מוקטנים ל-320px)
import pxMom from '../../assets/members/pixel/mom.png'
import pxTomer from '../../assets/members/pixel/tomer.png'
import pxNatan from '../../assets/members/pixel/natan.png'
import pxRiki from '../../assets/members/pixel/riki.png'

// תמונות של בני המשפחה, לפי השם. אין העלאה מהממשק (BACKLOG.md)
const PHOTOS = { 'אמא': mom, 'תומר': tomer, 'אבא נתן': natan, 'נתן': natan, 'אבא': natan, 'ריקי': riki }
const PIXEL_PHOTOS = { 'אמא': pxMom, 'תומר': pxTomer, 'אבא נתן': pxNatan, 'נתן': pxNatan, 'אבא': pxNatan, 'ריקי': pxRiki }

// בעיצוב החדש: האווטר בפיקסלים. האפליקציה מצוירת מחדש כשמחליפים עיצוב (useThemeName ב-App)
export function memberPhoto(member) {
  const name = member?.name?.trim()
  if (document.documentElement.dataset.theme === 'pixel' && PIXEL_PHOTOS[name]) return PIXEL_PHOTOS[name]
  return PHOTOS[name] || null
}
