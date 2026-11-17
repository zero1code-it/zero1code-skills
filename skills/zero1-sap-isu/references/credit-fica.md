# IS-U: Credit / FI-CA (Contract Accounts Receivable and Payable)

Convenzione: nessun segno = voce verificata su fonte SAP; **INCERTO** = non verificata o fonti in disaccordo (da
confermare nel sistema: SE93 transazioni, SE11 tabelle); *(solo fonti terze)* = presente solo in repertori o blog non
SAP. Valido per ECC 6.0 e S/4HANA Utilities salvo nota.

## 1. Concetti

| Concetto (EN) | Significato | Tabella / campo | Stato |
|---|---|---|---|
| FI-CA | Sottoledger di contabilità clienti per grandi volumi: registrazioni, pagamenti, solleciti, rate, cauzioni, chiusure. Alimenta la contabilità generale con record di totali | - | |
| Conto contrattuale (Contract Account) | Contiene condizioni di pagamento, procedura di sollecito, chiave interessi, blocchi; raggruppa i contratti IS-U | FKKVK (testata), FKKVKP (per partner); transazioni CAA1/2/3 | |
| Categoria del conto contrattuale | Classifica il conto | campo in FKKVK non verificato | **INCERTO** |
| Partner contrattuale (Contract Partner) | Il business partner nel ruolo FI-CA (ruolo MKK) | `FPP1` / `FPP2` / `FPP3` oppure `BP` | |
| Documento FI-CA | Registrazione a saldo zero: testata + posizioni. Posizioni: partite del business partner (con conto crediti/debiti), ricavi (con IVA), righe G/L (es. banca, imposte). Partite: aperte, chiuse, statistiche | - | |
| Testata documento | Tipo documento BLART, origine HERKF, chiave di riconciliazione FIKEY, area applicativa APPLK, riferimento XBLNR, date BLDAT/BUDAT/CPUDT | DFKKKO | |
| Partite BP | Chiave OPBEL (documento) + OPUPW (ripetizione) + OPUPK (posizione) + OPUPZ (sotto-posizione da compensazione parziale). Campi di analisi: GPART, VKONT, VTREF (rif. contratto), BUKRS, HVORG/TVORG, KOFIZ, BETRW/BETRH (importi), FAEDN (scadenza netta), STUDT (differimento) | DFKKOP | |
| Righe G/L del documento | Posizioni di contabilità generale | DFKKOPK | |
| Chiave principale / sottotransazione | HVORG (main transaction) e TVORG (subtransaction), 4 caratteri ciascuna: la natura economica della partita (es. credito da fatturazione consumi, spese da reso bancario) | DFKKOP-HVORG/TVORG | |
| Account determination | HVORG/TVORG + criteri come company code, divisione, KOFIZ (Account Determination ID) determinano conti G/L, ricavi e segno D/A. Customizing generale: `FQC0` | DFKKOP-KOFIZ | FQC0 *(solo fonti terze)* |
| Compensazione (clearing) | Non ha una tabella propria nelle fonti: lo stato è nei campi AUG* della partita. AUGST = vuoto aperta, 9 compensata; AUGDT data; AUGBL documento compensante (o documento di stampa); AUGBD data di registrazione; AUGRD motivo; AUGBT/AUGWA importo e valuta; XRAGL = compensazione stornata. Tabella storica dedicata: non trovata | DFKKOP | storico dedicato **INCERTO** |
| Restrizione di compensazione | AUGRS: es. 1 acconto da IS-U compensabile solo in invoicing; 2 cauzione non compensabile; 6 pagabile solo dopo richiesta budget billing; T solo via interfaccia esterna; W solo da account maintenance; Z solo dal payment program (lista completa su SE11, dominio AUGRS_KK) | DFKKOP | |
| Partita statistica | STAKZ: A richiesta acconto, G altro credito statistico (spese, interessi), H richiesta cauzione cash, I/J richiesta acconto/pagamento da invoicing, P voce del budget billing plan, R rata di piano rate, S voce fattura collettiva, Z richiesta pagamento. ASTKZ/ASBLG = chiave e documento della partita d'origine | DFKKOP | |
| Origine automatica | INTBU: A interessi di mora con compensazione, R spese di reso, B raggruppamento, G/F registrazione conseguente a reset di compensazione, I tassazione effettiva | DFKKOP | |
| Documento sostitutivo | ABWTP: R piano rate, S fattura collettiva, P promise to pay; ABWBL = documento sostitutivo | DFKKOP | |
| Chiave di riconciliazione | Raggruppa i documenti per il trasferimento alla G/L | DFKKKO-FIKEY | |
| Segmento (da ECC 6.0) | Campo SEGMENT su partite BP e righe G/L, derivato da company code, divisione, conto, HVORG/TVORG, profit center o evento 0081 | DFKKOP | |

