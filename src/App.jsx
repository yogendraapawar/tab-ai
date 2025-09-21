import { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [chromeApiAvailable, setChromeApiAvailable] = useState(false)

  // Check Chrome API availability on component mount
  useEffect(() => {
    const checkChromeAPI = () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
          setChromeApiAvailable(true)
          console.log('Chrome APIs are available')
        } else {
          setChromeApiAvailable(false)
          console.log('Chrome APIs are not available')
        }
      } catch (err) {
        setChromeApiAvailable(false)
        console.error('Error checking Chrome APIs:', err)
      }
    }

    checkChromeAPI()
  }, [])

  return (
    <div className="extension-popup">
      <header className="popup-header">
        <h1>My Chrome Extension</h1>
        <p>Template to get started</p>
      </header>

      <main className="popup-content">
        <div className="content-section">
          <div className={`api-status ${chromeApiAvailable ? 'available' : 'unavailable'}`}>
            Chrome APIs: {chromeApiAvailable ? '✓ Available' : '✗ Not Available'}
          </div>

          <div className="info">
            <p>Start building your extension features here.</p>
          </div>
        </div>
      </main>
    </div>
  )
}