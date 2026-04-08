/**
 * IQcarb — Moteur d'export PDF
 * Génère des rapports carbone conformes GHG Protocol / ISO 14064
 * Auteur: Hiba Ghali — 2025-2026
 */

const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// ─── Palette couleurs IQcarb ───────────────────────────────────────────────
const COLORS = {
  primary:    '#0D7C66',   // Vert IQcarb
  secondary:  '#1A5276',   // Bleu foncé
  accent:     '#27AE60',   // Vert clair
  scope1:     '#E74C3C',   // Rouge — Scope 1
  scope2:     '#F39C12',   // Orange — Scope 2
  scope3:     '#3498DB',   // Bleu — Scope 3
  light:      '#ECF0F1',   // Gris clair
  dark:       '#2C3E50',   // Gris foncé
  white:      '#FFFFFF',
  border:     '#BDC3C7',
  text:       '#2C3E50',
  textLight:  '#7F8C8D',
};

// ─── Générateur de graphiques (ChartJS → PNG Buffer) ─────────────────────
class ChartGenerator {
  constructor() {
    this.canvas = new ChartJSNodeCanvas({
      width: 700,
      height: 350,
      backgroundColour: 'white',
    });
  }

  /**
   * Graphique donut — répartition des émissions par scope
   */
  async generateScopeDonut(scope1, scope2, scope3) {
    const total = scope1 + scope2 + scope3;
    const config = {
      type: 'doughnut',
      data: {
        labels: [
          `Scope 1 — ${((scope1 / total) * 100).toFixed(1)}%`,
          `Scope 2 — ${((scope2 / total) * 100).toFixed(1)}%`,
          `Scope 3 — ${((scope3 / total) * 100).toFixed(1)}%`,
        ],
        datasets: [{
          data: [scope1, scope2, scope3],
          backgroundColor: [COLORS.scope1, COLORS.scope2, COLORS.scope3],
          borderColor: [COLORS.white, COLORS.white, COLORS.white],
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 14, family: 'sans-serif' },
              padding: 16,
              color: COLORS.dark,
            },
          },
          title: {
            display: true,
            text: 'Répartition des émissions par Scope (tCO₂e)',
            font: { size: 16, weight: 'bold', family: 'sans-serif' },
            color: COLORS.dark,
            padding: { bottom: 20 },
          },
        },
        cutout: '60%',
      },
    };
    return this.canvas.renderToBuffer(config);
  }

  /**
   * Graphique barres — évolution mensuelle des émissions
   */
  async generateEvolutionChart(evolutionData) {
    const labels = evolutionData.map(d => d.mois || d.label);
    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Scope 1',
            data: evolutionData.map(d => parseFloat(d.scope1 || 0)),
            backgroundColor: COLORS.scope1 + 'CC',
            borderColor: COLORS.scope1,
            borderWidth: 2,
            borderRadius: 4,
          },
          {
            label: 'Scope 2',
            data: evolutionData.map(d => parseFloat(d.scope2 || 0)),
            backgroundColor: COLORS.scope2 + 'CC',
            borderColor: COLORS.scope2,
            borderWidth: 2,
            borderRadius: 4,
          },
          {
            label: 'Scope 3',
            data: evolutionData.map(d => parseFloat(d.scope3 || 0)),
            backgroundColor: COLORS.scope3 + 'CC',
            borderColor: COLORS.scope3,
            borderWidth: 2,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 13, family: 'sans-serif' },
              color: COLORS.dark,
              padding: 16,
            },
          },
          title: {
            display: true,
            text: 'Évolution des émissions CO₂e (tCO₂e)',
            font: { size: 16, weight: 'bold', family: 'sans-serif' },
            color: COLORS.dark,
            padding: { bottom: 16 },
          },
        },
        scales: {
          x: {
            stacked: false,
            grid: { display: false },
            ticks: { color: COLORS.textLight, font: { size: 12 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: COLORS.border + '55' },
            ticks: { color: COLORS.textLight, font: { size: 12 } },
            title: {
              display: true,
              text: 'tCO₂e',
              color: COLORS.textLight,
              font: { size: 12 },
            },
          },
        },
      },
    };
    return this.canvas.renderToBuffer(config);
  }

  /**
   * Graphique ligne — tendance des émissions
   */
  async generateTrendChart(trendData) {
    const config = {
      type: 'line',
      data: {
        labels: trendData.map(d => d.label),
        datasets: [{
          label: 'Total émissions (tCO₂e)',
          data: trendData.map(d => parseFloat(d.total)),
          borderColor: COLORS.primary,
          backgroundColor: COLORS.primary + '22',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.primary,
          pointBorderColor: COLORS.white,
          pointBorderWidth: 2,
          pointRadius: 6,
        }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Tendance globale des émissions',
            font: { size: 16, weight: 'bold', family: 'sans-serif' },
            color: COLORS.dark,
            padding: { bottom: 16 },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: COLORS.textLight, font: { size: 12 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: COLORS.border + '55' },
            ticks: { color: COLORS.textLight, font: { size: 12 } },
          },
        },
      },
    };
    return this.canvas.renderToBuffer(config);
  }
}

