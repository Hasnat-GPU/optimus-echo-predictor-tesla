import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Boxes, 
  Plus, 
  Trash2, 
  Play, 
  Users, 
  Bot,
  Clock,
  Ruler,
  FileText
} from 'lucide-react';
import { HUDCard } from '@/components/HUDCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TASK_TYPES = [
  { value: 'assembly_line', label: 'Assembly Line', risk: 'medium' },
  { value: 'quality_check', label: 'Quality Check', risk: 'low' },
  { value: 'material_handling', label: 'Material Handling', risk: 'high' },
  { value: 'collaborative_work', label: 'Collaborative Work', risk: 'high' },
];

const PRESET_SCENARIOS = [
  {
    name: 'Standard Assembly',
    task_type: 'assembly_line',
    worker_count: 5,
    robot_count: 3,
    shift_duration_hours: 8,
    proximity_threshold_meters: 1.5,
    description: 'Standard assembly line configuration with moderate worker density'
  },
  {
    name: 'High-Density Collaborative',
    task_type: 'collaborative_work',
    worker_count: 12,
    robot_count: 6,
    shift_duration_hours: 10,
    proximity_threshold_meters: 1.0,
    description: 'High-density collaborative workspace requiring close proximity'
  },
  {
    name: 'Material Transport',
    task_type: 'material_handling',
    worker_count: 3,
    robot_count: 8,
    shift_duration_hours: 12,
    proximity_threshold_meters: 2.0,
    description: 'Material handling with multiple autonomous transport robots'
  },
];

