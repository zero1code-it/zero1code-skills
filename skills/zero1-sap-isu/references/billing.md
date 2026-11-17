# Billing e invoicing IS-U (fatturazione, tariffe, indagine errori)

Legenda: nessun segno = verificata; **INCERTO** = non verificata o fonti in disaccordo; *(solo fonti terze)* = trovata
solo su repertori non SAP (elenco transazioni dan852, leanx, blog). Quasi tutte le transazioni `EA*` vengono
dall'elenco di transazioni dan852 (estratto da un sistema reale): conferma sempre con SE93.
Vale per ECC 6.0 e S/4HANA Utilities salvo diversa indicazione. Custom (varianti Z, exit, eventi) non coperto.

## 1. Catena di determinazione

Ordine logico (impianto verso il calcolo):

1. **Impianto (installation)** (ES31/ES32): porta la *rate category* (categoria tariffa) e i dati tariffari propri.
2. **Rate category** (EA53/EA54/EA55): classifica l'impianto ai fini della fatturazione; contiene uno **schema** valido
   e determina i controlli di outsorting.
3. **Billing schema** (EA35/EA36/EA37): sequenza di tariffe/variant da eseguire.
4. **Rate** (tariffa) (EA30/EA31/EA32): contiene gli step di calcolo; ogni step è eseguito da un **variant program**.
5. **Step + variant + operandi**: il variant legge/scrive *operandi* (EA50/EA51/EA52) con valori (facts, prezzi).
6. **Rate determination** (EA87): rate category + **rate type** (EA56) determinano la tariffa applicata.

Ordine di creazione consigliato (da thread community, *solo fonti terze*): rate type, tariffa (+facts), schema (con la
tariffa), rate category (con lo schema), rate determination, poi assegna la rate category all'impianto (ES31).
Fatturare «senza apparecchio» richiede un rate type ammesso per facts, non per registro.

| Concetto | Significato | Transazione |
|---|---|---|
| Rate type (tipo tariffa) | Classifica registri, flat rate o valori di riferimento; con la rate category fa scegliere la tariffa | EA56 |
| Rate category (categoria tariffa) | Classe di fatturazione dell'impianto + schema + controlli outsorting | EA53 |
| Billing class (classe di fatturazione) | Classifica gli impianti (residenziale, non residenziale...), validazione e statistica, determinazione MRU | **INCERTO**: transazione non indicata |
| Variant program | Funzione ABAP eseguita da uno step (es. QUANTI01 = quantità x prezzo) | EA88 |
| Operand | Nome simbolico di input/output dei variant, raggruppati in operand category | EA50 |
| Facts (rate fact group) | Valori degli operandi, validi nel tempo; livelli installation, rate category, rate | ES31/ES32 (impianto) |

**Precedenza dei facts**: impianto > rate category > tariffa (il livello più specifico vince). *(solo fonti terze)*

## 2. Transazioni di configurazione tariffe

| Transazione | Descrizione |
|---|---|
| EA53 / EA54 / EA55 | Crea / modifica / mostra rate category |
| EA56 | Mantieni rate type |
| EA30 / EA31 / EA32 | Crea / modifica / mostra tariffa (rate) |
| EA35 / EA36 / EA37 | Crea / modifica / mostra schema |
| EA50 / EA51 / EA52 | Crea / modifica / mostra operando |
| EA87 | Rate determination *(solo fonti terze)* |
| EA88 | Mantieni variant program *(solo fonti terze)* |
| EA89 / EA90 / EA91 | Crea / modifica / mostra prezzo (price) *(solo fonti terze)* |
| EA92 | Mantieni price adjustment clause |
| EA47 / EA48 / EA49 | Crea / modifica / mostra sconto/maggiorazione (discount/surcharge) |
| EA99 | «Eval. of Variants» (valutazione/documentazione dei variant) per dan852 e un blog; un post lo chiama «creazione variant»: la creazione è EA88. Uso come valutazione **INCERTO** |
| ES30 / ES31 / ES32 | Crea / modifica / mostra impianto (il contratto è ES20); una fonte isolata attribuisce ES30 al contratto, smentita dalle altre |

Dati tariffari a livello apparecchio/registro: **EG70** (cambia rate data; alias EC30), **EG71** (mostra, indica anche
la procedura QD). Distinzione: dati *multiple-installation* (validi per tutte le installazioni del registro) e
*installation-specific* (rate type, price class, flag non rilevante per billing). Dettagli in `meter-reading.md`.

## 3. Tabelle tariffarie e documenti

