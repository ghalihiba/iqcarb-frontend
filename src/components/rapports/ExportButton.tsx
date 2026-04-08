import { useState }        from 'react';
import { Download, Loader2, FileText, CheckCircle } from 'lucide-react';
import rapportService      from '@/services/rapportService';
import type { Rapport }    from '@/types/rapport.types';
import { genererContenuRapport } from '@/engines/rapportEngine';

interface Props {
  rapport:  Rapport;
  compact?: boolean;
}

export default function ExportButton({ rapport, compact = false }: Props) {
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingTXT, setLoadingTXT] = useState(false);
  const [done,       setDone]       = useState(false);

  const nomOrg = rapport.organisation?.nom ?? 'Organisation';
  const annee  = rapport.periode?.annee    ?? 2024;

  // ── Export PDF via backend ─────────────────────────────────
  const handlePDF = async () => {
    setLoadingPDF(true);
    try {
      await rapportService.exportPDF(
        rapport.id_rapport,
        nomOrg,
        annee
      );
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error('Export PDF échoué:', err);
      // Fallback TXT automatique
      handleTXT();
    } finally {
      setLoadingPDF(false);
    }
  };

  // ── Export TXT fallback ────────────────────────────────────
  const handleTXT = () => {
    setLoadingTXT(true);
    try {
      const contenu  = genererContenuRapport(rapport);
      const fileName = `IQcarb_Rapport_${nomOrg.replace(/\s+/g, '_')}_${annee}.txt`;
      const blob     = new Blob([contenu], { type: 'text/plain;charset=utf-8' });
      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setLoadingTXT(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handlePDF}
        disabled={loadingPDF}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded-xl transition-all text-xs disabled:opacity-50"
      >
        {loadingPDF
          ? <Loader2    className="w-3.5 h-3.5 animate-spin" />
          : done
          ? <CheckCircle className="w-3.5 h-3.5" />
          : <Download   className="w-3.5 h-3.5" />
        }
        PDF
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">

      {/* ── Bouton PDF principal ── */}
      <button
        onClick={handlePDF}
        disabled={loadingPDF || loadingTXT}
        className={`
          flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl
          transition-all text-sm disabled:opacity-50 shadow-lg
          ${done
            ? 'bg-green-500 text-white'
            : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white shadow-green-200 dark:shadow-none'
          }
        `}
      >
        {loadingPDF
          ? <><Loader2   className="w-4 h-4 animate-spin" /> Génération PDF...</>
          : done
          ? <><CheckCircle className="w-4 h-4" /> Téléchargé !</>
          : <><Download  className="w-4 h-4" /> Export PDF</>
        }
      </button>

      {/* ── Bouton TXT secondaire ── */}
      <button
        onClick={handleTXT}
        disabled={loadingPDF || loadingTXT}
        title="Exporter en texte structuré"
        className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium px-3 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
      >
        {loadingTXT
          ? <Loader2  className="w-4 h-4 animate-spin" />
          : <FileText className="w-4 h-4" />
        }
        TXT
      </button>
    </div>
  );
}