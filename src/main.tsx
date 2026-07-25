import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MoneyProvider } from './store/MoneyProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MoneyProvider>
      <App />
    </MoneyProvider>
  </StrictMode>,
)
