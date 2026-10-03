# LocalPulse SF — Real-Time Situational Map & Neighborhood Intelligence

A hyper-local San Francisco situation awareness and neighborhood radar web application powered by **Google Gemma 4** (`gemma-4-26b-a4b-it`) and **Google Maps Platform**.

---

## 🌟 Key Features

### 1. Live Interactive Ground Radar & GPS
- **Device GPS Acquisition**: Instant 1-tap live location detection with accuracy radius readout.
- **Dynamic Leaflet & Google Maps Explorer**: Real-time situation markers, heat zones, and categorized ground pins.
- **Three Core Categories**:
  - 🚨 **Emergency**: Flooding, road hazards, tree down, power outages.
  - ☀️ **Daily Updates**: Community updates, court wait times, bakery supplies, parking lines.
  - 🎉 **Events**: Hackathons (e.g. SF Hacks x GDG @ SFSU), street fairs, farmers markets.

### 2. Device Image Import & Client-Side Compression
- Direct image file upload & mobile camera capture.
- Drag-and-drop support with automatic client-side resizing and compression (<250KB) for instantaneous uploads.
- Attached photo evidence displayed directly on pins and live field logs.

### 3. Google Gemma 4 AI Integrations
- **Ground Verification Engine**: Gemma 4 synthesizes crowd-sourced comments against initial hazard reports, verifying truthfulness and assigning confidence levels.
- **Ask AI Neighborhood Chatbot**: Powered by Gemma 4 to answer questions about local safety, transit, or food recommendations.
- **Multi-Platform Review Aggregation**: Gemma 4 synthesizes reviews from **Google Maps**, **Yelp**, and **Rednote (Xiaohongshu / 小红书)**, calculating consensus scores and must-try recommendations.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-github-repo-url>
cd localpulse-sf

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Leaflet
- **Backend**: Express.js server, Google GenAI SDK (`@google/genai`)
- **AI Models**: Google Gemma 4 (`gemma-4-26b-a4b-it`), Gemini 3.8 Flash fallback
- **Maps**: Leaflet + OpenStreetMap + Google Maps Place search & directions

---

## 📄 License
MIT License
