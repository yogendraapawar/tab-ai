import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { processTabsWithAI } from '../../utils/aiModel'

// Async thunk for fetching all tabs data
export const fetchTabsData = createAsyncThunk(
  'app/fetchTabsData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_TABS_DATA' })

      if (response?.error) {
        return rejectWithValue(response.error)
      }

      return response?.tabsData || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for AI processing tabs
export const processTabsWithAIAction = createAsyncThunk(
  'app/processTabsWithAI',
  async (tabsData, { rejectWithValue }) => {
    try {
      const categorizedTabs = await processTabsWithAI(tabsData)
      return categorizedTabs
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for processing tabs with progress tracking
export const processTabsWithProgress = createAsyncThunk(
  'app/processTabsWithProgress',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Import the function dynamically to avoid circular imports
      const { collectAllTabsData } = await import('../../utils/tabUtils.js')

      // Start processing
      dispatch(startProcessing({ totalTabs: 0 })) // Will be updated when we get tabs
      const _scanStartTs = Date.now()

      // Get tabs first to know total count
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => {
          resolve(tabs)
        })
      })

      // Update total tabs count
      dispatch(startProcessing({ totalTabs: tabs.length }))

      // Process tabs with progress updates
      const tabsData = []
      let processedCount = 0

      for (const tab of tabs) {
        // Update progress
        dispatch(updateProcessingProgress({
          processedTabs: processedCount,
          currentTab: tab.title
        }))

        // Process tab (simplified version of collectAllTabsData logic)
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          try {
            const response = await chrome.runtime.sendMessage({
              type: 'EXTRACT_TAB_DATA',
              tabId: tab.id
            })

            if (response?.data) {
              tabsData.push({
                tabId: tab.id,
                tabInfo: {
                  id: tab.id,
                  title: tab.title || "",
                  url: tab.url || "",
                  domain: tab.url ? new URL(tab.url).hostname : "",
                  windowId: tab.windowId,
                  favIconUrl: tab.favIconUrl,
                  index: tab.index,
                  pinned: tab.pinned,
                  active: tab.active,
                  audible: tab.audible,
                  mutedInfo: tab.mutedInfo,
                  groupId: tab.groupId
                },
                pageData: response.data
              })
            }
          } catch (error) {
            console.error(`Error extracting data from tab ${tab.id}:`, error)
          }
        }

        processedCount++
      }

      // Ensure minimum scan duration of 1s
      const _elapsed = Date.now() - _scanStartTs
      if (_elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - _elapsed))
      }
      // Finish processing
      dispatch(finishProcessing())

      return tabsData
    } catch (error) {
      dispatch(resetProcessing())
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  chromeApiAvailable: false,
  tabsData: [],
  categorizedTabs: null,
  loading: false,
  error: null,
  processing: {
    isProcessing: false,
    totalTabs: 0,
    processedTabs: 0,
    currentTab: null,
    progress: 0, // percentage
  },
  aiProcessing: {
    isProcessing: false,
    error: null,
  },
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setChromeApiAvailable: (state, action) => {
      state.chromeApiAvailable = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    startProcessing: (state, action) => {
      state.processing.isProcessing = true
      state.processing.totalTabs = action.payload.totalTabs
      state.processing.processedTabs = 0
      state.processing.currentTab = null
      state.processing.progress = 0
    },
    updateProcessingProgress: (state, action) => {
      const { processedTabs, currentTab } = action.payload
      state.processing.processedTabs = processedTabs
      state.processing.currentTab = currentTab
      state.processing.progress = state.processing.totalTabs > 0
        ? Math.round((processedTabs / state.processing.totalTabs) * 100)
        : 0
    },
    finishProcessing: (state) => {
      state.processing.isProcessing = false
      state.processing.currentTab = null
      state.processing.progress = 100
    },
    resetProcessing: (state) => {
      state.processing = {
        isProcessing: false,
        totalTabs: 0,
        processedTabs: 0,
        currentTab: null,
        progress: 0,
      }
    },
    setAIProcessing: (state, action) => {
      state.aiProcessing.isProcessing = action.payload
    },
    setAIError: (state, action) => {
      state.aiProcessing.error = action.payload
    },
    setCategorizedTabs: (state, action) => {
      state.categorizedTabs = action.payload
    },
    moveTabBetweenCategories: (state, action) => {
      const { tabId, fromCategory, toCategory } = action.payload
      if (!state.categorizedTabs) return

      // Remove tab from source category
      if (state.categorizedTabs[fromCategory]) {
        const tablist = state.categorizedTabs[fromCategory].tablist
        state.categorizedTabs[fromCategory].tablist = tablist.filter(id => id !== tabId)
      }

      // Add tab to target category
      if (state.categorizedTabs[toCategory]) {
        if (!state.categorizedTabs[toCategory].tablist.includes(tabId)) {
          state.categorizedTabs[toCategory].tablist.push(tabId)
        }
      }
    },
    removeCategory: (state, action) => {
      const category = action.payload
      if (state.categorizedTabs && state.categorizedTabs[category]) {
        delete state.categorizedTabs[category]
      }
    },
    removeTabFromCategory: (state, action) => {
      const { tabId, category } = action.payload
      if (!state.categorizedTabs || !state.categorizedTabs[category]) return
      state.categorizedTabs[category].tablist = state.categorizedTabs[category].tablist.filter(id => String(id) !== String(tabId))
    },
    removeTab: (state, action) => {
      const tabId = String(action.payload)

      // Remove from tabsData
      state.tabsData = state.tabsData.filter(tab => String(tab.tabId) !== tabId)

      // Remove from categorizedTabs
      if (state.categorizedTabs) {
        Object.keys(state.categorizedTabs).forEach(category => {
          if (state.categorizedTabs[category].tablist) {
            state.categorizedTabs[category].tablist = state.categorizedTabs[category].tablist.filter(id => String(id) !== tabId)
          }
        })
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTabsData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTabsData.fulfilled, (state, action) => {
        state.loading = false
        state.tabsData = action.payload
        state.error = null
      })
      .addCase(fetchTabsData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(processTabsWithProgress.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(processTabsWithProgress.fulfilled, (state, action) => {
        state.loading = false
        state.tabsData = action.payload
        state.error = null
      })
      .addCase(processTabsWithProgress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.processing.isProcessing = false
      })
      .addCase(processTabsWithAIAction.pending, (state) => {
        state.aiProcessing.isProcessing = true
        state.aiProcessing.error = null
      })
      .addCase(processTabsWithAIAction.fulfilled, (state, action) => {
        state.aiProcessing.isProcessing = false
        state.categorizedTabs = action.payload
        state.aiProcessing.error = null
      })
      .addCase(processTabsWithAIAction.rejected, (state, action) => {
        state.aiProcessing.isProcessing = false
        state.aiProcessing.error = action.payload
      })
  },
})

export const {
  setChromeApiAvailable,
  clearError,
  startProcessing,
  updateProcessingProgress,
  finishProcessing,
  resetProcessing,
  setAIProcessing,
  setAIError,
  setCategorizedTabs,
  moveTabBetweenCategories,
  removeCategory,
  removeTabFromCategory,
  removeTab
} = appSlice.actions
export default appSlice.reducer
