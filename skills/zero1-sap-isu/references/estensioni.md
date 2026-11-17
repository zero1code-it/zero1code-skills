# BPEM, IDE/IDEX, EDM, BAPI, exit, BAdI, eventi FI-CA

Legenda: nessun segno = verificata; **INCERTO** = non verificata o fonti in disaccordo; *(solo fonti terze)* = solo
repertori non SAP. Per ogni nome: conferma in SE93 (transazioni), SE37 (moduli/BAPI), SMOD/CMOD (exit), SE18/SE19 (BAdI).
Valido per ECC 6.0 e S/4HANA Utilities salvo note.

## 1. BPEM (Business Process Exception Management)

EMMA = Enhanced Message Management Analysis; l'estensione è stata rinominata BPEM. Gestisce **casi di chiarimento**
(clarification case) generati da errori di processo (billing, letture, IDE, FI-CA), assegnati ad agenti e chiusi
manualmente o con *solution process* automatici. In S/4HANA il **Backlog Reduction Engine** è sostituito da BPEM.

| Transazione | Descrizione | Stato |
|---|---|---|
| EMMAC1 | Crea caso di chiarimento manuale | BPEM Implementation Guide (help.sap.com) |
| EMMAC2 / EMMAC3 | Modifica / mostra caso | come sopra |
| EMMACL | Lista casi | come sopra |
| EMMACLS | Lista casi con shortcut | come EMMAC1 |
| EMMACAP | Esegue solution process automatici | come EMMAC1 |
| EMMA | Classico (sostituito da EMMAJP); nelle RN ECC 6.0 indica valutazioni FI-CA «enhanced message management» | verificata come nome |
| EMMAJP | Process jobs (preparazione e gestione job) | come EMMAC1 |
| EMMAJL / EMMAJLGEN / EMMALOG | Lista job / rigenera selection screen / messaggi | come EMMAC1 |
| FPEMMAMA | Mass activity BPEM (preparazione job, generazione casi) | come EMMAC1 |
| EMMACAT* (categorie di caso) | Creazione/modifica/mostra categorie, transport; nome esatto (EMMACAT1.. o EMMACCAT) | **INCERTO** |

Concetti: *case category* (categoria di caso), business process, sweeper (categorie generiche, es. business process
EMMACAS2), solution process, job di analisi.

Tabelle: EMMA_HDR (testata job), EMMA_RUNID, EMMA_JOBRUNIDMSG, EMMA_CASE (testata caso), EMMA_CACTOR, EMMA_COBJECT,
EMMA_CMSG_LINK, EMMA_CSOLP, EMMA_INT.

BAPI: BAPI_EMMA_CASE_CREATE / CHANGE / GET_DETAIL / ACCEPT / FORWARD / BACK_TO_QUEUE / REOPEN / CANCEL / COMPLETE /
CONFIRM; BAPI_EMMA_JOB_CREATE / PREPARE / GENERATE_CASES / EXECUTE_PROCESS / DELETE_CASES / DEL_PREPARATION.

BAdI: EMMA_CASE (classico, metodo DETERMINE_CASE), BADI_EMMA_JOB_ANALYSIS, BADI_EMMA_CASE,
BADI_EMMA_CASE_TRANSACTION, BADI_EMMA_CASE_WORK_LIST, BADI_EMMA_JOB_WORK_LIST, ISU_*_KPI_PROCESS. Logging:
EMMA_LOG_PROCESS_START / END / MSG_WRITE / CHECK_ACTIVE.

Nota: il Master Guide SAP for Utilities cita BPEM solo come concetto (assegnazione di casi agli agenti nel processo
Measurement Data Processing); i nomi sopra vengono dalla BPEM Implementation Guide.

## 2. IDE / IDEX (cambio fornitore, scambio dati)

Solo concetti; **nessuna procedura end-to-end verificata** (formati EDIFACT/UTILMD, mapping IDoc: **INCERTO**).

