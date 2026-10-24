# VolunTeam — Mobile Event Management App

VolunTeam is a React Native / Expo application that allows volunteers to find, view, and organize community volunteering events. Features include an interactive map view with custom location markers, event filtering, native date and time selection, and image uploads to cloud storage.

---

## 🛠️ Tech Stack & Prerequisites

* **Framework:** React Native with Expo Go (SDK 52+)
* **Navigation:** React Navigation Stack
* **Maps:** Leaflet WebView (`react-native-webview`)
* **Backend API:** `json-server` (Mock REST API)
* **Storage / Hosting:** ImgBB API for image hosting & `@react-native-async-storage/async-storage` for network-first caching
* **Environment:** Node.js (v18+ recommended)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Open a terminal in the project root directory and run:

```bash
npm install

##Start the Mock Backend (json-server)
npx json-server --watch db.json --port 3333 --host 0.0.0.0

##Start the Expo Development Server
npx expo start --tunnel