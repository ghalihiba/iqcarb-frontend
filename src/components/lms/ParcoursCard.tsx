import { useNavigate }  from 'react-router-dom';
import NiveauBadge      from './NiveauBadge';
import ProgressBar      from './ProgressBar';
import type { Parcours } from '@/types/lms.types';
import {
  BookOpen, Clock, Users,
  Play, CheckCircle, Lock
} from 'lucide-react';

interface Props {
  parcours:  Parcours;
  onInscrire: (id: string) => void;
}

export default function ParcoursCard({ parcours, onInscrire }: Props) {
  const navigate = useNavigate();

  const typeAccesIcon = {
    LIBRE:    <Play  className="w-3 h-3" />,
    GUIDE:    <BookOpen className="w-3 h-3" />,
    PREREQUIS:<Lock className="w-3 h-3" />,
  };

  const typeAccesLabel = {
    LIBRE:    'Accès libre',
    GUIDE:    'Parcours guidé',
    PREREQUIS: 'Prérequis requis',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden group">

      {/* Bandeau coloré selon le niveau */}
      <div className={`h-2 ${
        parcours.niveau === 'DEBUTANT'      ? 'bg-green-500'
        : parcours.niveau === 'INTERMEDIAIRE' ? 'bg-blue-500'
        : 'bg-purple-500'
      }`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <NiveauBadge niveau={parcours.niveau} />
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            {typeAccesIcon[parcours.type_acces]}
            {typeAccesLabel[parcours.type_acces]}
          </span>
        </div>

        {/* Titre */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {parcours.titre}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
          {parcours.description}
        </p>

        {/* Méta-données */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {parcours.nb_modules} modules
          </span>
          {parcours.duree_estimee && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {Math.round(parcours.duree_estimee / 60)}h
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {parcours.nb_inscrits} inscrits
          </span>
        </div>

        {/* Progression si inscrit */}
        {parcours.est_inscrit && (
          <div className="mb-4">
            <ProgressBar
              value={parcours.progression ?? 0}
              label="Progression"
              size="md"
            />
          </div>
        )}

        {/* Bouton action */}
        {parcours.statut === 'TERMINE' ? (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            Parcours terminé
          </div>
        ) : parcours.est_inscrit ? (
          <button
            onClick={() => navigate(`/lms/parcours/${parcours.id_parcours}`)}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Continuer ({parcours.progression}%)
          </button>
        ) : (
          <button
            onClick={() => onInscrire(parcours.id_parcours)}
            className="w-full py-2.5 border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-sm font-semibold transition-colors"
          >
            S'inscrire
          </button>
        )}
      </div>
    </div>
  );
}