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

function AppContent() {
  const { members, loadFamily, activeView } = useStore()
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
      <ViewSwitcher />
      <div style={{ flex: 1, minHeight: 0 }}>{view}</div>
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
