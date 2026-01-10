import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp,
  Boxes,
  Radio,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { HUDCard, HUDStat } from '@/components/HUDCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-optimus-card border border-optimus-cyan p-3">
        <p className="text-xs text-optimus-silver font-mono mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [errorRates, setErrorRates] = useState([]);
  const [symbiosisTrend, setSymbiosisTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpisRes, alertsRes, riskRes, errorRes, symbiosisRes] = await Promise.all([
        axios.get(`${API}/kpis`),
        axios.get(`${API}/alerts?acknowledged=false`),
        axios.get(`${API}/charts/risk-distribution`),
        axios.get(`${API}/charts/error-rates`),
        axios.get(`${API}/charts/symbiosis-trend`)
      ]);
      
      setKpis(kpisRes.data);
      setAlerts(alertsRes.data);
      setRiskData(riskRes.data);
      setErrorRates(errorRes.data);
      setSymbiosisTrend(symbiosisRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.patch(`${API}/alerts/${alertId}/acknowledge`);
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success('Alert acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      low: 'text-optimus-green',
      medium: 'text-optimus-warning',
      high: 'text-optimus-orange',
      critical: 'text-red-500'
    };
    return colors[level] || 'text-optimus-steel';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-optimus-steel text-sm">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HUDCard 
          title="Total Scenarios" 
          icon={Boxes}
          status="online"
          data-testid="kpi-scenarios"
        >
          <HUDStat 
            label="Active Configurations"
            value={kpis?.total_scenarios || 0}
            trend="+2 this week"
            trendDirection="up"
          />
        </HUDCard>

        <HUDCard 
          title="Risk Score" 
          icon={AlertTriangle}
          status={kpis?.avg_risk_score > 0.5 ? 'warning' : 'online'}
          data-testid="kpi-risk"
        >
          <HUDStat 
            label="Average Risk Level"
            value={(kpis?.avg_risk_score * 100 || 0).toFixed(1)}
            unit="%"
            trend={kpis?.avg_risk_score < 0.4 ? "Within safe range" : "Elevated"}
            trendDirection={kpis?.avg_risk_score < 0.4 ? "down" : "up"}
          />
        </HUDCard>

        <HUDCard 
          title="Mitigated Errors" 
          icon={ShieldCheck}
          glow="green"
          data-testid="kpi-mitigated"
        >
          <HUDStat 
            label="Prevention Rate"
            value={kpis?.mitigated_errors_total || 22}
            unit="%"
            trend="Symbiosis optimized"
            trendDirection="up"
          />
        </HUDCard>

        <HUDCard 
          title="Symbiosis Health" 
          icon={Activity}
          status="online"
          data-testid="kpi-symbiosis"
        >
          <HUDStat 
            label="Human-Robot Index"
            value={(kpis?.symbiosis_health || 0.75).toFixed(2)}
            trend={kpis?.symbiosis_health > 0.8 ? "Optimal" : "Monitoring"}
            trendDirection={kpis?.symbiosis_health > 0.8 ? "up" : "neutral"}
          />
        </HUDCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Rates Chart */}
        <HUDCard 
          title="Error Rates Analysis" 
          subtitle="7-Day Trend"
          icon={TrendingUp}
          className="chart-container"
          data-testid="chart-error-rates"
        >
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorRates}>
                <XAxis 
                  dataKey="day" 
                  stroke="#4A5568" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#4A5568" 
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="gesture_errors" 
                  fill="#FF4D00" 
                  name="Gesture Errors"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="proximity_breaches" 
                  fill="#FFB800" 
                  name="Proximity Breaches"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="mitigated" 
                  fill="#00FF9D" 
                  name="Mitigated"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HUDCard>

        {/* Symbiosis Trend Chart */}
        <HUDCard 
          title="Symbiosis Index Trend" 
          subtitle="30-Day History"
          icon={Radio}
          className="chart-container"
          data-testid="chart-symbiosis"
        >
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={symbiosisTrend}>
                <XAxis 
                  dataKey="day" 
                  stroke="#4A5568" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#4A5568" 
                  fontSize={10}
                  tickLine={false}
                  domain={[0.5, 1]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="symbiosis" 
                  stroke="#00F0FF" 
                  strokeWidth={2}
                  dot={false}
                  name="Symbiosis Index"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#4A5568" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </HUDCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <HUDCard 
          title="Risk Distribution" 
          subtitle="All Predictions"
          icon={ShieldCheck}
          className="chart-container"
          data-testid="chart-risk-distribution"
        >
          <div className="h-48 mt-4">
            {riskData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-optimus-steel text-sm">
                No prediction data yet
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {riskData.map((item) => (
              <div key={item.name} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-xs text-optimus-steel">{item.name}</span>
              </div>
            ))}
          </div>
        </HUDCard>

        {/* Active Alerts */}
        <HUDCard 
          title="Active Alerts" 
          subtitle={`${alerts.length} Unacknowledged`}
          icon={AlertTriangle}
          status={alerts.length > 0 ? 'warning' : 'online'}
          className="lg:col-span-2"
          data-testid="alerts-panel"
        >
          <ScrollArea className="h-64 mt-4">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-optimus-steel">
                <CheckCircle className="h-8 w-8 mb-2 text-optimus-green" />
                <p className="text-sm">All clear - no active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={cn(
                      "flex items-start justify-between p-3 border",
                      alert.type === 'danger' 
                        ? 'bg-optimus-orange/10 border-optimus-orange/30' 
                        : 'bg-optimus-warning/10 border-optimus-warning/30'
                    )}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.type === 'danger' ? (
                        <XCircle className="h-4 w-4 text-optimus-orange mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-optimus-warning mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm text-optimus-silver">{alert.message}</p>
                        <p className="text-xs text-optimus-steel mt-1 font-mono">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs text-optimus-steel hover:text-optimus-silver"
                      data-testid={`acknowledge-alert-${alert.id}`}
                    >
                      Dismiss
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </HUDCard>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => navigate('/scenarios')}
          className="btn-primary"
          data-testid="quick-create-scenario"
        >
          Create New Scenario
        </Button>
        <Button
          onClick={() => navigate('/predictions')}
          className="btn-secondary"
          data-testid="quick-view-predictions"
        >
          View All Predictions
        </Button>
        <Button
          onClick={fetchDashboardData}
          className="btn-secondary"
          data-testid="refresh-dashboard"
        >
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