| Voce | Descrizione | Stato |
|---|---|---|
| Service provider (fornitore di servizi) | Anagrafica degli attori di mercato (fornitore, gestore rete) | EEDMIDESERVPROV01/02/03 crea/modifica/mostra *(solo fonti terze)* |
| Service type (tipi servizio) | Definizione tipi servizio e controllo processo, servizi propri/di terzi fatturabili e non | EIDESERV1..5 *(solo fonti terze)* |
| Assegnazioni service provider | Area operativa, rate category, certificazione | EIDESP1/2/3 *(solo fonti terze)* |
| Comunicazione service provider | | EIDECOM1/2 *(solo fonti terze)* |
| Grid | Crea rete | EEDMIDE_GRID01 *(solo fonti terze)* |
| Monitor documenti di switch | | ESWTMON01 *(solo fonti terze)* |
| Switch document | Documento di cambio fornitore; testata **EIDESWTDOC**; altre: EIDESWTDOCSTEP, EIDESWTMSGDATA, EIDESWTMSGDATACO, EIDESWTDOCATTR, EIDESWTDOCREF; archiviazione ISU_SWTDOC; autorizzazione E_SWTDOC | verificata (RN ECC 6.0) |
| IDEX | Enhanced Intercompany Data Exchange, namespace `/ISIDEX/` (transazioni /ISIDEX/B0xx) | *(solo fonti terze)* |
| Processi base data exchange | **CHCD_OUT** (cambio dati master PoD in uscita), **REQ_CHANGE** (richiesta cambio dati PoD in ingresso; il task può riferire BP, impianto, contratto, conto, premise, apparecchio, oggetto di allacciamento) | verificata |
| Format module | ISU_COMPR_VDEW_UTILMD_CHCD_OUT / _IN (modelli; VDEW_UTILMD solo per test) | verificata |
| Report | REE_DATEX_AGGREGATE_IDOCS (aggrega e invia), REE_DATEX_MON_AGGREGATE_IDOCS (monitor), REDEREGPARA_001 | verificata |
| Transazioni IDEX di fatturazione | ETHI (postazione aggregata), ETHI_DIS (ALV DFKKTHI), EPLOT (rimborso payment on account), IUEEDPPLOTAALC2/5 (distribution lot) | verificata (RN) |
| Eventi IDE | R205 (metodo rimborso), R207 (gruppo aggregazione, modulo ISU_SAMPLE_R207), R252/R253 (controlli distribution lot) | verificata |
| BAdI IDE | ISU_DATEX_CONNECT (DATEXCONNECT_POD_CHANGED), ISU_IDE_COMM_SWT (dialog identificazione PoD), ISU_IDE_SWT_ARCHIVE (ANALYSE_SWITCHDOC) | verificata |
| BOR | ISUSWITCHD (CreateFromMsg, IdentifyPODDialog), ISUPOD (UtilPoD.SetPODDescription) | verificata |
| EDATEX | Standard EDI utility in Europa | **INCERTO** |

In S/4HANA 2025 il market process management è nel core; per l'Italia vedi `italia.md`.

## 3. EDM (Energy Data Management)

Gestisce profili, letture a intervallo, import/monitor/calcolo e billing con profili e Real-Time-Pricing.

| Transazione | Descrizione | Stato |
|---|---|---|
| EEDM00..EEDM12 | EDM frame, profili, testata, assegnazione, PoD (EEDM09 crea, EEDM10 modifica, EEDM11 visualizza), operand-profile role (EEDM12) | *(solo fonti terze)* |
| EEDM09 | Crea Point of Delivery | verificata (RN) |
| EEDMIMP01/02, EEDMEXP01/02 | Upload / download valori profilo (via PoD / per profilo) | *(solo fonti terze)* |
| EEDMCOPY01/02 | Copia file valori profilo | *(solo fonti terze)* |
| EEDMFACTORCALC, EEDMFICALC01 | Calcolo fattori / formula instance | *(solo fonti terze)* |

Altri fatti: archiviazione **ISU_PROFV** (profili/valori profilo); report REEDMFICALC_DEL_RUN_CONTR_DATA (cancella run
di calcolo formula); BAdI ISU_EDM_FORMPROF (CHANGE_STATUS_FLAGS), ISU_EDM_USAGEFACTOR (usage factor); settlement:
REEDMSETTLPROC_VV2_SYNTH_GRP, REEDMSETTLPROC_FINSETTL_GRP (procedura base VV2_SYNTH); exit EEDMFO01, EEDMPI01 (prima
dell'update valori profilo in import), EEDMPRF1, EEDMUFA1, EEDMUI01..04. BAdI OData: ISU_UMC_EDM (enhancement spot
ISU_UMC_ODATA).
Tabella dei **valori profilo**: nome **INCERTO**, nessuna fonte pubblica.

## 4. BAPI e moduli principali