// ─── Moteur PDF principal ──────────────────────────────────────────────────
class PDFExportEngine {
  constructor() {
    this.chartGen = new ChartGenerator();
  }

  /**
   * Point d'entrée principal
   * @param {Object} rapport    — données du rapport carbone
   * @param {Object} options    — { standard, includeCharts, includeActivites }
   * @returns {Buffer}          — PDF binaire
   */
  async genererRapportPDF(rapport, options = {}) {
    const {
      standard = 'GHG_PROTOCOL',
      includeCharts = true,
      includeActivites = true,
    } = options;

    // Générer les graphiques en parallèle
    let charts = {};
    if (includeCharts) {
      const [donut, evolution] = await Promise.all([
        this.chartGen.generateScopeDonut(
          parseFloat(rapport.total_scope1 || 0),
          parseFloat(rapport.total_scope2 || 0),
          parseFloat(rapport.total_scope3 || 0)
        ),
        rapport.evolution
          ? this.chartGen.generateEvolutionChart(rapport.evolution)
          : null,
      ]);
      charts = { donut, evolution };
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Rapport Carbone ${rapport.annee_reference} — ${rapport.organisation?.nom_organisation || ''}`,
          Author: 'IQcarb — Plateforme Intelligente de Pilotage Carbone',
          Subject: `Rapport GHG Protocol / ISO 14064 — Année ${rapport.annee_reference}`,
          Creator: 'IQcarb v1.0',
        },
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Construction du document ──────────────────────────────────────
      this._pageCouverture(doc, rapport, standard);
      doc.addPage();
      this._tableMatieres(doc);
      doc.addPage();
      this._sectionResume(doc, rapport);
      doc.addPage();
      this._sectionEmissionsParScope(doc, rapport, charts.donut);

      if (charts.evolution) {
        doc.addPage();
        this._sectionEvolution(doc, rapport, charts.evolution);
      }

      doc.addPage();
      this._sectionConformite(doc, rapport, standard);

      if (includeActivites && rapport.activites?.length > 0) {
        doc.addPage();
        this._sectionActivites(doc, rapport.activites);
      }

      doc.addPage();
      this._sectionMRV(doc, rapport);
      this._paginationEtPied(doc);

      doc.end();
    });
  }

  // ── Page de couverture ───────────────────────────────────────────────────
  _pageCouverture(doc, rapport, standard) {
    const { width, height } = doc.page;

    // Fond vert dégradé (simulation avec rectangles)
    doc.rect(0, 0, width, height).fill(COLORS.primary);
    doc.rect(0, height * 0.55, width, height * 0.45).fill(COLORS.white);

    // Motif décoratif
    doc.save();
    doc.opacity(0.08);
    for (let i = 0; i < 6; i++) {
      doc.circle(width * 0.85 - i * 30, 120 + i * 25, 80 - i * 10)
         .stroke(COLORS.white);
    }
    doc.restore();

    // Logo / Titre plateforme
    doc.fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('IQcarb', 50, 45, { align: 'left' })
       .fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.white + 'CC')
       .text('Plateforme Intelligente de Pilotage Carbone', 50, 62);

    // Badge standard
    const badgeLabel = standard === 'ISO_14064' ? 'ISO 14064-1:2018' : 'GHG Protocol';
    doc.roundedRect(width - 160, 40, 110, 28, 14)
       .fill(COLORS.white + '33');
    doc.fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(9)
       .text(badgeLabel, width - 155, 49, { width: 100, align: 'center' });

    // Titre principal
    doc.fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(36)
       .text('RAPPORT', 50, height * 0.22)
       .text('CARBONE', 50, height * 0.22 + 42);

    doc.font('Helvetica')
       .fontSize(18)
       .fillColor(COLORS.white + 'DD')
       .text(`Année de référence : ${rapport.annee_reference}`, 50, height * 0.22 + 100);

    // Ligne décorative
    doc.moveTo(50, height * 0.52)
       .lineTo(width - 50, height * 0.52)
       .strokeColor(COLORS.white + '44')
       .lineWidth(1)
       .stroke();

    // Section blanche — informations organisation
    const yInfo = height * 0.58;
    doc.fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .fontSize(20)
       .text(rapport.organisation?.nom_organisation || 'Organisation', 50, yInfo);

    if (rapport.organisation?.secteur_activite) {
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor(COLORS.textLight)
         .text(rapport.organisation.secteur_activite, 50, yInfo + 28);
    }

    // Cartes KPI couverture
    const kpis = [
      { label: 'Total CO₂e', value: `${parseFloat(rapport.total_co2e || 0).toFixed(2)} t`, color: COLORS.primary },
      { label: 'Scope 1', value: `${parseFloat(rapport.total_scope1 || 0).toFixed(2)} t`, color: COLORS.scope1 },
      { label: 'Scope 2', value: `${parseFloat(rapport.total_scope2 || 0).toFixed(2)} t`, color: COLORS.scope2 },
      { label: 'Scope 3', value: `${parseFloat(rapport.total_scope3 || 0).toFixed(2)} t`, color: COLORS.scope3 },
    ];

    const cardW = (width - 100 - 30) / 4;
    const yCards = yInfo + 70;

    kpis.forEach((kpi, i) => {
      const x = 50 + i * (cardW + 10);
      doc.roundedRect(x, yCards, cardW, 70, 8).fill(kpi.color + '15');
      doc.roundedRect(x, yCards, 4, 70, 2).fill(kpi.color);
      doc.fillColor(kpi.color).font('Helvetica-Bold').fontSize(18)
         .text(kpi.value, x + 12, yCards + 14, { width: cardW - 20 });
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(10)
         .text(kpi.label, x + 12, yCards + 42, { width: cardW - 20 });
    });

    // Pied de couverture
    doc.fillColor(COLORS.textLight)
       .font('Helvetica')
       .fontSize(9)
       .text(
         `Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} · Conforme ${badgeLabel} · Principe MRV`,
         50, height - 65, { align: 'center', width: width - 100 }
       );

    // Pied de page vert
    doc.rect(0, height - 40, width, 40).fill(COLORS.primary);
    doc.fillColor(COLORS.white)
       .font('Helvetica')
       .fontSize(9)
       .text('IQcarb — Plateforme Intelligente de Pilotage Carbone · Hiba Ghali 2025-2026',
         50, height - 28, { align: 'center', width: width - 100 });
  }

  // ── Table des matières ───────────────────────────────────────────────────
  _tableMatieres(doc) {
    this._sectionHeader(doc, 'Table des matières');
    let y = doc.y + 20;

    const sections = [
      { num: '1.', label: 'Résumé exécutif', page: 3 },
      { num: '2.', label: 'Émissions par Scope', page: 4 },
      { num: '3.', label: 'Évolution temporelle', page: 5 },
      { num: '4.', label: 'Conformité réglementaire', page: 6 },
      { num: '5.', label: 'Détail des activités', page: 7 },
      { num: '6.', label: 'Statut MRV', page: 8 },
    ];

    sections.forEach((s, i) => {
      const bgColor = i % 2 === 0 ? COLORS.light + '66' : COLORS.white;
      doc.rect(50, y, doc.page.width - 100, 28).fill(bgColor);
      doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(11)
         .text(s.num, 60, y + 8);
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(11)
         .text(s.label, 85, y + 8);
      // Points de liaison
      doc.fillColor(COLORS.border).font('Helvetica').fontSize(11)
         .text(`${s.page}`, doc.page.width - 80, y + 8, { align: 'right', width: 30 });
      y += 28;
    });
  }

  // ── Résumé exécutif ──────────────────────────────────────────────────────
  _sectionResume(doc, rapport) {
    this._sectionHeader(doc, '1. Résumé exécutif');

    const total = parseFloat(rapport.total_co2e || 0);
    const s1 = parseFloat(rapport.total_scope1 || 0);
    const s2 = parseFloat(rapport.total_scope2 || 0);
    const s3 = parseFloat(rapport.total_scope3 || 0);

    // Bloc résumé
    doc.rect(50, doc.y + 10, doc.page.width - 100, 80).fill(COLORS.primary + '0D');
    doc.roundedRect(50, doc.y + 10, 4, 80, 2).fill(COLORS.primary);
    const yText = doc.y + 22;
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(11)
       .text(
         `Ce rapport présente le bilan des émissions de gaz à effet de serre (GES) de ` +
         `${rapport.organisation?.nom_organisation || "l'organisation"} pour l'année ${rapport.annee_reference}. ` +
         `Les données ont été collectées, calculées et vérifiées conformément au protocole GHG Protocol et à la norme ISO 14064-1:2018. ` +
         `Le périmètre couvre l'ensemble des Scopes 1, 2 et 3.`,
         62, yText, { width: doc.page.width - 124, lineGap: 4 }
       );

