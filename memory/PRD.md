# Optimus Echo Predictor - Product Requirements Document

## Overview
MVP tool for predicting human-robot interaction risks in 2026 Tesla factories using real echo state networks via ReservoirPy.

## User Personas
- **Factory Managers**: Overview of risk levels and alerts
- **Robotics Engineers**: Configure scenarios and analyze predictions  
- **Safety Analysts**: Review echo risks and recommendations

## Core Requirements (Static)
1. Real ESN prediction engine (ReservoirPy)
2. MediaPipe gesture detection
3. Scenario configuration system
4. Real-time KPI dashboard
5. PDF report export
6. Alert management system

## What's Been Implemented (January 10, 2026)

### Phase 2 - Real ML Integration
- **ReservoirPy ESN**: 100-unit reservoir, trained on 500 synthetic sequences
- **MediaPipe Gesture Detection**: Hand landmark tracking, gesture classification
- **PDF Export**: jsPDF + html2canvas report generation
- **ESN Status API**: Model monitoring and training endpoints

### Backend (FastAPI + MongoDB + ReservoirPy)
- `/api/esn/status` - ESN model status
- `/api/esn/initialize` - Train ESN model
- `/api/scenarios` - CRUD operations
- `/api/predictions` - Run real ESN predictions
- `/api/gestures/detect` - MediaPipe gesture detection
- `/api/gestures/synthetic` - Synthetic data with ESN analysis
- `/api/gestures/analyze` - Sequence analysis through ESN

### Frontend (React + Tailwind + Recharts)
- **Dashboard**: KPI cards, charts, alerts, PDF export buttons
- **Scenario Builder**: Presets, sliders, task types
- **Predictions**: ESN details panel (reservoir activation, state variance)
- **Data Upload**: Drag-drop, synthetic generation
- **Settings**: Display/accessibility options

### ML Features
- Reservoir activation tracking
- State variance analysis
- Anomaly detection (rapid changes, low confidence, erratic movement)
- Gesture sequence analysis

## Tech Stack
- ReservoirPy 0.4+ (Echo State Networks)
- MediaPipe (Hand detection)
- jsPDF + html2canvas (PDF export)
- React 19 + FastAPI + MongoDB

## Impact Metrics
- ~22% error mitigation rate
- 95%+ gesture accuracy
- 0.85 target symbiosis index
- <100ms prediction latency

## Prioritized Backlog

### P0 (Must Have) - COMPLETED
- [x] Real ReservoirPy ESN integration
- [x] MediaPipe gesture detection
- [x] PDF report export
- [x] ESN model training on startup

### P1 (Should Have) - Future
- [ ] User authentication
- [ ] WebSocket real-time updates
- [ ] Webcam live gesture feed
- [ ] Model retraining UI

### P2 (Nice to Have) - Future
- [ ] WebXR VR mode
- [ ] Multi-factory support
- [ ] Custom model hyperparameters
- [ ] Tableau embed support

## Next Tasks
1. Add webcam live gesture detection to frontend
2. Implement user authentication
3. Add WebSocket for real-time dashboard updates
4. Create model retraining interface
