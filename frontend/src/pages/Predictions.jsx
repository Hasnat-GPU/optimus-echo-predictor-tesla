import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Radio
} from 'lucide-react';
import { HUDCard, HUDStat } from '@/components/HUDCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Predictions() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [scenarios, setScenarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedPrediction, setExpandedPrediction] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const [predictionsRes, scenariosRes] = await Promise.all([
        axios.get(`${API}/predictions`),
        axios.get(`${API}/scenarios`)
      ]);

      // Create scenarios lookup map
      const scenarioMap = {};
      scenariosRes.data.forEach(s => {
        scenarioMap[s.id] = s;
      });

      setPredictions(predictionsRes.data);
      setScenarios(scenarioMap);
    } catch (error) {
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelConfig = (level) => {
    const configs = {
      low: {
        color: 'text-optimus-green',
        bgColor: 'bg-optimus-green/20',
        borderColor: 'border-optimus-green/30',
        label: 'LOW RISK',
        icon: ShieldCheck
      },
      medium: {
        color: 'text-optimus-warning',
        bgColor: 'bg-optimus-warning/20',
        borderColor: 'border-optimus-warning/30',
        label: 'MEDIUM RISK',
        icon: AlertTriangle
      },
      high: {
        color: 'text-optimus-orange',
        bgColor: 'bg-optimus-orange/20',
        borderColor: 'border-optimus-orange/30',
        label: 'HIGH RISK',
        icon: AlertTriangle
      },
      critical: {
        color: 'text-red-500',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        label: 'CRITICAL',
        icon: AlertTriangle
      }
    };
    return configs[level] || configs.medium;
  };

  const getEchoRiskIcon = (type) => {
    const icons = {
      gesture_misread: '👋',
      proximity_breach: '📍',
      fatigue_induced: '⏰',
      crowding_interference: '👥'
    };
    return icons[type] || '⚠️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="predictions-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-rajdhani text-2xl font-bold text-optimus-silver uppercase tracking-wide">
            Prediction Results
          </h2>
          <p className="text-sm text-optimus-steel mt-1">
            Echo state network risk analysis results
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchPredictions}
            className="btn-secondary flex items-center gap-2"
            data-testid="refresh-predictions-btn"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/scenarios')}
            className="btn-primary"
            data-testid="new-prediction-btn"
          >
            Run New Prediction
          </Button>
        </div>
      </div>

      {predictions.length === 0 ? (
        <HUDCard>
          <div className="flex flex-col items-center justify-center py-16 text-optimus-steel">
            <Activity className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="font-rajdhani text-xl font-semibold text-optimus-silver mb-2">
              No Predictions Yet
            </h3>
            <p className="text-sm mb-4">Create a scenario and run your first prediction</p>
            <Button
              onClick={() => navigate('/scenarios')}
              className="btn-primary"
            >
              Create Scenario
            </Button>
          </div>
        </HUDCard>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {predictions.map((prediction) => {
              const scenario = scenarios[prediction.scenario_id];
              const riskConfig = getRiskLevelConfig(prediction.risk_level);
              const isExpanded = expandedPrediction === prediction.id;
              const RiskIcon = riskConfig.icon;

              return (
                <Collapsible
                  key={prediction.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedPrediction(isExpanded ? null : prediction.id)}
                >
                  <div
                    className={cn(
                      "hud-card transition-colors",
                      isExpanded && "border-optimus-cyan/50"
                    )}
                    data-testid={`prediction-${prediction.id}`}
                  >
                    {/* Header */}
                    <CollapsibleTrigger className="w-full">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 border",
                            riskConfig.bgColor,
                            riskConfig.borderColor
                          )}>
                            <RiskIcon className={cn("h-6 w-6", riskConfig.color)} />
                          </div>
                          <div className="text-left">
                            <h3 className="font-rajdhani text-lg font-semibold text-optimus-silver">
                              {scenario?.name || 'Unknown Scenario'}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 border uppercase tracking-wider font-bold",
                                riskConfig.bgColor,
                                riskConfig.borderColor,
                                riskConfig.color
                              )}>
                                {riskConfig.label}
                              </span>
                              <span className="text-xs text-optimus-steel font-mono">
                                {new Date(prediction.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Quick Stats */}
                          <div className="hidden md:flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] text-optimus-steel uppercase">Risk Score</p>
                              <p className={cn("text-2xl font-rajdhani font-bold", riskConfig.color)}>
                                {(prediction.overall_risk_score * 100).toFixed(0)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-optimus-steel uppercase">Mitigated</p>
                              <p className="text-2xl font-rajdhani font-bold text-optimus-green">
                                {prediction.mitigated_errors_percent.toFixed(0)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-optimus-steel uppercase">Symbiosis</p>
                              <p className="text-2xl font-rajdhani font-bold text-optimus-cyan">
                                {prediction.symbiosis_index.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-optimus-steel" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-optimus-steel" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    {/* Expanded Content */}
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-optimus-border pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Risk Metrics */}
                          <div className="space-y-4">
                            <h4 className="text-xs text-optimus-steel uppercase tracking-wider">
                              Risk Metrics
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-optimus-steel">Overall Risk</span>
                                  <span className={riskConfig.color}>
                                    {(prediction.overall_risk_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={prediction.overall_risk_score * 100} 
                                  className="h-2 bg-optimus-border"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-optimus-steel">Gesture Accuracy</span>
                                  <span className="text-optimus-cyan">
                                    {(prediction.gesture_accuracy * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={prediction.gesture_accuracy * 100} 
                                  className="h-2 bg-optimus-border"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-optimus-steel">Errors Mitigated</span>
                                  <span className="text-optimus-green">
                                    {prediction.mitigated_errors_percent.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={prediction.mitigated_errors_percent} 
                                  className="h-2 bg-optimus-border"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Echo Risks */}
                          <div className="space-y-4">
                            <h4 className="text-xs text-optimus-steel uppercase tracking-wider">
                              Echo Risks Detected
                            </h4>
                            {prediction.echo_risks.length === 0 ? (
                              <p className="text-sm text-optimus-green flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                No significant risks detected
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {prediction.echo_risks.map((risk, index) => (
                                  <div
                                    key={index}
                                    className="p-2 border border-optimus-border bg-optimus-subtle"
                                    data-testid={`echo-risk-${index}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="text-lg">{getEchoRiskIcon(risk.type)}</span>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-semibold text-optimus-silver uppercase">
                                            {risk.type.replace('_', ' ')}
                                          </span>
                                          <span className="text-xs text-optimus-orange font-mono">
                                            {(risk.probability * 100).toFixed(0)}% prob
                                          </span>
                                        </div>
                                        <p className="text-xs text-optimus-steel mt-1">
                                          {risk.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Recommendations */}
                          <div className="space-y-4">
                            <h4 className="text-xs text-optimus-steel uppercase tracking-wider">
                              Recommendations
                            </h4>
                            <div className="space-y-2">
                              {prediction.recommendations.map((rec, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-2 border-l-2 border-optimus-cyan bg-optimus-cyan/5"
                                >
                                  <TrendingDown className="h-4 w-4 text-optimus-cyan mt-0.5 shrink-0" />
                                  <p className="text-xs text-optimus-silver">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* ESN Details */}
                        {prediction.esn_details && (
                          <div className="mt-6 pt-4 border-t border-optimus-border">
                            <h4 className="text-xs text-optimus-cyan uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Radio className="h-3 w-3" />
                              ReservoirPy ESN Analysis
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div className="p-2 bg-optimus-subtle border border-optimus-border">
                                <p className="text-optimus-steel uppercase">Reservoir Activation</p>
                                <p className="text-optimus-cyan font-mono text-lg">
                                  {(prediction.esn_details.reservoir_activation * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div className="p-2 bg-optimus-subtle border border-optimus-border">
                                <p className="text-optimus-steel uppercase">State Variance</p>
                                <p className="text-optimus-silver font-mono text-lg">
                                  {prediction.esn_details.state_variance.toFixed(4)}
                                </p>
                              </div>
                              <div className="p-2 bg-optimus-subtle border border-optimus-border">
                                <p className="text-optimus-steel uppercase">Gestures Analyzed</p>
                                <p className="text-optimus-silver font-mono text-lg">
                                  {prediction.esn_details.gestures_analyzed}
                                </p>
                              </div>
                              <div className="p-2 bg-optimus-subtle border border-optimus-border">
                                <p className="text-optimus-steel uppercase">Anomalies Detected</p>
                                <p className={cn(
                                  "font-mono text-lg",
                                  prediction.esn_details.anomalies_detected > 0 
                                    ? "text-optimus-orange" 
                                    : "text-optimus-green"
                                )}>
                                  {prediction.esn_details.anomalies_detected}
                                </p>
                              </div>
                            </div>
                            <p className="text-[10px] text-optimus-steel mt-2 font-mono">
                              Model: {prediction.esn_details.model_type}
                            </p>
                          </div>
                        )}

                        {/* Scenario Details */}
                        {scenario && (
                          <div className="mt-6 pt-4 border-t border-optimus-border">
                            <h4 className="text-xs text-optimus-steel uppercase tracking-wider mb-3">
                              Scenario Configuration
                            </h4>
                            <div className="flex flex-wrap gap-4 text-xs">
                              <span className="text-optimus-steel">
                                Task: <span className="text-optimus-silver">{scenario.task_type}</span>
                              </span>
                              <span className="text-optimus-steel">
                                Workers: <span className="text-optimus-silver">{scenario.worker_count}</span>
                              </span>
                              <span className="text-optimus-steel">
                                Robots: <span className="text-optimus-silver">{scenario.robot_count}</span>
                              </span>
                              <span className="text-optimus-steel">
                                Shift: <span className="text-optimus-silver">{scenario.shift_duration_hours}h</span>
                              </span>
                              <span className="text-optimus-steel">
                                Proximity: <span className="text-optimus-silver">{scenario.proximity_threshold_meters}m</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Real ESN Note */}
      <div className="text-center p-4 border border-optimus-cyan/30 bg-optimus-cyan/5">
        <p className="text-xs text-optimus-cyan">
          <Radio className="h-3 w-3 inline mr-1 animate-pulse" />
          Real ESN: Predictions powered by ReservoirPy Echo State Networks with trained reservoir computing.
        </p>
      </div>
    </div>
  );
}
