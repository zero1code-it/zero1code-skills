# Glossario IS-U: italiano / inglese SAP / nome tecnico

Come si usa: la colonna «Tedesco / nome tecnico» riporta il nome di campo o tabella come compare nei file di questa
cartella (spesso derivato dal tedesco: ANLAGE, VSTELLE, VKONT). Se la voce è vuota, il nome non è nelle fonti: cercarlo
in SE11. **INCERTO** = nome o significato da confermare nel sistema. Dettagli e fonti nei file di area indicati.

## Master data (`masterdata.md`)

| Italiano | Inglese SAP | Tedesco / nome tecnico | Note |
|---|---|---|---|
| Partner commerciale | Business Partner (BP) | PARTNER, GPART; BUT000, EKUN | In S/4 obbligatorio (CVI); transazione `BP` |
| Conto contrattuale | Contract Account | VKONT (VKONTO in EVER); FKKVK, FKKVKP | CAA1/2/3 |
| Contratto | IS-U Contract | EVER | ES20/21/22 |
| Impianto | Installation | ANLAGE; EANL, EANLH | ES30/31/32 |
| Divisione (servizio: luce, gas, acqua) | Division | SPARTE | Campo in EANL |
| Immobile / unità | Premise | VSTELLE; EVBS | ES60/61/62 |
| Oggetto di allacciamento | Connection Object | HAUS; EHAUISU | ES55/56/57 |
| Ubicazione apparecchio | Device Location | IFLOT (PM) | Corrisponde alla functional location PM |
| Apparecchio / contatore | Device (Equipment PM) | EQUNR; EQUI, EGERS | IQ01 |
| Categoria dell'apparecchio | Device category | MATERIAL (materiale) | |
| Numero seriale | Serial number | SERIALNO (campo BAPI) | Con il materiale identifica l'apparecchio |
| Registro | Register | ETDZ; LOGIKNR (apparecchio) | Contatore logico dentro l'apparecchio |
| Registro logico / gruppo registri | Logical register / Register group | EZWG | EG60/EG61 |
| Struttura impianto | Installation structure | EASTL, EASTS | Apparecchi e registri installati |
| Punto di prelievo / riconsegna | Point of Delivery (PoD) | EUIHEAD, EUITRANS, EUIINSTLN | Campi INT_UI/EXT_UI **INCERTO** |
| Subentro | Move-in | | `EC50E` |
| Cessazione | Move-out | | `EC55E` |
| Distacco | Disconnection | | Documento di distacco EC85/86/87 |
| Cambio fornitore | Switching (IDE) | | Vedi `estensioni.md` |
| Device information record | Device information record | EGERR **INCERTO** | EG44/EG41/EG43 |

## Letture (`meter-reading.md`)

| Italiano | Inglese SAP | Tedesco / nome tecnico | Note |
|---|---|---|---|
| Unità di lettura | Meter Reading Unit (MRU) | | Tabella **INCERTO** (cercare TE42*/EMRU) |
| Portion | Portion | | Raggruppa MRU con le stesse date |
| Record di programmazione | Schedule record | | |
| Percorso di lettura | Street route | | Città > Via > Civico |
| Ordine di lettura | Meter Reading Order | EABL (stato 0) | EL01, EL35 |
| Documento di lettura | MR Document | EABL | |
| Motivo di lettura | MR Reason | MRREASON; EABLG | Periodica, finale, subentro... |
| Risultato di lettura | MR Result | | Plausible / Implausible |
| Plausibilità | Plausibility check | | Validazioni in Customizing |
| Inserimento / correzione lettura | MR entry / correction | | EL28; EL27 (implausibili), EL29 (plausibili) |
| Monitor letture | MR monitor | | EL31 manuale, EL32 automatico |
| Stima / estrapolazione | Estimation / extrapolation | | |
| Consumo di periodo | Period consumption | | EL56 |
| Determinazione quantità | Quantity Determination (QD) | | Durante billing o durante la lettura |
| Caricamento letture (upload) | MR upload | | BAPI_MTRREADDOC_UPLOAD, IDoc ISU_MR_UPLOAD02 |
| Ordine di fatturazione | Billing order | ETRG | Visibile da EL31 |

