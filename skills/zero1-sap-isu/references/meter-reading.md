# IS-U: letture (Meter Reading)

Convenzione: nessun segno = voce verificata; **INCERTO** = non verificata o fonti in disaccordo (confermare nel
sistema: SE93, SE11, SE37, SE18/SMOD). Letture a intervallo / profili EDM: vedi `estensioni.md`.

## 1. Concetti

| Concetto (EN) | Significato |
|---|---|
| Unità di lettura (Meter Reading Unit, MRU) | Gruppo di apparecchi letti insieme; riferimento per ordine, percorso e monitor |
| Portion | Raggruppa MRU con le stesse date di programmazione |
| Schedule record | Record di programmazione di una MRU: date di ordine/lettura/fatturazione e categoria di lettura prevista (il lettore predefinito e i moduli di stampa ordine si mantengono qui) |
| Percorso di lettura (Street route) | Ordina le letture; catena Città > Via > Civico (oggetto di allacciamento) > Ubicazione apparecchio > Apparecchio. MRU che condividono un percorso vanno allocate tra loro negli schedule record |
| Ordine di lettura (Meter Reading Order) | Uno per registro da leggere; assegnabile a lettore interno, esterno o cliente. Dal punto di vista dati è un record EABL in stato 0 |
| Motivo di lettura (MR Reason) | Perché si legge. Dai documenti: periodica, finale, subentro (move-in), installazione, intermedia con/senza fatturazione, di controllo. Valori numerici noti: 06 subentro, 03 cessazione (creati in automatico da move-in/out), 09 e 10 di controllo (non scatenate dalla fatturazione), 17 generato da storno lettura (EL37); gli altri numeri (es. 01 periodica) **INCERTO**: non nelle fonti, verificare in Customizing |
| Risultato di lettura (MR Result) | Valore letto; stato **Plausible** (passa la fatturazione) o **Implausible** (va corretto). Il consumo mostrato in inserimento è calcolato come differenza dalla lettura precedente: non è salvato (salvo QD durante la lettura, vedi sotto) |
| Plausibilità / validazioni | Ogni risultato è validato in inserimento; validazioni dipendenti e indipendenti definite in Customizing (Utilities > Device Management > Meter Reading > Validations); aggiungibili validazioni cliente |
| Stima / estrapolazione | Se manca la lettura reale si stima dal consumo di periodo (Period Consumption) o dalla procedura di estrapolazione; una lettura reale successiva più bassa di una stima fa ristimare le stime precedenti (assessing) |
| Assessing | Se V2 (da ultima lettura reale a ultima stimata) > V1 (da ultima lettura reale a lettura attuale) si ha overflow di stime: workflow ISU_ASSESS1 storna la fatturazione e ristima. Funziona solo dentro lo stesso contratto (non dopo un move-in/out). Flag «Ass. Control MR» in TE410s per estenderlo ai motivi 09/10 |
| Quantity Determination (QD) | Conversione della differenza di lettura in quantità fatturabile; «during billing» (classica) o «during meter reading» (richiede la business function ISU_QD_1 e l'impostazione in Customizing); in QD alla lettura il consumo è salvato e usato da billing |
| Registro a consumo / a domanda | Il consumo di periodo sostiene l'estrapolazione; per profili standard esiste invece l'usage factor (per impianto, aggiornato in billing, BAdI ISU_EDM_USAGEFACTOR) |

Canali di inserimento: upload da sistema esterno (MDE, IDoc/BAPI), fast entry (senza correzione immediata, oppure con
schermata di correzione), single entry (letture di controllo, intermedie, finali).

## 2. Transazioni

| Transazione | Funzione |
|---|---|
| EL01 | Creazione ordini di lettura periodici (programmazione) |
| EL06 | Creazione massiva ordini (repertorio terzo) |
| EL35 | Uscita/stampa ordini di lettura (non è il monitor) |
| EL28 | Inserimento singolo (single entry) |
| EL27 | Correzione risultati implausibili |
| EL29 | Correzione risultati plausibili |
| EL31 | Monitor manuale: per portion, MRU, partner commerciale, contratto, impianto, apparecchio, premise; liste di schedule record, ordini, risultati, ordini di fatturazione (liste riassunte per data, con drill-down). Vista anche dei risultati da IDoc (stato Plausible/Implausible/Error) |
| EL32 | Monitor automatico dei dati di lettura |
| EL37 | Storno lettura (genera un nuovo ordine, motivo 17, se il risultato QD viene annullato) |
| EL43 | Panoramica apparecchi di una MRU (Device Overview) |
| EL56 | Manutenzione del consumo di periodo |
| ELDM | Post-elaborazione IDoc di upload letture (categoria ISU_MR_UPLOAD) |
| IUPP | Log del processo di upload letture |

Altri codici EL* di repertori terzi non elencati qui: cercare in SE93/TSTCT con `EL*`.

## 3. Tabelle

| Tabella | Contenuto | Stato |
|---|---|---|
| EABL | Documento di lettura (MR Document); un ordine di lettura è un EABL in stato 0 | verificata |
| EABLG | Motivi di lettura legati al documento (non è la testata) | verificata come «MR reasons in MR document» |
| EASTL / EASTS | Struttura impianto a livello apparecchio / registro | verificate |
| ETDZ, EZWG | Registri installati, gruppo registri | verificate |
| TE410 (flag in TE410s) | Parametri tecnici di controllo dell'elaborazione dati di lettura (Customizing «Define Technical Control Parameters for Meter Reading Data Processing») | citata nel PDF Device Management come TE410s |
| Tabella unità di lettura / schedule record | non nelle fonti | **INCERTO** (cercare in SE11 con `TE42*`/`EMRU`, non confermato) |
| ETRG | Ordine di fatturazione (billing order), visibile da EL31 | verificata (repertorio) |

Chiavi di join a EABL (ANLAGE, EQUNR, ecc.): non verificate, **INCERTO**; usare i dati di EASTL e EGERH (vedi
`masterdata.md`) e verificare in SE11.

## 4. Exit, BAdI, enhancement (PDF Device Management)

| Enhancement | Uso | Stato |
|---|---|---|
| EDMMR001 | Sottoschermo e controllo campi nei risultati di lettura: aggiunge campi cliente alla tabella risultati | verificato |
| EDMMR002 | Cambio della gas date alla lettura; sostituito dal BAdI ISU_QD_GAS_DATE_CHANGE | verificato |
| EDMMR003 | Non citato nel PDF | **INCERTO**: solo repertorio terzo |
| EDMMRRES | Manipolazione dopo upload, prima della validazione | verificato |
| EDMFOLUP | Azioni di follow-up dopo i controlli di inserimento e la validazione delle letture caricate | verificato |
| EDMASSES | Controllo dei casi di assessing | verificato |
| EDMLSORT | Ordinamento personalizzato degli ordini di lettura | verificato |
| EDMLELHR / EDMLELAH / EDMLELHA / EDMLELHP | Estrapolazione: procedura cliente / confronto / stima / con consumo periodo artificiale | verificati (famiglia EDMLEL*) |
| EDMD1001 | Valori predefiniti e controlli per installazione, rimozione, sostituzione apparecchio (non è un exit di lettura vera e propria) | verificato |
| EDMEG901 | Codici ordine/notifica alla sostituzione | verificato |
| BAdI ISU_QD_PROC | Procedura QD (GET_LEADING_INSTALLATION, CHANGE_VALID_FROM_EADZ_QD) | verificato |
| BAdI ISU_EDM_USAGEFACTOR | Adegua l'usage factor | verificato |
| BAdI ISU_BENDEF_EPVG / ISU_BENDEF_WEIGHTING / ISU_GEWSCHL_EXTRAPOL / ISU_USE_EASTE | Pesatura utente e chiave di pesatura in estrapolazione/assessing | verificati; contenuto di EASTE **INCERTO** |

Funzioni correlate: ISU_EVENT_ASSESSING / ISU_ACTION_ASSESSING (assessing), ISU_INSTALLATION_INTERVALS (intervalli
impianti per QD). Parametro REMOVEF1D: rimozione/installazione a intervallo con un giorno nel futuro.

## 5. BAPI e IDoc di lettura

| Oggetto | Uso | Stato |
|---|---|---|
| BAPI_MTRREADDOC_UPLOAD (BOR MTRREADDOC, metodo Upload) | Carica o modifica risultati di lettura; IDoc ISU_MR_UPLOAD02 con segmenti E1BPEABLUCHANGE (modifica) ed E1BPEABLUUPDATE (aggiorna/inserisce); struttura BAPIEABLU | **INCERTO** sul comportamento: vedi sotto |
| BOR MeterReadingDocument.GetList | Selezione ordini e risultati | verificato |
| IDoc ISU_RPL_ORDER | Uscita ordini di sostituzione/lettura verso sistemi esterni | verificato |
| IDoc ISU_DEVICE_CHANGE | Entrata dati per installazione/rimozione/sostituzione (una lettura per azione) | verificato |

Disaccordo su BAPI_MTRREADDOC_UPLOAD (**INCERTO**): una fonte web lo descrive come «aggiorna ordini esistenti, non li
crea»; il PDF Device Management dice che col segmento *update*, se il risultato o l'ordine non è identificabile, il
sistema **crea** un nuovo ordine di lettura durante l'upload, mentre il segmento *change* modifica solo risultati
identificabili. Identificazione: ID interno dell'ordine oppure chiave alternativa (PoD + codice registro + data +
data ausiliaria MRDATEFORIDENTIF). Campi BAPIEABLU: MATERIAL, SERIALNO, REGISTER, MRREASON, MRIDNUMBER,
READINGRESULT, METERREADINGNOTE, ACTUALCUSTOMERMRTYPE, METERREADER, MRDATEFORBILLING, ACTUALMRDATE, MRDATEOFMAXIMUM,
SMORDER, ACTIVE. Il record entra se c'è lettura oppure nota. Prerequisito per i cambi: Customizing «Define Change
Process for Meter Reading Data». Confermare in SE37 prima di scriverci codice.

