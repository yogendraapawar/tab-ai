import { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    // Example Chrome extension API usage
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('Current tab:', tabs[0])
      })
    }
    setCount(count + 1)
  }

  return (
    <div className="extension-popup">
      <header className="popup-header">
        <h1>My Chrome Extension</h1>
        <p>Template to get started</p>
      </header>

      <main className="popup-content">
        <div className="content-section">
          <h2>Welcome!</h2>
          <p>This is your Chrome extension popup.</p>

          <button className="action-button" onClick={handleClick}>
            Click me! ({count})
          </button>

          <div className="info">
            <p>Start building your extension features here. ogendra</p>
          </div>
        </div>
      </main>
    </div>
  )
}