## Billing / fatturazione (`billing.md`)

| Italiano | Inglese SAP | Tedesco / nome tecnico | Note |
|---|---|---|---|
| Tariffa | Rate | ETRF | EA30/31/32 *(solo fonti terze)* |
| Categoria tariffa | Rate category | ETTA | EA53/54/55 |
| Tipo tariffa | Rate type | TE069 | EA56 |
| Classe di fatturazione | Billing class | | Tabella **INCERTO** |
| Schema di fatturazione | Billing schema | ESCHS **INCERTO** | EA35/36/37 |
| Operando | Operand | TE221 | EA50/51/52 |
| Programma variante | Variant program | | EA88 |
| Facts (fatti tariffari) | Rate facts | ETTIF, ETTIFN, ETTIFB | Archiviazione ISU_FACTS |
| Prezzo | Price | EPREI, EPREIH | EA89/90/91 |
| Sconto / maggiorazione | Discount / surcharge | | EA47/48/49 |
| Documento di fatturazione | Billing document | ERCH; righe DBERCHZ1..8 | |
| Fatturazione (calcolo) | Billing | | EA38 massa, EASIBI singola |
| Simulazione | Billing simulation | | EA00, EASISI, EA39 |
| Bolletta (emissione) | Bill / Invoicing | ERDK (print document) | EA19 singola; EA10 Document Invoicing |
| Documento di stampa | Print document | ERDK; righe DBERDL | |
| Storno | Reversal | ERCHC | EA13, EA20 |
| Outsorting | Outsorting | ERCHO (billing), ERDO (invoicing) | EA05 rilascio |
| Piano acconti | Budget Billing Plan | EABP, EABPS | EA61/62/63; non è il piano rate FI-CA |
| Richiesta acconti | Budget billing request | | EA12; invoicing acconti EA11 |
| Evento di invoicing | Invoicing event | | R4xx |

## FI-CA / credito (`credit-fica.md`)

| Italiano | Inglese SAP | Tedesco / nome tecnico | Note |
|---|---|---|---|
| Contabilità contrattuale | Contract Accounts Receivable and Payable (FI-CA) | | Sottoledger |
| Documento FI-CA (testata) | FI-CA document header | DFKKKO | BLART, HERKF, FIKEY |
| Partita | Business partner item | DFKKOP; OPBEL, OPUPK | |
| Riga G/L | G/L item | DFKKOPK | |
| Tipo documento | Document type | BLART | |
| Chiave principale / sottotransazione | Main / subtransaction | HVORG / TVORG | |
| Determinazione conti | Account determination | KOFIZ | FQC0 *(solo fonti terze)* |
| Compensazione | Clearing | AUGST, AUGBL, AUGDT | AUGST 9 = compensata |
| Partita aperta | Open item | AUGST vuoto | |
| Partita statistica | Statistical item | STAKZ | |
| Chiave di riconciliazione | Reconciliation key | FIKEY | FPF1/FPF2/FPF3, FPG4 |
| Trasferimento alla G/L | Transfer to G/L | | FPG1 |
| Lotto pagamenti | Payment lot | DFKKZK, DFKKZP | FP05 |
| Chiarimento | Clarification | | FPCPL |
| Reso (storno bancario) | Return | | FP09 |
| Sportello / cassa | Cash desk / cash journal | DFKKCJT | FPCJ |
| Pagamenti in uscita / addebiti diretti | Payment run / debit memo run | | FPY1 |
| Mandato SEPA | SEPA mandate | EMMND | Transazione **INCERTO** |
| Sollecito | Dunning | FKKMAKO, FKKMAZE | FPVA/FPVB/FPVC/FPM3 |
| Procedura di sollecito | Dunning procedure | MAHNV | |
| Interessi | Interest | DFKKIH | FPI1, FPINTM1 |
| Chiave interessi | Interest key | IKEY | |
| Cauzione | Security deposit | | FPSEC1/2/3 *(solo fonti terze)* |
| Piano rate | Installment plan | FKK_INSTPLN_HEAD | FPR1/2/3 |
| Differimento | Deferral | STUDT | |
| Write-off | Write-off | | FP04 *(solo fonti terze)* |
| Agenzia di recupero | Collection agency | | FP03; FPCI **INCERTO** |
| Blocco (sollecito, pagamento, interessi, compensazione) | Business lock | DFKKLOCKS; MANSP, SPZAH, SPERZ | |
| Fattura collettiva | Collective bill | ABWTP = S | FPCB |
| Promise to pay | Promise to pay | ABWTP = P | Transazione **INCERTO** |
| Procedura di rimborso | Repayment request | | App Fiori Manage Repayment Requests |
| Mass activity | Mass activity | | FPSCHEDULER *(solo fonti terze)* |
| Evento FI-CA | FI-CA event | TFKFBC (moduli cliente) | FQEVENTS |