## 6. Procedura: lettura scartata o bloccata dalla plausibilità

1. **Trova la lettura**: `EL31` per MRU/portion, contratto, impianto, apparecchio o premise; leggi stato (Plausible /
   Implausible / Error) e ordine di fatturazione collegato. Per letture da upload: `ELDM` e log `IUPP`.
2. **Stato Error (IDoc)**: da EL31 si apre l'inserimento singolo; controlla nel log IUPP il messaggio (apparecchio,
   registro o motivo non identificabili, campo obbligatorio mancante).
3. **Stato Implausible**: apri `EL27`; guarda quale validazione ha fallito. Il consumo mostrato è la differenza dalla
   lettura precedente: confronta con consumo di periodo (`EL56`) e con la tolleranza della validazione.
4. **Valida in Customizing**: Device Management > Meter Reading > Validations (e validazioni cliente in Tools >
   System Modification). Se la validazione è corretta, la lettura è sbagliata: chiedi riletture; se è troppo
   stretta, è una questione di Customizing (non cambiare per un solo caso).
5. **Decidi**: correggi il valore, oppure conferma come plausibile se verificato; se serve verifica in campo, crea ordine
   di correzione o lettura di controllo con dati aggiornati (indicata anche con motivo 09/10). Per sovrascrivere una
   lettura già plausibile usa `EL29` o l'upload di tipo change.