| Nome | Uso | Stato |
|---|---|---|
| BAPI_ISUMOVEIN_CREATEFROMDATA | Crea move-in: contratto per impianto, conto, BP, letture. Non gestisce BB plan, service order, welcome letter, deposito cauzionale, print action records; richiede IS-U nello stesso sistema | verificata (help.sap.com «Move-In Transactions») |
| ISU_MOVE_IN_BAPI_GET_DEFAULTS | Valorizza i parametri import del BAPI di move-in | verificata |
| BAPI_ISUACCOUNT_CREATEFROMDATA / CHANGE / GETDETAIL / GETLIST | Conto contrattuale | verificata |
| BAPI_MTRREADDOC_UPLOAD (BOR MeterReadingDocument.Upload) | Upload/modifica risultati lettura, IDoc ISU_MR_UPLOAD02 (segmenti E1BPEABLUCHANGE, E1BPEABLUUPDATE). Il segmento di update crea l'ordine se manca (PDF SAP Device Management); un post community dice che aggiorna soltanto ordini esistenti: **INCERTO**, fonti in disaccordo | verificato il nome, comportamento INCERTO |
| BOR MeterReadingDocument.GetList | Seleziona ordini e risultati di lettura | verificata |
| BAPI_CTRACDOCUMENT_CREATE | Crea documento FI-CA (parametro RecKeyInfo, chiave di riconciliazione) | verificata |
| BAPI_ISULOT_INS_SAMPLE_DEVICES | Campioni apparecchi (lotti) | verificata |
| BAPI_WASTEWEIGHING_DOWNLOAD / _UPLOAD | Pesatura rifiuti offline | verificata |
| IDoc ISU_DEVICE_CHANGE | Dati esterni verso installazione/rimozione/sostituzione apparecchio | verificata |
| IDoc ISU_RPL_ORDER | Uscita ordini di sostituzione/lettura | verificata |
| BAPI_ISUPARTNER_* | Il BP in IS-U è il BP standard (BAPI_BUPA_*); BOR ISUPARTNER esiste (metodo Check Credit) | BAPI_ISUPARTNER_*: **INCERTO** |
| FKK_FUNC_MODULE_DETERMINE | Verifica i moduli di un evento FI-CA | *(solo fonti terze)* |
| Famiglia ISU_S_* | Nessun modulo verificato | **INCERTO** |

## 5. Exit SMOD/CMOD

