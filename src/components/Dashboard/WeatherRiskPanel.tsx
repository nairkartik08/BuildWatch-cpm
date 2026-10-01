import React from 'react';
import { AlertTriangle, Check, CloudRain, RefreshCw, Wind } from 'lucide-react';
import { getWeatherDelaySuggestions, getWeatherRiskLabel } from '../../engine';
import type { CPMProjectResult, Project, Task, WeatherForecastDay } from '../../engine/types';

interface WeatherRiskPanelProps {
  project: Project;
  tasks: Task[];
  cpm: CPMProjectResult;
  forecast: WeatherForecastDay[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  updatedAt: string | null;
  error: string | null;
  onRefresh: () => void;
  onApply: (suggestions: ReturnType<typeof getWeatherDelaySuggestions>) => void;
}

export const WeatherRiskPanel: React.FC<WeatherRiskPanelProps> = ({
  project, tasks, cpm, forecast, status, updatedAt, error, onRefresh, onApply,
}) => {
  const suggestions = React.useMemo(
    () => getWeatherDelaySuggestions(tasks, cpm, project, forecast),
    [tasks, cpm, project, forecast]
  );
  const forecastDays = forecast.slice(0, 5);

  return (
    <section className="border border-white/10 bg-[#121926] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><CloudRain className="h-4 w-4 text-[#4da3ff]" /><h2 className="text-sm font-bold text-white">Weather risk window</h2></div>
          <p className="mt-1 text-xs text-[#8e9ab0]">Live 14-day forecast for {project.location ?? 'the project site'} is matched against upcoming outdoor work.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={status === 'loading'} className="flex items-center gap-1.5 border border-white/10 px-3 py-2 text-xs font-semibold text-[#b7c0cf] hover:bg-white/5 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {status === 'error' ? <p className="mt-4 text-xs text-red-300">{error}</p> : null}
      {status === 'idle' || status === 'loading' ? <p className="mt-4 text-xs text-[#8e9ab0]">Loading current forecast...</p> : null}
      {status === 'ready' && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {forecastDays.map((day) => {
              const label = getWeatherRiskLabel(day);
              const highRisk = label === 'High risk';
              return <div key={day.date} className="border border-white/10 bg-black/15 p-3">
                <div className="text-[10px] font-semibold text-[#8e9ab0]">{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}</div>
                <div className={`mt-2 text-xs font-bold ${highRisk ? 'text-[#ff4d4d]' : label === 'Watch' ? 'text-[#ffb020]' : 'text-[#35d07f]'}`}>{label}</div>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-300"><CloudRain className="h-3 w-3" />{day.precipitationProbability}%</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-300"><Wind className="h-3 w-3" />{Math.round(day.maxWindKmh)} km/h</div>
              </div>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-xs text-[#8e9ab0]">{suggestions.length ? `${suggestions.length} outdoor task${suggestions.length === 1 ? '' : 's'} need a weather hold review.` : 'No forecast weather holds are indicated for upcoming outdoor work.'}</p>
            {suggestions.length > 0 && <button type="button" onClick={() => onApply(suggestions)} className="flex items-center gap-1.5 bg-[#ffb020] px-3 py-2 text-xs font-bold text-black hover:bg-amber-400"><AlertTriangle className="h-3.5 w-3.5" />Apply reviewed holds ({suggestions.length})</button>}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#657084]"><Check className="h-3 w-3" />Updated {updatedAt ? new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'just now'}; weather holds only apply after manager review.</p>
        </>
      )}
    </section>
  );
};
