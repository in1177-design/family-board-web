import mom from '../../assets/members/mom.jpg'
import tomer from '../../assets/members/tomer.jpg'
import natan from '../../assets/members/natan.jpg'
import riki from '../../assets/members/riki.jpg'

// תמונות של בני המשפחה, לפי השם. אין העלאה מהממשק (BACKLOG.md)
const PHOTOS = { 'אמא': mom, 'תומר': tomer, 'אבא נתן': natan, 'נתן': natan, 'אבא': natan, 'ריקי': riki }

export function memberPhoto(member) {
  return PHOTOS[member?.name?.trim()] || null
}
