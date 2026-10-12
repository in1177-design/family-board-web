import React, { useEffect, useState } from 'react'
import { useStore } from './store'
import HomeScreen from './components/shared/HomeScreen'
import KidsView from './components/KidsView/KidsView'
import ParentView from './components/ParentView/ParentView'
import SetupWizard from './components/shared/SetupWizard'
import LoginScreen from './components/shared/LoginScreen'
import Loader from './components/shared/Loader'
import ViewSwitcher from './components/shared/ViewSwitcher'
import { ToastProvider } from './components/shared/Toast'
import ThemeToggle, { useThemeName, applyTheme, memberTheme } from './components/shared/ThemeToggle'
import StyleGuide from './components/Design/StyleGuide'

function AppContent() {
  const { members, loadFamily, activeView, activeMemberId } = useStore()
  // מחליפים עיצוב: הכל מצויר מחדש (אווטרים בפיקסלים בעיצוב החדש)
  useThemeName()

  // העיצוב לפי בן המשפחה שבמסך (החלטה 2026-10-09). במסך הבית: מה שנבחר במכשיר
  const viewMember = activeView === 'kid' ? members.find(m => m.id === activeMemberId)
    : activeView === 'parent' ? (members.find(m => m.id === activeMemberId) || members.find(m => m.role === 'parent'))
    : null
  useEffect(() => { applyTheme(memberTheme(viewMember)) }, [viewMember?.id, viewMember?.theme])
  // המדריך המלא, מהכפתור בפס העליון (זמני, 2026-10-12)
  const [guide, setGuide] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [hasToken, setHasToken]         = useState(!!localStorage.getItem('family_token'))

  const init = () => loadFamily().finally(() => setInitializing(false))

  useEffect(() => {
    if (hasToken) {
      init()
    } else {
      setInitializing(false)
    }
  }, [])

  const handleLogin = () => {
    setHasToken(true)
    setInitializing(true)
    init()
  }

  if (initializing)  return <Loader message="טוען את לוח המשפחה..." />
  if (!hasToken)     return <LoginScreen onLogin={handleLogin} />
  if (!members.length) return <SetupWizard familyExists />

  const view = activeView === 'kid'    ? <KidsView />
             : activeView === 'parent' ? <ParentView />
             : <HomeScreen />
  return (
    <>
      <ViewSwitcher guideOpen={guide} onGuide={setGuide} />
      <div style={{ flex: 1, minHeight: 0 }}>{guide ? <GuidePage /> : view}</div>
    </>
  )
}

// מדריך הסגנון כדף מלא, מכל מסך. העיצוב: של המסך שממנו הגיעו, והכפתור כאן מחליף אותו במכשיר בלבד.
// trial: מסגרת מ"נסה במדריך" במעבדה שנפתחת מתוך המדריך. נמחקת כשסוגרים
function GuidePage() {
  const [trial, setTrial] = useState(null)
  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg)' }}>
      <div style={{ padding: '1.5rem' }}>
        <div className="pl pl-bare pl-row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}><ThemeToggle /></div>
        <StyleGuide trial={trial} onClearTrial={() => setTrial(null)} onTry={setTrial} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