## 2. Flusso IS-U -> FI-CA

1. **Fatturazione (billing)** produce il documento di billing (ERCH, vedi `billing.md`). Il documento FI-CA non nasce dal
   billing ma dall'**invoicing**, che crea la bolletta (print document) e il documento FI-CA. La **sequenza esatta**
   `EA19`/`EA10` -> documento FI-CA è **INCERTO**: `EA19` = Create Bill (creazione individuale), `EA10` = Document
   Invoicing; funzioni dell'invoicing `ISU_INV_UNIT_ACTION` e `ISU_INV_UPDATE`. Transazioni di invoicing lato FI-CA:
   `FKKINV_MA` (massa), `FKKINV_S` (individuale), `FKKINV_BW_*` (estrazione BW) *(solo fonti terze)*.
2. Gli **eventi di invoicing R4xx** (R402 estensione documento, R403 raggruppamento, R404 info sollecito, R405
   estensione partite, R417 scadenza bolletta, R420 settlement budget billing, R433 numerazione documenti) permettono
   di intervenire sul documento prodotto; vedi `estensioni.md` §7.
3. **Budget billing (piano acconti)**: le rate sono **richieste** registrate come partite statistiche (STAKZ P = voce del
   piano, Z = richiesta di pagamento); l'incasso è un acconto/pagamento in conto compensato dalla fattura finale
   (AUGRS 1 = acconto da IS-U compensabile solo in invoicing). `EA12` richiede gli importi, `EA11` fa l'invoicing degli
   acconti. Il meccanismo end-to-end (quali righe diventano partita aperta, quando) è **INCERTO** nei dettagli: la
   pagina SAP sul «payment scheme» descrive una variante statistica del budget billing; leggerla prima di affermare altro.
4. **Interessi, cauzioni, spese di sollecito e di reso** nascono in FI-CA come partite proprie (INTBU, STAKZ G/H).
5. **Piano acconti IS-U ≠ piano rate FI-CA.** Piano acconti = Budget Billing Plan: tabelle **EABP** (testata) ed
   **EABPS** (sub-piano) *(solo fonti terze)*, transazioni `EA61`/`EA62`/`EA63` (vedi `billing.md`). Piano rate FI-CA =
   rateizzazione di partite già aperte, transazioni `FPR1`/`FPR2`/`FPR3`, tabelle FKK_INSTPLN_HEAD / _HIST / _INVH.
   Le rate sostituiscono la partita originale in sollecito e payment run (ABWTP R, STAKZ R).

## 3. Transazioni per area

### 3.1 Visualizzazione e analisi

| Transazione | Funzione | Stato |
|---|---|---|
| FPL9 | Display Account Balance: saldo e partite del conto; navigazione a master, storia solleciti/resi/compensazioni, piani rate | |
| FPE3 | Display Document (FPE3S: documento di esempio) | *(solo fonti terze)* |
| FPO1 / FPO1P | Elenco partite aperte a data chiave / versione parallela (mass activity); FPO6 e FPO7 valutano i totali esportati | FPO1 *(solo fonti terze)*; FPO1P verificata |
| FPO4 | Item list (anche partite chiuse in un periodo); raggruppamento con preselezioni `FPSELP` | |
| FPM3 | Display Dunning History | |
| FPLKA | Valutazione dei blocchi di elaborazione | *(solo fonti terze)* |
| FPBN | Post-elaborazione conferme di saldo | |
| FPCOPARA | Stampa corrispondenza (lettere: solleciti, estratto conto, avviso interessi, avviso resi) | *(solo fonti terze)* |
| FPCC0029 | Crea estratto conto del partner | *(solo fonti terze)* |
| FPBW / FPCLBW | Estrazione BW partite aperte / partite in recupero | *(solo fonti terze)* |
| FP12, FPEDU | Nessuna fonte | **INCERTO** (non usare senza controllo in SE93) |

