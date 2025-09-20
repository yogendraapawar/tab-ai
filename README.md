# Chrome Extension Template

## Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```

3. **Load in Chrome**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder
   - Extension icon appears in toolbar

4. **Test**
   - Click extension icon
   - Make changes in `src/App.jsx`
   - Save file → extension auto-reloads

That's it! Hot reloading works automatically.