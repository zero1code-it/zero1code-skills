# IS-U: master data (anagrafica, subentro/cessazione, apparecchi)

Convenzione: nessun segno = voce verificata su fonte; **INCERTO** = non verificata o fonti in disaccordo (da
confermare nel sistema: SE11 tabelle, SE93 transazioni). Valido per ECC 6.0 e S/4HANA Utilities salvo nota.

## 1. Oggetti: definizione, tabella, transazioni

| Oggetto (EN) | Definizione breve | Tabella principale | Crea / modifica / visualizza |
|---|---|---|---|
| Partner commerciale (Business Partner, BP) | Cliente o controparte; in S/4 il BP è obbligatorio (modello unico, CVI) | BUT000 (generali), EKUN (dati IS-U), BUT050 relazioni e BUT100 ruoli (**INCERTO**: solo repertorio terzo), ADRC indirizzi | `BP` (tutto); ruolo contract partner FI-CA: FPP1 / FPP2 / FPP3 |
| Conto contrattuale (Contract Account) | Raggruppa i contratti per fatturazione e pagamenti (FI-CA) | FKKVK (testata), FKKVKP (per partner: chiave VKONT + GPART) | CAA1 / CAA2 / CAA3 |
| Contratto (IS-U Contract) | Lega un impianto a un conto contrattuale, con date di ingresso/uscita | EVER (campi VKONTO, ANLAGE, EINZDAT, AUSZDAT) | ES20 / ES21 / ES22; ES27 / ES28 manutenzione/visualizzazione multipla |
| Oggetto di allacciamento (Connection Object) | Punto di allacciamento fisico (edificio); corrisponde alla functional location PM (campo HAUS) | EHAUISU (HAUS); IFLOT lato PM | ES55 / ES56 / ES57 |
| Immobile / unità (Premise) | Unità abitativa/commerciale dentro l'oggetto di allacciamento; chiave VSTELLE | EVBS | ES60 / ES61 / ES62 |
| Impianto (Installation) | Lato fatturazione: serve una divisione (Sparte) in un premise; storico a fasce temporali | EANL (VSTELLE, SPARTE), EANLH (time slice) | ES30 crea, ES31 modifica, ES32 visualizza (mostra anche facts archiviati) |
| Ubicazione apparecchio (Device Location) | Lato tecnico: dove sta l'apparecchio; corrisponde alla functional location PM | IFLOT; testi per lingua in EGPLTX (chiave DEVLOC, SPRAS); testata **EGPL INCERTO** | ES65 / ES66 / ES67 |
| Apparecchio (Device = Equipment PM) | Il device IS-U è l'equipment di Plant Maintenance più un record master IS-U; categoria = materiale, numero seriale = serial number | EQUI (PM), EGERS (master IS-U), EGERH (storico) | IQ01 crea; IQ02/IQ03 **INCERTO** (transazioni PM, non nelle fonti IS-U) |
| Device information record | Oggetto IS-U solo per fatturazione, senza equipment PM; comunica con l'esterno via PoD | EGERR (**INCERTO**: fonti discordi, «device info record» vs «device info per PoD») | EG44 crea, EG41 modifica, EG42 modifica apparecchio, EG43 visualizza |
| Registro (Register) | Contatore logico/fisico dentro l'apparecchio; legato al registro logico con numero a 4 cifre | ETDZ (registri installati), EZWG (gruppo registri), EZUZ (allocazione apparecchio; solo repertorio terzo) | EG60 / EG61 registro logico; EG75/76/77 relazioni registri |
| Struttura impianto | Quali apparecchi/registri sono installati in quale impianto | EASTL (livello apparecchio, chiave LOGIKNR), EASTS (livello registro) | via EG31/EG33/EG34 (sezione 5) |
| Punto di prelievo (Point of Delivery, PoD) | Identificatore del punto fornitura, anche verso altri sistemi/mercato | EUIHEAD (testata), EUITRANS (ID interno/esterno), EUIINSTLN (PoD -> impianto) | EEDM09 / EEDM10 / EEDM11 |