6. **Dopo la correzione**: controlla che l'ordine di fatturazione non sia bloccato (EL31, vista ordini di fatturazione)
   e rilancia la fatturazione (vedi `billing.md`).
7. **Se compaiono stime incongruenti**: caso assessing (V2 > V1): workflow ISU_ASSESS1; non vale dopo un cambio contratto.
   Per annullare una lettura con QD usa `EL37`.
8. **Se qualcosa non torna con lo standard**: cercare exit attivi (EDMMR001, EDMMRRES, EDMFOLUP, EDMASSES) in CMOD/SMOD
   e validazioni cliente prima di concludere a un errore.

## Fonti

- SAP Help, «Device Management» (meter reading, validazioni, upload): https://help.sap.com/docs/SAP_ERP/acf8f8e0bda645638370c385f572c6a9/4190d0533f8e4308e10000000a174cb4.html
- SAP Help, «EL01 e stato EABL 0»: https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183738.html
- Meter reading status (blog): https://sapisurdg.wordpress.com/2022/06/11/meter-reading-status/
- Elenco transazioni IS-U (repertorio): https://www.dan852.com/page/sap-transactions-is-u/
- Descrizione tabelle EABL/EABLG (repertorio): https://leanx.eu/sap/table/eabl/
- Titoli SAP: «SAP Help – Device Management», «IS-U Release Notes ECC 6.0»
