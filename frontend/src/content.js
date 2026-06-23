// Contenuti bilingue per onboarding, documentazione e comando /chat.

// Pool di domande demo, per categoria di comportamento atteso:
//  · general   → ben coperte dal corpus (alta confidenza, grounded)
//  · low       → copertura parziale o assente (confidenza bassa → escalation)
//  · guardrail → toccano variabili sensibili (warning anti-discriminazione)
export const QUESTION_POOL = {
  it: {
    general: [
      'Possiamo usare i dati storici dei sinistri per personalizzare il premio RC Auto?',
      'Per quanto tempo conserviamo la documentazione KYC dei clienti cessati?',
      'Quali obblighi antiriciclaggio si applicano alle polizze vita?',
      'Che informazioni dobbiamo dare al cliente sui fattori che incidono sul premio?',
      'Un cliente può opporsi a una decisione totalmente automatizzata sul suo preventivo?',
      'Quali sono gli obblighi di valutazione di adeguatezza per i prodotti IBIP?',
      'Qual è il diritto di recesso per una polizza connessa a un finanziamento?',
      'Per quanto va conservata la documentazione contrattuale e di sinistro?',
    ],
    low: [
      'Qual è il periodo di conservazione delle registrazioni delle chiamate di vendita inbound?',
      'Come trattiamo i dati biometrici raccolti in fase di onboarding?',
      'Quali obblighi di notifica prevede una polizza cyber-insurance?',
      'Come si applica la regolazione del premio nelle polizze parametriche?',
      'Per quanto conserviamo i log delle chiamate di vendita?',
    ],
    guardrail: [
      'Possiamo usare il CAP di residenza come variabile per il pricing RC Auto?',
      'Possiamo usare il genere dell’assicurato come fattore tariffario?',
      'La nazionalità può essere usata come variabile nel pricing?',
      'Possiamo usare il quartiere di residenza per differenziare il premio?',
      'L’origine etnica può incidere sulla tariffa?',
    ],
  },
  en: {
    general: [
      'Can we use historical claims data to personalise the motor liability premium?',
      'How long do we retain KYC documentation for closed clients?',
      'Which anti-money-laundering duties apply to life policies?',
      'What information must we give the customer about the factors affecting the premium?',
      'Can a customer object to a fully automated decision on their quote?',
      'What suitability assessment duties apply to IBIP products?',
      'What is the withdrawal right for a loan-linked policy?',
      'How long must contract and claims documentation be retained?',
    ],
    low: [
      'What is the retention period for inbound sales call recordings?',
      'How do we process biometric data collected during onboarding?',
      'What notification duties does a cyber-insurance policy entail?',
      'How does premium adjustment apply to parametric policies?',
      'How long do we retain sales call logs?',
    ],
    guardrail: [
      'Can we use the residential postal code as a pricing variable for motor liability?',
      'Can we use the policyholder’s gender as a rating factor?',
      'Can nationality be used as a pricing variable?',
      'Can we use the residential neighbourhood to differentiate the premium?',
      'Can ethnic origin affect the tariff?',
    ],
  },
}

// category: 'random' (default, da tutte) | 'low' | 'guardrail' | 'general'
export function poolFor(lang, category = 'random') {
  const p = QUESTION_POOL[lang] || QUESTION_POOL.it
  if (category === 'low') return p.low
  if (category === 'guardrail') return p.guardrail
  if (category === 'general') return p.general
  return [...p.general, ...p.low, ...p.guardrail]
}

export function pickQuestion(lang, category = 'random', avoid = null) {
  const pool = poolFor(lang, category)
  let q = pool[Math.floor(Math.random() * pool.length)]
  let guard = 0
  while (pool.length > 1 && q === avoid && guard++ < 10) {
    q = pool[Math.floor(Math.random() * pool.length)]
  }
  return q
}