## BPEM, IDE/IDEX, EDM, estensioni (`estensioni.md`)

| Italiano | Inglese SAP | Tedesco / nome tecnico | Note |
|---|---|---|---|
| Gestione eccezioni di processo | Business Process Exception Management (BPEM) | | Casi: EMMAC1/2/3, lista EMMACL |
| Caso di chiarimento | Clarification case | | Esce da errori di billing, letture, IDE, FI-CA |
| Scambio dati intercompany | Intercompany Data Exchange (IDE) | | IDEX = enhanced, namespace /ISIDEX/ |
| Fornitore di servizi | Service provider | EEDMIDESERVPROV01/02/03 | *(solo fonti terze)* |
| Gestione dati energetici | Energy Data Management (EDM) | | EEDM00..EEDM12 |
| Profilo di misura / valori profilo | Profile / profile values | | Upload EEDMIMP01/02 |
| Exit (CMOD/SMOD) | Customer exit | | SE19 per BAdI |
| BAPI documento FI-CA | BAPI_CTRACDOCUMENT_CREATE | | RecKeyInfo = chiave di riconciliazione |

## Mercato italiano (`italia.md`)

| Italiano | Inglese / sigla | Nome tecnico | Note |
|---|---|---|---|
| POD / PDR | Punto di prelievo (elettrico) / di riconsegna (gas) | EUIHEAD (PoD) | Mappatura su PoD IS-U in `italia.md` |
| SII | Sistema Informativo Integrato | | Flussi con operatori |
| Voltura / subentro | Change of customer / move-in | | EC50E per il subentro |
| Morosità | Arrears (TIMOE elettrico, TIMG gas) | | Delibere ARERA, da verificare |
| Maggior tutela / STG | | | Delibere ARERA, da verificare |

## ECC vs S/4HANA (`ecc-vs-s4hana.md`)

| Italiano | Inglese SAP | Nome tecnico | Note |
|---|---|---|---|
| Interaction Center Utilities | Utilities for Customer Engagement | | Sostituisce CIC0/EC20 |
| Quadro cliente (ECC) | Customer Interaction Center | CIC0 | Non esiste in S/4 |
| Business Partner unico | Customer-Vendor Integration (CVI) | | Obbligatorio in S/4 |
| Contratto di vendita utilities | Utilities sales contract | | Migrazione con CRMS4_IU_CM_CONTRACT_MIGRATION |
| Convergent Invoicing | S/4HANA for Convergent Invoicing | | Rapporto con BRIM **INCERTO** |
| Elenco semplificazioni | Simplification List | | Note SAP indicate nel file |
