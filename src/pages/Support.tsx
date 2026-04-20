import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import { HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react';

export default function Support() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header title="Support" subtitle="Aide et assistance utilisateur" />

        <div className="p-8 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Besoin d'aide ?
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Notre équipe support vous accompagne pour l’usage de la plateforme,
              les parcours pédagogiques, les certificats et les comptes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <Mail className="w-5 h-5 text-primary-600 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white">Email</p>
              <p className="text-sm text-gray-500 mt-1">support@iqcarb.com</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <Phone className="w-5 h-5 text-primary-600 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white">Téléphone</p>
              <p className="text-sm text-gray-500 mt-1">+212 5 00 00 00 00</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <MessageCircle className="w-5 h-5 text-primary-600 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white">Chat</p>
              <p className="text-sm text-gray-500 mt-1">Disponible du lundi au vendredi</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