// Tour di onboarding — ogni step "illumina" l'elemento reale della GUI (target).
// target = attributo data-tour dell'elemento da evidenziare; null = centrato.
export const ONBOARDING = {
  it: [
    { target: null, icon: '👋', title: 'Benvenutə nel Compliance Copilot', body: 'Un copilota interno che interroga il corpus normativo e le policy in linguaggio naturale e risponde ancorato alle fonti, con citazioni, confidenza e tracciabilità. È un assistente di bozza, non un decisore: l’ultima parola resta all’espertə. Ti mostro l’interfaccia, pezzo per pezzo.' },
    { target: 'sidebar', icon: '🧭', title: 'La barra laterale', body: 'Da qui navighi le cinque sezioni: in alto le funzioni “Assistente”, in basso la “Governance”. Sono i punti di vista del copilota, dall’uso quotidiano al controllo.' },
    { target: 'answer', icon: '💬', title: 'La risposta', body: 'Ogni risposta è una “Bozza assistita da AI — da validare”, con un badge di Confidenza. I numeri colorati nel testo sono citazioni cliccabili: ogni affermazione è ancorata a una fonte precisa.' },
    { target: 'sources', icon: '📚', title: 'Il pannello Fonti', body: 'Qui vedi solo le fonti effettivamente citate. Clicca una citazione o una card per espandere lo snippet originale, con la parte rilevante evidenziata. Le fonti sono etichettate Normativa pubblica o Policy interna (FITTIZIO).' },
    { target: 'hitl', icon: '✅', title: 'Validazione umana (HITL)', body: 'Per ogni risposta registri l’esito — Valida, Da correggere o Scarta — più un voto 👍/👎. Niente resta “solo AI”: ogni output passa dal giudizio umano e finisce nell’audit.' },
    { target: 'nav-assistant', icon: '⚠️', title: 'Confidenza bassa e Guardrail', body: '“Confidenza bassa” mostra cosa accade quando le fonti non bastano: la risposta scende sotto soglia ed è inviata a revisione esperta. “Guardrail pricing” intercetta variabili sensibili (es. CAP) con un warning anti-discriminazione (IVASS).' },
    { target: 'nav-governance', icon: '📊', title: 'Audit & Dashboard', body: 'L’“Audit trail” è il registro immutabile (catena SHA-256), ricercabile ed esportabile. La “Dashboard” mostra l’adoption-health: grounding, escalation, % validate e lacune del corpus.' },
    { target: 'input', icon: '⌨️', title: 'La barra di input', body: 'Scrivi qui la tua domanda. Suggerimento: digita /chat e premi Invio per generare una domanda di esempio casuale, diversa ogni volta e pronta da inviare.' },
    { target: 'footer', icon: '📄', title: 'Documentazione e Architettura', body: 'Da qui apri in ogni momento la documentazione utente e il diagramma dell’architettura. Il “?” in alto a destra riapre questo tour. Tutti i dati sono pubblici o sintetici: nessun dato reale di clienti.' },
  ],
  en: [
    { target: null, icon: '👋', title: 'Welcome to Compliance Copilot', body: 'An internal copilot that queries the regulatory corpus and policies in natural language and answers grounded in sources, with citations, confidence and traceability. It is a drafting assistant, not a decision-maker: the expert always has the final say. Let me walk you through the interface, piece by piece.' },
    { target: 'sidebar', icon: '🧭', title: 'The sidebar', body: 'Navigate the five sections here: “Assistant” functions at the top, “Governance” below. They are the copilot’s viewpoints, from daily use to oversight.' },
    { target: 'answer', icon: '💬', title: 'The answer', body: 'Every answer is an “AI-assisted draft — to be validated”, with a Confidence badge. The coloured numbers in the text are clickable citations: every statement is anchored to a precise source.' },
    { target: 'sources', icon: '📚', title: 'The Sources panel', body: 'Here you see only the sources actually cited. Click a citation or a card to expand the original snippet, with the relevant part highlighted. Sources are tagged Public regulation or Internal policy (FICTITIOUS).' },
    { target: 'hitl', icon: '✅', title: 'Human-in-the-loop', body: 'For each answer you record the outcome — Validate, Needs fixing or Discard — plus a 👍/👎 vote. Nothing stays “AI-only”: every output goes through human judgement and lands in the audit trail.' },
    { target: 'nav-assistant', icon: '⚠️', title: 'Low confidence & Guardrail', body: '“Low confidence” shows what happens when sources fall short: the answer drops below threshold and is sent to expert review. “Pricing guardrail” catches sensitive variables (e.g. postal code) with an anti-discrimination warning (IVASS).' },
    { target: 'nav-governance', icon: '📊', title: 'Audit & Dashboard', body: 'The “Audit trail” is the immutable log (SHA-256 chain), searchable and exportable. The “Dashboard” shows adoption health: grounding, escalation, % validated and corpus gaps.' },
    { target: 'input', icon: '⌨️', title: 'The input bar', body: 'Type your question here. Tip: type /chat and press Enter to generate a random sample question, different each time and ready to send.' },
    { target: 'footer', icon: '📄', title: 'Documentation and Architecture', body: 'Open the user documentation and the architecture diagram from here anytime. The “?” at the top right reopens this tour. All data is public or synthetic: no real customer data.' },
  ],
}

