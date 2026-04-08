import { useState, useEffect, type FormEvent } from 'react';
import type {
  ActiviteFormData, Source
} from '@/types/activite.types';
import { SCOPES } from '@/types/activite.types';
import {
  Plus, X, Loader2, Info,
  ChevronDown, Calendar
} from 'lucide-react';

interface Props {
  sources:       Source[];
  orgId:         string | null;
  loadingSources: boolean;
  submitting:    boolean;
  onSubmit:      (data: ActiviteFormData) => Promise<boolean>;
  onClose:       () => void;
}

const initialForm: ActiviteFormData = {
  id_organisation: '',
  id_source:       '',
  description:     '',
  periode_debut:   new Date().getFullYear() + '-01-01',
  periode_fin:     new Date().getFullYear() + '-12-31',
  quantite:        '',
  unite:           '',
  site:            '',
  scope:           '',
  notes:           '',
};

export default function ActiviteForm({
  sources, orgId, loadingSources,
  submitting, onSubmit, onClose
}: Props) {
  const [form, setForm] = useState<ActiviteFormData>(initialForm);
  const [sourcesFiltrees, setSourcesFiltrees] = useState<Source[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [co2ePreview, setCo2ePreview] = useState<string | null>(null);

  useEffect(() => {
    if (orgId) setForm(f => ({ ...f, id_organisation: orgId }));
  }, [orgId]);

  useEffect(() => {
    if (form.scope) {
      const filtered = sources.filter(s => s.scope_defaut === form.scope);
      setSourcesFiltrees(filtered);
      if (!filtered.find(s => s.id_source === form.id_source)) {
        setForm(f => ({ ...f, id_source: '', unite: '' }));
      }
    } else {
      setSourcesFiltrees(sources);
    }
  }, [form.scope, sources]);

  const handleSourceChange = (id_source: string) => {
    const source = sources.find(s => s.id_source === id_source);
    setForm(f => ({
      ...f,
      id_source,
      unite: source?.unite_activite ?? ''
    }));
    if (source && form.quantite) {
      setCo2ePreview('Calcul disponible après validation');
    }
  };

  const validerFormulaire = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.scope) newErrors.scope = 'Sélectionnez un scope GES';
    if (!form.id_source) newErrors.id_source = 'Sélectionnez une source d\'émission';
    if (!form.quantite || Number(form.quantite) <= 0)
      newErrors.quantite = 'La quantité doit être un nombre positif';
    if (!form.unite) newErrors.unite = 'L\'unité est obligatoire';
    if (!form.periode_debut) newErrors.periode_debut = 'La date de début est obligatoire';
    if (!form.periode_fin) newErrors.periode_fin = 'La date de fin est obligatoire';
    if (form.periode_fin < form.periode_debut)
      newErrors.periode_fin = 'La date de fin doit être après la date de début';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validerFormulaire()) return;
    const success = await onSubmit(form);
    if (success) {
      setForm({ ...initialForm, id_organisation: orgId ?? '' });
      setErrors({});
      setCo2ePreview(null);
    }
  };

  const handleChange = (field: keyof ActiviteFormData, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nouvelle activité carbone
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              Saisir une donnée d'activité émettrice de GES
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Scope */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Scope GES *
            </label>

            <div className="grid grid-cols-3 gap-3">
              {SCOPES.map(scope => (
                <button
                  key={scope.value}
                  type="button"
                  onClick={() => handleChange('scope', scope.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    form.scope === scope.value
                      ? `${scope.bg} ${scope.border} ${scope.color}`
                      : 'border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <p className={`font-bold text-sm ${
                    form.scope === scope.value ? scope.color : 'text-gray-700 dark:text-gray-200'
                  }`}>
                    {scope.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {scope.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Source d'émission *
            </label>

            <select
              value={form.id_source}
              onChange={e => handleSourceChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Choisir une source</option>
              {sourcesFiltrees.map(s => (
                <option key={s.id_source} value={s.id_source}>
                  {s.nom_source}
                </option>
              ))}
            </select>
          </div>

          {/* Quantité */}
          <input
  type="number"
  value={form.quantite}
  onChange={e => handleChange('quantite', e.target.value)}
  placeholder="ex: 1200"
  min="0"
  step="0.01"
  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm ${
    errors.quantite
      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
  }`}
/>

          {/* Notes */}
          <textarea
  value={form.notes}
  onChange={e => handleChange('notes', e.target.value)}
  placeholder="Informations complémentaires sur cette activité..."
  rows={3}
  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
/>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary-600 text-white py-3 rounded-xl"
            >
              Créer
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}