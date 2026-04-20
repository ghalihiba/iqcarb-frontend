import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import { useToast } from '@/components/common/Toast';
import LMSBreadcrumb from '@/components/lms/LMSBreadcrumb';
import lmsService from '@/services/lmsService';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, GraduationCap, PlusCircle, Users } from 'lucide-react';
import type { AxiosError } from 'axios';

interface FormateurParcours {
  id_parcours: string;
  titre: string;
  description?: string;
  niveau?: string;
  est_publie?: boolean;
  nb_modules?: number;
}

interface FormateurModule {
  id_module: string;
  id_parcours: string;
  titre: string;
  description?: string;
  ordre?: number;
  est_publie?: boolean;
}

interface FormateurCours {
  id_cours: string;
  id_module: string;
  titre: string;
  description?: string;
  type_contenu?: string;
  url_ressource?: string | null;
  ordre?: number;
  points_xp?: number;
  est_publie?: boolean;
}

export default function LMSFormateur() {
  const toast = useToast();
  const [parcours, setParcours] = useState<FormateurParcours[]>([]);
  const [modules, setModules] = useState<FormateurModule[]>([]);
  const [cours, setCours] = useState<FormateurCours[]>([]);
  const [stats, setStats] = useState<{ nb_apprenants: number; nb_parcours: number; nb_cours_termines: number } | null>(null);
  const [progressionEquipe, setProgressionEquipe] = useState<Array<{
    id_utilisateur: string;
    nom: string;
    prenom: string;
    email: string;
    parcours_titre: string;
    progression: number | string;
    statut_simulation: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcoursId, setSelectedParcoursId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedCoursId, setSelectedCoursId] = useState('');

  const [newParcours, setNewParcours] = useState({
    titre: '',
    description: '',
    niveau: 'DEBUTANT',
    type_acces: 'GUIDE',
    est_publie: true
  });
  const [newModule, setNewModule] = useState({
    id_parcours: '',
    titre: '',
    description: '',
    ordre: 1,
    est_publie: true
  });
  const [newCours, setNewCours] = useState({
    id_module: '',
    titre: '',
    description: '',
    type_contenu: 'ARTICLE',
    url_ressource: '',
    ordre: 1,
    points_xp: 10,
    est_publie: true
  });
  const [newQuiz, setNewQuiz] = useState({
    id_cours: '',
    titre: '',
    score_minimal: 70,
    nb_questions: 10,
    nb_tentatives_max: 3
  });

  const loadData = async () => {
    setLoading(true);
    const [parRes, stRes, eqRes] = await Promise.allSettled([
      lmsService.getFormateurParcours(),
      lmsService.getApprenantsStats(),
      lmsService.getEquipeProgression()
    ]);

    if (parRes.status === 'fulfilled') {
      setParcours(parRes.value.data.data ?? []);
    } else {
      toast.error('Erreur', 'Impossible de charger vos parcours formateur.');
    }

    if (stRes.status === 'fulfilled') {
      setStats(stRes.value.data.data ?? null);
    } else {
      setStats(null);
    }

    if (eqRes.status === 'fulfilled') {
      setProgressionEquipe(eqRes.value.data.data ?? []);
    } else {
      setProgressionEquipe([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedParcoursId) {
        setModules([]);
        setSelectedModuleId('');
        return;
      }
      const res = await lmsService.getFormateurModules(selectedParcoursId);
      const rows = res.data.data ?? [];
      setModules(rows);
      setSelectedModuleId((prev) => rows.some((m: FormateurModule) => m.id_module === prev) ? prev : '');
    };
    fetchModules().catch(() => toast.error('Erreur', 'Chargement modules impossible.'));
  }, [selectedParcoursId]);

  useEffect(() => {
    const fetchCours = async () => {
      if (!selectedModuleId) {
        setCours([]);
        setSelectedCoursId('');
        return;
      }
      const res = await lmsService.getFormateurCours(selectedModuleId);
      const rows = res.data.data ?? [];
      setCours(rows);
      setSelectedCoursId((prev) => rows.some((c: FormateurCours) => c.id_cours === prev) ? prev : '');
    };
    fetchCours().catch(() => toast.error('Erreur', 'Chargement cours impossible.'));
  }, [selectedModuleId]);

  const selectedParcours = useMemo(
    () => parcours.find((p) => p.id_parcours === selectedParcoursId) ?? null,
    [parcours, selectedParcoursId]
  );
  const selectedModule = useMemo(
    () => modules.find((m) => m.id_module === selectedModuleId) ?? null,
    [modules, selectedModuleId]
  );
  const selectedCours = useMemo(
    () => cours.find((c) => c.id_cours === selectedCoursId) ?? null,
    [cours, selectedCoursId]
  );

  const handleCreateParcours = async () => {
    if (!newParcours.titre) return toast.warning('Titre requis');
    try {
      await lmsService.createParcours(newParcours);
      toast.success('Parcours créé');
      setNewParcours({ titre: '', description: '', niveau: 'DEBUTANT', type_acces: 'GUIDE', est_publie: true });
      const parRes = await lmsService.getFormateurParcours();
      setParcours(parRes.data.data ?? []);
    } catch (err: unknown) {
      const e = err as AxiosError<{ message?: string }>;
      toast.error('Erreur', e.response?.data?.message ?? 'Création parcours impossible.');
    }
  };

  const handleCreateModule = async () => {
    if (!newModule.id_parcours || !newModule.titre) return toast.warning('Parcours et titre requis');
    try {
      await lmsService.createModule(newModule);
      toast.success('Module créé');
      setNewModule({ id_parcours: newModule.id_parcours, titre: '', description: '', ordre: 1, est_publie: true });
      const res = await lmsService.getFormateurModules(newModule.id_parcours);
      setModules(res.data.data ?? []);
    } catch (err: unknown) {
      const e = err as AxiosError<{ message?: string }>;
      toast.error('Erreur', e.response?.data?.message ?? 'Création module impossible.');
    }
  };

  const handleCreateCours = async () => {
    if (!newCours.id_module || !newCours.titre) return toast.warning('Module et titre requis');
    try {
      await lmsService.createCours(newCours);
      toast.success('Cours créé');
      setNewCours({
        id_module: newCours.id_module,
        titre: '',
        description: '',
        type_contenu: 'ARTICLE',
        url_ressource: '',
        ordre: 1,
        points_xp: 10,
        est_publie: true
      });
      const res = await lmsService.getFormateurCours(newCours.id_module);
      setCours(res.data.data ?? []);
    } catch (err: unknown) {
      const e = err as AxiosError<{ message?: string }>;
      toast.error('Erreur', e.response?.data?.message ?? 'Création cours impossible.');
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.id_cours || !newQuiz.titre) return toast.warning('Cours et titre requis');
    try {
      await lmsService.createQuiz(newQuiz);
      toast.success('Quiz créé');
      setNewQuiz({ id_cours: '', titre: '', score_minimal: 70, nb_questions: 10, nb_tentatives_max: 3 });
    } catch (err: unknown) {
      const e = err as AxiosError<{ message?: string }>;
      toast.error('Erreur', e.response?.data?.message ?? 'Création quiz impossible.');
    }
  };

  const handleUpdateParcours = async () => {
    if (!selectedParcours) return;
    try {
      await lmsService.updateParcours(selectedParcours.id_parcours, {
        titre: selectedParcours.titre,
        description: selectedParcours.description,
        niveau: selectedParcours.niveau,
        est_publie: !!selectedParcours.est_publie
      });
      toast.success('Parcours mis à jour');
      await loadData();
    } catch {
      toast.error('Erreur', 'Mise à jour parcours impossible.');
    }
  };

  const handleUpdateModule = async () => {
    if (!selectedModule) return;
    try {
      await lmsService.updateModule(selectedModule.id_module, {
        titre: selectedModule.titre,
        description: selectedModule.description,
        ordre: selectedModule.ordre,
        est_publie: !!selectedModule.est_publie
      });
      toast.success('Module mis à jour');
      const res = await lmsService.getFormateurModules(selectedModule.id_parcours);
      setModules(res.data.data ?? []);
    } catch {
      toast.error('Erreur', 'Mise à jour module impossible.');
    }
  };

  const handleUpdateCours = async () => {
    if (!selectedCours) return;
    try {
      await lmsService.updateCours(selectedCours.id_cours, {
        titre: selectedCours.titre,
        description: selectedCours.description,
        type_contenu: selectedCours.type_contenu,
        url_ressource: selectedCours.url_ressource ?? '',
        ordre: selectedCours.ordre,
        points_xp: selectedCours.points_xp,
        est_publie: !!selectedCours.est_publie
      });
      toast.success('Cours mis à jour');
      const res = await lmsService.getFormateurCours(selectedCours.id_module);
      setCours(res.data.data ?? []);
    } catch {
      toast.error('Erreur', 'Mise à jour cours impossible.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header title="Interface Formateur LMS" subtitle="Création de contenus, suivi apprenants et évaluations" onRefresh={loadData} />
        <div className="p-8 space-y-6">
          <LMSBreadcrumb items={[{ label: 'Apprentissage', to: '/lms' }, { label: 'Espace Formateur' }]} />

          <div className="flex justify-end">
            <Link to="/lms" className="text-sm px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold">
              Parcours étudiant
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Apprenants', value: stats?.nb_apprenants ?? 0, icon: Users },
              { label: 'Parcours créés', value: stats?.nb_parcours ?? 0, icon: GraduationCap },
              { label: 'Cours complétés', value: stats?.nb_cours_termines ?? 0, icon: BarChart3 }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                <Icon className="w-5 h-5 text-primary-600 mb-2" />
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Créer / éditer parcours</h3>
              <input value={newParcours.titre} onChange={(e) => setNewParcours((f) => ({ ...f, titre: e.target.value }))} placeholder="Titre du parcours" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
              <textarea value={newParcours.description} onChange={(e) => setNewParcours((f) => ({ ...f, description: e.target.value }))} placeholder="Description" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
              <button onClick={handleCreateParcours} className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold">Créer parcours</button>
              <div className="pt-2">
                <select
                  value={selectedParcoursId}
                  onChange={(e) => {
                    setSelectedParcoursId(e.target.value);
                    setSelectedModuleId('');
                    setSelectedCoursId('');
                    setNewModule((f) => ({ ...f, id_parcours: e.target.value }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="">Sélectionner un parcours à éditer</option>
                  {parcours.map((p) => <option key={p.id_parcours} value={p.id_parcours}>{p.titre}</option>)}
                </select>
              </div>
              {selectedParcours && (
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 space-y-2">
                  <input
                    value={selectedParcours.titre}
                    onChange={(e) => setParcours((prev) => prev.map((p) => p.id_parcours === selectedParcours.id_parcours ? { ...p, titre: e.target.value } : p))}
                    className="w-full px-3 py-2 rounded-lg border border-primary-200 bg-white dark:bg-gray-700"
                  />
                  <textarea
                    value={selectedParcours.description ?? ''}
                    onChange={(e) => setParcours((prev) => prev.map((p) => p.id_parcours === selectedParcours.id_parcours ? { ...p, description: e.target.value } : p))}
                    className="w-full px-3 py-2 rounded-lg border border-primary-200 bg-white dark:bg-gray-700"
                  />
                  <button onClick={handleUpdateParcours} className="px-3 py-2 rounded-lg bg-primary-700 text-white text-xs font-semibold">
                    Enregistrer modifications parcours
                  </button>
                </div>
              )}
              <div className="space-y-2 pt-2">
                {parcours.map((p) => (
                  <div key={p.id_parcours} className="text-sm p-3 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{p.titre}</p>
                      <p className="text-xs text-gray-500">{p.nb_modules ?? 0} modules</p>
                    </div>
                    <Link to={`/lms/parcours/${p.id_parcours}`} className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg font-semibold">Voir</Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4" /> Gérer modules et cours</h3>
              <select value={newModule.id_parcours} onChange={(e) => setNewModule((f) => ({ ...f, id_parcours: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                <option value="">Sélectionner parcours</option>
                {parcours.map((p) => <option key={p.id_parcours} value={p.id_parcours}>{p.titre}</option>)}
              </select>
              <input value={newModule.titre} onChange={(e) => setNewModule((f) => ({ ...f, titre: e.target.value }))} placeholder="Titre module" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
              <button onClick={handleCreateModule} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold">Créer module</button>
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  setSelectedCoursId('');
                  setNewCours((f) => ({ ...f, id_module: e.target.value }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="">Sélectionner module ({selectedParcours?.titre ?? 'parcours'})</option>
                {modules.map((m) => <option key={m.id_module} value={m.id_module}>{m.ordre}. {m.titre}</option>)}
              </select>
              {selectedModule && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 space-y-2">
                  <input
                    value={selectedModule.titre}
                    onChange={(e) => setModules((prev) => prev.map((m) => m.id_module === selectedModule.id_module ? { ...m, titre: e.target.value } : m))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <textarea
                    value={selectedModule.description ?? ''}
                    onChange={(e) => setModules((prev) => prev.map((m) => m.id_module === selectedModule.id_module ? { ...m, description: e.target.value } : m))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <button onClick={handleUpdateModule} className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold">
                    Enregistrer module
                  </button>
                </div>
              )}

              <input value={newCours.titre} onChange={(e) => setNewCours((f) => ({ ...f, titre: e.target.value }))} placeholder="Titre cours" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
              <select
                value={newCours.type_contenu}
                onChange={(e) => setNewCours((f) => ({ ...f, type_contenu: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="ARTICLE">Card / Article</option>
                <option value="VIDEO">Vidéo</option>
                <option value="PDF">PDF</option>
                <option value="PRESENTATION">Présentation</option>
                <option value="ETUDE_DE_CAS">Étude de cas</option>
              </select>
              <input
                value={newCours.url_ressource}
                onChange={(e) => setNewCours((f) => ({ ...f, url_ressource: e.target.value }))}
                placeholder="URL ressource (vidéo, PDF, etc.)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <textarea
                value={newCours.description}
                onChange={(e) => setNewCours((f) => ({ ...f, description: e.target.value }))}
                placeholder="Texte card d’apprentissage / résumé"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <button onClick={handleCreateCours} className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold">Créer cours</button>
              <select
                value={selectedCoursId}
                onChange={(e) => setSelectedCoursId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="">Sélectionner cours à éditer</option>
                {cours.map((c) => <option key={c.id_cours} value={c.id_cours}>{c.ordre}. {c.titre}</option>)}
              </select>
              {selectedCours && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 space-y-2">
                  <input
                    value={selectedCours.titre}
                    onChange={(e) => setCours((prev) => prev.map((c) => c.id_cours === selectedCours.id_cours ? { ...c, titre: e.target.value } : c))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <textarea
                    value={selectedCours.description ?? ''}
                    onChange={(e) => setCours((prev) => prev.map((c) => c.id_cours === selectedCours.id_cours ? { ...c, description: e.target.value } : c))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <select
                    value={selectedCours.type_contenu ?? 'ARTICLE'}
                    onChange={(e) => setCours((prev) => prev.map((c) => c.id_cours === selectedCours.id_cours ? { ...c, type_contenu: e.target.value } : c))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    <option value="ARTICLE">Card / Article</option>
                    <option value="VIDEO">Vidéo</option>
                    <option value="PDF">PDF</option>
                    <option value="PRESENTATION">Présentation</option>
                    <option value="ETUDE_DE_CAS">Étude de cas</option>
                  </select>
                  <input
                    value={selectedCours.url_ressource ?? ''}
                    onChange={(e) => setCours((prev) => prev.map((c) => c.id_cours === selectedCours.id_cours ? { ...c, url_ressource: e.target.value } : c))}
                    placeholder="URL ressource"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <button onClick={handleUpdateCours} className="px-3 py-2 rounded-lg bg-primary-700 text-white text-xs font-semibold">
                    Enregistrer cours
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Créer quiz / évaluations</h3>
              <select
                value={newQuiz.id_cours}
                onChange={(e) => setNewQuiz((f) => ({ ...f, id_cours: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="">Sélectionner cours cible</option>
                {cours.map((c) => <option key={c.id_cours} value={c.id_cours}>{c.titre}</option>)}
              </select>
              <input value={newQuiz.titre} onChange={(e) => setNewQuiz((f) => ({ ...f, titre: e.target.value }))} placeholder="Titre quiz" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
              <button onClick={handleCreateQuiz} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold">Créer quiz</button>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Suivi progression équipe</h3>
              {loading ? (
                <p className="text-sm text-gray-500">Chargement...</p>
              ) : progressionEquipe.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune donnée de progression.</p>
              ) : (
                <div className="space-y-2">
                  {progressionEquipe.slice(0, 8).map((row, idx) => (
                    <div key={`${row.id_utilisateur}-${idx}`} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.prenom} {row.nom} · {row.parcours_titre}</p>
                      <p className="text-xs text-gray-500">{Number(row.progression ?? 0)}% · {row.statut_simulation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
