import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        <ShieldAlert className="w-10 h-10 mx-auto text-red-500 mb-3" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Accès non autorisé</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Votre rôle ne permet pas d’accéder à cette page.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
