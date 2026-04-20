/**
 * QuizPlayer.tsx
 * Composant quiz interactif complet — connecté à l'API backend.
 *
 * FLUX :
 *   1. Chargement du quiz via GET /lms/quiz/:id_cours
 *   2. Affichage question par question avec choix radio
 *   3. Soumission via POST /lms/quiz/:id_quiz/submit
 *   4. Affichage résultats : score animé, corrections, badge Réussi/À retravailler
 *   5. Déclenchement onComplete() si score ≥ 70%
 *
 * INTÉGRATION dans CoursDetail.tsx :
 *   case 'QUIZ':
 *     return <QuizPlayer id_cours={id!} onComplete={handleComplete} />;
 */

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Award, AlertCircle } from 'lucide-react';
import lmsService from '@/services/lmsService';

// ─── Types ────────────────────────────────────────────────────
interface QuizReponse {
  id_reponse: string;
  texte: string;
  ordre: number;
}

interface QuizQuestion {
  id_question: string;
  enonce: string;
  ordre: number;
  reponses: QuizReponse[];
}

interface QuizData {
  id_quiz: string;
  titre: string;
  score_minimal: number;
  questions: QuizQuestion[];
}

interface QuizResultat {
  score: number;
  nb_questions: number;
  passed: boolean;
  corrections?: Record<string, { correct: boolean; bonne_reponse: string }>;
}

interface QuizPlayerProps {
  id_cours: string;
  onComplete: () => void;
}