### 3.2 Registrazione, modifica, storno, compensazione

| Transazione | Funzione | Stato |
|---|---|---|
| FPE1 | Post Document | |
| FPE2 / FPE2M | Change Document / Mass Document Change | *(solo fonti terze)* |
| FP08 / FP08M | Reverse Document / Mass Reversal. Documento archiviato: lo storno crea nuove partite di segno opposto (RN ECC 6.0) | FP08M *(solo fonti terze)* |
| FP07 | Reset Clearing | *(solo fonti terze)* |
| FP06 | Account Maintenance: compensazione manuale; da ECC 6.0 anche modifica campi (struttura FKKOP_CHG: scadenze, metodo di pagamento, procedura e esclusione dal sollecito, chiave interessi, blocchi) e split di partite | |
| FPMA | Automatic Clearing (compensazione automatica; **non** è il lancio delle mass activity) | *(solo fonti terze)* |
| FPCB | Collective Bill | *(solo fonti terze)* |

### 3.3 Pagamenti

| Transazione | Funzione | Stato |
|---|---|---|
| FP05 | Process Payment Lot: lotto di incassi, assegnazione automatica via testo di pagamento (note to payee), compensazione. Stato lotto in DFKKZK-STAZS: vuoto = aggiungibile, 1 chiuso, 2 registrazioni pianificate, 3 incomplete, 4 registrato con post-elaborazione necessaria, 5 registrato, 6 lotto incompleto, 7 posting online in corso, 8 posting diretto fermato, 9 archiviato. Tabelle DFKKZK (testata, KEYZ1, conto banca di compensazione BVRKO) e DFKKZP (dati dei pagamenti) *(solo fonti terze)*. Report RFKKPLADJ corregge stati errati | |
| FPCPL | Chiarimento del lotto; FP05CLE = worklist; FPCRL = chiarimento resi; FPCRPO = chiarimento crediti | |
| FPB7 | Trasferimento da estratto conto elettronico (FF_5 importa in FI, FEBA lo mostra) verso lotto FI-CA | *(solo fonti terze)* |
| FPB17 | Trasferimento file MultiCash (report RFKKKA00 nelle RN) | FPB17 *(solo fonti terze)* |
| FPB5, FPB4 | Trasferimento lotto resi / gestione errori di trasferimento lotto | *(solo fonti terze)* |
| FPCJ | Cash Journal: cassa e sportello con contanti, assegno, carta, postal order; versamenti, prelievi, differenze; tabella DFKKCJT; eventi 6120, 6140, 6170 | |
| FPY1 | Payment Run / Debit Memo Run: selezione partite scadute, raggruppamento, metodo e banca, registrazione e compensazione | |
| FPAY1A / FPAY1B / FPAY2 | Payment specification (raggruppa partite con dati di pagamento per payment run o lotto); PDTYP in partita | |
| FPVZ | Importi di pagamento concordati | |
| FP09 | Returns: reso bancario, reset del pagamento o nuove partite derivate; spese di reso; lotto resi chiuso riaperto se si storna il reso; report RFKKRLCL elenca voci di chiarimento | |
| Mandati SEPA | Dati in partita: EMMND (ID mandato), PNNUM, PNHKF (origine pre-notifica: R1 = invoicing IS-U), PNEXD, PNCTR. Evento 0368 controlla il mandato nel sollecito. `FPDDAX` = notifica addebito diretto. Transazione di gestione dei mandati | FPDDAX *(solo fonti terze)*; transazione mandati **INCERTO** |

### 3.4 Solleciti