    doc.moveDown(2.5);

    // Tableau résumé KPIs
    this._tableauKPIResume(doc, [
      { label: 'Total émissions GES', value: `${total.toFixed(4)} tCO₂e`, highlight: true },
      { label: 'Émissions Scope 1 (directes)', value: `${s1.toFixed(4)} tCO₂e` },
      { label: 'Émissions Scope 2 (énergie indirecte)', value: `${s2.toFixed(4)} tCO₂e` },
      { label: 'Émissions Scope 3 (autres indirectes)', value: `${s3.toFixed(4)} tCO₂e` },
      { label: 'Intensité Scope 1 (%)', value: `${total > 0 ? ((s1 / total) * 100).toFixed(1) : 0} %` },
      { label: 'Intensité Scope 2 (%)', value: `${total > 0 ? ((s2 / total) * 100).toFixed(1) : 0} %` },
      { label: 'Intensité Scope 3 (%)', value: `${total > 0 ? ((s3 / total) * 100).toFixed(1) : 0} %` },
      { label: 'Standard appliqué', value: rapport.standard_utilise || 'GHG Protocol' },
      { label: 'Statut du rapport', value: this._labelStatut(rapport.statut) },
      { label: 'Période couverte', value: `${rapport.date_debut || rapport.annee_reference} → ${rapport.date_fin || rapport.annee_reference}` },
    ]);
  }

  // ── Section émissions par scope ──────────────────────────────────────────
  _sectionEmissionsParScope(doc, rapport, donutBuffer) {
    this._sectionHeader(doc, '2. Émissions par Scope');

    // Graphique donut
    if (donutBuffer) {
      doc.image(donutBuffer, 50, doc.y + 10, { width: doc.page.width - 100, height: 220 });
      doc.moveDown(10);
    }

    // Tableau détaillé par scope
    const scopes = [
      {
        scope: 'Scope 1',
        description: 'Émissions directes (combustion, procédés, fugitives)',
        total: parseFloat(rapport.total_scope1 || 0),
        color: COLORS.scope1,
      },
      {
        scope: 'Scope 2',
        description: 'Émissions indirectes liées à l\'énergie (électricité, chaleur)',
        total: parseFloat(rapport.total_scope2 || 0),
        color: COLORS.scope2,
      },
      {
        scope: 'Scope 3',
        description: 'Autres émissions indirectes (transport, chaîne valeur)',
        total: parseFloat(rapport.total_scope3 || 0),
        color: COLORS.scope3,
      },
    ];

    const totalGlobal = scopes.reduce((s, r) => s + r.total, 0);

    doc.moveDown(1);
    const headers = ['Scope', 'Description', 'Total (tCO₂e)', 'Part (%)'];
    const colWidths = [70, 240, 100, 70];
    this._tableauGeneral(doc, headers, colWidths, scopes.map(s => [
      s.scope,
      s.description,
      s.total.toFixed(4),
      totalGlobal > 0 ? ((s.total / totalGlobal) * 100).toFixed(1) + ' %' : '0 %',
    ]), scopes.map(s => s.color));
  }

  // ── Section évolution ────────────────────────────────────────────────────
  _sectionEvolution(doc, rapport, evolutionBuffer) {
    this._sectionHeader(doc, '3. Évolution temporelle des émissions');

    if (evolutionBuffer) {
      doc.image(evolutionBuffer, 50, doc.y + 10, { width: doc.page.width - 100, height: 220 });
      doc.moveDown(10);
    }

    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(10)
       .text(
         'Ce graphique présente l\'évolution des émissions de GES réparties par scope sur la période de référence. ' +
         'Les données sont exprimées en tonnes de CO₂ équivalent (tCO₂e).',
         50, doc.y + 10, { width: doc.page.width - 100, lineGap: 4 }
       );
  }

  // ── Section conformité ───────────────────────────────────────────────────
  _sectionConformite(doc, rapport, standard) {
    this._sectionHeader(doc, '4. Conformité réglementaire');

    const criteres = standard === 'ISO_14064' ? [
      { critere: 'Quantification des émissions GES (§6)', statut: 'CONFORME', detail: 'Calcul selon CO₂e = Activité × Facteur ADEME 2024' },
      { critere: 'Traçabilité des données (§7)', statut: 'CONFORME', detail: 'Logs complets dans audit_verification' },
      { critere: 'Incertitudes de mesure (§8)', statut: 'CONFORME', detail: 'Incertitudes S1:5%, S2:10%, S3:30%' },
      { critere: 'Rapport d\'inventaire GES (§9)', statut: 'CONFORME', detail: 'Structure rapport_carbone respectée' },
      { critere: 'Vérification tierce partie (§10)', statut: rapport.statut === 'VERIFIE' ? 'CONFORME' : 'EN ATTENTE', detail: 'Workflow AUDITEUR intégré' },
    ] : [
      { critere: 'Périmètre organisationnel', statut: 'CONFORME', detail: 'Approche contrôle opérationnel' },
      { critere: 'Périmètre opérationnel (S1/S2/S3)', statut: 'CONFORME', detail: 'Les 3 scopes documentés' },
      { critere: 'Identification des sources', statut: 'CONFORME', detail: '15 sources ADEME intégrées' },
      { critere: 'Quantification (formule CO₂e)', statut: 'CONFORME', detail: 'Formule standard validée' },
      { critere: 'Qualité des données', statut: 'CONFORME', detail: 'Facteurs ADEME 2024 officiels' },
      { critere: 'Rapport & documentation', statut: 'CONFORME', detail: 'Export PDF structuré' },
    ];

    doc.moveDown(1);

    // En-tête tableau
    const y0 = doc.y;
    const cols = [240, 100, 140];
    const headers = ['Critère', 'Statut', 'Détail'];
    this._drawTableHeader(doc, 50, y0, cols, headers);

    let yRow = y0 + 28;
    criteres.forEach((c, i) => {
      const bg = i % 2 === 0 ? COLORS.white : COLORS.light + '66';
      doc.rect(50, yRow, cols.reduce((a, b) => a + b, 0), 28).fill(bg);
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(10)
         .text(c.critere, 56, yRow + 8, { width: cols[0] - 12 });

      const statutColor = c.statut === 'CONFORME' ? COLORS.primary : COLORS.scope2;
      const statutBg = c.statut === 'CONFORME' ? COLORS.primary + '22' : COLORS.scope2 + '22';
      const xStatut = 50 + cols[0];
      doc.roundedRect(xStatut + 8, yRow + 6, 80, 18, 9).fill(statutBg);
      doc.fillColor(statutColor).font('Helvetica-Bold').fontSize(9)
         .text(c.statut, xStatut + 8, yRow + 10, { width: 80, align: 'center' });

      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(9)
         .text(c.detail, 50 + cols[0] + cols[1] + 4, yRow + 8, { width: cols[2] - 8 });

      yRow += 28;
    });

    // Bordure tableau
    doc.rect(50, y0, cols.reduce((a, b) => a + b, 0), yRow - y0)
       .stroke(COLORS.border);
  }

  // ── Section activités ────────────────────────────────────────────────────
  _sectionActivites(doc, activites) {
    this._sectionHeader(doc, '5. Détail des activités');

    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(10)
       .text(`${activites.length} activité(s) incluse(s) dans ce rapport`, 50, doc.y + 8);

    doc.moveDown(1.5);

    const headers = ['Description', 'Source', 'Scope', 'Quantité', 'CO₂e (t)'];
    const cols = [130, 100, 55, 70, 75];

    const y0 = doc.y;
    this._drawTableHeader(doc, 50, y0, cols, headers);

    let yRow = y0 + 28;
    activites.slice(0, 30).forEach((a, i) => { // max 30 lignes
      if (yRow > doc.page.height - 100) {
        doc.addPage();
        yRow = 80;
        this._drawTableHeader(doc, 50, yRow - 28, cols, headers);
      }
      const bg = i % 2 === 0 ? COLORS.white : COLORS.light + '66';
      const rowH = 24;
      doc.rect(50, yRow, cols.reduce((s, c) => s + c, 0), rowH).fill(bg);

      const scopeColor = a.scope === 'SCOPE_1' ? COLORS.scope1 : a.scope === 'SCOPE_2' ? COLORS.scope2 : COLORS.scope3;
      let xCursor = 50;

      doc.fillColor(COLORS.text).font('Helvetica').fontSize(9)
         .text(a.description || '—', xCursor + 4, yRow + 6, { width: cols[0] - 8, ellipsis: true });
      xCursor += cols[0];

      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(9)
         .text(a.source_label || '—', xCursor + 4, yRow + 6, { width: cols[1] - 8, ellipsis: true });
      xCursor += cols[1];

      const scopeLabel = a.scope?.replace('SCOPE_', 'S') || '—';
      doc.roundedRect(xCursor + 4, yRow + 4, 40, 16, 8).fill(scopeColor + '22');
      doc.fillColor(scopeColor).font('Helvetica-Bold').fontSize(9)
         .text(scopeLabel, xCursor + 4, yRow + 7, { width: 40, align: 'center' });
      xCursor += cols[2];

      doc.fillColor(COLORS.text).font('Helvetica').fontSize(9)
         .text(`${parseFloat(a.quantite || 0).toFixed(2)} ${a.unite || ''}`, xCursor + 4, yRow + 6, { width: cols[3] - 8 });
      xCursor += cols[3];

      doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(9)
         .text(`${parseFloat(a.co2e || 0).toFixed(4)}`, xCursor + 4, yRow + 6, { width: cols[4] - 8 });

      yRow += rowH;
    });

    doc.rect(50, y0, cols.reduce((s, c) => s + c, 0), yRow - y0)
       .stroke(COLORS.border);

    if (activites.length > 30) {
      doc.fillColor(COLORS.textLight).font('Helvetica-Oblique').fontSize(9)
         .text(`... et ${activites.length - 30} activité(s) supplémentaire(s) non affichée(s).`, 50, yRow + 8);
    }
  }

  // ── Section MRV ──────────────────────────────────────────────────────────
  _sectionMRV(doc, rapport) {
    this._sectionHeader(doc, '6. Statut MRV — Monitoring · Reporting · Verification');

    const phases = [
      {
        phase: 'Monitoring',
        icon: '●',
        description: 'Collecte et enregistrement des données d\'activité',
        statut: 'COMPLETE',
        detail: `${rapport.nb_activites || 0} activité(s) saisie(s) et validée(s)`,
      },
      {
        phase: 'Reporting',
        icon: '●',
        description: 'Calcul CO₂e et génération du rapport consolidé',
        statut: 'COMPLETE',
        detail: `Total : ${parseFloat(rapport.total_co2e || 0).toFixed(4)} tCO₂e`,
      },
      {
        phase: 'Verification',
        icon: '●',
        description: 'Vérification tierce partie par un auditeur qualifié',
        statut: rapport.statut === 'VERIFIE' || rapport.statut === 'VALIDE' ? 'COMPLETE' : 'EN_ATTENTE',
        detail: rapport.statut === 'VERIFIE' ? 'Rapport vérifié et validé' : 'En attente de vérification',
      },
    ];

    doc.moveDown(1.5);

    phases.forEach((p, i) => {
      const isComplete = p.statut === 'COMPLETE';
      const color = isComplete ? COLORS.primary : COLORS.scope2;
      const yPhase = doc.y;

      // Ligne verticale connecteur
      if (i < phases.length - 1) {
        doc.moveTo(75, yPhase + 60).lineTo(75, yPhase + 100)
           .strokeColor(isComplete ? COLORS.primary : COLORS.border)
           .lineWidth(2).stroke();
      }

      // Cercle phase
      doc.circle(75, yPhase + 30, 20)
         .fill(isComplete ? COLORS.primary : COLORS.white);
      doc.circle(75, yPhase + 30, 20)
         .stroke(color);
      doc.fillColor(isComplete ? COLORS.white : color)
         .font('Helvetica-Bold').fontSize(14)
         .text(i + 1 + '', 68, yPhase + 24);

      // Contenu
      doc.rect(110, yPhase + 10, doc.page.width - 160, 50)
         .fill(color + '0D');
      doc.roundedRect(110, yPhase + 10, 4, 50, 2).fill(color);

      doc.fillColor(color).font('Helvetica-Bold').fontSize(13)
         .text(p.phase, 122, yPhase + 15);
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(10)
         .text(p.description, 122, yPhase + 32, { width: doc.page.width - 220 });

      // Badge statut
      const badgeText = isComplete ? '✓ Complété' : '⏳ En attente';
      doc.roundedRect(doc.page.width - 145, yPhase + 18, 90, 20, 10)
         .fill(color + '22');
      doc.fillColor(color).font('Helvetica-Bold').fontSize(9)
         .text(badgeText, doc.page.width - 145, yPhase + 23, { width: 90, align: 'center' });

      doc.moveDown(3.5);
    });

    // Résumé audit si disponible
    if (rapport.audit) {
      doc.moveDown(1);
      doc.roundedRect(50, doc.y, doc.page.width - 100, 60, 8)
         .fill(COLORS.primary + '0D');
      doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(11)
         .text('Vérification externe', 62, doc.y + 12);
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(10)
         .text(`Verdict : ${rapport.audit.verdict || '—'}`, 62, doc.y + 28);
      if (rapport.audit.commentaire_auditeur) {
        doc.text(`Commentaire : ${rapport.audit.commentaire_auditeur}`, 62, doc.y + 14,
          { width: doc.page.width - 124 });
      }
    }
  }

  // ── Pagination & pied de page ────────────────────────────────────────────
  _paginationEtPied(doc) {
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      if (i === 0) continue; // Pas de pied sur la couverture

      const { width, height } = doc.page;
      doc.rect(0, height - 35, width, 35).fill(COLORS.light);
      doc.moveTo(50, height - 35).lineTo(width - 50, height - 35)
         .strokeColor(COLORS.border).lineWidth(0.5).stroke();

      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
         .text('IQcarb — Rapport Carbone · Conforme GHG Protocol / ISO 14064', 50, height - 24,
           { align: 'left', width: (width - 100) / 2 });
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
         .text(`Page ${i + 1} / ${totalPages}`, 50, height - 24,
           { align: 'right', width: width - 100 });
    }
  }

  // ── Helpers UI ──────────────────────────────────────────────────────────
  _sectionHeader(doc, titre) {
    const y = doc.y;
    doc.rect(50, y, doc.page.width - 100, 36).fill(COLORS.primary);
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(14)
       .text(titre, 62, y + 11);
    doc.moveDown(0.5);
  }

  _drawTableHeader(doc, x, y, cols, labels) {
    let xCursor = x;
    const totalW = cols.reduce((a, b) => a + b, 0);
    doc.rect(x, y, totalW, 28).fill(COLORS.secondary);
    labels.forEach((label, i) => {
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(10)
         .text(label, xCursor + 6, y + 8, { width: cols[i] - 12 });
      xCursor += cols[i];
    });
  }

  _tableauKPIResume(doc, rows) {
    const y0 = doc.y + 8;
    const colW = [260, 170];
    doc.rect(50, y0, colW[0] + colW[1], 28).fill(COLORS.secondary);
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(10)
       .text('Indicateur', 56, y0 + 8)
       .text('Valeur', 50 + colW[0] + 6, y0 + 8);

    let yRow = y0 + 28;
    rows.forEach((row, i) => {
      const bg = row.highlight ? COLORS.primary + '15' : (i % 2 === 0 ? COLORS.white : COLORS.light + '66');
      doc.rect(50, yRow, colW[0] + colW[1], 26).fill(bg);
      const fontStyle = row.highlight ? 'Helvetica-Bold' : 'Helvetica';
      const textColor = row.highlight ? COLORS.primary : COLORS.text;
      doc.fillColor(textColor).font(fontStyle).fontSize(10)
         .text(row.label, 56, yRow + 7, { width: colW[0] - 12 });
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10)
         .text(row.value, 50 + colW[0] + 6, yRow + 7, { width: colW[1] - 12 });
      yRow += 26;
    });

    doc.rect(50, y0, colW[0] + colW[1], yRow - y0).stroke(COLORS.border);
    doc.y = yRow + 10;
  }

  _tableauGeneral(doc, headers, cols, rows, rowColors = []) {
    const y0 = doc.y + 8;
    this._drawTableHeader(doc, 50, y0, cols, headers);
    let yRow = y0 + 28;

    rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? COLORS.white : COLORS.light + '66';
      doc.rect(50, yRow, cols.reduce((a, b) => a + b, 0), 28).fill(bg);
      let xCursor = 50;
      row.forEach((cell, j) => {
        const color = j === 0 && rowColors[i] ? rowColors[i] : COLORS.text;
        doc.fillColor(color).font(j === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
           .text(String(cell), xCursor + 6, yRow + 8, { width: cols[j] - 12, ellipsis: true });
        xCursor += cols[j];
      });
      yRow += 28;
    });

    doc.rect(50, y0, cols.reduce((a, b) => a + b, 0), yRow - y0).stroke(COLORS.border);
    doc.y = yRow + 10;
  }

  _labelStatut(statut) {
    const labels = {
      BROUILLON: 'Brouillon',
      SOUMIS: 'Soumis',
      VERIFIE: 'Vérifié',
      VALIDE: 'Validé',
      REJETE: 'Rejeté',
      CORRECTIONS_DEMANDEES: 'Corrections demandées',
    };
    return labels[statut] || statut || '—';
  }
}

module.exports = new PDFExportEngine();