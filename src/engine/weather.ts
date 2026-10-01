import type { CPMProjectResult, Project, Task, WeatherDelaySuggestion, WeatherForecastDay } from './types';

const isSevereWeatherDay = (day: WeatherForecastDay) =>
  day.precipitationProbability >= 70 || day.precipitationMm >= 10 || day.maxWindKmh >= 45;

const isWetWeatherDay = (day: WeatherForecastDay) =>
  day.precipitationProbability >= 45 || day.precipitationMm >= 3 || day.maxWindKmh >= 32;

export function getWeatherDelaySuggestions(
  tasks: Task[],
  cpm: CPMProjectResult,
  project: Project,
  forecast: WeatherForecastDay[]
): WeatherDelaySuggestion[] {
  if (!forecast.length) return [];

  return tasks.flatMap((task) => {
    const result = cpm.tasks[task.id];
    if (!task.outdoor || task.percentComplete >= 100 || !result || result.ef <= project.statusDay) {
      return [];
    }

    const relevantDays = forecast.filter((_, index) => {
      const forecastOffset = project.statusDay + index;
      return forecastOffset >= Math.max(project.statusDay, result.es) && forecastOffset < result.ef;
    });
    const severeDays = relevantDays.filter(isSevereWeatherDay).length;
    const wetDays = relevantDays.filter(isWetWeatherDay).length;
    const suggestedDays = severeDays + Math.max(0, wetDays - severeDays) * 0.5;

    if (suggestedDays < 0.5) return [];

    return [{
      taskId: task.id,
      days: Math.round(suggestedDays * 10) / 10,
      reason: `${severeDays ? `${severeDays} severe` : ''}${severeDays && wetDays > severeDays ? ' and ' : ''}${wetDays > severeDays ? `${wetDays - severeDays} wet` : ''} forecast day${wetDays === 1 ? '' : 's'}`,
    }];
  });
}

export function getWeatherRiskLabel(day: WeatherForecastDay) {
  if (isSevereWeatherDay(day)) return 'High risk';
  if (isWetWeatherDay(day)) return 'Watch';
  return 'Clear';
}
