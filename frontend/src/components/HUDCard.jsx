import { cn } from '@/lib/utils';

export function HUDCard({ 
  children, 
  className, 
  title, 
  subtitle, 
  icon: Icon,
  status,
  glow,
  ...props 
}) {
  const glowClass = {
    cyan: 'glow-cyan',
    orange: 'glow-orange',
    green: 'glow-green',
  }[glow];

  const statusClass = {
    online: 'status-online',
    warning: 'status-warning',
    danger: 'status-danger',
  }[status];

  return (
    <div 
      className={cn(
        "hud-card p-4 transition-colors duration-300 hover:border-optimus-cyan/50",
        glowClass,
        className
      )}
      {...props}
    >
      {(title || subtitle || Icon || status) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-optimus-cyan/10 border border-optimus-cyan/30">
                <Icon className="h-4 w-4 text-optimus-cyan" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="font-rajdhani text-sm font-semibold text-optimus-silver uppercase tracking-wider">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[10px] text-optimus-steel tracking-[0.15em] uppercase">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {status && <div className={statusClass} />}
        </div>
      )}
      {children}
    </div>
  );
}

export function HUDStat({ label, value, unit, trend, trendDirection }) {
  const trendColor = trendDirection === 'up' 
    ? 'text-optimus-green' 
    : trendDirection === 'down' 
      ? 'text-optimus-orange' 
      : 'text-optimus-steel';

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-optimus-steel tracking-[0.2em] uppercase">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-rajdhani text-3xl font-bold text-optimus-silver">{value}</span>
        {unit && <span className="text-xs text-optimus-steel">{unit}</span>}
      </div>
      {trend && (
        <p className={cn("text-xs font-mono", trendColor)}>
          {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'} {trend}
        </p>
      )}
    </div>
  );
}
