
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { redirectByRole } from '@/hooks/useRoleRedirect';
import { Leaf, Mail, Lock, AlertCircle, UserCircle2, Briefcase } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [nom,        setNom]        = useState('');
  const [prenom,     setPrenom]     = useState('');
  const [role,       setRole]       = useState('ETUDIANT');
  const [error,      setError]      = useState('');
  const [debugInfo,  setDebugInfo]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setLoading(true);

    try {
      if (isRegister) {
        const payload = { nom, prenom, email, password, role };
        console.log('[REGISTER] Payload envoyé :', payload);
        await register(payload);
        redirectByRole(role, navigate);
      } else {
        console.log('[LOGIN] Tentative avec :', email);
        const userData = await login(email, password);
        const userRole = userData?.roles?.[0] ?? 'ETUDIANT';
        redirectByRole(userRole, navigate);
      }
    } catch (err: unknown) {
      // DEBUG : affiche l'erreur complète dans la console
      console.error('[AUTH ERROR] Erreur complète :', err);

      // Essaye d'extraire le message du backend
      let backendMessage = '';
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;

        // Axios : e.response.data.message
        if (e.response && typeof e.response === 'object') {
          const response = e.response as Record<string, unknown>;
          if (response.data && typeof response.data === 'object') {
            const data = response.data as Record<string, unknown>;
            backendMessage =
              (data.message as string) ||
              (data.error as string) ||
              JSON.stringify(data);
          }
          // Affiche le status HTTP
          setDebugInfo(`HTTP ${response.status} — ${backendMessage}`);
          console.error('[AUTH ERROR] Réponse backend :', response.status, response.data);
        } else if (e.message) {
          backendMessage = e.message as string;
          setDebugInfo(backendMessage);
        }
      }

      // Messages d'erreur clairs selon le code HTTP
      const status =
        err && typeof err === 'object'
          ? ((err as Record<string, unknown>).response as Record<string, unknown>)?.status
          : null;

      if (isRegister) {
        if (status === 409) {
          setError('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.');
        } else if (status === 400) {
          setError(`Données invalides : ${backendMessage || 'vérifiez les champs.'}`);
        } else {
          setError(`Inscription impossible${backendMessage ? ` : ${backendMessage}` : '.'}`);
        }
      } else {
        if (status === 401 || status === 403) {
          setError('Email ou mot de passe incorrect.');
        } else {
          setError(`Connexion impossible${backendMessage ? ` : ${backendMessage}` : '.'}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <Leaf className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IQcarb</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Plateforme intelligente de pilotage carbone
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex flex-col gap-1 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
            {/* Message de debug visible sous l'erreur */}
            {debugInfo && (
              <p className="text-xs text-red-500 pl-6 font-mono break-all">{debugInfo}</p>
            )}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); setDebugInfo(''); }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${!isRegister ? 'bg-white dark:bg-gray-800 text-primary-600' : 'text-gray-500'}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); setDebugInfo(''); }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${isRegister ? 'bg-white dark:bg-gray-800 text-primary-600' : 'text-gray-500'}`}
            >
              Inscription
            </button>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Prénom
                </label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={prenom}
                    onChange={e => setPrenom(e.target.value)}
                    placeholder="Votre prénom"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Nom
                </label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder="Votre nom"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Rôle apprenant
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ETUDIANT">Apprenant (Étudiant)</option>
                    <option value="ENTREPRISE">Entreprise</option>
                    <option value="AUDITEUR">Auditeur</option>
                    <option value="FORMATEUR">Formateur</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@iqcarb.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isRegister ? 'Création du compte...' : 'Connexion...'}
              </span>
            ) : isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {/* Badges conformité */}
        <div className="mt-8 flex items-center justify-center gap-3">
          {['GHG Protocol', 'ISO 14064', 'MRV'].map(badge => (
            <span
              key={badge}
              className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-600"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}