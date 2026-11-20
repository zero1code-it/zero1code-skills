---
name: zero1-sap-isu
description: >
  (Beta) Conoscenza di SAP IS-U standard (SAP for Utilities, ECC 6.0 e SAP S/4HANA Utilities) per le quattro aree
  Master data, Meter reading (letture), Billing (fatturazione, tariffe) e Credit / FI-CA (contract accounting,
  solleciti, pagamenti). Usala quando l'utente chiede di oggetti, tabelle, transazioni, BAPI, exit o processi IS-U:
  partner commerciale, conto contrattuale, contratto, impianto, premise, apparecchi, letture, subentro/cessazione
  (move-in/move-out), bolletta, errore di fatturazione, outsorting, piano acconti, saldo cliente, sollecito, BPEM,
  IDE/IDEX, differenze ECC vs S/4HANA, o nomina EVER, EANL, EVBS, EABL, ERCH, ERDK, DFKKOP, EA00, EA19, EC50E,
  EG31, EL28, FPL9, FPVA. Non copre le personalizzazioni Z/Y dei clienti.
license: MIT
metadata:
  category: SAP
  author: zero1code
---

# SAP IS-U standard (beta)

Rispondi a domande su SAP IS-U standard e aiuta ad analizzare dati, processi ed errori, con i nomi SAP esatti
(oggetti, tabelle, transazioni) e indicando quanto ogni informazione è sicura.

**Usala per**: navigare il modello dati, trovare la transazione o la tabella giusta, spiegare un processo, impostare
un'analisi (bolletta errata, lettura scartata, partita che resta aperta), scrivere query o codice ABAP che legge
tabelle standard IS-U, confrontare ECC e S/4HANA.

**Non usarla per**: logica custom del cliente (oggetti Z/Y, varianti tariffarie proprie, report aziendali), di cui
non sai nulla; configurazione SAP generica non legata alle utilities (per ABAP, CDS e BTP usa le skill `sap-*`).

## Come lavorare

1. **Individua l'area** e leggi solo il file che serve (nella cartella `references/`, accanto a questo file):

   | Area | File |
   |---|---|
   | Master data: partner, conto contrattuale, contratto, oggetto di allacciamento, premise, impianto, apparecchi, PoD, subentro/cessazione | `references/masterdata.md` |
   | Meter reading: ordini di lettura, inserimento, plausibilità, monitor | `references/meter-reading.md` |
   | Billing: tariffe, schemi, operandi, fatturazione, bolletta, storni, outsorting, piano acconti, analisi errori | `references/billing.md` |
   | Credit / FI-CA: documenti, saldo, pagamenti, solleciti, rate, cauzioni, write-off, chiusure | `references/credit-fica.md` |
   | BPEM, IDE/IDEX, EDM, BAPI, exit, BAdI, eventi FI-CA | `references/estensioni.md` |
   | ECC 6.0 vs S/4HANA Utilities, app Fiori | `references/ecc-vs-s4hana.md` |
   | Mercato italiano (SII, ARERA, POD/PDR) | `references/italia.md` |
   | Termini IT / EN / DE | `references/glossario.md` |

2. **Chiedi la versione** se cambia la risposta (ECC 6.0 o S/4HANA, e quale release). Se l'utente non lo sa, dai
   la risposta valida per entrambe e segnala le differenze.
3. **Usa i nomi SAP originali** (transazione, tabella, campo) accanto al termine italiano: è così che l'utente li
   cerca nel sistema.
4. **Rispetta lo stato delle voci.** Nei file ogni voce è *verificata* o segnata **INCERTO**. Una voce incerta va
   detta come tale e fatta confermare nel sistema reale: SE93 (transazione), SE11 (tabella), SE37 (modulo
   funzione/BAPI), SE18/SMOD (BAdI/exit). Non presentarla mai come certa. Le voci *(solo fonti terze)* sono
   confermate solo da repertori pubblici non SAP: probabilmente giuste, ma suggerisci la stessa verifica. In
   `masterdata.md` e `meter-reading.md` anche alcune voci senza segno (triple crea/modifica/visualizza) vengono da un
   repertorio: le fonti di ogni file sono in fondo.
5. **Non inventare.** Se un nome non è nei file e non lo conosci con certezza, dillo e indica come trovarlo
   (SE93 con ricerca per descrizione, SE11 con `E*`/`DFKK*`, menu SAP Easy Access, tabella TSTCT).
6. **Considera il custom.** Ogni sistema reale ha enhancement e varianti proprie: quando un comportamento non torna
   con lo standard, suggerisci di cercare exit/BAdI attivi (CMOD, SE19), eventi FI-CA (FQEVENTS) e varianti tariffarie
   del cliente prima di concludere che è un errore standard.

## Formato della risposta

- Prima la risposta (transazione, tabella, passo), poi la spiegazione minima.
- Per un'analisi: elenco numerato di passi con la transazione o la tabella da usare a ogni passo e cosa guardare.
- Per una query: SQL/ABAP solo su tabelle standard, con le chiavi di collegamento esplicite (vedi `masterdata.md`).
- Chiudi con le voci da confermare nel sistema, se ce ne sono.

## Note sulle fonti

I contenuti sono fatti tratti da documentazione pubblica SAP (help.sap.com, SAP Learning, release notes e guide
SAP), da SAP Community e da repertori pubblici di transazioni e tabelle, riscritti in forma sintetica. Le voci
italiane di mercato (SII, ARERA) sono una panoramica da verificare sulle fonti ufficiali indicate.
