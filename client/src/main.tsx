import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// グローバルスタイルはApp.tsxで読み込むため、ここではimportしない

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