// Documentazione utente — sezioni con titolo e paragrafi/elenco.
export const DOCS = {
  it: [
    { h: 'Cos’è il Compliance Copilot', p: [
      'Il Compliance Copilot aiuta la funzione Compliance a interrogare il corpus normativo (GDPR, IVASS, Codice delle Assicurazioni, IDD) e le policy interne in linguaggio naturale.',
      'Ogni risposta è ancorata alle fonti, con citazioni verificabili, un punteggio di confidenza e tracciabilità completa. NON prende decisioni di conformità: produce bozze da validare.',
    ] },
    { h: 'Fare una domanda', p: [
      'Scrivi la domanda nella barra in basso e premi Invio (o il pulsante →). La chat parte sempre vuota: nessuna attesa al caricamento.',
      'Comandi rapidi nell’input: /chat inserisce una domanda casuale; /chat low una domanda a copertura debole (per vedere l’escalation); /chat guardrail una domanda con variabile sensibile. La domanda viene inserita, pronta da inviare.',
      'Il pulsante “Domande demo” (in basso) apre l’intero pool di esempi per categoria: clicca una domanda per inserirla.',
      'Cambia lingua (IT/EN) dal selettore in alto a destra: il copilota risponde nella lingua della domanda.',
    ] },
    { h: 'Leggere la risposta', p: [
      'La risposta è una “Bozza assistita da AI — da validare”.',
      'Il badge Confidenza indica quanto le fonti coprono la domanda. Verde = alta; ambra = sotto soglia (richiede revisione).',
      'I numeri colorati nel testo sono citazioni: cliccali per evidenziare la fonte corrispondente e leggerne lo snippet originale nel pannello a destra.',
      'Nel pannello Fonti compaiono solo le fonti effettivamente citate. Le policy interne sono marcate FITTIZIO (dati sintetici dimostrativi).',
    ] },
    { h: 'Confidenza bassa ed escalation — cosa fa', p: [
      'La confidenza (0–100) stima quanto le fonti recuperate coprono davvero la domanda: copertura piena e diretta → alta; copertura parziale, indiretta o assente → bassa. La stima il modello, sulla base delle fonti, non della sua conoscenza generale.',
      'Sotto la soglia (default 60) la risposta NON è considerata affidabile da sola: viene marcata “richiede revisione”, compare un banner di copertura insufficiente e il pulsante “Invia a revisione esperto”.',
      'È una scelta di maturità: in un ambito regolato, sapere dove fermarsi vale più che rispondere sempre. La domanda dubbia va a un esperto invece di rischiare un’allucinazione.',
      'Prova con /chat low (es. conservazione delle chiamate di vendita inbound): il corpus copre solo in parte → confidenza bassa → escalation.',
    ] },
    { h: 'Guardrail pricing (anti-discriminazione) — cosa fa', p: [
      'Un controllo applicativo che, prima e dopo il modello, cerca in domanda e risposta variabili sensibili o proxy discriminatori: CAP/area di residenza, genere, nazionalità, etnia, religione, quartiere… (lista configurabile).',
      'Il CAP, ad esempio, non è una caratteristica protetta, ma può fungere da “proxy”: correla con l’area di residenza e indirettamente con caratteristiche protette. Per questo il pricing assicurativo deve rispettare i principi di non-discriminazione (IVASS).',
      'Quando scatta, la risposta NON viene bloccata: procede ma resta segnalata con un warning che elenca i termini rilevati. L’obiettivo è rendere visibile il rischio, non impedire l’analisi.',
      'Prova con /chat guardrail (es. il CAP come variabile di pricing).',
    ] },
    { h: 'Stati e ciclo di vita di una risposta', p: [
      'Ogni risposta nasce come Bozza assistita da AI. Poi attraversa due controlli automatici: la soglia di confidenza e il guardrail.',
      'Confidenza ≥ soglia → badge verde, pronta per la validazione. Confidenza < soglia → “In revisione” (escalation a esperto).',
      'Validazione umana (esiti, visibili e filtrabili nell’Audit): Validata (corretta e riutilizzabile), Corretta (segnalata da correggere, va in coda di revisione), Scartata (non verrà riutilizzata). Finché una risposta sotto-soglia non è validata, resta “In revisione”.',
      'Qualunque sia l’esito, l’interazione e la sua revisione finiscono nell’audit trail immutabile.',
    ] },
    { h: 'Validare (human-in-the-loop)', p: [
      'Registra l’esito della revisione con i pulsanti Valida / Da correggere / Scarta. L’esito resta tracciato nell’audit trail.',
      'Usa 👍/👎 per un feedback rapido sulla qualità (alimenta le metriche).',
    ] },
    { h: 'Audit trail', p: [
      'Ogni interazione è registrata in modo immutabile: ogni evento porta un hash SHA-256 che incatena il precedente, quindi una modifica a posteriori romperebbe la catena (verificata a schermo: “catena verificata”).',
      'Puoi cercare per domanda/utente, filtrare per esito (Validata, Corretta, Scartata, In revisione) ed esportare tutto in CSV o JSON.',
    ] },
    { h: 'Dashboard: cosa misura e come si calcola', p: [
      'Domande totali: numero di interazioni registrate nell’audit.',
      'Tasso di grounding = risposte con almeno una fonte valida ÷ totale × 100. Misura quanto il copilota resta ancorato alle fonti.',
      'Tasso di escalation = risposte sotto-soglia (in revisione) ÷ totale × 100.',
      '% validate = risposte validate ÷ risposte effettivamente revisionate × 100 (è anche il centro della ciambella “Esiti di validazione”).',
      'Tempo risparmiato = domande totali × 15 minuti stimati di ricerca manuale evitata ÷ 60 = ore (i 15 min sono un parametro configurabile, MINUTES_SAVED_PER_QUERY).',
      'Lacune del corpus = domande “senza risposta adeguata” (fuori-corpus o confidenza < 60), aggregate per testo con la loro frequenza: è la roadmap di cosa aggiungere al corpus.',
      'Andamento domande: numero di domande registrate per mese (asse verticale = conteggio mensile, con base a 0; etichette Y a sinistra), sugli ultimi 12 mesi.',
      'Tutti i numeri sono calcolati live dai dati di sessione/demo: non sono valori fissi.',
    ] },
    { h: 'Dashboard Adoption-health (nel tempo)', p: [
      'Lente complementare ai KPI di business: non "quanto risponde bene il tool" ma "quanto e come viene adottato".',
      'Utenti attivi (MAU) nel tempo e retention a 30/60/90 giorni (% di nuovi utenti ancora attivi dopo N giorni dal primo accesso).',
      'Funnel di attivazione: Onboardati → 1ª domanda → fonte consultata → validazione. Lo stadio con il calo maggiore evidenzia dove gli utenti si bloccano.',
      'Cohort retention: per ogni coorte di iscrizione, la % di utenti ancora attivi mese per mese (heatmap).',
      'Segmenti utenti (power / regolari / occasionali / dormienti), punti di frizione (chiedono ma non validano, onboarding senza domande, inattivi >30g) e adozione per team.',
      'Dati utente SINTETICI a scopo dimostrativo: mostrano il pattern di misurazione dell’adozione, non persone reali.',
    ] },
    { h: 'Nota sui dati', p: [
      'Il corpus è pubblico + sintetico. Nessun dato reale di clienti Prima. La POC dimostra il pattern: con i documenti interni, in sicurezza, il comportamento è lo stesso.',
    ] },
  ],
  en: [
    { h: 'What the Compliance Copilot is', p: [
      'The Compliance Copilot helps the Compliance function query the regulatory corpus (GDPR, IVASS, Insurance Code, IDD) and internal policies in natural language.',
      'Every answer is grounded in sources, with verifiable citations, a confidence score and full traceability. It does NOT make compliance decisions: it produces drafts to be validated.',
    ] },
    { h: 'Asking a question', p: [
      'Type your question in the bottom bar and press Enter (or the → button). The chat always starts empty: no wait on load.',
      'Quick commands in the input: /chat inserts a random question; /chat low a weakly-covered one (to see escalation); /chat guardrail one with a sensitive variable. The question is inserted, ready to send.',
      'The “Demo questions” button (at the bottom) opens the full example pool by category: click a question to insert it.',
      'Switch language (IT/EN) from the top-right toggle: the copilot answers in the question’s language.',
    ] },
    { h: 'Reading the answer', p: [
      'The answer is an “AI-assisted draft — to be validated”.',
      'The Confidence badge shows how well the sources cover the question. Green = high; amber = below threshold (needs review).',
      'The coloured numbers in the text are citations: click them to highlight the matching source and read its original snippet in the right panel.',
      'The Sources panel shows only the sources actually cited. Internal policies are tagged FICTITIOUS (synthetic demo data).',
    ] },
    { h: 'Low confidence and escalation — what it does', p: [
      'Confidence (0–100) estimates how well the retrieved sources actually cover the question: full, direct coverage → high; partial, indirect or absent → low. It is estimated from the sources, not the model’s general knowledge.',
      'Below the threshold (default 60) the answer is not trusted on its own: it is flagged “needs review”, with an insufficient-coverage banner and a “Send to expert review” button.',
      'It is a maturity choice: in a regulated domain, knowing where to stop beats always answering. The uncertain question goes to an expert instead of risking a hallucination.',
      'Try /chat low (e.g. inbound sales call retention): the corpus only partly covers it → low confidence → escalation.',
    ] },
    { h: 'Pricing guardrail (anti-discrimination) — what it does', p: [
      'An application-layer check that, before and after the model, scans question and answer for sensitive variables or discriminatory proxies: postal code/area of residence, gender, nationality, ethnicity, religion, neighbourhood… (configurable list).',
      'Postal code, for instance, is not a protected characteristic, but it can act as a proxy: it correlates with area of residence and indirectly with protected traits. That is why insurance pricing must respect non-discrimination principles (IVASS).',
      'When triggered, the answer is NOT blocked: it proceeds but stays flagged with a warning listing the detected terms. The goal is to surface the risk, not to prevent the analysis.',
      'Try /chat guardrail (e.g. postal code as a pricing variable).',
    ] },
    { h: 'Answer states and lifecycle', p: [
      'Every answer starts as an AI-assisted draft. It then passes two automatic checks: the confidence threshold and the guardrail.',
      'Confidence ≥ threshold → green badge, ready for validation. Confidence < threshold → “In review” (escalated to an expert).',
      'Human validation (outcomes, visible and filterable in the Audit): Validated (correct and reusable), Fixed (flagged for fixing, sent to the review queue), Discarded (won’t be reused). Until a below-threshold answer is validated, it stays “In review”.',
      'Whatever the outcome, the interaction and its review land in the immutable audit trail.',
    ] },
    { h: 'Validate (human-in-the-loop)', p: [
      'Record the review outcome with Validate / Needs fixing / Discard. The outcome stays logged in the audit trail.',
      'Use 👍/👎 for quick quality feedback (it feeds the metrics).',
    ] },
    { h: 'Audit trail', p: [
      'Every interaction is logged immutably: each event carries a SHA-256 hash chaining the previous one, so a later edit would break the chain (verified on screen: “chain verified”).',
      'You can search by question/user, filter by outcome (Validated, Fixed, Discarded, In review) and export everything to CSV or JSON.',
    ] },
    { h: 'Dashboard: what it measures and how it’s computed', p: [
      'Total questions: number of interactions logged in the audit.',
      'Grounding rate = answers with at least one valid source ÷ total × 100. How well the copilot stays anchored to sources.',
      'Escalation rate = below-threshold answers (in review) ÷ total × 100.',
      '% validated = validated answers ÷ actually-reviewed answers × 100 (also the centre of the “Validation outcomes” donut).',
      'Time saved = total questions × 15 estimated minutes of manual search avoided ÷ 60 = hours (the 15 min is a configurable parameter, MINUTES_SAVED_PER_QUERY).',
      'Corpus gaps = questions “without an adequate answer” (out-of-corpus or confidence < 60), aggregated by text with their frequency: the roadmap of what to add.',
      'Question volume: number of questions logged per month (vertical axis = monthly count, with a 0 baseline; Y labels on the left), over the last 12 months.',
      'All numbers are computed live from session/demo data: they are not fixed values.',
    ] },
    { h: 'Adoption-health dashboard (over time)', p: [
      'A complementary lens to the business KPIs: not "how well the tool answers" but "how much and how it is adopted".',
      'Active users (MAU) over time and 30/60/90-day retention (% of new users still active N days after first access).',
      'Activation funnel: Onboarded → first question → source consulted → validation. The stage with the biggest drop highlights where users get stuck.',
      'Cohort retention: for each signup cohort, the % of users still active month by month (heatmap).',
      'User segments (power / regular / occasional / dormant), friction points (ask but don’t validate, onboarded but never asked, inactive >30d) and adoption by team.',
      'SYNTHETIC user data for demo purposes: it shows the adoption-measurement pattern, not real people.',
    ] },
    { h: 'Note on data', p: [
      'The corpus is public + synthetic. No real Prima customer data. The POC demonstrates the pattern: with internal documents, securely, the behaviour is the same.',
    ] },
  ],
}
