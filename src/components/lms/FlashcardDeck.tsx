/**
 * FlashcardDeck.tsx
 * ─────────────────────────────────────────────────────────────
 * Composant de cartes interactives recto/verso (style Cisco NetAcad).
 *
 * FONCTIONNEMENT :
 *   1. L'API retourne un deck de flashcards lié à un cours.
 *   2. L'apprenant clique sur une carte → animation flip 3D CSS.
 *   3. Sur le verso il peut cliquer "Je maîtrise ✓" → la carte
 *      passe en vert et est comptée comme maîtrisée.
 *   4. Une fois toutes les cartes vues, un écran de résultat
 *      s'affiche avec score et bouton "Continuer".
 *
 * INTÉGRATION dans CoursDetail.tsx :
 *   import FlashcardDeck from '@/components/lms/FlashcardDeck';
 *   // Dans le switch type_contenu :
 *   case 'FLASHCARD':
 *     return <FlashcardDeck id_cours={id!} onComplete={handleComplete} />;
 */

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, RotateCcw, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import lmsService from '@/services/lmsService';

// ─── Types ────────────────────────────────────────────────────
interface Flashcard {
  id_carte: string;
  recto: string;       // Question / Terme affiché face avant
  verso: string;       // Définition / Réponse face arrière
  exemple?: string;    // Exemple concret (optionnel)
  emoji?: string;      // Emoji illustratif (ex: 🌡️)
  categorie?: string;  // GES / Scope / MRV ...
  maitrisee?: boolean; // Déjà maîtrisée par l'utilisateur
}

interface FlashcardDeckProps {
  id_cours: string;
  onComplete: () => void; // Appelé quand toutes les cartes sont maîtrisées
}

// ─── Composant carte individuelle ─────────────────────────────
/**
 * SingleCard gère l'animation flip CSS 3D.
 * La rotation est appliquée sur l'élément intérieur (.card-inner)
 * pendant que le conteneur (.card-container) garde sa taille fixe.
 * backface-visibility: hidden masque la face opposée pendant la rotation.
 */