| Area | Exit | Stato |
|---|---|---|
| Billing | EBIA0001..EBIA0030, EBIS0001..0010, EBIC0001 (vedi `billing.md` §7) | verificata |
| Letture | EDMMR001 (campi custom nei risultati), EDMMR002 (gas date; sostituito dal BAdI ISU_QD_GAS_DATE_CHANGE), EDMMR003 (consumo periodo), EDMMRRES (modifica letture all'upload prima della validazione), EDMFOLUP (follow-up), EDMASSES (assessing), EDMLSORT (ordinamento ordini) | verificata (EDMMR003: solo repertorio exit) |
| Estrapolazione/validazioni | EDMLELHR, EDMLELAH, EDMLELHA, EDMLELHP, EDMLELDV, EDMLELDE, EDMLELSV, EDMLELKP, EDMLELIP | verificata |
| Apparecchi | EDMD1001 (default/check install/removal/replace), EDME10L1 (default alla creazione device), IQSM0008 (check material+serial), EDMEG901 (codici ordine/notifica alla sostituzione), EDMLOT01 (lotti) | verificata |
| Move-in | ECSBTI01..04, EC500001, ECSBTIO1, EMDBP003 (default EC60) | verificata |
| Conto/BP | EMDCA001 (subscreen conto), EMDBP001..005 (BP, duplicate check) | verificata |
| Billing/prezzi esterni | EBIS0001, EBIS0007 | verificata |
| Non esistono | EMRD0001, EDMLELIG (refusi probabili; per EDMLELIG esiste EDMLELIP) | **INCERTO** |
| Altro | EBIA0001 va usato per campi custom nel billing document | verificata |

## 6. BAdI

| BAdI | Uso | Stato |
|---|---|---|
| ISU_BI_EASIM, ISU_BI_MASS_SIMUL, ISU_BI_BLOCK_BILLING, ISU_BI_ADV_PERIOD, ISU_BI_BBP_EXT_PER, ISU_BI_BICO_ACTIONS, ISU_BI_BICO_DOC_SELECTION, ISU_BI_EBF_HEAD, ISU_BI_INSTGR | Billing (cerca con SE18 `ISU_BI*`) | verificata |
| ISU_QD_PROC | Quantity determination (GET_LEADING_INSTALLATION, CHANGE_VALID_FROM_EADZ_QD) | verificata |
| ISU_QD_GAS_DATE_CHANGE | Cambio gas date alla lettura (sostituisce EDMMR002) | verificata |
| ISU_AMI_DISCONNECT | Validazione di disconnessione/riconnessione remota AMI | verificata |
| ISU_BENDEF_EPVG, ISU_BENDEF_WEIGHTING | Pesatura utente | verificata |
| ISU_GEWSCHL_EXTRAPOL, ISU_USE_EASTE | Chiave pesatura in estrapolazione/assessing | verificata |
| ISU_EDM_USAGEFACTOR, ISU_EDM_FORMPROF | Usage factor, profili formula | verificata |
| ISU_FACTS_ARCHIVE | Controlli archiviazione installation facts | verificata |
| CRMS4_IU_CM_INTEGRATION (spot CRMS4_IU_CM_PROCESS_FRAMEWORK) | Integrazione contratto di vendita utilities in S/4 CE | verificata |
| ISU_MR_HISTORY_QUERY (enhancement spot) | Storico letture | verificata solo da snippet: **INCERTO** |
| Waste: ISU_WA_BILLING, ISU_WA_ELOC, ISU_WA_SERVICE_FREQ | Rifiuti | verificata |

Clean Core (S/4HANA): FQEVENTS e BAdI classici sono «level B», i BAdI kernel «level A»; SAP indica BAdI specifici come
sostituti futuri degli eventi (SAP Learning).

## 7. Eventi FI-CA (FQEVENTS)

- **FQEVENTS** mostra gli eventi e i moduli standard, industry e customer. I moduli cliente si registrano in
  Customizing («Define Customer-Specific Function Modules», tabella **TFKFBC**); si possono avere più moduli per
  evento (prima industry, poi custom).
- Moduli di esempio: **FKK_SAMPLE_\<evento\>** (es. FKK_SAMPLE_0505, FKK_SAMPLE_6120, FKK_SAMPLE_6140,
  FKK_SAMPLE_0335_DISPUTE, FKK_SAMPLE_0617_PAYMENT_LOCKSV) e **ISU_SAMPLE_\<evento\>** (function group E21U; es.
  ISU_SAMPLE_R925, R205, R207). Verificati nelle RN ECC 6.0.
- Eventi di invoicing «Rxxx»: R402, R403, R413, R431, R433, R469/R470/R471 (reversal); budget billing R950..R955,
  R974..R995, EINA0001, EA610002.
- Eventi numerici citati nelle RN: 0062, 0064, 0073, 0081, 0208, 0242, 0262, 0296, 0300, 0335, 0336, 0351, 0505,
  0606-0609, 0616-0618, 0650, 0655 (FKK_BLACKLIST_0655), 1210, 1219, 2418-2425 (IDoc/XI documenti), 4500-4504, 4600,
  5057, 5502, 5514, 6120, 6140, 9563. L'evento «0010»: **INCERTO**.

## 8. Dove agganciare una personalizzazione (senza modificare lo standard)

1. Cerca prima un **evento FI-CA** (FQEVENTS) se il processo tocca contabilità, invoicing, solleciti, pagamenti.
2. Per billing, letture, apparecchi: **exit SMOD** (CMOD attiva) o **BAdI** del dominio (tabelle §5-6).
3. Per tariffe: **variant program custom** (EA88, funzione `ISU_Z...`) e **operandi custom**, non patch al codice.
4. Per errori da gestire a mano: **BPEM** con categoria di caso propria e BAdI BPEM, non report ad hoc.
5. Per integrazioni: **BAPI**/IDoc standard (move-in, conto, letture); in S/4 i BAdI di CRMS4_IU_CM_*.
6. Dove cercare: SE18/SE19 (BAdI), SMOD/CMOD (exit), SE37 (moduli), FQEVENTS (eventi), SE84/SE24 per classi.
7. Documenta e versiona ogni aggancio; prima di concludere che è un bug standard, cerca enhancement già attivi.

## Fonti

- https://learning.sap.com/courses/configuring-billing-and-invoicing-in-sap-s-4hana-utilities/understanding-program-enhancements
- https://help.sap.com/doc/c6d6a233e1a546a38ff4388f12c28438/6.0/en-US/BPEM_Implementation_Guide_v2%203.pdf
- https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183468.html
- https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183378.html
- https://www.dan852.com/page/sap-transactions-is-u/
- http://pavelgk.pbworks.com/All+User+Exits+CMOD-SMOD
- https://leanx.eu/sap/table/eideswtdoc/
- Documenti SAP «IS-U SAP Utilities, Release Notes ECC 6.0» e «SAP Help – Device Management»