// ─── Cercle de progression animé ─────────────────────────────
function ScoreCircle({ score, total }: { score: number; total: number }) {
  const pct  = total > 0 ? Math.round((score / total) * 100) : 0;
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  const color = pct >= 70 ? '#10b981' : '#f59e0b';

  return (
    <div className="relative w-28 h-28 mx-auto mb-4">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none"
          stroke="currentColor" strokeWidth="10"
          className="text-gray-200 dark:text-gray-700" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{pct}%</span>
        <span className="text-xs text-gray-500">{score}/{total}</span>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────
export default function QuizPlayer({ id_cours, onComplete }: QuizPlayerProps) {
  const [quiz,       setQuiz]       = useState<QuizData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Index de la question courante
  const [currentIdx, setCurrentIdx] = useState(0);

  // Réponses sélectionnées : { id_question → id_reponse }
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Résultat après soumission
  const [resultat,   setResultat]   = useState<QuizResultat | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Chargement du quiz ────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const res  = await lmsService.getQuiz(id_cours);
        const data = res.data?.data ?? res.data;

        // Normalisation : le backend peut retourner { quiz, questions }
        // ou directement { id_quiz, titre, questions }
        const quizData: QuizData = data?.quiz
          ? { ...data.quiz, questions: data.questions ?? [] }
          : { ...data, questions: data.questions ?? [] };

        // Mélanger les réponses de chaque question pour éviter biais
        quizData.questions = quizData.questions.map((q) => ({
          ...q,
          reponses: [...q.reponses].sort(() => Math.random() - 0.5),
        }));

        setQuiz(quizData);

        // Vérifier si l'apprenant a déjà réussi ce quiz
        try {
          const resRes  = await lmsService.getQuizResultat(quizData.id_quiz);
          const resData = resRes.data?.data ?? resRes.data;
          if (resData?.est_valide) {
            setResultat({
              score:        resData.score,
              nb_questions: resData.nb_questions ?? quizData.questions.length,
              passed:       true,
            });
          }
        } catch {
          // Pas de résultat précédent — normal pour premier passage
        }

      } catch (err) {
        console.error('[QuizPlayer] Erreur chargement:', err);
        setError('Impossible de charger le quiz. Vérifiez que le quiz est bien associé à ce cours.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id_cours]);

  // ── Sélectionner une réponse ──────────────────────────────
  const selectAnswer = useCallback((id_question: string, id_reponse: string) => {
    if (resultat) return; // Quiz déjà soumis
    setAnswers((prev) => ({ ...prev, [id_question]: id_reponse }));
  }, [resultat]);

  // ── Navigation ────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!quiz) return;
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  }, [quiz, currentIdx]);

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);

  // ── Soumettre le quiz ─────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const res  = await lmsService.submitQuiz(quiz.id_quiz, answers);
      const data = res.data?.data ?? res.data;

      const score       = data?.score ?? 0;
      const nbQuestions = data?.nb_questions ?? quiz.questions.length;
      const passed      = score / nbQuestions >= (quiz.score_minimal / 100);

      setResultat({
        score,
        nb_questions: nbQuestions,
        passed,
        corrections: data?.corrections ?? {},
      });

      // Déclencher la complétion si score suffisant
      if (passed) {
        setTimeout(onComplete, 800);
      }
    } catch (err) {
      console.error('[QuizPlayer] Erreur soumission:', err);
      setError('Erreur lors de la soumission. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, onComplete]);

  // ── Recommencer le quiz ───────────────────────────────────
  const handleRetry = useCallback(() => {
    setResultat(null);
    setAnswers({});
    setCurrentIdx(0);
    // Mélanger à nouveau les réponses
    if (quiz) {
      setQuiz((prev) => prev ? {
        ...prev,
        questions: prev.questions.map((q) => ({
          ...q,
          reponses: [...q.reponses].sort(() => Math.random() - 0.5),
        })),
      } : null);
    }
  }, [quiz]);

  // ─── États de rendu ─────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 dark:text-red-300 font-semibold mb-1">Quiz indisponible</p>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!quiz) return null;

  const totalQuestions = quiz.questions.length;
  const answeredCount  = Object.keys(answers).length;
  const allAnswered    = answeredCount === totalQuestions;
  const currentQ       = quiz.questions[currentIdx];

  // ─── Écran de résultats ──────────────────────────────────
  if (resultat) {
    const pct = resultat.nb_questions > 0
      ? Math.round((resultat.score / resultat.nb_questions) * 100)
      : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Carte résultat principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">

          <ScoreCircle score={resultat.score} total={resultat.nb_questions} />

          {/* Badge Réussi / À retravailler */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 ${
            resultat.passed
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
          }`}>
            {resultat.passed
              ? <><Award className="w-4 h-4" /> Quiz réussi !</>
              : <><AlertCircle className="w-4 h-4" /> À retravailler</>
            }
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {resultat.passed
              ? `Félicitations ! Vous avez obtenu ${pct}% (seuil requis : ${quiz.score_minimal}%)`
              : `Vous avez obtenu ${pct}%. Le seuil de réussite est de ${quiz.score_minimal}%. Réessayez !`
            }
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!resultat.passed && (
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Recommencer
              </button>
            )}
            <button
              onClick={onComplete}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                resultat.passed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              Continuer le parcours
            </button>
          </div>
        </div>

        {/* Détail des corrections */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">
            Correction détaillée
          </h3>
          <div className="space-y-4">
            {quiz.questions.map((q, idx) => {
              const selectedId = answers[q.id_question];
              const selectedR  = q.reponses.find((r) => r.id_reponse === selectedId);
              // Identifier la bonne réponse
              // Si le backend retourne corrections, l'utiliser
              const corrInfo   = resultat.corrections?.[q.id_question];
              const isCorrect  = corrInfo?.correct ?? false;

              return (
                <div key={q.id_question} className={`p-4 rounded-xl border ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                }`}>
                  <div className="flex items-start gap-3">
                    {isCorrect
                      ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <XCircle    className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Q{idx + 1}. {q.enonce}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Votre réponse : <span className={`font-semibold ${
                          isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedR?.texte ?? 'Non répondu'}
                        </span>
                      </p>
                      {!isCorrect && corrInfo?.bonne_reponse && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Bonne réponse : <span className="font-semibold">{corrInfo.bonne_reponse}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Écran de quiz (question par question) ───────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* En-tête : titre + progression */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">{quiz.titre}</h2>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {currentIdx + 1} / {totalQuestions}
          </span>
        </div>

        {/* Barre de progression par question */}
        <div className="flex gap-1">
          {quiz.questions.map((q, idx) => (
            <div
              key={q.id_question}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                idx < currentIdx
                  ? 'bg-primary-500'
                  : idx === currentIdx
                  ? 'bg-primary-300'
                  : answers[q.id_question]
                  ? 'bg-primary-200'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{answeredCount} répondu{answeredCount > 1 ? 's' : ''}</span>
          <span>{totalQuestions - answeredCount} restant{totalQuestions - answeredCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Carte question */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">

        {/* Énoncé */}
        <p className="font-semibold text-gray-900 dark:text-white text-base leading-relaxed mb-6">
          {currentQ.enonce}
        </p>

        {/* Choix de réponses */}
        <div className="space-y-3">
          {currentQ.reponses.map((reponse) => {
            const isSelected = answers[currentQ.id_question] === reponse.id_reponse;
            return (
              <button
                key={reponse.id_reponse}
                onClick={() => selectAnswer(currentQ.id_question, reponse.id_reponse)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all duration-150 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Radio visuel */}
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  {reponse.texte}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation bas */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Précédente
        </button>

        <span className="text-xs text-gray-400">
          {answeredCount}/{totalQuestions} répondu{answeredCount > 1 ? 's' : ''}
        </span>

        {currentIdx < totalQuestions - 1 ? (
          /* Bouton Suivante */
          <button
            onClick={goNext}
            disabled={!answers[currentQ.id_question]}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivante
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          /* Bouton Terminer (dernière question) */
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Correction...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Terminer le quiz
              </>
            )}
          </button>
        )}
      </div>

      {/* Hint si toutes questions répondues mais pas sur dernière */}
      {allAnswered && currentIdx < totalQuestions - 1 && (
        <p className="text-center text-xs text-primary-600 dark:text-primary-400">
          ✓ Toutes les questions ont une réponse — naviguez jusqu'à la dernière pour soumettre.
        </p>
      )}
    </div>
  );
}