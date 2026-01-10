import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ScenarioBuilder from "@/pages/ScenarioBuilder";
import DataUpload from "@/pages/DataUpload";
import Predictions from "@/pages/Predictions";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="App min-h-screen bg-optimus-bg">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scenarios" element={<ScenarioBuilder />} />
            <Route path="/data" element={<DataUpload />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0A0A0F',
            border: '1px solid #1F2937',
            color: '#E0E0E0',
            fontFamily: 'Roboto Mono, monospace',
          },
        }}
      />
    </div>
  );
}

export default App;