| Tabella | Contenuto | Stato |
|---|---|---|
| ETRF | Tariffe (rates) | *(solo fonti terze)* |
| ETRFV | Step di tariffa (rate steps) | *(solo fonti terze)* |
| TE221 | Operandi (non è una tabella tariffe) | *(solo fonti terze)* |
| ETTA / ETTAF | Rate category / facts | *(solo fonti terze)* |
| TE069 | Rate types | *(solo fonti terze)* |
| ETTIFN / ETTIFB | Installation facts (archiviazione ISU_FACTS) | verificata (RN ECC 6.0: ETTIFN/ETTIFB) |
| ETTIF | Installation facts | *(solo fonti terze)* |
| EPREIH / EPREI | Prezzi, storico / testata | *(solo fonti terze)* |
| ERTFND | Rate determination | *(solo fonti terze)*, nome **INCERTO** |
| EKDI | «Rate facts» secondo un blog | **INCERTO** |
| ESCHS | Schema (blog lo usa per testata e step) | **INCERTO** sulla distinzione |
| ETRG | Billing orders (non tariffe) | *(solo fonti terze)* |
| EITR | Billed ma non invoiced | *(solo fonti terze)* |
| EANLH | Storico impianto (campo industry + industry system) | verificata |
| TE503 | Impostazioni invoicing | verificata (RN) |

Documenti:

| Oggetto | Contenuto | Stato |
|---|---|---|
| ERCH | Testata billing document | verificata |
| ERCHC | Storico di storno/invoicing del billing document | *(solo fonti terze)* |
| ERCHZ | Righe del billing document (nome vecchio/variante) | **INCERTO** |
| DBERCHZ1..8 | Righe del billing document (per tipo riga) | *(solo fonti terze)* |
| ERCHO | Outsorting del billing document | *(solo fonti terze)* |
| ERDK | Testata print document (invoicing) | *(solo fonti terze)* |
| DBERDL / DBERDLB | Righe print document / riferimento billing-print | *(solo fonti terze)* |
| ERDZ | Righe print document: coincide o no con DBERDL | **INCERTO** |
| ERDO | Outsorting invoicing | *(solo fonti terze)* |
| ERDB | Documento FI-CA per print document | *(solo fonti terze)* |

Distinzione: il **billing document** (ERCH) contiene il calcolo; l'**invoicing** crea il **print document** (ERDK) con
numero univoco e la partita FI-CA (vedi `credit-fica.md`). Una correzione manuale genera un documento manuale.
Il «budget billing change» è trattato per legge come fattura. Easy bill correction: correzione a livello riga senza
stornare l'originale (dati in ERCH, BAdI per automazione).

## 4. Varianti e funzioni variante

- Il variant program è registrato in EA88; la funzione ABAP si chiama **ISU_\<variante\>** (es. ISU_COMPUT25 per la
  variante COMPUT25, input QPRICE e USERDEF, output QPRICE). Verificata su un'analisi pubblica di COMPUT25.
- Varianti custom: convenzione `ISU_Z...`, interfaccia con operandi in ingresso/uscita, variant controls, line item
  type *(solo fonti terze)*. Il prefisso `ISU_VAR_` **INCERTO**.
- Debug a livello di singolo step: nessuna fonte pubblica; serve il debugger ABAP sulla funzione ISU_<variante>.
- Per capire cosa fa uno step: EA99/EA22_TOOL (valutazione variant e dettaglio documento).

## 5. Fatturazione: transazioni

| Esigenza | Transazione |
|---|---|
| Test di fatturazione di un contratto (nessun salvataggio) | **EA00** |
| Fatturazione singola (menu individuale) | **EASIBI** *(solo fonti terze, citazione debole)* |
| Simulazione individuale / scenari | EASISI, EASIM, EASIM01 (backbilling e PE billing) |
| Fatturazione di massa (mass activity) | **EA38**; **EAMABI** (mass billing, accanto a EASIBI singola) *(solo fonti terze)* |
| Simulazione di massa | **EA39** |
| Crea bolletta singola / parziale | **EA19** / EA25 |
| Invoicing di massa (vecchio) / parziale / stampa / storno / storno completo | EA26 / EA27 / EA29 / EA33 / EA34 |
| Invoicing di documento | **EA10** (EA10_AGGRBILL aggregata, EA10_COLL collettiva) |
| Visualizza billing document | **EA22** (EA22_TOOL = billing tool) |
| Visualizza print document | **EA40** |
| Stampa fattura / collettiva / stampa massiva collettiva | EA60 / EA64 / EA58 |
| Log billing/invoicing | EABI |
| Correzione fattura (bill correction) | EABICO |
| Backbilling manuale (crea/cambia/mostra) | EA16 / EA17 / EA18 |

### Storni

| Storno | Transazione |
|---|---|
| Billing document | **EA20** |
| Storno di stampa/billing document | **EA13** (EA14) |
| Documenti di invoicing | **EA15** |
| Rettifica storni (adjustment reversal) | EA21 |
| Massivo billing / completo | EA33 / EA34 |

Regola: un documento manuale selezionato da solo non si fattura; si storna con EA15.

### Outsorting e validazioni

- **EA05** = Display and Release Outsortings (billing e invoicing) *(solo fonti terze)*. Tabelle ERCHO/ERDO.
- Gli outsorting nascono dai controlli definiti nella rate category e da exit di controllo (EBIA0003, EBIA0013).
- Errore tipico: «existing billing documents cannot be invoiced» = outsort non rilasciato, invoicing congiunto
  incompleto o documento manuale isolato.

### Piano acconti (budget billing, BB plan)

