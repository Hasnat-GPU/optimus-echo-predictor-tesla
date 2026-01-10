import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Monitor, 
  Accessibility, 
  Database,
  Radio,
  Info,
  ExternalLink
} from 'lucide-react';
import { HUDCard } from '@/components/HUDCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({
    showScanlines: false,
    reducedMotion: false,
    highContrast: false,
    autoRefresh: true,
    refreshInterval: 30,
    defaultProximity: 1.5,
    defaultShiftHours: 8,
    theme: 'dark'
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Setting updated');
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h2 className="font-rajdhani text-2xl font-bold text-optimus-silver uppercase tracking-wide">
          Settings
        </h2>
        <p className="text-sm text-optimus-steel mt-1">
          Configure application preferences and defaults
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Display Settings */}
        <HUDCard title="Display" icon={Monitor}>
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-optimus-silver">Scanline Effect</Label>
                <p className="text-xs text-optimus-steel mt-1">
                  Retro CRT scanline overlay
                </p>
              </div>
              <Switch
                checked={settings.showScanlines}
                onCheckedChange={(checked) => updateSetting('showScanlines', checked)}
                data-testid="scanlines-toggle"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-optimus-silver">Reduced Motion</Label>
                <p className="text-xs text-optimus-steel mt-1">
                  Disable animations and transitions
                </p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                data-testid="reduced-motion-toggle"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-optimus-silver">High Contrast</Label>
                <p className="text-xs text-optimus-steel mt-1">
                  Enhanced contrast for visibility
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                data-testid="high-contrast-toggle"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-optimus-silver">Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => updateSetting('theme', value)}
              >
                <SelectTrigger className="input-field" data-testid="theme-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-optimus-card border-optimus-border">
                  <SelectItem value="dark" className="text-optimus-silver">
                    Dark (Default)
                  </SelectItem>
                  <SelectItem value="darker" className="text-optimus-silver">
                    Darker
                  </SelectItem>
                  <SelectItem value="midnight" className="text-optimus-silver">
                    Midnight
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </HUDCard>

        {/* Accessibility */}
        <HUDCard title="Accessibility" icon={Accessibility}>
          <div className="space-y-4 mt-4">
            <div className="p-4 border border-optimus-cyan/30 bg-optimus-cyan/5">
              <h4 className="text-sm font-rajdhani font-semibold text-optimus-cyan uppercase mb-2">
                Screen Reader Support
              </h4>
              <p className="text-xs text-optimus-steel">
                All interactive elements include ARIA labels and descriptions. 
                Charts provide hidden table summaries for accessibility.
              </p>
            </div>

            <div className="p-4 border border-optimus-border">
              <h4 className="text-sm font-rajdhani font-semibold text-optimus-silver uppercase mb-2">
                Keyboard Navigation
              </h4>
              <div className="space-y-2 text-xs text-optimus-steel">
                <p><kbd className="px-1 bg-optimus-subtle border border-optimus-border">Tab</kbd> - Navigate between elements</p>
                <p><kbd className="px-1 bg-optimus-subtle border border-optimus-border">Enter</kbd> - Activate buttons and links</p>
                <p><kbd className="px-1 bg-optimus-subtle border border-optimus-border">Esc</kbd> - Close dialogs and modals</p>
              </div>
            </div>

            <div className="p-4 border border-optimus-border">
              <h4 className="text-sm font-rajdhani font-semibold text-optimus-silver uppercase mb-2">
                Color Contrast
              </h4>
              <p className="text-xs text-optimus-steel">
                Primary colors meet WCAG 2.1 AA standards for contrast ratios.
                Enable High Contrast mode for enhanced visibility.
              </p>
            </div>
          </div>
        </HUDCard>

        {/* Data Settings */}
        <HUDCard title="Data & Refresh" icon={Database}>
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-optimus-silver">Auto Refresh</Label>
                <p className="text-xs text-optimus-steel mt-1">
                  Automatically update dashboard data
                </p>
              </div>
              <Switch
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                data-testid="auto-refresh-toggle"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                Refresh Interval: {settings.refreshInterval}s
              </Label>
              <Slider
                value={[settings.refreshInterval]}
                onValueChange={([value]) => updateSetting('refreshInterval', value)}
                min={10}
                max={120}
                step={10}
                disabled={!settings.autoRefresh}
                className="py-4"
                data-testid="refresh-interval-slider"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                Default Proximity Threshold: {settings.defaultProximity}m
              </Label>
              <Slider
                value={[settings.defaultProximity]}
                onValueChange={([value]) => updateSetting('defaultProximity', value)}
                min={0.5}
                max={5}
                step={0.1}
                className="py-4"
                data-testid="default-proximity-slider"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-optimus-steel uppercase tracking-wider">
                Default Shift Duration: {settings.defaultShiftHours}h
              </Label>
              <Slider
                value={[settings.defaultShiftHours]}
                onValueChange={([value]) => updateSetting('defaultShiftHours', value)}
                min={4}
                max={12}
                step={0.5}
                className="py-4"
                data-testid="default-shift-slider"
              />
            </div>
          </div>
        </HUDCard>

        {/* About / System Info */}
        <HUDCard title="System Information" icon={Info}>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-optimus-steel uppercase tracking-wider">Version</p>
                <p className="text-optimus-silver font-mono">1.0.0-MVP</p>
              </div>
              <div>
                <p className="text-optimus-steel uppercase tracking-wider">Build</p>
                <p className="text-optimus-silver font-mono">2026.01</p>
              </div>
              <div>
                <p className="text-optimus-steel uppercase tracking-wider">ML Engine</p>
                <p className="text-optimus-silver font-mono">MOCKED (Demo)</p>
              </div>
              <div>
                <p className="text-optimus-steel uppercase tracking-wider">Status</p>
                <p className="text-optimus-green font-mono">Operational</p>
              </div>
            </div>

            <div className="p-3 border border-optimus-warning/30 bg-optimus-warning/5">
              <div className="flex items-start gap-2">
                <Radio className="h-4 w-4 text-optimus-warning mt-0.5" />
                <div>
                  <p className="text-xs text-optimus-warning font-semibold uppercase">
                    MVP Demo Version
                  </p>
                  <p className="text-xs text-optimus-steel mt-1">
                    This version uses mocked echo state predictions for demonstration.
                    Real ReservoirPy integration and OpenCV gesture detection 
                    available for production deployments.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs text-optimus-steel uppercase tracking-wider">
                Technology Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {['React', 'Three.js', 'FastAPI', 'MongoDB', 'Recharts', 'Tailwind'].map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] px-2 py-1 bg-optimus-subtle border border-optimus-border text-optimus-silver font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-optimus-border">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-optimus-cyan hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View on GitHub
              </a>
            </div>
          </div>
        </HUDCard>
      </div>

      {/* VR Mode Notice */}
      <HUDCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-optimus-steel/20 border border-optimus-steel/30">
              <Monitor className="h-6 w-6 text-optimus-steel" />
            </div>
            <div>
              <h3 className="font-rajdhani text-lg font-semibold text-optimus-silver uppercase">
                VR Mode
              </h3>
              <p className="text-xs text-optimus-steel">
                Immersive factory view - Coming in future release
              </p>
            </div>
          </div>
          <Button
            disabled
            className="btn-secondary opacity-50 cursor-not-allowed"
            data-testid="vr-settings-btn"
          >
            Configure VR
          </Button>
        </div>
      </HUDCard>
    </div>
  );
}
