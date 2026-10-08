import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyTheme, readTheme } from './components/shared/ThemeToggle'
import { applyFrame, readFrame } from './components/Design/frame'
import './styles/global.css'
import './styles/plain.css'
import './styles/theme-pixel.css'
import './styles/lab.css'

// העיצוב שנבחר במכשיר, לפני הציור הראשון, כדי שלא יהבהב
applyTheme(readTheme())
applyFrame(readFrame())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