| Voce | Funzione | Stato |
|---|---|---|
| FPVA | Dunning Proposal Run: identifica partite, raggruppa, determina livello, spese | |
| FPVB | Dunning Activity Run: esegue le attività (lettera, spese, interessi, storia) | |
| FPVC | Dunning Reversal Run: lo storno dell'intera run; un'esecuzione FPVB non si cancella, si storna. Una proposta non eseguita si cancella da menu | |
| FPM3 | Storia dei solleciti | |
| Tabelle | FKKMAKO (testata storia, data esecuzione MDRKD), FKKMAZE (partite sollecitate). FKKMAKT = attività | FKKMAKT *(solo fonti terze)* |
| Procedura di sollecito | Livelli, intervallo minimo, importi minimi, spese/interessi, attività per livello; assegnata al conto contrattuale (MAHNV), override per partita. Limite % di aperto per livello (MINPZ_KK) | |
| Attività standard | Lettera, estratto conto, documento di blocco, richiesta cauzione, disattivazione piano rate, rilascio ad agenzia | |
| Sollecito -> distacco IS-U (`EC85`) | Fra i moduli IS-U dell'evento 0350 c'è un blocco apparecchio (ISU_DUNNING_BLOCK_DEVICE_0350) ma nessun modulo che crei un ordine di distacco; il collegamento va cercato in Customizing | **INCERTO** |
| Eventi | 0300 modifica proposta, 0301/0309 gruppi, 0303 blocco e procedura, 0335 riduzioni (dispute), 0350/0351 attività, 0370 interessi, 0391/0392 estensioni storia, 0395 storno | |
| Blocchi | Vedi §3.8 | |

### 3.5 Interessi, cauzioni, write-off, recupero, rate

| Transazione | Funzione | Stato |
|---|---|---|
| FPI1 | Calcolo interessi individuale (debit o credit items) | |
| FPINTM1 | Interest run di massa | FPINTM1 *(solo fonti terze)* |
| FPI4 | Visualizza interessi | *(solo fonti terze)* |
| Tabelle interessi | DFKKIH (storico), DFKKIAPT (log del run); report RFKKINT_MASS_LOG elenca i run; eventi 2000-2095; chiave interessi IKEY, blocco SPERZ | |
| FPSEC1 / FPSEC2 / FPSEC3, FPD2 | Cauzione: crea / modifica / mostra / panoramica. Richiesta cauzione cash = STAKZ H; non compensabile (AUGRS 2) | *(solo fonti terze)* |
| FP04 | Write-off (singolo o parziale; in massa esiste una versione, **FP04M** non confermata) | FP04 *(solo fonti terze)*; FP04M **INCERTO** |
| Doubtful items | INFOZ 901-904 sulla partita; rettifica di valore singolo | |
| FP03 | Invio all'agenzia di recupero (non sono i solleciti) | |
| FP03E / FP03F / FPAVI | Rilascio partite al recupero / lettura file agenzia / avviso di pagamento da agenzia | *(solo fonti terze)* |
| FPCI | **Conflitto**: le RN ECC 6.0 lo indicano come «Information for Collection Agencies»; un repertorio terzo come «BW extraction of cleared items». Preferire le RN, ma confermare in SE93 | **INCERTO** |
| FPR1 / FPR2 / FPR3, FPRH | Piano rate: crea / modifica-disattiva / mostra / panoramica; da ECC 6.0 pagatore alternativo e carta per rata. Può essere disattivato dal sollecito | |
| Promise to pay | Documento sostitutivo ABWTP = P; transazione dedicata | **INCERTO** |
| Dispute management | I casi riducono la base del sollecito (evento 0335, modulo FKK_SAMPLE_0335_DISPUTE) | |

### 3.6 Chiusure e integrazione con la G/L

| Transazione | Funzione | Stato |
|---|---|---|
| FPF1 / FPF2 / FPF3 | Crea / modifica / mostra chiave di riconciliazione | FPF1/FPF2 verificate; FPF3 *(solo fonti terze)* |
| FPG4 | Chiude automaticamente le chiavi di riconciliazione (report RFKKFIKEYCLOSE) | |
| FPG1 / FPG1M | Trasferimento dei record di totali alla G/L (report RFKKGL00) / versione di massa | |
| FPG2 / FPG2M, FPT1M | Riconciliazione con la G/L / controllo dei record di totali | |
| FPG8, FPG5 | Storno del trasferimento G/L / documenti FI-CA verso documenti FI-GL | *(solo fonti terze)* |
| FPYE1, FPRECL, FPW1 | Registrazioni di fine anno, riclassificazioni, valutazione in valuta estera | FPRECL verificata nelle RN; FPYE1 *(solo fonti terze)* |
| FPSCHEDULER | Esegue una mass activity | *(solo fonti terze)* |
| Log mass activity | Nome della transazione di log | **INCERTO** |

### 3.7 Eventi FI-CA

Transazione `FQEVENTS`; moduli di esempio FKK_SAMPLE_\<evento\> e ISU_SAMPLE_\<evento\>. Elenco, registrazione dei moduli
cliente (tabella TFKFBC) e criteri di scelta: `estensioni.md` §7.