export default function ScenarioBuilder() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [runningPrediction, setRunningPrediction] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    task_type: 'assembly_line',
    worker_count: 5,
    robot_count: 3,
    shift_duration_hours: 8,
    proximity_threshold_meters: 1.5,
    description: ''
  });

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(`${API}/scenarios`);
      setScenarios(response.data);
    } catch (error) {
      toast.error('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }

    try {
      const response = await axios.post(`${API}/scenarios`, formData);
      setScenarios([...scenarios, response.data]);
      setIsCreateOpen(false);
      resetForm();
      toast.success('Scenario created successfully');
    } catch (error) {
      toast.error('Failed to create scenario');
    }
  };

  const deleteScenario = async (id) => {
    try {
      await axios.delete(`${API}/scenarios/${id}`);
      setScenarios(scenarios.filter(s => s.id !== id));
      toast.success('Scenario deleted');
    } catch (error) {
      toast.error('Failed to delete scenario');
    }
  };

  const runPrediction = async (scenarioId) => {
    setRunningPrediction(scenarioId);
    try {
      await axios.post(`${API}/predictions/${scenarioId}`);
      toast.success('Prediction completed');
      navigate('/predictions');
    } catch (error) {
      toast.error('Prediction failed');
    } finally {
      setRunningPrediction(null);
    }
  };

  const applyPreset = (preset) => {
    setFormData({
      ...preset,
      name: `${preset.name} - ${new Date().toLocaleDateString()}`
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      task_type: 'assembly_line',
      worker_count: 5,
      robot_count: 3,
      shift_duration_hours: 8,
      proximity_threshold_meters: 1.5,
      description: ''
    });
  };

  const getRiskBadge = (taskType) => {
    const task = TASK_TYPES.find(t => t.value === taskType);
    const colors = {
      low: 'bg-optimus-green/20 text-optimus-green border-optimus-green/30',
      medium: 'bg-optimus-warning/20 text-optimus-warning border-optimus-warning/30',
      high: 'bg-optimus-orange/20 text-optimus-orange border-optimus-orange/30'
    };
    return (
      <span className={cn(
        "text-[10px] px-2 py-0.5 border uppercase tracking-wider",
        colors[task?.risk || 'medium']
      )}>
        {task?.risk || 'unknown'} risk
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="scenario-builder">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-rajdhani text-2xl font-bold text-optimus-silver uppercase tracking-wide">
            Scenario Configurations
          </h2>
          <p className="text-sm text-optimus-steel mt-1">
            Define factory scenarios for echo risk prediction
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center gap-2"
          data-testid="create-scenario-btn"
        >
          <Plus className="h-4 w-4" />
          <span>New Scenario</span>
        </Button>
      </div>

      {/* Presets */}
      <HUDCard title="Quick Presets" icon={Boxes}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {PRESET_SCENARIOS.map((preset, index) => (
            <button
              key={index}
              onClick={() => {
                applyPreset(preset);
                setIsCreateOpen(true);
              }}
              className="text-left p-4 border border-optimus-border hover:border-optimus-cyan/50 transition-colors"
              data-testid={`preset-${index}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-rajdhani text-sm font-semibold text-optimus-silver uppercase">
                  {preset.name}
                </h4>
                {getRiskBadge(preset.task_type)}
              </div>
              <p className="text-xs text-optimus-steel line-clamp-2">
                {preset.description}
              </p>
              <div className="flex gap-4 mt-3 text-xs text-optimus-steel">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {preset.worker_count}
                </span>
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3" /> {preset.robot_count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </HUDCard>

      {/* Scenarios List */}
      <HUDCard title="Active Scenarios" subtitle={`${scenarios.length} Configured`} icon={FileText}>
        <ScrollArea className="h-[400px] mt-4">
          {scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-optimus-steel">
              <Boxes className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No scenarios configured yet</p>
              <p className="text-xs mt-1">Create your first scenario to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="p-4 border border-optimus-border hover:border-optimus-cyan/30 transition-colors"
                  data-testid={`scenario-${scenario.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-rajdhani text-lg font-semibold text-optimus-silver">
                          {scenario.name}
                        </h4>
                        {getRiskBadge(scenario.task_type)}
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 border uppercase tracking-wider",
                          scenario.status === 'analyzed' 
                            ? 'bg-optimus-cyan/20 text-optimus-cyan border-optimus-cyan/30'
                            : 'bg-optimus-steel/20 text-optimus-steel border-optimus-steel/30'
                        )}>
                          {scenario.status}
                        </span>
                      </div>
                      
                      {scenario.description && (
                        <p className="text-sm text-optimus-steel mb-3">{scenario.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-xs text-optimus-steel">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-optimus-cyan" />
                          {scenario.worker_count} Workers
                        </span>
                        <span className="flex items-center gap-1">
                          <Bot className="h-3 w-3 text-optimus-cyan" />
                          {scenario.robot_count} Robots
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-optimus-cyan" />
                          {scenario.shift_duration_hours}h Shift
                        </span>
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3 text-optimus-cyan" />
                          {scenario.proximity_threshold_meters}m Proximity
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => runPrediction(scenario.id)}
                        disabled={runningPrediction === scenario.id}
                        className="btn-primary"
                        data-testid={`run-prediction-${scenario.id}`}
                      >
                        {runningPrediction === scenario.id ? (
                          <div className="spinner w-4 h-4" />
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Predict
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-optimus-steel hover:text-optimus-orange"
                        data-testid={`delete-scenario-${scenario.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </HUDCard>

      {/* Create Scenario Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-optimus-card border-optimus-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-rajdhani text-xl text-optimus-silver uppercase tracking-wide">
              Create New Scenario
            </DialogTitle>
            <DialogDescription className="text-optimus-steel">
              Configure a factory scenario for echo risk prediction
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                Scenario Name
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Assembly Line A - Morning Shift"
                className="input-field"
                data-testid="scenario-name-input"
              />
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                Task Type
              </Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => setFormData({ ...formData, task_type: value })}
              >
                <SelectTrigger className="input-field" data-testid="task-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-optimus-card border-optimus-border">
                  {TASK_TYPES.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className="text-optimus-silver hover:bg-optimus-subtle"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Workers and Robots */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                  Worker Count: {formData.worker_count}
                </Label>
                <Slider
                  value={[formData.worker_count]}
                  onValueChange={([value]) => setFormData({ ...formData, worker_count: value })}
                  min={1}
                  max={50}
                  step={1}
                  className="py-4"
                  data-testid="worker-count-slider"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                  Robot Count: {formData.robot_count}
                </Label>
                <Slider
                  value={[formData.robot_count]}
                  onValueChange={([value]) => setFormData({ ...formData, robot_count: value })}
                  min={1}
                  max={20}
                  step={1}
                  className="py-4"
                  data-testid="robot-count-slider"
                />
              </div>
            </div>

            {/* Shift and Proximity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                  Shift Duration: {formData.shift_duration_hours}h
                </Label>
                <Slider
                  value={[formData.shift_duration_hours]}
                  onValueChange={([value]) => setFormData({ ...formData, shift_duration_hours: value })}
                  min={1}
                  max={12}
                  step={0.5}
                  className="py-4"
                  data-testid="shift-duration-slider"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                  Proximity Threshold: {formData.proximity_threshold_meters}m
                </Label>
                <Slider
                  value={[formData.proximity_threshold_meters]}
                  onValueChange={([value]) => setFormData({ ...formData, proximity_threshold_meters: value })}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="py-4"
                  data-testid="proximity-slider"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                Description (Optional)
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the scenario configuration..."
                className="input-field min-h-[80px] resize-none"
                data-testid="scenario-description-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={createScenario}
              className="btn-primary"
              data-testid="submit-scenario-btn"
            >
              Create Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
