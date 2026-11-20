---
runtime: 0.2.2-rc.1
aggiornata: 2026-11-08
---

# Guida a zero1code

zero1code è l'assistente di programmazione aziendale: un agente che legge e modifica i file dei tuoi progetti, esegue comandi e cerca sul web, usando i modelli del gateway aziendale. Questa guida è anche quella che usa l'agente: puoi sempre chiedergli «Come si fa…?».

Supporto: **supporto@zero1code.it**

Le novità di ogni versione sono nel riquadro «Novità» del pannello «Guida».

## Accesso, account e credito

- Al primo avvio accedi con l'account aziendale: si apre il browser per l'SSO.
- In fondo alla barra laterale c'è la riga dell'account: email, credito residuo («NN% di credito», con la data di rinnovo) oppure «Credito illimitato».
- **Esci** ti disconnette senza chiudere l'app; al centro compare «Accedi a zero1code» con il pulsante **Effettua il log-in**.
- Se compare «Quota di richieste esaurita.» il credito è finito: attendi il rinnovo o scrivi al supporto.
- Se l'account non è abilitato ai modelli, l'app te lo dice all'accesso: chiedi l'abilitazione al supporto.

## Aree di lavoro

- Un'area di lavoro è una cartella del computer, di solito un progetto: l'agente lavora sui file che contiene.
- Per crearne una: il **+** accanto ad «Aree di lavoro» nella barra laterale, oppure **Nuova area di lavoro** nella schermata iniziale.
- Nella schermata iniziale il selettore accanto alla casella di testo indica in quale area parte la nuova conversazione: finché non ne scegli una non puoi scrivere.
- «Elimina area di lavoro» toglie l'area dall'elenco: la cartella e i suoi file restano sul disco.

## Conversazioni (sessioni)

