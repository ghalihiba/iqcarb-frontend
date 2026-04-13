import { useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/common/Toast';
import { UserCircle2, ShieldCheck } from 'lucide-react';

export default function Parametres() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const rolePrincipale = user?.roles?.[0] ?? 'ETUDIANT';
  const roleApprenant = ['ETUDIANT', 'FORMATEUR'].includes(rolePrincipale);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      toast.success('Profil actualisé');
    } catch {
      toast.error('Erreur', 'Impossible de charger les données de profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header title="Paramètres du compte" subtitle="Gestion du profil utilisateur et des rôles" onRefresh={handleRefresh} />
        <div className="p-8 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {user?.prenom} {user?.nom}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Rôle principal</p>
                <p className="font-semibold text-gray-900 dark:text-white">{rolePrincipale}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Statut apprenant LMS</p>
                <p className={`font-semibold ${roleApprenant ? 'text-green-600' : 'text-orange-600'}`}>
                  {roleApprenant ? 'Activé' : 'Accès restreint'}
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-700">
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Mise à jour du profil...' : 'Profil synchronisable avec le backend'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
