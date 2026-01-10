import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RobotPreview from '@/components/RobotPreview';
import { Radio, Activity, ShieldCheck, Zap, ChevronRight, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: 'Echo State Networks',
      description: 'Advanced neural networks for predicting human-robot interaction patterns',
    },
    {
      icon: ShieldCheck,
      title: 'Risk Mitigation',
      description: 'Proactive identification and prevention of symbiosis errors',
    },
    {
      icon: Zap,
      title: 'Real-Time Analysis',
      description: 'Instant gesture detection and safety zone monitoring',
    },
  ];

  return (
    <div className="min-h-screen bg-optimus-bg overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 grid-bg opacity-30" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* 3D Robot Preview */}
        <div className="absolute inset-0 z-0">
          <RobotPreview className="w-full h-full opacity-60" />
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-optimus-bg via-optimus-bg/80 to-transparent z-10" />
        
        {/* Content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-optimus-cyan/10 border border-optimus-cyan/30 mb-8">
              <Radio className="h-4 w-4 text-optimus-cyan animate-pulse" />
              <span className="text-xs font-mono text-optimus-cyan tracking-wider">
                TESLA FACTORY 2026 READY
              </span>
            </div>
            
            {/* Title */}
            <h1 className="font-rajdhani text-5xl md:text-7xl font-bold text-optimus-silver leading-tight mb-6 tracking-tighter uppercase">
              Optimus
              <br />
              <span className="text-optimus-cyan">Echo</span>
              <br />
              Predictor
            </h1>
            
            {/* Subtitle */}
            <p className="text-base md:text-lg text-optimus-steel leading-relaxed mb-8 font-light max-w-lg">
              Predict and prevent human-robot interaction risks in next-generation 
              manufacturing environments using advanced echo state networks.
            </p>
            
            {/* Stats */}
            <div className="flex gap-8 mb-10">
              <div>
                <p className="font-rajdhani text-3xl font-bold text-optimus-green">22%</p>
                <p className="text-xs text-optimus-steel tracking-wider uppercase">Errors Mitigated</p>
              </div>
              <div>
                <p className="font-rajdhani text-3xl font-bold text-optimus-cyan">0.85</p>
                <p className="text-xs text-optimus-steel tracking-wider uppercase">Symbiosis Index</p>
              </div>
              <div>
                <p className="font-rajdhani text-3xl font-bold text-optimus-warning">95%</p>
                <p className="text-xs text-optimus-steel tracking-wider uppercase">Gesture Accuracy</p>
              </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                className="btn-primary flex items-center gap-2 group"
                data-testid="get-started-btn"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                onClick={() => navigate('/live')}
                className="flex items-center gap-2 bg-optimus-green/10 border border-optimus-green text-optimus-green hover:bg-optimus-green hover:text-optimus-bg transition-colors px-6 py-3 text-xs font-bold tracking-wider uppercase"
                data-testid="live-detection-btn"
              >
                <span>Try Live Detection</span>
                <Zap className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/scenarios')}
                className="btn-secondary flex items-center gap-2"
                data-testid="create-scenario-btn"
              >
                <span>Create Scenario</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex flex-col items-center gap-2 text-optimus-steel">
            <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
            <div className="w-px h-8 bg-optimus-border relative overflow-hidden">
              <div className="absolute inset-x-0 h-4 bg-optimus-cyan animate-scan" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative z-20 py-24 px-6 md:px-12 bg-optimus-card border-t border-optimus-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-rajdhani text-3xl md:text-4xl font-semibold text-optimus-silver uppercase tracking-tight mb-4">
              Predictive Safety Intelligence
            </h2>
            <p className="text-optimus-steel max-w-2xl mx-auto">
              Leveraging echo state networks to forecast interaction risks before they occur
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="hud-card p-6 hover:border-optimus-cyan/50 transition-colors duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 bg-optimus-cyan/10 border border-optimus-cyan/30 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-optimus-cyan" />
                </div>
                <h3 className="font-rajdhani text-xl font-semibold text-optimus-silver uppercase tracking-wide mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-optimus-steel leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Demo Note */}
      <section className="relative z-20 py-12 px-6 bg-optimus-bg border-t border-optimus-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-optimus-warning/10 border border-optimus-warning/30 mb-4">
            <span className="text-xs font-mono text-optimus-warning tracking-wider">
              MVP DEMO VERSION
            </span>
          </div>
          <p className="text-sm text-optimus-steel">
            This is a demonstration version featuring mocked echo state predictions. 
            Real ReservoirPy integration available for production deployments.
          </p>
        </div>
      </section>
    </div>
  );
}