### 3.8 Blocchi

| Voce | Funzione | Stato |
|---|---|---|
| Tipi | Sollecito, pagamento (entrata/uscita), interessi, compensazione, registrazione; a tempo e con storico utente | |
| DFKKLOCKS | Blocchi master e di processo: oggetto LOOBJ1, categoria oggetto LOTYP, processo PROID, motivo LOCKR, validità FDATE/TDATE | campi *(solo fonti terze)* |
| Sulla partita | MANSP (sollecito), SPZAH (pagamento), SPERZ (interessi), XMANL (escluso dal sollecito run), AUGRS (restrizione compensazione). Max 2 blocchi per categoria modificabili in `FP06`/`FPE2` | |
| Blocchi per preselezione | Impostati/rimossi su gruppi di partner o conti con le preselezioni `FPSELP` | |
| Transazione dedicata ai blocchi master | Nessuna confermata | **INCERTO** |

## 4. S/4HANA Utilities

- FI-CA resta il sottoledger di S/4HANA Utilities (registrazione, pagamenti, solleciti, piani rate, interessi, write-off,
  G/L, recupero crediti, promise to pay). Le transazioni `FP*` e le tabelle DFKKOP/DFKKKO risultano presenti in S/4;
  nessuna fonte elenca transazioni FI-CA rimosse: **INCERTO** voce per voce, testare con SE93.
- App Fiori per FI-CA (tutte descritte da un blog SAP Press; disponibilità on-premise/cloud non dichiarata):

  | App | Funzione | App ID |
  |---|---|---|
  | Manage Business Partner Master Data | crea/modifica/mostra il business partner | **INCERTO** |
  | Manage Contract Accounts | crea/modifica/mostra conti contrattuali | F5474A (help S/4HANA Cloud) |
  | Manage Business Partner Items | partite sui conti del partner | **INCERTO** |
  | Display Account Balance | saldo di un solo conto alla volta | **INCERTO** |
  | Manage Repayment Requests | richieste di rimborso | **INCERTO** |
  | Manage Installment Plans | crea piani rate | **INCERTO** |
  | Analyze Installment Plans | piani in scadenza, disattivati, in approvazione | **INCERTO** |

  Altre: Business Partner Financial Overview (con dati utilities); ruolo SAP_BR_APR_MANAGER_FICA. Gli ID non verificati
  si leggono nella Fiori Apps Reference Library o nell'help (vedi `ecc-vs-s4hana.md` §4 per gli ID delle app Utilities).

## 5. Procedura: «il cliente dice di aver pagato ma risulta aperto»

Ordine di buona pratica; le transazioni e i campi sono quelli verificati sopra, la sequenza è di sintesi.

1. Individua partner, conto contrattuale (VKONT) e contratto. `FPL9` sul conto, includendo le partite chiuse.
2. Cerca la partita contestata: aperta (AUGST vuoto) o chiusa (AUGST = 9)? Se chiusa, `FPE3` sul documento in AUGBL:
   è un incasso reale, una compensazione tra partite, un acconto?
3. Se aperta: cerca l'incasso nei lotti con `FP05` e `FPCPL` (importo, data, testo di pagamento, conto bancario del
   pagatore). Stato del lotto (DFKKZK-STAZS): 3, 4 o 6 indicano pagamento non registrato o non compensato.
4. Voci in chiarimento: incasso fermo sul conto bancario di compensazione o in worklist (`FP05CLE`, `FPCPL`), oppure
   assegnato a un altro partner/conto. Assegna e compensa (`FP06`).
5. Resi: un reso bancario (`FP09`, `FPCRL`) riapre la partita e crea spese; `FPL9` mostra il documento di reso.
6. Addebito diretto: se doveva pagare `FPY1`, controlla il documento di pagamento, la pre-notifica (XPYOR = Y) e il
   mandato SEPA (EMMND).
7. Blocchi: blocco di pagamento o compensazione sul conto o sulla partita (DFKKLOCKS, SPZAH, AUGRS) lascia l'incasso
   non assegnato.
8. Acconti e rate: l'incasso può aver compensato una rata (STAKZ R) o un acconto (AUGRS 1, compensabile solo in
   invoicing) e non la fattura: confronta gli importi.