function SingleCard({
  card,
  isFlipped,
  isMaitrisee,
  onFlip,
  onMaitrisee,
}: {
  card: Flashcard;
  isFlipped: boolean;
  isMaitrisee: boolean;
  onFlip: () => void;
  onMaitrisee: () => void;
}) {
  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1200px', minHeight: 320 }}
      onClick={onFlip}
    >
      {/* card-inner : c'est lui qui tourne sur l'axe Y */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 320,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── RECTO (face avant) ─────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-primary-100 dark:border-primary-800 p-8 flex flex-col items-center justify-center text-center shadow-sm"
        >
          {/* Emoji illustratif */}
          {card.emoji && (
            <span className="text-5xl mb-4 block">{card.emoji}</span>
          )}

          {/* Badge catégorie */}
          {card.categorie && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 mb-4 uppercase tracking-wide">
              {card.categorie}
            </span>
          )}

          {/* Terme / Question */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
            {card.recto}
          </h3>

          {/* Indication pour l'apprenant */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            Cliquez pour révéler la réponse →
          </p>
        </div>

        {/* ── VERSO (face arrière — rotée de 180° par défaut) ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl border-2 border-primary-200 dark:border-primary-700 p-8 flex flex-col items-start justify-between shadow-sm"
          onClick={(e) => e.stopPropagation()} // évite re-flip sur click verso
        >
          <div className="w-full">
            {/* Définition */}
            <p className="text-base text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
              {card.verso}
            </p>

            {/* Exemple concret (si disponible) */}
            {card.exemple && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-primary-100 dark:border-primary-800">
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1 uppercase tracking-wide">
                  Exemple
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {card.exemple}
                </p>
              </div>
            )}
          </div>

          {/* Bouton "Je maîtrise" */}
          <div className="w-full flex gap-3 mt-6">
            <button
              onClick={(e) => { e.stopPropagation(); onFlip(); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ← Retourner
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMaitrisee(); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                isMaitrisee
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isMaitrisee ? 'Maîtrisée ✓' : 'Je maîtrise !'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────
export default function FlashcardDeck({ id_cours, onComplete }: FlashcardDeckProps) {
  const [cards, setCards]           = useState<Flashcard[]>([]);
  const [loading, setLoading]       = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped]   = useState(false);

  // Set des id_carte maîtrisées (Set pour O(1) lookup)
  const [maitrisees, setMaitrisees] = useState<Set<string>>(new Set());

  // Mode révision = uniquement les non-maîtrisées
  const [revisionMode, setRevisionMode] = useState(false);

  // Phase : 'intro' | 'playing' | 'results'
  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');

  // ── Chargement des flashcards depuis l'API ─────────────────
  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const res = await lmsService.getFlashcards(id_cours);
        const fetched: Flashcard[] = res.data.data.cartes ?? [];
        setCards(fetched);

        // Pré-remplir les cartes déjà maîtrisées (si l'API les retourne)
        const dejaMaitrisees = new Set(
          fetched.filter((c) => c.maitrisee).map((c) => c.id_carte)
        );
        setMaitrisees(dejaMaitrisees);
      } catch (err) {
        console.error('[FlashcardDeck] Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [id_cours]);

  // ── Cartes actives selon le mode ──────────────────────────
  const activeCards = revisionMode
    ? cards.filter((c) => !maitrisees.has(c.id_carte))
    : cards;

  const currentCard = activeCards[currentIdx];
  const totalCards  = activeCards.length;

  // ── Navigation ────────────────────────────────────────────
  const goNext = useCallback(() => {
    setIsFlipped(false);
    // Petit délai pour laisser la carte se retourner avant de changer
    setTimeout(() => {
      if (currentIdx < totalCards - 1) {
        setCurrentIdx((i) => i + 1);
      } else {
        setPhase('results');
      }
    }, 180);
  }, [currentIdx, totalCards]);

  const goPrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((i) => Math.max(0, i - 1));
    }, 180);
  }, []);

  // ── Marquer une carte comme maîtrisée ────────────────────
  const handleMaitrisee = useCallback(async (card: Flashcard) => {
    const newSet = new Set(maitrisees);
    const wasAlreadyMaitrisee = newSet.has(card.id_carte);

    if (wasAlreadyMaitrisee) {
      newSet.delete(card.id_carte);
    } else {
      newSet.add(card.id_carte);
      // Appel API pour persister (non bloquant)
      try {
        await lmsService.markFlashcardMaitrisee(card.id_carte);
      } catch {
        // silencieux — la progression locale est déjà mise à jour
      }
    }
    setMaitrisees(newSet);

    // Auto-avance vers la carte suivante après 400ms
    if (!wasAlreadyMaitrisee) {
      setTimeout(goNext, 400);
    }
  }, [maitrisees, goNext]);

  // ── Mélanger les cartes ───────────────────────────────────
  const shuffleCards = useCallback(() => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIdx(0);
    setIsFlipped(false);
  }, []);

  // ── Rendu selon la phase ──────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // PHASE : Écran d'introduction
  if (phase === 'intro') {
    // Regrouper les catégories uniques pour l'affichage
    const categories = [...new Set(cards.map((c) => c.categorie).filter(Boolean))];
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center max-w-lg mx-auto">
        <div className="text-6xl mb-4">🃏</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Cartes de révision
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {cards.length} cartes · Cliquez pour révéler la définition · Marquez celles que vous maîtrisez
        </p>

        {/* Catégories couvertes */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((cat) => (
              <span key={cat} className="text-xs px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold">
                {cat}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setPhase('playing')}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors text-sm"
        >
          Commencer l'apprentissage →
        </button>
      </div>
    );
  }

  // PHASE : Écran de résultats
  if (phase === 'results') {
    const score     = maitrisees.size;
    const total     = cards.length;
    const pct       = Math.round((score / total) * 100);
    const allDone   = score === total;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center max-w-lg mx-auto">
        {/* Cercle de score */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor"
              className="text-gray-100 dark:text-gray-700" strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={allDone ? '#10b981' : '#6366f1'} strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white rotate-0">
            {pct}%
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {allDone ? '🎉 Parfait ! Toutes maîtrisées !' : `${score} / ${total} cartes maîtrisées`}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {allDone
            ? 'Excellent travail ! Vous avez maîtrisé toutes les cartes.'
            : `Il vous reste ${total - score} carte(s) à retravailler.`}
        </p>

        <div className="flex flex-col gap-3">
          {/* Révision des non-maîtrisées */}
          {!allDone && (
            <button
              onClick={() => {
                setRevisionMode(true);
                setCurrentIdx(0);
                setIsFlipped(false);
                setPhase('playing');
              }}
              className="w-full py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold rounded-xl hover:bg-amber-100 transition-colors text-sm border border-amber-200 dark:border-amber-800"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Réviser les non-maîtrisées ({total - score})
            </button>
          )}

          {/* Recommencer depuis le début */}
          <button
            onClick={() => {
              setCurrentIdx(0);
              setIsFlipped(false);
              setRevisionMode(false);
              setPhase('playing');
            }}
            className="w-full py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            Recommencer depuis le début
          </button>

          {/* Continuer le cours */}
          <button
            onClick={onComplete}
            className={`w-full py-3 font-bold rounded-xl transition-colors text-sm ${
              allDone
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {allDone ? '✓ Continuer le parcours' : 'Continuer quand même →'}
          </button>
        </div>
      </div>
    );
  }

  // PHASE : Lecture des cartes (playing)
  if (!currentCard) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Barre de progression ─────────────────────────── */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Carte {currentIdx + 1} / {totalCards}
            {revisionMode && ' (mode révision)'}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {maitrisees.size} maîtrisée{maitrisees.size > 1 ? 's' : ''}
          </span>
        </div>

        {/* Barre avec segments colorés par carte */}
        <div className="flex gap-0.5 h-2">
          {cards.map((c, i) => (
            <div
              key={c.id_carte}
              className={`flex-1 rounded-full transition-all duration-300 ${
                maitrisees.has(c.id_carte)
                  ? 'bg-emerald-500'
                  : i === currentIdx
                  ? 'bg-primary-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Carte ─────────────────────────────────────────── */}
      <SingleCard
        card={currentCard}
        isFlipped={isFlipped}
        isMaitrisee={maitrisees.has(currentCard.id_carte)}
        onFlip={() => setIsFlipped((f) => !f)}
        onMaitrisee={() => handleMaitrisee(currentCard)}
      />

      {/* ── Navigation ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédente
        </button>

        {/* Bouton mélanger */}
        <button
          onClick={shuffleCards}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Mélanger les cartes"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        <button
          onClick={goNext}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
        >
          {currentIdx === totalCards - 1 ? 'Voir résultats' : 'Suivante'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}