# Mercato italiano: SII, ARERA, POD/PDR

> **Panoramica — tutte le voci da verificare sulle fonti ufficiali; non è consulenza normativa.**

Stato per voce: «da verificare» = controllare sul testo vigente; «**INCERTO**» = fonte debole o non letta.
Le pagine ARERA hanno date di aggiornamento diverse: usare sempre la versione vigente del testo integrato.

## 1. SII (Sistema Informativo Integrato)

| Voce | Contenuto | Stato |
|---|---|---|
| Natura | Istituito presso Acquirente Unico con legge 13 agosto 2010 n. 129; gestisce i flussi informativi fra operatori dei mercati elettrico e gas secondo le regole ARERA. Portale: https://siiportale.acquirenteunico.it/ | Finalità verificata; dettagli operativi da verificare |
| Registro | RCU (Registro Centrale Ufficiale) dei punti di prelievo/riconsegna | da verificare |
| Processi citati | Switching (elettrico: flusso «SWITCHING SE», fonte terza), voltura (gas: VTG «Attivazione Contrattuale Voltura Gas»), pre-check (corrispondenza POD e dati cliente), settlement, accreditamento utenti, popolamento RCU gas | da verificare |
| Attivazione, cessazione, misure | Nomi dei flussi e tracciati non estratti (pagine Acquirente Unico non leggibili in ricerca) | **INCERTO** |

## 2. Testi integrati ARERA

| Sigla | Oggetto | Riferimento | Stato |
|---|---|---|---|
| TIV | Vendita elettricità di ultima istanza: maggior tutela per i vulnerabili, servizio a tutele graduali (STG) | Del. 362/2023/R/eel, versione aggiornata 2026 | da verificare |
| TIVG | Vendita gas (non è il TIV) | Del. 100/2023/R/com | da verificare |
| TIMOE | Morosità elettrica | Del. 258/2015/R/com | da verificare |
| TIMG | Morosità gas | ARG/gas 99/11 | da verificare |
| TIF | Fatturazione | Del. 463/2016/R/com, versione dal 1 gen 2026 | da verificare |
| Bolletta 2.0 | Criteri di trasparenza delle bollette (Allegato A) | Del. 501/2014/R/com; revisione 637/2022/R/com (29 nov 2022). Decorrenza di una bolletta «riconfigurata» dal 1 lug 2025: solo fonte non ufficiale | Delibere verificate; decorrenza **INCERTO** |
| TIS | Settlement elettrico: obblighi informativi di distributori, Terna e SII | ARG/elt 107/09; il documento letto era una proposta di delibera | Ruolo verificato; testo vigente da verificare |
| TISIND | Indennitario | Del. 593/2017/R/com, versione dal 24 mar 2026 | da verificare |
| Altri | TIME 616/2023/R/eel (misura); TIQV (qualità vendita, dal 1 gen 2026); TIRV 228/2017/R/com; TIAO 102/2022/R/com; Codice di condotta commerciale 366/2018/R/com (dal 1 nov 2026); TIDE 227/2025/R/eel; bonus sociale 63/2021/R/com; TIT | Esistenza verificata (elenco ARERA, 17 nov 2026); contenuto da verificare |

## 3. POD e PDR

- **POD**: codice del punto di prelievo elettrico; registro elettronico dei punti tenuto dai distributori con codice
  alfanumerico omogeneo (coordinamento Terna), come descritto nel TIS. Da verificare.
- **PDR** (punto di riconsegna gas): non approfondito. **INCERTO**.

## 4. Fine maggior tutela e servizio a tutele graduali

| Voce | Contenuto | Stato |
|---|---|---|
| Elettricità, domestici non vulnerabili | Fine tutela di prezzo al 1 luglio 2024; chi non aveva un fornitore sul libero passa al servizio a tutele graduali (STG) | da verificare |
| Durata STG | Indicata fino al 31 marzo 2027 (pagina ARERA con data di aggiornamento 26 apr 2021, quindi datata); collegata alle delibere 10/2025/R/eel e 110/2025/R/eel | **INCERTO** (date esatte) |
| Vulnerabili | Maggior tutela mantenuta secondo il TIV | da verificare |
| Gas | Non estratto | **INCERTO** |

## 5. Stato in SAP

