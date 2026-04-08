import { useState, type FormEvent } from 'react';
import { STANDARDS } from '@/engines/rapportEngine';
import type { GenerateRapportDTO } from '@/types/rapport.types';
import {
  FileText, Loader2, X,
  Calendar, Shield, Info
} from 'lucide-react';

interface Props {
  generating: boolean;
  onGenerate: (data: Omit<GenerateRapportDTO, 'id_organisation'>) => Promise<boolean>;
  onClose:    () => void;
}

export default function RapportGenerator({
  generating, onGenerate, onClose
}: Props) {
  const currentYear = new Date().getFullYear();

  const [annee,  setAnnee]  = useState(2024);
  const [debut,  setDebut]  = useState(`${annee}-01-01`);
  const [fin,    setFin]    = useState(`${annee}-12-31`);
  const [std,    setStd]    = useState<GenerateRapportDTO['standard']>(
    'GHG Protocol Corporate Standard'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAnneeChange = (val: number) => {
    setAnnee(val);
    setDebut(`${val}-01-01`);
    setFin(`${val}-12-31`);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!annee || annee < 2000 || annee > currentYear)
      errs.annee = `Année invalide (2000–${currentYear})`;
    if (!debut) errs.debut = 'Date de début requise';
    if (!fin)   errs.fin   = 'Date de fin requise';
    if (debut && fin && fin < debut)
      errs.fin = 'La date de fin doit être après le début';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const ok = await onGenerate({
      annee,
      periode_debut: debut,
      periode_fin:   fin,
      standard:      std
    });
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Générer un rapport
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Rapport carbone conforme GHG Protocol / ISO 14064
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Année */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Année de reporting
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex gap-2">
              {[2022, 2023, 2024].map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleAnneeChange(y)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    annee === y
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                  }`}
                >
                  {y}
                </button>
              ))}
              <input
                type="number"
                value={annee}
                onChange={e => handleAnneeChange(parseInt(e.target.value))}
                min={2000}
                max={currentYear}
                className="w-24 px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {errors.annee && (
              <p className="text-red-500 text-xs mt-1.5">{errors.annee}</p>
            )}
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Date de début
              </label>
              <input
                type="date"
                value={debut}
                onChange={e => setDebut(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.debut
                    ? 'border-red-300'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.debut && (
                <p className="text-red-500 text-xs mt-1">{errors.debut}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Date de fin
              </label>
              <input
                type="date"
                value={fin}
                min={debut}
                onChange={e => setFin(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.fin
                    ? 'border-red-300'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.fin && (
                <p className="text-red-500 text-xs mt-1">{errors.fin}</p>
              )}
            </div>
          </div>

          {/* Standard */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Shield className="w-3.5 h-3.5 inline mr-1" />
              Standard de référence
            </label>
            <div className="space-y-2">
              {STANDARDS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStd(s.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    std === s.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    std === s.value
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {std === s.value && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${
                      std === s.value
                        ? 'text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {s.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Le rapport consolide toutes les activités validées sur
                la période sélectionnée et calcule les émissions CO2e
                par scope (1, 2, 3) conformément au standard choisi.
              </p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Génération...</>
                : <><FileText className="w-4 h-4" />Générer</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}