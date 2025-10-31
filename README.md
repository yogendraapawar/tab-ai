<div align="center">
   <img width="121" height="126" alt="logo" src="https://github.com/user-attachments/assets/33775d83-5f06-4968-bd7e-7aff9fa0a043" />
</div>

<h1 align="center">TabSense</h1>

<p align="justify">
TabSense is a Chrome extension that helps researchers and knowledge workers manage information overload while browsing. Like a personal research assistant, it transforms messy, tab-filled sessions into an organized, searchable knowledge base — clustering related content, summarizing key ideas, and enabling natural language queries. By turning chaotic browsing into structured insight, TabSense tackles one of the web’s most persistent problems: too many tabs, too little clarity.
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=fi8BRWbYpqA">View Demo</a>
  ·
  <a href="https://github.com/RocketChat/Apps.Emoji.Embellisher/issues">Request Feature</a>
  ·
  <a href="https://github.com/RocketChat/Apps.Emoji.Embellisher/issues/new">Report Bug</a>
</p>

<div align="center">
  
  [![Contributors][contributors-shield]][contributors-url] 
  [![Forks][forks-shield]][forks-url]
  [![Stargazers][stars-shield]][stars-url]
  [![Issues][issues-shield]][issues-url]
  [![MIT License][license-shield]][license-url]

</div>

## 🔑 Key Features
<div align="justify">
   
- **AI-Powered Tab Clustering**: Automatically groups your open tabs into meaningful themes using intelligent prompt-based design.
- **Hybrid Inference System**: Built on Firebase AI Logic — process data locally for privacy or in the cloud for higher performance.
- **Natural Language Querying**: Ask questions like “Which tabs discuss DeFi or Layer 2 scaling?” and get synthesized insights from your tabs.
- **Smart Bookmarking & Management**: Save, reopen, and query themed tab clusters — turning your bookmarks into an interactive knowledge base.
- **Customizable AI Models**: Fine-tune parameters like temperature, context length, and precision to match your research or workflow needs.

</div>

## 📘 Prerequisites

<div align="justify">
  
**Setting up a Firebase Project**
- To set up your Firebase project, follow these steps: [Create a Firebase project](https://firebase.google.com/docs/web/setup#create-project).
- Then register your Firebase application: [Register your app](https://firebase.google.com/docs/web/setup#register-app).
- Followed by which create a **config.js** file: `touch config.js`
- The **config.js** file should be added with this content:
   ```sh
   export const firebaseConfig = {
     apiKey: "API_KEY",
     authDomain: "PROJECT_ID.firebaseapp.com",
     projectId: "PROJECT_ID",
     storageBucket: "PROJECT_ID.firebasestorage.app",
     messagingSenderId: "SENDER_ID",
     appId: "APP_ID",
     measurementId: "G-MEASUREMENT_ID",
   };
   ```
    **Note:** You can obtain your Firebase config object here: [Firebase Configuration](https://support.google.com/firebase/answer/7015592).

</div>

## 🚀 Installation
**First, ensure that you have your _config.js_ ready, by following the instructions in the [Prerequisites](#-prerequisites) section above.**

1. Fork the repository, then clone the forked repository under your username to your local system:
    ```sh
    git clone https://github.com/<your-username>/tab-ai
    ```
    
2. Copy the **config.js** file inside **tab-ai** project location:
    ```sh
    cp config.js tab-ai
    ```
        
3. Install app dependencies:
    ```sh
    cd tab-ai && npm install
    ```

4. Deploy the app to your server:
   ```sh
   npm run dev
   ```
   
4. Load app in Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder inside tab-ai
   - Extension icon appears in toolbar

That's it! Click on the **TabSense** chrome extension and start using it.

## ✅ Usage
```

  👋 Need some help?

    • use `Scan tabs` button to scan and load all your tabs 🔄
    • use `Categorize tabs` button to cluster all your tabs into theme and summarize them 🔍
    • use `Group tabs` button to group and open all your bookmarked links 📂
    • use `Ask AI` button to query your questions on your open tabs 🤖

```

## 🧑‍💻 Contributing
<p align="justify">
  Contributions make the open-source community an incredible place to learn, inspire, and create, and any you make are <strong>greatly appreciated</strong>. If you have suggestions for improvement, please fork the repo, create a pull request, or simply open an issue. And don't forget to give the project a star—thanks again!
</p>

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: adds some amazing feature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/yogendraapawar/tab-ai?style=for-the-badge
[contributors-url]: https://github.com/yogendraapawar/tab-ai/graphs/contributors

[forks-shield]: https://img.shields.io/github/forks/yogendraapawar/tab-ai?style=for-the-badge
[forks-url]: https://github.com/yogendraapawar/tab-ai/network/members

[stars-shield]: https://img.shields.io/github/stars/yogendraapawar/tab-ai?style=for-the-badge
[stars-url]: https://github.com/yogendraapawar/tab-ai/stargazers

[issues-shield]: https://img.shields.io/github/issues/yogendraapawar/tab-ai?style=for-the-badge
[issues-url]: https://github.com/yogendraapawar/tab-ai/issues

[license-shield]: https://img.shields.io/github/license/yogendraapawar/tab-ai?style=for-the-badge
[license-url]: https://github.com/yogendraapawar/tab-ai/blob/main/LICENSE
