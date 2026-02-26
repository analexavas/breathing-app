import React from 'react'
import ReactDOM from 'react-dom/client'
import { webApi } from './api/webApi'
import App from './App'
import './styles/global.css'

// Inject web storage adapter as window.api before React mounts.
// The same interface as the Electron preload, so all screens work unchanged.
;(window as unknown as Record<string, unknown>).api = webApi

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
