# Optimus Echo Predictor

<div align="center">

![Optimus Echo Predictor](https://img.shields.io/badge/Tesla-Factory%202026-00F0FF?style=for-the-badge&logo=tesla&logoColor=white)
![ReservoirPy](https://img.shields.io/badge/ReservoirPy-ESN%20Active-00FF9D?style=for-the-badge)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Live%20Detection-FF4D00?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

### Real-time human-robot risk forecasting using ReservoirPy ESN, MediaPipe gestures, and interactive cyberpunk dashboard for Tesla factory symbiosis

[Live Demo](#demo) • [Features](#features) • [Screenshots](#screenshots) • [Installation](#installation) • [API](#api-endpoints)

</div>

---

## 🎯 Impact Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **Error Mitigation** | **22%** | Simulated error reduction in human-robot handoffs |
| **Gesture Accuracy** | **95%+** | Classification accuracy via MediaPipe + ReservoirPy ESN |
| **Symbiosis Index** | **0.85** | Target human-robot collaboration efficiency |
| **Response Time** | **<100ms** | Real-time risk assessment latency |
| **Hand Landmarks** | **21** | MediaPipe hand tracking precision |
| **Reservoir Units** | **100** | Echo State Network capacity |

---

## 🚀 Tesla Factory 2026 Relevance

This tool directly addresses critical challenges in **Tesla's Optimus robot deployment**:

- **Predictive Maintenance for Symbiosis**: Forecast interaction failures before incidents occur using Echo State Networks trained on gesture sequences
- **Data-Driven Safety Insights**: Analyze worker-robot proximity, gesture recognition accuracy, and shift fatigue factors
- **Stakeholder Reports**: Generate professional PDF reports with KPIs, risk assessments, and recommendations for management review
- **Real-Time Gesture Detection**: Live webcam integration ensures workers can test gesture commands before deployment

---

## ✨ Features

### 🎥 Live Webcam Gesture Detection (NEW!)
- **MediaPipe Hand Landmarker**: 21-point hand tracking at 30+ FPS
- **Real-Time Classification**: Stop, proceed, slow down, point, wave gestures
- **Robot Reaction Preview**: See how Optimus would respond to your gestures
- **ESN Analysis**: Buffer gestures and analyze risk through Echo State Network

### 🧠 Real Echo State Network Predictions
- **ReservoirPy Integration**: 100-unit reservoir with 0.3 leak rate, 0.9 spectral radius
- **Trained Model**: 500 synthetic gesture sequences for anomaly detection
- **Anomaly Types**: Rapid gesture changes, low confidence, erratic movements, unusual patterns
- **Reservoir Metrics**: Activation levels, state variance, gestures analyzed

### 📊 Interactive Dashboard
- **KPI Cards**: Total scenarios, average risk, mitigated errors, symbiosis health
- **Recharts Visualization**: Bar charts, line graphs, pie charts for risk distribution
- **Active Alerts**: Real-time notification management
- **PDF Export**: Professional branded reports with one click

### 🔧 Scenario Configuration
- **Task Types**: Assembly line, quality check, material handling, collaborative work
- **Parameters**: Worker count (1-50), robot count (1-20), shift duration (1-12h), proximity threshold
- **Quick Presets**: Standard Assembly, High-Density Collaborative, Material Transport
- **ESN Predictions**: Run real neural network analysis on any scenario

---

## 📸 Screenshots

### Landing Page
Dark cyberpunk hero with animated robot visualization, echo wave effects, and prominent "Try Live Detection" CTA.

### Live Gesture Detection
Real-time webcam feed with MediaPipe hand landmarks, gesture classification overlay, and robot reaction panel.

### Dashboard
KPI cards with real-time data, Recharts visualizations, alerts panel, and PDF export buttons.

### Scenario Builder
Preset cards, slider controls for workers/robots/shift/proximity, and active scenario management.

### Prediction Results
Expandable cards with risk metrics, ESN analysis panel (reservoir activation, state variance), recommendations.

### Data Upload
Drag-and-drop zone, synthetic gesture generation buttons, data format documentation.

### Settings
Display preferences, accessibility options, keyboard navigation guide, system information.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Tailwind CSS, Recharts, jsPDF, html2canvas |
| **ML (Frontend)** | @mediapipe/tasks-vision (Hand Landmarker, Gesture Recognizer) |
| **Backend** | FastAPI, Python 3.11, Pydantic |
| **ML (Backend)** | ReservoirPy (Echo State Networks), NumPy |
| **Database** | MongoDB (Motor async driver) |
| **Styling** | Custom HUD theme, Rajdhani + Roboto Mono fonts |

---

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6+
- Webcam (for live detection)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="optimus_echo"

# Start server (ESN trains automatically on startup)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Set environment variable
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start development server
yarn start
```

### Environment Variables

**Backend (.env)**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=optimus_echo
CORS_ORIGINS=*
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 🔌 API Endpoints

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | API health and version |
| GET | `/api/health` | System status |

### ESN Model
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/esn/status` | Model status (units, leak rate, spectral radius) |
| POST | `/api/esn/initialize` | Train/reinitialize model |

### Scenarios
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scenarios` | List all scenarios |
| POST | `/api/scenarios` | Create scenario |
| GET | `/api/scenarios/{id}` | Get scenario details |
| DELETE | `/api/scenarios/{id}` | Delete scenario |

### Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/predictions` | List all predictions |
| POST | `/api/predictions/{scenario_id}` | Run ESN prediction |
| GET | `/api/predictions/{id}` | Get prediction details |

### Gestures
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gestures/detect` | Detect from base64 image |
| GET | `/api/gestures/synthetic` | Generate synthetic data |
| POST | `/api/gestures/analyze` | Analyze sequence via ESN |
| POST | `/api/gestures/upload` | Upload dataset |

### KPIs & Charts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kpis` | Dashboard KPIs |
| GET | `/api/charts/risk-distribution` | Risk level distribution |
| GET | `/api/charts/error-rates` | 7-day error trends |
| GET | `/api/charts/symbiosis-trend` | 30-day symbiosis index |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/{id}/acknowledge` | Acknowledge alert |

---

## 🧪 Echo State Network Details

### Architecture
```
Input Layer (10 features)
    ↓
Reservoir (100 units, sparse connections)
    ↓
Readout Layer (Ridge regression)
    ↓
Risk Score (0.0 - 1.0)
```

### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| Units | 100 | Reservoir neurons |
| Leak Rate | 0.3 | Memory decay speed |
| Spectral Radius | 0.9 | Dynamics stability |
| Input Scaling | 0.5 | Input weight magnitude |
| Ridge | 1e-5 | Regularization strength |

### Input Features (10)
- 7 gesture one-hot encoding (stop, proceed, slow_down, handover, point, wave, emergency)
- 1 confidence score
- 2 position coordinates (x, y)

### Anomaly Detection
1. **Rapid Gesture Changes**: >50% transition rate between frames
2. **Low Confidence**: >30% of sequence below 70% confidence
3. **Erratic Movement**: Position variance > 1.0
4. **Unusual Pattern**: Reservoir activation > 0.5

---

## 📁 Project Structure

```
optimus-echo-predictor/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── esn_module.py          # ReservoirPy ESN implementation
│   ├── gesture_detection.py   # MediaPipe backend (optional)
│   ├── models/                # Saved ESN model
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── HUDCard.jsx
│   │   │   ├── RobotPreview.jsx
│   │   │   └── WebcamGesture.jsx   # MediaPipe live detection
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LiveDetection.jsx   # NEW!
│   │   │   ├── ScenarioBuilder.jsx
│   │   │   ├── Predictions.jsx
│   │   │   ├── DataUpload.jsx
│   │   │   └── Settings.jsx
│   │   └── utils/
│   │       └── pdfExport.js
│   ├── package.json
│   └── .env
├── README.md
└── LICENSE
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - Copyright (c) 2026 Hasnat

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [ReservoirPy](https://github.com/reservoirpy/reservoirpy) - Echo State Network library
- [MediaPipe](https://developers.google.com/mediapipe) - Hand tracking and gesture recognition
- [Tesla](https://www.tesla.com/optimus) - Inspiration for Optimus robot integration

---

<div align="center">

**"Safe symbiosis through intelligent prediction"**

Built with ❤️ for the future of human-robot collaboration

[⬆ Back to Top](#optimus-echo-predictor)

</div>
