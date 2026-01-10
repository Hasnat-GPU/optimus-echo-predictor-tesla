# Optimus Echo Predictor - Product Requirements Document

## Overview
MVP tool for predicting human-robot interaction risks in 2026 Tesla factories using echo state networks for symbiosis forecasting.

## User Personas
- **Factory Managers**: Need overview of risk levels and alerts
- **Robotics Engineers**: Configure scenarios and analyze predictions
- **Safety Analysts**: Review echo risks and recommendations

## Core Requirements (Static)
1. Echo risk prediction engine
2. Scenario configuration system
3. Real-time KPI dashboard
4. Alert management system
5. Data upload/generation capabilities
6. Accessibility compliance

## What's Been Implemented (January 10, 2026)

### Backend (FastAPI + MongoDB)
- `/api/scenarios` - CRUD operations for factory scenarios
- `/api/predictions` - Run echo predictions and retrieve results
- `/api/kpis` - Dashboard KPI aggregation
- `/api/alerts` - Alert management with acknowledgment
- `/api/gestures/synthetic` - Synthetic gesture data generation
- `/api/gestures/upload` - Dataset upload endpoint
- `/api/charts/*` - Chart data endpoints (risk distribution, error rates, symbiosis trend)

### Frontend (React + Tailwind)
- **Landing Page**: Animated robot visualization, hero section with CTAs
- **Dashboard**: KPI cards, Recharts visualizations (bar, line, pie), alerts panel
- **Scenario Builder**: Presets, scenario creation with sliders, run predictions
- **Predictions Page**: Collapsible results with risk metrics, echo risks, recommendations
- **Data Upload**: Drag-drop zone, synthetic data generation, format documentation
- **Settings**: Display/accessibility options, system info

### Design System
- Dark "Symbiotic Industrial Futurism" theme
- Rajdhani + Roboto Mono typography
- HUD-style cards with corner decorations
- Cyber cyan (#00F0FF) primary accent

## Mocked Features (MVP)
- **Echo State Network**: Rule-based prediction simulation (real ReservoirPy available for production)
- **Gesture Detection**: Synthetic data generation (OpenCV/Roboflow ready)
- **VR Mode**: Placeholder toggle only

## Prioritized Backlog

### P0 (Must Have) - COMPLETED
- [x] Landing page with branding
- [x] Dashboard with KPIs and charts
- [x] Scenario CRUD and prediction
- [x] Basic alerting system

### P1 (Should Have) - Future
- [ ] Real ReservoirPy integration
- [ ] OpenCV gesture detection
- [ ] File parsing for uploaded datasets
- [ ] User authentication

### P2 (Nice to Have) - Future
- [ ] WebXR VR mode
- [ ] Real-time WebSocket updates
- [ ] Export reports to PDF
- [ ] Tableau embed support
- [ ] Multi-factory support

## Next Tasks
1. Integrate real ReservoirPy for echo state networks
2. Add OpenCV gesture detection from webcam/video
3. Implement user authentication
4. Add PDF report export
5. Enable real-time updates via WebSocket