- **Nuova sessione** apre una conversazione nuova nell'area scelta.
- Nella barra laterale le sessioni sono raggruppate per area di lavoro. Il campo «Cerca nei nomi delle sessioni» cerca solo nei titoli, non nel testo dei messaggi.
- In «Opzioni di visualizzazione» puoi raggruppare (per area, ad albero o in un unico elenco), ordinare (manuale o per ultimo aggiornamento) e scegliere cosa vedere: «Nascondi archiviate», «Tutte le conversazioni» o «Solo archiviate».
- Sul menu di ogni sessione: **Rinomina**, **Fissa**, **Archivia** / **Ripristina**, **Dirama sessione** (una copia da cui proseguire in un'altra direzione), **Copia ID sessione**. Le sessioni non si cancellano: si archiviano.
- Nel menu «Altre azioni» della conversazione: «Scarica il registro della sessione» e «Copia la sessione come Markdown».
- Su ogni risposta: copia, «Risposta buona» / «Risposta scadente», «Cita il testo» (seleziona un pezzo e citalo nel messaggio) e «Dirama in una nuova conversazione».
- Durante il lavoro la conversazione mostra le «Cose da fare» dell'agente, le «Attività in background» e i subagenti che ha avviato.
- Per un argomento nuovo apri una nuova sessione: l'agente lavora meglio con un contesto pulito.

## Scrivere all'agente

- Descrivi il risultato che vuoi come lo chiederesti a un collega: contesto, file coinvolti, cosa vuol dire «finito». Per lavori lunghi procedi a passi e controlla ogni passo.
- Digita **/** per i comandi, le skill e i subagenti; digita **@** per citare file e cartelle, altre sessioni o subagenti.
- Allegati: trascina file, cartelle o immagini nella casella («Trascina qui file o immagini per aggiungerli») oppure usa il pulsante «Aggiungi file o esegui comandi». Immagini PNG, JPG, WebP e GIF, fino a 20 per messaggio e 50 MB l'una.
- Mentre l'agente lavora puoi scrivere ancora: **Accoda messaggio** lo manda quando ha finito, **Indirizza messaggio** (Ctrl+Invio) lo corregge subito; «Interrompi la generazione» lo ferma. Il comportamento predefinito si sceglie in Impostazioni → Generali, «Comportamento dell'invio durante l'esecuzione».

### Modalità e permessi

- Accanto all'area di lavoro, sopra la casella, scegli la **modalità**: «Modalità Standard» per lavorare sul codice, «Guida» per le domande su come si usa zero1code, «Modalità Creator» per creare plugin. Con «Mostra la vista di programmazione» (Impostazioni → Generali) compaiono anche le modalità più tecniche.
- Nella casella di testo scegli la **modalità di accesso**: «Sola lettura», «Scrittura nell'area di lavoro» o «Accesso completo»; «Revisione automatica» (sperimentale) lascia valutare le richieste a un revisore automatico. Il predefinito per le nuove sessioni è in Impostazioni → Generali, «Permessi».
- Quando l'agente chiede un permesso rispondi con **Rifiuta**, **Consenti una volta**, **Consenti** o **Consenti sempre**.
- Se l'agente ti fa una domanda compare una scheda con le opzioni (quella «Consigliata» è evidenziata), **Salta** e **Avanti**. In modalità piano il piano proposto si **Approva**, si **Rifiuta** o si chiede di cambiarlo con **Richiedi modifiche**.
- Con un obiettivo attivo (`/goal`) la barra «Obiettivo» permette di metterlo in pausa, riprenderlo, modificarlo o cancellarlo.

### Pannello a destra

- Il pulsante in alto a destra apre il pannello laterale con le schede **File**, **Terminale** e **Browser** («Nuova scheda» per aggiungerne). Mostra l'anteprima di PDF, documenti Office, fogli Excel, HTML e Markdown.
- «Rivedi le modifiche di questo turno» mostra cosa ha cambiato l'agente; «Apri in…» apre file e cartelle nel tuo editor.

### Comandi principali

- `/model` — scegli il modello per questa conversazione.
- `/compact` — compatta la parte più vecchia della conversazione (come «Compatta ora»).
- `/plan` — entra o esci dalla modalità piano: l'agente prima propone un piano, poi lavora.
- `/goal` — imposta o mostra l'obiettivo di un'attività lunga.
- `/permission` — cambia il livello dei permessi (cosa l'agente può fare da solo e cosa deve chiederti).
- `/export` — scarica il log della sessione come archivio ZIP.
- `/feedback` — registra un feedback su questa sessione.

## Modelli e ragionamento

- Il selettore del modello è nella casella di testo. Il menu ha due colonne: **Modello** e **Livello**.
- Il livello di ragionamento (dove il modello lo offre) decide quanto l'agente pensa prima di rispondere: più alto vuol dire risposte più ponderate ma più lente e costose. I livelli segnalati come pesanti consumano molti più token e credito.
- Modelli, limiti e livelli li decide il gateway aziendale. Se un modello abilitato non è configurato del tutto, l'app non lo propone e all'accesso mostra l'elenco: segnalalo al supporto.

## Conversazioni lunghe e «Compatta ora»

- Ogni modello ha una finestra di contesto limitata. Nella casella di testo c'è un indicatore di quanto è pieno il contesto: cliccandolo trovi **Compatta ora**.
- «Compatta ora» riassume la parte più vecchia della conversazione e libera spazio. È disponibile quando l'agente è fermo e la casella del messaggio è vuota.

## Skill

- Una skill è una procedura pronta che l'agente carica quando serve: uno stile aziendale, una checklist, un modo di lavorare.
- Il pannello **Skill** nella barra laterale mostra le skill installate e il catalogo: attivi e disattivi ciascuna con l'interruttore e ne installi dal catalogo. Con **Crea skill** scegli «Scrivila tu», «Importa una cartella» o «Falla scrivere all'agente». Quelle con l'etichetta «Predefinita» arrivano con l'app (se le togli non tornano); quando un aggiornamento ne aggiunge o ne cambia una, all'apertura successiva una finestra «Skill nuove e aggiornate» (o la finestra «Novità») te lo segnala una volta.
- Puoi anche richiamarle con **/** nella casella di testo.

## Plugin

- Il pannello **Plugin** nella barra laterale mostra i plugin installati e permette di aggiungerne di terze parti (npm, Git o cartella locale). Installa solo plugin di cui ti fidi.
- Sempre in **Plugin**, «Impostazioni dei plugin integrati» regola subagenti, ciclo dell'agente e shell.

## Attività di automazione

- Il pannello **Attività di automazione** nella barra laterale serve a programmare lavori che l'agente esegue da solo a orari stabiliti.
- **Nuova** chiede come crearla: «Crea in una sessione» (la descrivi all'agente) o «Crea manualmente».
- L'elenco si filtra per Tutte, Attiva, In pausa, Terminata; ogni attività si può mettere in pausa, riprendere o eseguire subito («Esegui ora»).

## Ricerca sul web

- L'agente cerca sul web e legge pagine quando gli serve: nella conversazione compaiono come «Ricerca sul web» e «Visita di pagine web». Non c'è niente da attivare.

## Impostazioni

- Si aprono da **Impostazioni** in fondo alla barra laterale.
- Tre sezioni: **Generali**, **Modelli** (solo consultazione: li gestisce il gateway) e **Preset di agente**.
- In Generali: «Permessi» predefiniti, «Lingua» (italiano o inglese), «Aspetto» (Chiaro, Scuro, Sistema), «Dimensione del carattere», «Dettagli del lavoro», compressione dei dettagli, «Mostra la vista di programmazione» (traiettoria e differenze del codice), «Scorciatoie da tastiera» («Modifica le scorciatoie»), «Apri i link della chat in», «Comportamento dell'invio durante l'esecuzione», «Prestazioni e utilizzo» e «Versione attuale».
- Scorciatoie utili: Ctrl+, apre le Impostazioni, Ctrl+O aggiunge un'area di lavoro.

## Aggiornamenti

- Quando c'è una versione nuova l'app la scarica e mostra **Aggiorna**; poi **Installa e riavvia**.
- Dopo un aggiornamento, al primo avvio, compare «Novità di zero1code» con i cambiamenti principali; la stessa lista è nel riquadro «Novità» del pannello «Guida».

## Disinstallazione

- Durante la disinstallazione l'app chiede se togliere solo il programma o anche i dati (conversazioni e impostazioni).

## Problemi frequenti

- **Non riesco a scrivere**: scegli un'area di lavoro, oppure accedi se compare «Accedi per scrivere.».
- **L'area di lavoro non si crea o la cartella scelta non viene accettata**: spesso è l'«Accesso controllato alle cartelle» di Sicurezza di Windows, che protegge Documenti, Desktop e Immagini (anche sotto OneDrive) e blocca le app che non conosce. Scegli una cartella fuori da quelle, per esempio `C:\Users\<nome>\progetti`, oppure chiedi all'IT di consentire zero1code in Sicurezza di Windows → Protezione da virus e minacce → Protezione ransomware → «Consenti un'app tramite Accesso controllato alle cartelle».
- **Non vedo un modello**: non è abilitato per il tuo account o non è configurato sul gateway; scrivi al supporto.
- **«Compatta ora» è grigio**: aspetta che l'agente finisca e svuota la casella del messaggio.
- **Il credito è finito**: attendi il rinnovo indicato nella riga dell'account o scrivi al supporto.
