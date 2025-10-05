import { useEffect } from 'react'
import './App.css'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { setChromeApiAvailable, fetchTabsData, processTabsWithProgress, processTabsWithAIAction } from './store/slices/appSlice'

export default function App() {
  const dispatch = useAppDispatch()
  const { chromeApiAvailable, tabsData, categorizedTabs, loading, error, processing, aiProcessing } = useAppSelector(state => state.app)

  // Check Chrome API availability on component mount
  useEffect(() => {
    const checkChromeAPI = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
          dispatch(setChromeApiAvailable(true))
          console.log('Chrome APIs are available')
        } else {
          dispatch(setChromeApiAvailable(false))
          console.log('Chrome APIs are not available')
        }
      } catch (err) {
        dispatch(setChromeApiAvailable(false))
        console.error('Error checking Chrome APIs:', err)
      }
    }

    checkChromeAPI()
  }, [dispatch])

  // Manual function to trigger tabs data scan
  const handleScanTabs = async () => {
    const result = await dispatch(processTabsWithProgress())
    
    // After tabs are scanned, trigger AI processing
    if (result.payload && result.payload.length > 0) {
      console.log('🚀 Starting AI processing for', result.payload.length, 'tabs...')
      dispatch(processTabsWithAIAction(result.payload))
    }
  }

  // Log tabs data when it changes
  useEffect(() => {
    if (tabsData.length > 0) {
      console.log('All tabs data from Redux:', tabsData)
    }
  }, [tabsData])

  // Log categorized tabs when available
  useEffect(() => {
    if (categorizedTabs) {
      console.log('🎯 Categorized tabs from AI:', categorizedTabs)
    }
  }, [categorizedTabs])

  return (
    <div className="extension-popup">
      <header className="popup-header">
        <h1>My Chrome Extension</h1>
        <p>Redux-powered template</p>
      </header>

      <main className="popup-content">
        <div className="content-section">
          <div className={`api-status ${chromeApiAvailable ? 'available' : 'unavailable'}`}>
            Chrome APIs: {chromeApiAvailable ? '✓ Available' : '✗ Not Available'}
          </div>

          <div className="redux-status">
            <h3>Redux State:</h3>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Tabs Count: {tabsData.length}</p>
            {error && <p className="error">Error: {error}</p>}
          </div>

          {processing.isProcessing && (
            <div className="processing-status">
              <h3>Processing Tabs:</h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${processing.progress}%` }}
                ></div>
              </div>
              <p>Progress: {processing.progress}%</p>
              <p>Processed: {processing.processedTabs} / {processing.totalTabs}</p>
              {processing.currentTab && (
                <p>Current: {processing.currentTab}</p>
              )}
            </div>
          )}

          {aiProcessing.isProcessing && (
            <div className="ai-processing-status">
              <h3>🤖 AI Processing Tabs...</h3>
              <p>Categorizing and summarizing your tabs</p>
            </div>
          )}

          {aiProcessing.error && (
            <div className="ai-error">
              <p>❌ AI Processing Error: {aiProcessing.error}</p>
            </div>
          )}

          {categorizedTabs && (
            <div className="categorized-tabs">
              <h3>📊 AI-Categorized Tabs</h3>
              <div className="categories-container">
                {Object.entries(categorizedTabs).map(([categoryName, categoryData]) => (
                  <div key={categoryName} className="category-card">
                    <h4>{categoryName}</h4>
                    <p className="category-summary">{categoryData.summary}</p>
                    <div className="category-tabs">
                      <strong>Tabs ({categoryData.tablist.length}):</strong>
                      <ul>
                        {categoryData.tablist.map(tabId => {
                          const tab = tabsData.find(t => String(t.tabId) === String(tabId))
                          return (
                            <li key={tabId}>
                              {tab?.tabInfo?.title || `Tab ${tabId}`}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabsData.length > 0 && (
            <div className="tabs-list">
              <h3>Tabs Data ({tabsData.length})</h3>
              <div className="tabs-container">
                {tabsData.map((tab, index) => (
                  <div key={tab.tabId || index} className="tab-item">
                    <div className="tab-header">
                      <span className="tab-title">{tab.tabInfo?.title || 'Untitled'}</span>
                      <span className="tab-domain">{tab.tabInfo?.domain || 'No domain'}</span>
                    </div>
                    <div className="tab-url">{tab.tabInfo?.url || 'No URL'}</div>
                    {tab.pageData?.content?.text && (
                      <div className="tab-preview">
                        {tab.pageData.content.text.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="info">
            <p>Redux is configured and ready to use!</p>
            <button
              className="scan-button"
              onClick={handleScanTabs}
              disabled={loading || processing.isProcessing || aiProcessing.isProcessing}
            >
              {loading || processing.isProcessing ? 'Scanning...' : 
               aiProcessing.isProcessing ? 'AI Processing...' : 'Scan Tabs'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
