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

// Valeurs initiales du formulaire
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
  const [form,          setForm]          = useState<ActiviteFormData>(initialForm);
  const [sourcesFiltrees, setSourcesFiltrees] = useState<Source[]>([]);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [co2ePreview,   setCo2ePreview]   = useState<string | null>(null);

  // Mettre à jour l'organisation dès qu'elle est disponible
  useEffect(() => {
    if (orgId) setForm(f => ({ ...f, id_organisation: orgId }));
  }, [orgId]);

  // Filtrer les sources selon le scope sélectionné
  useEffect(() => {
    if (form.scope) {
      const filtered = sources.filter(
        s => s.scope_defaut === form.scope
      );
      setSourcesFiltrees(filtered);
      // Réinitialiser la source si elle n'est plus dans le scope
      if (!filtered.find(s => s.id_source === form.id_source)) {
        setForm(f => ({ ...f, id_source: '', unite: '' }));
      }
    } else {
      setSourcesFiltrees(sources);
    }
  }, [form.scope, sources]);

  // Mettre à jour l'unité automatiquement selon la source
  const handleSourceChange = (id_source: string) => {
    const source = sources.find(s => s.id_source === id_source);
    setForm(f => ({
      ...f,
      id_source,
      unite: source?.unite_activite ?? ''
    }));
    // Prévisualisation CO2e estimée
    if (source && form.quantite) {
      setCo2ePreview('Calcul disponible après validation');
    }
  };

  // Validation du formulaire
  const validerFormulaire = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.scope)
      newErrors.scope = 'Sélectionnez un scope GES';
    if (!form.id_source)
      newErrors.id_source = 'Sélectionnez une source d\'émission';
    if (!form.quantite || Number(form.quantite) <= 0)
      newErrors.quantite = 'La quantité doit être un nombre positif';
    if (!form.unite)
      newErrors.unite = 'L\'unité est obligatoire';
    if (!form.periode_debut)
      newErrors.periode_debut = 'La date de début est obligatoire';
    if (!form.periode_fin)
      newErrors.periode_fin = 'La date de fin est obligatoire';
    if (form.periode_debut && form.periode_fin &&
        form.periode_fin < form.periode_debut)
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

  const handleChange = (
    field: keyof ActiviteFormData,
    value: string | number
  ) => {
    setForm(f => ({ ...f, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(e => ({ ...e, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header du modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Nouvelle activité carbone
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Saisir une donnée d'activité émettrice de GES
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* SECTION 1 — Scope GES */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Scope GES
              <span className="text-red-500 ml-1">*</span>
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
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className={`font-bold text-sm ${
                    form.scope === scope.value ? scope.color : 'text-gray-700'
                  }`}>
                    {scope.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {scope.description}
                  </p>
                </button>
              ))}
            </div>
            {errors.scope && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" /> {errors.scope}
              </p>
            )}
          </div>

          {/* SECTION 2 — Source d'émission */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Source d'émission
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <select
                value={form.id_source}
                onChange={e => handleSourceChange(e.target.value)}
                disabled={loadingSources || !form.scope}
                className={`w-full px-4 py-3 border rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm ${
                  errors.id_source
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white'
                } disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">
                  {!form.scope
                    ? '← Sélectionnez d\'abord un scope'
                    : loadingSources
                    ? 'Chargement...'
                    : 'Choisir une source d\'émission'}
                </option>
                {sourcesFiltrees.map(source => (
                  <option key={source.id_source} value={source.id_source}>
                    {source.nom_source} ({source.unite_activite})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.id_source && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" /> {errors.id_source}
              </p>
            )}
            {/* Info source sélectionnée */}
            {form.id_source && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">
                  ℹ️ Unité automatique :{' '}
                  <span className="font-bold">{form.unite}</span>
                  {' '}— Facteur ADEME 2024 disponible
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3 — Quantité et Unité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Quantité
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                value={form.quantite}
                onChange={e => handleChange('quantite', e.target.value)}
                placeholder="ex: 1200"
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm ${
                  errors.quantite
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              />
              {errors.quantite && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" /> {errors.quantite}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Unité
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={form.unite}
                onChange={e => handleChange('unite', e.target.value)}
                placeholder="ex: kWh, L, km"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm ${
                  errors.unite
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              />
              {errors.unite && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" /> {errors.unite}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Remplie automatiquement selon la source
              </p>
            </div>
          </div>

          {/* SECTION 4 — Période */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Date de début
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={form.periode_debut}
                onChange={e => handleChange('periode_debut', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm ${
                  errors.periode_debut
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              />
              {errors.periode_debut && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.periode_debut}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Date de fin
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={form.periode_fin}
                onChange={e => handleChange('periode_fin', e.target.value)}
                min={form.periode_debut}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm ${
                  errors.periode_fin
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              />
              {errors.periode_fin && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.periode_fin}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 5 — Description et Site */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="ex: Consommation électrique bureaux"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Site / Localisation
              </label>
              <input
                type="text"
                value={form.site}
                onChange={e => handleChange('site', e.target.value)}
                placeholder="ex: Bureau Paris, Site Lyon"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* SECTION 6 — Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes / Commentaires
            </label>
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Informations complémentaires sur cette activité..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm resize-none"
            />
          </div>

          {/* Preview CO2e */}
          {co2ePreview && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm text-green-700 font-medium">
                💡 {co2ePreview}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Le calcul CO2e sera effectué automatiquement lors de la validation
              </p>
            </div>
          )}

          {/* Info MRV */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold mb-1">
              ℹ️ Processus MRV
            </p>
            <p className="text-xs text-blue-600">
              L'activité sera créée en statut <strong>BROUILLON</strong>.
              Validez-la ensuite pour déclencher le calcul CO2e automatique
              (Facteur ADEME 2024).
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !orgId}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-primary-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Créer l'activité
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}