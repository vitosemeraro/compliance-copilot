// Contenuti bilingue per onboarding, documentazione e comando /chat.

// Domande demo casuali per il comando "/chat" — coprono i vari comportamenti:
// grounded alta confidenza, escalation, guardrail, fuori-corpus.
export const RANDOM_QUESTIONS = {
  it: [
    'Possiamo usare i dati storici dei sinistri per personalizzare il premio RC Auto?',
    'Il CAP di residenza è ammesso come variabile di pricing RC Auto?',
    'Possiamo usare il genere dell’assicurato come fattore tariffario?',
    'Per quanto tempo conserviamo la documentazione KYC dei clienti cessati?',
    'Qual è il periodo di conservazione delle registrazioni delle chiamate di vendita inbound?',
    'Quali obblighi antiriciclaggio si applicano alle polizze vita?',
    'Che informazioni dobbiamo dare al cliente sui fattori che incidono sul premio?',
    'Un cliente può opporsi a una decisione totalmente automatizzata sul suo preventivo?',
    'Quali sono gli obblighi di valutazione di adeguatezza per i prodotti IBIP?',
    'La nazionalità può essere usata come variabile nel pricing?',
    'Come trattiamo i dati biometrici raccolti in fase di onboarding?',
    'Qual è il diritto di recesso per una polizza connessa a un finanziamento?',
    'Possiamo usare il quartiere di residenza per differenziare il premio?',
    'Per quanto va conservata la documentazione contrattuale e di sinistro?',
  ],
  en: [
    'Can we use historical claims data to personalise the motor liability premium?',
    'Is the residential postal code allowed as a motor pricing variable?',
    'Can we use the policyholder’s gender as a rating factor?',
    'How long do we retain KYC documentation for closed clients?',
    'What is the retention period for inbound sales call recordings?',
    'Which anti-money-laundering duties apply to life policies?',
    'What information must we give the customer about the factors affecting the premium?',
    'Can a customer object to a fully automated decision on their quote?',
    'What suitability assessment duties apply to IBIP products?',
    'Can nationality be used as a pricing variable?',
    'How do we process biometric data collected during onboarding?',
    'What is the withdrawal right for a loan-linked policy?',
    'Can we use the residential neighbourhood to differentiate the premium?',
    'How long must contract and claims documentation be retained?',
  ],
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
      'Scrivi la domanda nella barra in basso e premi Invio (o il pulsante →).',
      'Scrivi /chat e premi Invio per inserire una domanda di esempio casuale, diversa ogni volta, pronta da inviare.',
      'Cambia lingua (IT/EN) dal selettore in alto a destra: il copilota risponde nella lingua della domanda.',
    ] },
    { h: 'Leggere la risposta', p: [
      'La risposta è una “Bozza assistita da AI — da validare”.',
      'Il badge Confidenza indica quanto le fonti coprono la domanda. Verde = alta; ambra = sotto soglia (richiede revisione).',
      'I numeri colorati nel testo sono citazioni: cliccali per evidenziare la fonte corrispondente e leggerne lo snippet originale nel pannello a destra.',
      'Nel pannello Fonti compaiono solo le fonti effettivamente citate. Le policy interne sono marcate FITTIZIO (dati sintetici dimostrativi).',
    ] },
    { h: 'Validare (human-in-the-loop)', p: [
      'Registra l’esito della revisione: Valida, Da correggere o Scarta. L’esito resta tracciato nell’audit trail.',
      'Usa 👍/👎 per dare un feedback rapido sulla qualità della risposta.',
    ] },
    { h: 'Confidenza bassa ed escalation', p: [
      'Se la confidenza è sotto la soglia (default 60), la risposta è marcata “richiede revisione”.',
      'Compare un banner di copertura insufficiente e il pulsante “Invia a revisione esperto”.',
    ] },
    { h: 'Guardrail anti-discriminazione', p: [
      'Se la domanda o la risposta contengono variabili sensibili o proxy (es. CAP, genere, nazionalità, etnia), scatta un warning di non-discriminazione (IVASS).',
      'La risposta procede ma resta segnalata: i termini rilevati sono mostrati nel banner.',
    ] },
    { h: 'Audit trail', p: [
      'Ogni interazione è registrata in modo immutabile (catena di hash SHA-256, verificata a schermo).',
      'Puoi cercare per domanda/utente, filtrare per esito ed esportare tutto in CSV o JSON.',
    ] },
    { h: 'Dashboard adoption', p: [
      'KPI principali: domande totali, tasso di grounding, tasso di escalation, % validate, tempo risparmiato stimato.',
      'Grafici: andamento domande, esiti di validazione, top temi richiesti e lacune del corpus (la roadmap di cosa aggiungere).',
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
      'Type your question in the bottom bar and press Enter (or the → button).',
      'Type /chat and press Enter to insert a random sample question, different each time, ready to send.',
      'Switch language (IT/EN) from the top-right toggle: the copilot answers in the question’s language.',
    ] },
    { h: 'Reading the answer', p: [
      'The answer is an “AI-assisted draft — to be validated”.',
      'The Confidence badge shows how well the sources cover the question. Green = high; amber = below threshold (needs review).',
      'The coloured numbers in the text are citations: click them to highlight the matching source and read its original snippet in the right panel.',
      'The Sources panel shows only the sources actually cited. Internal policies are tagged FICTITIOUS (synthetic demo data).',
    ] },
    { h: 'Validate (human-in-the-loop)', p: [
      'Record the review outcome: Validate, Needs fixing or Discard. The outcome stays logged in the audit trail.',
      'Use 👍/👎 for quick feedback on answer quality.',
    ] },
    { h: 'Low confidence and escalation', p: [
      'If confidence is below the threshold (default 60), the answer is flagged “needs review”.',
      'An insufficient-coverage banner and a “Send to expert review” button appear.',
    ] },
    { h: 'Anti-discrimination guardrail', p: [
      'If the question or answer contains sensitive variables or proxies (e.g. postal code, gender, nationality, ethnicity), a non-discrimination warning is raised (IVASS).',
      'The answer proceeds but stays flagged: the detected terms are shown in the banner.',
    ] },
    { h: 'Audit trail', p: [
      'Every interaction is logged immutably (SHA-256 hash chain, verified on screen).',
      'You can search by question/user, filter by outcome and export everything to CSV or JSON.',
    ] },
    { h: 'Adoption dashboard', p: [
      'Key KPIs: total questions, grounding rate, escalation rate, % validated, estimated time saved.',
      'Charts: question volume, validation outcomes, top requested topics and corpus gaps (the roadmap of what to add).',
    ] },
    { h: 'Note on data', p: [
      'The corpus is public + synthetic. No real Prima customer data. The POC demonstrates the pattern: with internal documents, securely, the behaviour is the same.',
    ] },
  ],
}