Note: la vista d'insieme cliente era CIC0 (ECC); in S/4HANA CIC0 ed EC20 non esistono più e si usa l'Interaction
Center di Utilities for Customer Engagement (vedi `ecc-vs-s4hana.md`).

## 2. Relazioni e cardinalità

```
Partner (BUT000/EKUN) 1 ---- n Conto contrattuale (FKKVK/FKKVKP)      [BP 1:n conti: da confermare]
Conto contrattuale 1 ---- n Contratto (EVER)                         [n contratti : 1 conto, blog]
Contratto (EVER) n ---- 1 Impianto (EANL)                            [impianto in un solo contratto; eccezioni:
                                                                       in costruzione / senza proprietario, blog]
Oggetto di allacciamento (EHAUISU) 1 ---- n Premise (EVBS)           [blog: da confermare su fonte SAP]
Premise (EVBS) 1 ---- n Impianto (EANL)   (divisioni diverse)         [VERIFICATO SAP Learning: più impianti]
Premise 1 ---- n Contratti   (uno per divisione/tipo servizio)        [VERIFICATO]
Oggetto di allacciamento 1 ---- n Ubicazione apparecchio             [blog: da confermare]
Ubicazione apparecchio 1 ---- n Apparecchio (EQUI)                   [blog: da confermare]
Impianto 1 ---- 1 Ubicazione apparecchio                             [INCERTO: blog]
Apparecchio: installato tecnicamente in UNA ubicazione (EG33),
             poi allocato in fatturazione a UNO O PIU impianti (EG34) [VERIFICATO SAP Learning / PDF Device Mgmt]
Impianto n ---- n Apparecchio/registro via EASTL / EASTS             [VERIFICATO]
PoD (EUIHEAD) ---- Impianto via EUIINSTLN                            [PoD deregolato: 1 o 2 impianti; più PoD
                                                                       tecnici sullo stesso impianto]
```

Premise-impianto è 1:n (SAP Learning e documentazione SAP Device Management concordano: più impianti e contratti
per premise, anche di divisioni diverse; il blog che parla di 1:1 è smentito). Da confermare nel sistema solo il
vincolo «un impianto di fornitura per divisione per premise».

## 3. Chiavi di join

| Join | Campi | Stato |
|---|---|---|
| Contratto -> impianto | EVER-ANLAGE = EANL-ANLAGE | verificata |
| Contratto -> conto contrattuale | EVER-VKONTO = FKKVKP-VKONT (nome campo in EVER: VKONTO) | verificata |
| Conto contrattuale -> partner | FKKVKP-GPART = BUT000-PARTNER | **INCERTO**: GPART è in chiave FKKVKP, il campo BUT000 è da conoscenza propria |
| Impianto -> premise | EANL-VSTELLE = EVBS-VSTELLE | verificata |
| Premise -> oggetto di allacciamento | EVBS-HAUS = EHAUISU-HAUS | **INCERTO**: HAUS in EHAUISU verificato, in EVBS non nelle fonti |
| Oggetto di allacciamento -> indirizzo | EHAUISU -> ADRC via numero indirizzo | **INCERTO** (nome campo non verificato) |
| Impianto -> apparecchi | EASTL-ANLAGE, EASTL-LOGIKNR -> EGERH-LOGIKNR; EGERH-EQUNR = EQUI-EQUNR | EASTL con LOGIKNR e passaggio EASTL -> EGERH/EGERR verificati; campi esatti **INCERTO** |
| PoD esterno -> interno | EUITRANS (ID interno/esterno: INT_UI / EXT_UI) | tabella verificata, nomi campo **INCERTO** |
| PoD -> impianto | EUIINSTLN (INT_UI -> ANLAGE) | tabella verificata, nomi campo **INCERTO** |
| Oggetti dei task di data exchange | data element BU_PARTNER, ANLAGE, VERTRAG, VKONT_KK, VSTELLE, EQUNR, HAUS | verificati (PDF Release Notes) |

