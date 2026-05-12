// Demo data for preview/browser mode (no Electron IPC available)
const FAMILY = { id: 'f1', name: 'משפחת לוי' }

const MEMBERS = [
  { id: 'm1', family_id: 'f1', name: 'אמא',  role: 'parent', color: '#6C63FF', avatar: '👩', pin: null,   points: 0 },
  { id: 'm2', family_id: 'f1', name: 'נועה',  role: 'child',  color: '#FF7043', avatar: '🦊', pin: null,   points: 230 },
  { id: 'm3', family_id: 'f1', name: 'יוני',  role: 'child',  color: '#4FC3F7', avatar: '🐯', pin: '5678', points: 95 }
]

const TODAY = new Date().toISOString().split('T')[0]
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const TASKS = [
  { id: 't1', family_id:'f1', member_id:'m2', title:'לסדר את החדר',      description:'לקפל בגדים ולשים בארון', points:15, due_date:TODAY,     completed:0, completed_at:null, recurring:'daily',   created_by:'m1', created_at:'2026-05-10T08:00:00Z' },
  { id: 't2', family_id:'f1', member_id:'m2', title:'לעשות שיעורי בית',  description:'מתמטיקה + עברית',       points:20, due_date:TODAY,     completed:1, completed_at:'2026-05-11T14:00:00Z', recurring:null,    created_by:'m1', created_at:'2026-05-10T08:00:00Z' },
  { id: 't3', family_id:'f1', member_id:'m2', title:'לאמן כלב',          description:'חצי שעה בפארק',         points:10, due_date:TOMORROW,  completed:0, completed_at:null, recurring:'daily',   created_by:'m1', created_at:'2026-05-10T08:00:00Z' },
  { id: 't4', family_id:'f1', member_id:'m2', title:'לשטוף כלים',        description:'',                       points:10, due_date:TODAY,     completed:0, completed_at:null, recurring:'weekly',  created_by:'m1', created_at:'2026-05-10T08:00:00Z' },
  { id: 't5', family_id:'f1', member_id:'m3', title:'לקרוא ספר',         description:'לפחות 20 עמודים',        points:15, due_date:TODAY,     completed:0, completed_at:null, recurring:null,      created_by:'m1', created_at:'2026-05-10T08:00:00Z' },
  { id: 't6', family_id:'f1', member_id:'m3', title:'לעזור בארוחת ערב',  description:'להגיש שולחן',            points:10, due_date:TOMORROW,  completed:1, completed_at:'2026-05-11T19:00:00Z', recurring:'daily',   created_by:'m1', created_at:'2026-05-10T08:00:00Z' },
]

const POINTS_HISTORY = [
  { id:'h1', family_id:'f1', member_id:'m2', task_id:'t2', points:20, reason:'השלמת משימה: לעשות שיעורי בית', created_at:'2026-05-11T14:00:00Z' },
  { id:'h2', family_id:'f1', member_id:'m2', task_id:null, points:50, reason:'בונוס על עזרה מיוחדת',          created_at:'2026-05-10T18:00:00Z' },
  { id:'h3', family_id:'f1', member_id:'m2', task_id:null, points:100,reason:'סיום הסמסטר בהצלחה!',          created_at:'2026-05-01T12:00:00Z' },
  { id:'h4', family_id:'f1', member_id:'m2', task_id:null, points:60, reason:'בונוס שבועי',                  created_at:'2026-04-20T12:00:00Z' },
  { id:'h5', family_id:'f1', member_id:'m3', task_id:'t6', points:10, reason:'השלמת משימה: לעזור בארוחת ערב', created_at:'2026-05-11T19:00:00Z' },
  { id:'h6', family_id:'f1', member_id:'m3', task_id:null, points:50, reason:'ציון מעולה במבחן',             created_at:'2026-05-05T12:00:00Z' },
  { id:'h7', family_id:'f1', member_id:'m3', task_id:null, points:35, reason:'עזרה לסבתא',                   created_at:'2026-04-25T12:00:00Z' },
]

export { FAMILY, MEMBERS, TASKS, POINTS_HISTORY }
