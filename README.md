# 🌍 CrisisMap – Multi-Disaster Tracking Platform
> A full-stack web solution that transforms real-time environmental and disaster data into interactive, map-based insights across the United States and Canada.

CrisisMap provides a live dashboard for monitoring natural disasters such as earthquakes, floods, wildfires, and tornadoes. It aggregates trusted public data sources (like **NOAA** and **USGS**) and displays them on an interactive, filterable map built with React.

## 🚀 Overview
CrisisMap is designed to make disaster information accessible and actionable. It combines a **FastAPI backend** for data collection and processing with a **React + TailwindCSS** frontend for visualization. Users can monitor multiple disaster types, explore affected regions, and view time-stamped event details — all from one responsive dashboard.

## ✨ Core Features
- 🔥 Multi-Hazard Tracking: Earthquakes, floods, wildfires, and tornado alerts  
- 🗺️ Interactive Map: Google Maps integration with severity-based color markers  
- ⚡ Real-Time Updates: Automatic data refresh using USGS and NOAA APIs  
- 🔎 Filter & Search: Filter disasters by category or location  
- 📊 Timestamps: Each record shows when it was last updated  
- 💾 Data Archive: Store and access past disaster data  
- 📱 Responsive Design: Works seamlessly across devices  
- 🧪 Testing Suite: Automated validation and data-integrity checks  

## 🧠 Tech Stack
| Layer | Technologies |
|--------|---------------|
| **Frontend** | React, TailwindCSS, PostCSS, JavaScript (ES6) |
| **Backend** | FastAPI (Python), RESTful endpoints |
| **Database** | MongoDB / Local JSON archive |
| **APIs** | NOAA Storm Feed, USGS Earthquake Feed |
| **Testing** | Python Unittest |
| **Version Control** | Git + GitHub |

## 🗂️ Folder Structure
CrisisMap/  
├── backend/  
│   ├── server.py — FastAPI backend for disaster endpoints  
│   ├── requirements.txt — Backend dependencies  
│   └── .env — Environment variables for API keys  
│  
├── frontend/  
│   ├── public/ — Static files (index.html, favicon)  
│   ├── src/  
│   │   ├── components/ — Reusable UI components (cards, filters, dialogs)  
│   │   ├── hooks/ — Custom React hooks  
│   │   ├── lib/ — Utility functions for data handling  
│   │   └── App.js — Main application logic  
│   ├── package.json — Frontend dependencies  
│   └── .env — Frontend configuration  
│  
├── tests/  
│   ├── backend_test.py — Unit tests for backend routes and validation  
│   ├── test_result.md — Summary of test outputs  
│   └── README.md — Notes for testing  
│  
└── README.md — (This file)

## ⚙️ Installation & Setup
### 1️⃣ Clone the repository
git clone https://github.com/ayesha1145/CrisisMap.git  
cd CrisisMap

### 2️⃣ Backend Setup
cd backend  
pip install -r requirements.txt  
python server.py

### 3️⃣ Frontend Setup
cd frontend  
npm install  
npm start  

Once started, the app runs locally through your configured API endpoints — no third-party redirection or external links required.

## 🧪 Testing
Run automated backend tests:  
cd tests  
python backend_test.py  

To view summarized test outputs:  
test_result.md

## 📊 Data Sources
- USGS Earthquake API — https://earthquake.usgs.gov/fdsnws/event/1/  
- NOAA Storm Feeds — https://www.noaa.gov/  
- OpenWeather Air Quality Index — https://openweathermap.org/api/air-pollution  

## 🔮 Future Enhancements
- Add real-time alert subscriptions  
- Extend coverage to international datasets  
- Introduce analytics and visualization charts  
- Implement user customization for preferred disaster types  

## 🧭 Project Highlights
- Clean, modular codebase with a clear separation of backend, frontend, and testing logic  
- Integration with multiple open data sources for accurate, real-time disaster information  
- Intuitive UI design optimized for performance and accessibility  
- Reliable testing framework ensuring data consistency and API stability  
- Readable commit history that demonstrates organized, iterative development  

## 💬 Contribution Guide
1. Fork the repository  
2. Create a new branch:  
   git checkout -b feature-name  
3. Commit your changes:  
   git commit -m "feat: describe new feature"  
4. Push to the branch:  
   git push origin feature-name  
5. Open a Pull Request  

## 📄 License
This project is open-source under the MIT License.  
Free to use, adapt, and extend for learning and research purposes.