- **Nessuna localizzazione SAP standard per i flussi SII/ARERA trovata** (la Simplification List 2023 non cita IS-U
  Italia; gli elenchi «Country-Specific Functions (IS-U)» mostrano per esempio il Giappone, non l'Italia).
  L'assenza non è provata: **INCERTO**. Un partner italiano cita evoluzioni IS-U per la conformità normativa di una
  multiutility, senza nominare prodotti.
- Funzioni Italia documentate in FI-CA / Invoicing (help S/4HANA 2025.002): formati dei supporti di pagamento;
  reporting IVA `RFKKITVAT00` (solo IS-U); numerazione ufficiale dei documenti di Contract Accounting (solo IS-U);
  fatture elettroniche FatturaPA in Convergent Invoicing; documenti contabili elettronici da SD billing; fatture
  esenti IVA con lettera d'intento; dichiarazione IVA; registro IVA con dati di contract accounting.
  Verificato come esistenza, dettagli di configurazione da verificare sull'help.
- Market Process Management for Utilities (vedi `ecc-vs-s4hana.md`) è il framework SAP per messaggi coi partner di
  mercato, ma il suo uso per i flussi SII italiani non è documentato nelle fonti trovate: **INCERTO**.

## 6. Mappatura sul modello IS-U — interpretazione

**Interpretazione, non fatto documentato da SAP né da ARERA: da validare con chi conosce il sistema reale.**

| Concetto italiano | Oggetto IS-U probabile | Nota |
|---|---|---|
| POD (elettrico) | Point of Delivery (PoD), tabella `EUITRANS`; collegato all'impianto via `EUIINSTLN` | Il PoD IS-U ha un'identificazione esterna: il POD italiano ci sta verosimilmente |
| PDR (gas) | Stesso oggetto PoD, divisione gas | |
| Switching / cambio fornitore | Processo di cambio fornitore dell'IDE (Intercompany Data Exchange): documenti `EIDESWTDOC`; lato cliente move-in/move-out (`EC50E`/`EC55E`) | |
| Voltura | Move-out + move-in o modifica cliente sul contratto | |
| Misure per il settlement | Letture (EABL) e dati EDM/profili | |
| Morosità (TIMOE/TIMG) | Solleciti e procedure FI-CA (`FPVA`/`FPVB`) | |

IDE/IDEX: solo i concetti e la tabella `EIDESWTDOC` sono documentati nelle fonti; nessuna procedura end-to-end
italiana. **INCERTO** ogni mappatura di dettaglio.

## Fonti

- ARERA, Sistema Informativo Integrato (pagina datata dicembre 2020): https://www.arera.it/area-operatori/sistema-informativo-integrato-sii
- ARERA, Testi integrati (elenco, consultato 17 nov 2026): https://www.arera.it/area-operatori/testi-integrati
- TIV aggiornato (362/2023): https://www.arera.it/fileadmin/allegati/docs/26/362-23-tiv-aggiornato.pdf
- TIS, allegato a ARG/elt 107/09: https://www.arera.it/fileadmin/allegati/docs/09/107-09alla_ti.pdf
- Servizio a tutele graduali (pagina ARERA, data 26 apr 2021): https://www.arera.it/consumatori/il-servizio-a-tutele-graduali
- Delibera 10/2025/R/eel: https://www.arera.it/fileadmin/allegati/docs/25/10-2025-R-eel.pdf
- Delibera 110/2025/R/eel: https://www.arera.it/fileadmin/allegati/docs/25/110-2025-R-eel.pdf
- Delibera 637/2022: https://www.arera.it/atti-e-provvedimenti/dettaglio/22/637-22
- Delibera 501/2014: https://www.arera.it/en/atti-e-provvedimenti/dettaglio/14/501-14
- Portale SII, volture gas: https://siiportale.acquirenteunico.it/processi/settore-gas/volture
- Portale SII, specifiche switching v3.1 (documento del nov 2025, solo anteprima): https://siiportale.acquirenteunico.it/documents/11387888/11450040/Funzionamento+e+Specifiche+del+processo+di+Switching_v3.1.pdf
- Help SAP S/4HANA 2025.002, funzioni specifiche Italia: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/b2d44c1091094b5a810c2a879ee95522/2f217100e74947fe99ee1772cfadb893.html
- Fonte non ufficiale (decorrenza Bolletta, INCERTO): https://www.confimimb.it/bolletta-20.html
