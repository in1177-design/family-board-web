import mom from '../../assets/members/mom.jpg'
import tomer from '../../assets/members/tomer.jpg'
import natan from '../../assets/members/natan.jpg'
import riki from '../../assets/members/riki.jpg'
// אווטרים בפיקסלים לעיצוב החדש (2026-10-08, מהמשתמשת: pixel-portrait-*.png, מוקטנים ל-320px)
import pxMom from '../../assets/members/pixel/mom.png'
import pxTomer from '../../assets/members/pixel/tomer.png'
import pxNatan from '../../assets/members/pixel/natan.png'
import pxRiki from '../../assets/members/pixel/riki.png'

// תמונות קבועות של בני המשפחה, לפי השם. תמונה שהועלתה בפרופיל (photo_playful / photo_refined, 2026-10-09) גוברת
const PHOTOS = { 'אמא': mom, 'תומר': tomer, 'אבא נתן': natan, 'נתן': natan, 'אבא': natan, 'ריקי': riki }
const PIXEL_PHOTOS = { 'אמא': pxMom, 'תומר': pxTomer, 'אבא נתן': pxNatan, 'נתן': pxNatan, 'אבא': pxNatan, 'ריקי': pxRiki }

// בעיצוב המשחקי: התמונה שהועלתה לו, או האווטר בפיקסלים. במעודן: התמונה שהועלתה לו, או התמונה הרגילה.
// האפליקציה מצוירת מחדש כשמחליפים עיצוב (useThemeName ב-App)
export function memberPhoto(member) {
  const name = member?.name?.trim()
  if (document.documentElement.dataset.theme === 'pixel') return member?.photo_playful || PIXEL_PHOTOS[name] || PHOTOS[name] || null
  return member?.photo_refined || PHOTOS[name] || null
}

// התמונה הקבועה (בלי העלאה) של בן משפחה בכל עיצוב, לחלון הפרופיל
export function defaultPhoto(member, theme) {
  const name = member?.name?.trim()
  return (theme === 'playful' ? PIXEL_PHOTOS[name] : null) || PHOTOS[name] || null
}