9. Pagamento in cassa: controlla `FPCJ` e lo stato del lotto (chiuso e registrato).
10. Solleciti partiti dopo il pagamento: `FPM3`; storno con `FPVC`.
11. Se in FI-CA è a posto ma non in G/L: chiave di riconciliazione (`FPF3`, `FPG1`).
12. Chiudi con assegnazione manuale (`FP06`), chiarimento (`FPCPL`) o richiesta di rimborso; documenta con `FPCOPARA`.

## 6. Procedura: «perché è partito (o non è partito) il sollecito»

1. Prendi conto e partita: `FPL9`. Verifica scadenza (FAEDN) e eventuale differimento (STUDT) o rata (STAKZ R, ABWTP R):
   una rata o un differimento sostituiscono la partita originale.
2. Procedura di sollecito del conto (campo MAHNV del conto contrattuale in `CAA3`) ed eventuale override sulla partita.
3. Esclusioni sulla partita: MANSP (blocco sollecito), XMANL (escluso dal sollecito run), blocchi in DFKKLOCKS per
   conto/contratto (`FPLKA`); blocchi per preselezione (`FPSELP`).
4. Importi: minimo/massimo della procedura, limite % di aperto per livello, intervallo minimo fra solleciti, gruppi
   di sollecito (un sollecito per contratto o divisione).
5. Pagamenti: incasso in lotto non ancora registrato (stato lotto) o in chiarimento; un pagamento successivo alla
   proposta ma prima della FPVB.
6. Storia: `FPM3` (FKKMAKO, FKKMAZE): è già stato emesso un sollecito per quel gruppo? A che livello, in che data?
7. Esecuzione: data della proposta `FPVA` e della `FPVB`; la proposta non eseguita si cancella, un sollecito eseguito
   si storna con `FPVC`. Log e statistica della run.
8. Dispute: un caso in Dispute Management riduce la base (evento 0335).
9. Personalizzazioni: eventi sollecito (0300, 0303, 0304, 0351, 0395) in `FQEVENTS` e attività custom.
10. Per il blocco del contratto o il distacco dopo il sollecito: vedi §3.4 (collegamento **INCERTO**).

## Fonti

- «IS-U Release Notes ECC 6.0» (SAP), cap. 40.7 «Contract Accounts Receivable and Payable»: cassa, pagamenti, payment
  specification, solleciti, interessi, blocchi, write-off, chiusure, segmento.
- SAP Help, panoramica FI-CA: https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183821.html
- SAP Help, Dunning (transazioni, eventi): https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183392.html
- SAP Help, Payment lot functions: https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183287.html
- SAP Help, Integration FI-CA e G/L: https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362182687.html
- SAP Help, Interest calculation: https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183390.html
- SAP Help, Account balance display: https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362182788.html
- SAP Help, Invoicing (eventi R4xx): https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183381.html
- SAP Help, Payment scheme: https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183364.html
- SAP Help, S/4HANA Utilities: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/021b182b0c47416c8fafed67ebfd78a9/266dce53118d4308e10000000a174cb4.html
- SAP Help, Manage Contract Accounts (F5474A): https://help.sap.com/docs/s4hana-cloud-best-practices/contract-accounting-master-data-and-basic-functions-2ar-ph/display-and-change-contract-account
- SAP Learning, dunning: https://learning.sap.com/courses/implementing-sap-financial-contract-accounting/performing-dunning-by-dunning-procedure
- SAP Learning, FI-CA in S/4HANA Utilities: https://learning.sap.com/courses/discovering-business-processes-in-sap-s-4hana-utilities/using-the-functions-of-contract-accounts-receivable-and-payable
- SAP Press, app Fiori per contract accounting: https://blog.sap-press.com/sap-fiori-apps-for-contract-accounting-with-sap
- SAP Community, estratto conto elettronico in FI-CA: https://community.sap.com/t5/financial-management-blog-posts-by-members/fi-ca-simple-scenario-electronic-bank-statement-configuration-and-usage/ba-p/13280109
- Repertorio terzo, transazioni FI-CA (copia dell'help SAP): http://aboutsapfi.blogspot.com/2013/01/sap-fi-contract-accounts-receivable-and.html
- Repertori terzi, tabelle: https://leanx.eu/sap/table/dfkkop/ , https://leanx.eu/sap/table/dfkkko/ , https://leanx.eu/sap/table/dfkklocks/ , https://leanx.eu/sap/table/dfkkzk/
