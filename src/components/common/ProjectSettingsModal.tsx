import React, { useEffect, useState } from 'react';
import { MapPin, Settings2, X } from 'lucide-react';
import type { Project } from '../../engine/types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (updates: Partial<Project>) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ isOpen, onClose, project, onSave }) => {
  const [form, setForm] = useState(project);

  useEffect(() => {
    if (isOpen) setForm(project);
  }, [isOpen, project]);

  if (!isOpen) return null;

  const update = <K extends keyof Project>(key: K, value: Project[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      name: form.name.trim() || project.name,
      startDate: form.startDate,
      targetFinish: Math.max(1, Number(form.targetFinish) || project.targetFinish),
      statusDay: Math.max(0, Number(form.statusDay) || 0),
      location: form.location?.trim() || 'Project site',
      latitude: Number(form.latitude) || 18.5204,
      longitude: Number(form.longitude) || 73.8567,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Project settings">
      <form onSubmit={submit} className="w-full max-w-xl border border-white/10 bg-[#151b25] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 text-[#ffb020]"><Settings2 className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-white">Project settings</h2>
              <p className="text-[11px] text-[#8e9ab0]">Changes recalculate every schedule view immediately.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="app-icon-button" aria-label="Close project settings"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="sm:col-span-2 text-xs font-semibold text-slate-300">Project name
            <input value={form.name} onChange={(event) => update('name', event.target.value)} className="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ffb020]" />
          </label>
          <label className="text-xs font-semibold text-slate-300">Start date
            <input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} className="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ffb020]" />
          </label>
          <label className="text-xs font-semibold text-slate-300">Target finish day
            <input type="number" min="1" value={form.targetFinish} onChange={(event) => update('targetFinish', Number(event.target.value))} className="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ffb020]" />
          </label>
          <label className="text-xs font-semibold text-slate-300">Status day
            <input type="number" min="0" value={form.statusDay} onChange={(event) => update('statusDay', Number(event.target.value))} className="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ffb020]" />
          </label>
          <label className="text-xs font-semibold text-slate-300">Site location
            <input value={form.location ?? ''} onChange={(event) => update('location', event.target.value)} className="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ffb020]" />
          </label>
          <label className="text-xs font-semibold text-slate-300">Latitude
            <input type="number" step="0.0001" value={form.latitude ?? ''} onChange={(event) => update('latitude', Number(event.target.value))} className="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ffb020]" />
          </label>
          <label className="text-xs font-semibold text-slate-300">Longitude
            <input type="number" step="0.0001" value={form.longitude ?? ''} onChange={(event) => update('longitude', Number(event.target.value))} className="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ffb020]" />
          </label>
          <div className="sm:col-span-2 flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] text-[#8e9ab0]"><MapPin className="h-3.5 w-3.5 text-[#ffb020]" />Weather forecast refreshes using these site coordinates.</div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button type="button" onClick={onClose} className="border border-white/10 px-4 py-2 text-xs font-semibold text-[#b7c0cf] hover:bg-white/5">Cancel</button>
          <button type="submit" className="bg-[#ffb020] px-4 py-2 text-xs font-bold text-black hover:bg-amber-400">Save and recalculate</button>
        </div>
      </form>
    </div>
  );
};