Attenzione al tempo: EVER ha date (EINZDAT/AUSZDAT) e EANLH/EGERH sono storici: filtrare sempre alla data chiave.

## 4. Subentro e cessazione (move-in / move-out)

| Transazione | Funzione | Note |
|---|---|---|
| EC50E (EC50) | Crea documento di subentro (move-in) | esiste già in ECC (programma EMOVEINOUT): non è una novità S/4 |
| EC51E / EC53E | Modifica / annulla move-in | versione «enhanced»; in S/4 CE inclusi nei processi MOVE_IN, MOVE_IN_CHANGE, MOVE_IN_CANCEL |
| EC55E (EC55) | Crea documento di cessazione (move-out) | |
| EC56E / EC58E | Modifica / annulla move-out | processi MOVE_OUT, MOVE_OUT_CHANGE, MOVE_OUT_CANCEL |
| EC60 | Elaborazione iniziale move-in/out (massiva) | non è il move-out |
| EC70 | Inserimento rapido move-in / move-out / move-in-out | nuovi campi cauzione, telefono, e-mail; errori in ECRMREPL |
| EC85 / EC86 / EC87 | Crea / modifica / visualizza documento di distacco (disconnection document) | un forum chiama EC86 «riconnessione»; che la riconnessione si registri sullo stesso documento è **INCERTO** |

Sequenza consigliata (risposta di un esperto SAP in un forum, non documentazione ufficiale): BP -> (conto
contrattuale creato in automatico al move-in) -> ES55 -> ES65 -> ES60 -> ES30 -> EC50E -> IQ01 + EG31 -> lettura di
subentro creata in automatico (non serve EL01) -> EL28. Cessazione: EC55E -> lettura finale (EL01 se serve) ->
EASIBI per la fattura finale. API: BAPI_ISUMOVEIN_CREATEFROMDATA / BAPI_ISUMOVEOUT_CREATEFROMDATA (stessa fonte).
Il cambio fornitore (switching) non è EC70: appartiene a IDE (vedi `estensioni.md`).

## 5. Gestione apparecchi (Device Management)

**Regola: prima installazione tecnica, poi fatturazione.** Il device va prima in una ubicazione (lato tecnico), poi
in un impianto con i dati tariffari (lato fatturazione); «full» fa entrambe le cose insieme. Nella rimozione l'ordine
è inverso: prima le rimozioni di fatturazione da ciascun impianto (in ordine di data), poi la rimozione tecnica. Il
device information record vive senza equipment PM.

| Transazione | Funzione |
|---|---|
| EG31 | Installazione completa (tecnica + fatturazione; include consumo di periodo) |
| EG30 | Sostituzione completa |
| EG33 | Installazione tecnica |
| EG34 | Installazione di fatturazione |
| EG32 | Rimozione completa |
| EG35 | Rimozione di fatturazione |
| EG36 | Rimozione tecnica |
| EG41 / EG42 / EG43 / EG44 | Modifica / modifica apparecchio / visualizza / crea device info record |
| EG50 / EG51 / EG52 / EG53 | Storno: installazione/rimozione/sostituzione (generico) / installazione / sostituzione tecnica / rimozione tecnica |
| EG60 / EG61 | Modifica / visualizza registro logico (EG60 = cambio numero registro logico) |
| EG70 / EG71 | Modifica / visualizza dati tariffari (non «regole registri») |
| EG72 / EG73 | Allocazione apparecchi (EG72 bloccata nel periodo con QD finale) |
| EG75 / EG76 / EG77 | Crea / modifica / visualizza relazioni tra registri |
| EL56 | Consumo di periodo (Maintain Period Consumption) |
| EG80 / EG83 / EG84 | Certificazione/sostituzione periodica: crea lotto / compila lotto / determina apparecchi del lotto |