| Transazione | Descrizione |
|---|---|
| EA61 / EA62 / EA63 | Crea / modifica / mostra BB plan (EA63 NON è outsorting) |
| EA67 | Impostazioni BB plan |
| EA11 / EA12 | Invoicing acconti / richiesta importi acconti |
| EK93C / EK94C | Mostra / modifica congiunta di payment plan fatturati insieme |

Tabelle **EABP** (Budget Billing Plan, testata) ed **EABPS** (Sub-BB Plan) *(solo fonti terze: leanx)*. Non confonderle col piano rate FI-CA (FPR1-3, vedi `credit-fica.md`). Payment plan IS-U (EABPL, EK92-EK94): **INCERTO**, solo cenni.
Evento FI-CA R925 = data di modifica del BB plan al move-in (modulo ISU_SAMPLE_R925).

## 6. Indagare un errore di fatturazione (procedura)

Ordine di buona pratica; ogni transazione è verificata, la sequenza è di sintesi.

1. **Identifica oggetti e periodo**: contratto (ES20), impianto (ES32), rate category, periodo fatturato, MRU. Verifica
   che le date contratto/impianto/PoD siano allineate (causa frequente di errori).
2. **Leggi il log**: EABI (log billing/invoicing); per job massivi il log applicativo (SLG1) e, se usi BPEM, la lista
   casi EMMACL (vedi `estensioni.md`).
3. **Riproduci con EA00** (test senza salvataggio) sullo stesso contratto e periodo; poi EASISI/EASIM/EA39 per
   scenari e simulazioni di massa. Se EA00 dà un risultato diverso dal documento, è cambiato il dato dopo la fatturazione.
4. **Confronta operandi e dati tariffari**: rate category (EA55), tariffa (EA32), schema (EA37), operandi (EA52),
   rate determination (EA87), prezzi (EA91); facts dell'impianto in ES32, dati registro/apparecchio in EG71.
   Ricorda la precedenza facts: impianto > rate category > tariffa. Fatti archiviati sono visibili in ES32.
5. **Controlla letture e periodo**: documenti di lettura (EL31 monitor, EL28/EL29/EL27 correzione; tabelle EABL/EABLG),
   stime/estrapolazione, installazioni/rimozioni con buchi nel periodo (errore «variant incompatibility»),
   categoria TOU coerente con i registri («segment missing»), overflow del contatore (fatture altissime).
6. **Outsorting**: EA05 per vedere e rilasciare i documenti scartati (billing ed invoicing); tabelle ERCHO/ERDO.
7. **Esamina il documento**: EA22 / EA22_TOOL / EABICO per testata e righe; ERCH (testata), DBERCHZ* (righe) per lo
   step che produce l'importo; print document EA40, ERDK/DBERDL per l'invoicing.
8. **Varianti e custom**: step e funzione ISU_<variante> (EA88, EA99); cerca exit attive (EBIA00xx in CMOD),
   BAdI ISU_BI_*, eventi FI-CA su FQEVENTS (R4xx), varianti Z. Se il comportamento non torna con lo standard,
   la causa è spesso lì.
9. **Storno e rifattura**: EA20 (billing), EA13 (stampa), EA15 (invoicing); correzioni con EABICO; backbilling EA16-EA18.
   Poi rifattura con EA19 o EA38 e invoicing EA10; stampa EA60/EA64/EA58.

Prima di stornare (consiglio generale, non tratto dalle fonti, **INCERTO**): controlla che il documento non sia già stato contabilizzato/incassato (partite in FPL9) e non
abbia piani acconti collegati.

## 7. Estensioni di billing (riepilogo)

Exit SMOD: EBIA0001 (campi custom nel billing document), EBIA0002 (proration su date custom), EBIA0003 (check/overall
check), EBIA0005 (abort mass run), EBIA0006 (period control), EBIA0007/0008 (azioni nei reversal), EBIA0011 (update
billing), EBIA0013 (check in selezione), EBIA0015 (backbilling), EBIA0023 (check facts), EBIA0024 (operandi speciali),
EBIA0028 (facts custom), EBIS0001 (prezzi esterni), EBIS0007 (check prezzi), EBIC0001 (evaluation group storico consumi).
BAdI: ISU_BI_EASIM, ISU_BI_MASS_SIMUL, ISU_BI_BLOCK_BILLING, ISU_BI_ADV_PERIOD, ISU_BI_BBP_EXT_PER,
ISU_BI_BICO_ACTIONS, ISU_BI_BICO_DOC_SELECTION, ISU_BI_EBF_HEAD, ISU_BI_INSTGR. Dettaglio in `estensioni.md`.

## Fonti

- https://learning.sap.com/courses/configuring-billing-and-invoicing-in-sap-s-4hana-utilities/understanding-program-enhancements
- https://www.dan852.com/page/sap-transactions-is-u/
- https://sapisubilling.blogspot.com/2014/12/sap-isu-billing.html
- https://community.sap.com/t5/sap-for-utilities-discussions/sap-is-u-billing-without-devices/m-p/398240
- https://sapisurdg.wordpress.com/2012/08/27/analysis-of-variant-comput25/
- https://leanx.eu/sap/table/etrfv/
- Documento SAP «IS-U SAP Utilities, Release Notes ECC 6.0» (billing/invoicing, installation facts)
