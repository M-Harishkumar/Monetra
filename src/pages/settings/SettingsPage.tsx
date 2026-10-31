import React, { useState, useEffect } from 'react';
import { Cog, Check, Save } from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const SettingsPage: React.FC = () => {
  const { role } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
          <Cog className="h-6 w-6 text-teal-600" />
          Platform Configuration & Business Settings
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Accounting currency, billing retry policies, and dunning tolerance parameters.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {settings.map(s => (
            <div key={s.id} className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 capitalize">
                {s.key.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                value={s.value}
                disabled={role !== 'ADMIN'}
                onChange={e => handleChange(s.key, e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
              {s.description && (
                <p className="text-[11px] text-slate-400">{s.description}</p>
              )}
            </div>
          ))}

          {role === 'ADMIN' && (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {isSaved ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Settings updated successfully!
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-2xs"
              >
                <Save className="h-4 w-4" />
                Save Platform Settings
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