Lista di sostituzione periodica: anno = ultimo anno di certificazione + validità taratura. Log SLG1, oggetto IUEG
(sottooggetti REP_STAT/REP_ERROR e WO_STAT/WO_ERROR). Enhancement alla creazione device: EDME10L1
(EXIT_SAPLE10R_002), controlli material+serial IQSM0008; per install/remove/replace EDMD1001 (vedi `meter-reading.md`).
Parametro di sistema GOODSMVMT: movimento merci alla installazione/rimozione/sostituzione. Un apparecchio creato
da IS-U non aggiorna lo stock MM; creato da entrata merci sì.

## 6. Procedura: trovare tutto di un cliente da POD o indirizzo

Da POD:
1. EUITRANS: ID esterno POD -> ID interno. **INCERTO** sui nomi campo (INT_UI, EXT_UI).
2. EUIINSTLN: ID interno -> impianto (ANLAGE); un PoD deregolato può avere 1 o 2 impianti.
3. EANL (ANLAGE): divisione (SPARTE), premise (VSTELLE). EANLH per lo storico.
4. EVER dove ANLAGE = impianto: contratto/i, date di ingresso e uscita (prendere quello valido alla data chiave).
5. EVER-VKONTO -> FKKVKP (VKONT) -> partner (GPART): conto contrattuale e cliente. Le partite del conto: `FPL9`.
6. EVBS (VSTELLE) -> HAUS -> EHAUISU: oggetto di allacciamento e indirizzo (ADRC). **INCERTO** sui campi.
7. Apparecchi: EASTL (ANLAGE) -> EGERH -> EQUI; registri in ETDZ; tariffe con EG70/EG71.

Da indirizzo: ADRC (via, civico, città) -> oggetto di allacciamento (EHAUISU) -> premise (EVBS) -> poi dal punto 3 in
poi. Il collegamento ADRC -> EHAUISU non è confermato su fonte (**INCERTO**): in alternativa cercare dal BP.

Verifica da interfaccia (ECC): `CIC0` per il quadro cliente; `ES32` impianto; `FPL9` saldo. Se un valore non torna,
cercare estensioni custom (CMOD, SE19) prima di concludere che è un errore standard.

## Fonti

- SAP Learning, «Discovering Business Processes in SAP S/4HANA Utilities»: https://learning.sap.com/courses/discovering-business-processes-in-sap-s-4hana-utilities/analyzing-key-aspects-of-technical-master-data
- SAP Help, «Move-In / Move-Out Transactions» (EC50E, EC55E): https://help.sap.com/docs/SUPPORT_CONTENT/uindustry/3362183461.html
- SAP Community, «SAP S/4HANA Utilities move-in & move-out»: https://community.sap.com/t5/sap-for-utilities-blog-posts/sap-s-4-hana-utilities-move-in-amp-move-out/ba-p/13634239
- SAP Help, Device Management (EG30/31/32/34/35): https://help.sap.com/docs/SAP_ERP/acf8f8e0bda645638370c385f572c6a9/4190d0533f8e4308e10000000a174cb4.html
- SAP Help, Point of Delivery (EUIHEAD/EUITRANS/EUIINSTLN): https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e52c8ee6197147ec97dfc2eb8c46a3ad/076ace53118d4308e10000000a174cb4.html
- SAP Community, «Move-in and move-out process» (sequenza): https://community.sap.com/t5/sap-for-utilities-discussions/move-in-and-move-out-process/m-p/6961140
- Elenco transazioni IS-U (repertorio; fonte delle triple crea/modifica/visualizza ES*, EC85-87, EG50-53, EEDM09-11): https://www.dan852.com/page/sap-transactions-is-u/
- Descrizioni tabelle (repertorio): https://leanx.eu/sap/table/ever/
- Titoli SAP: «SAP Help – Device Management», «IS-U Release Notes ECC 6.0»
