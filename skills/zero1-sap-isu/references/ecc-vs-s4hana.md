# SAP IS-U: ECC 6.0 vs S/4HANA Utilities

Stato per voce: nessuna nota = verificata su fonte SAP; «**INCERTO**» = da confermare nel sistema o sulla fonte
primaria. Le note SAP (numeri) si leggono su me.sap.com (launchpad note, SAP Note) con il numero indicato.

## 1. Differenze principali (Simplification List S/4HANA on-premise 2023)

| Area | ECC 6.0 | S/4HANA | Nota SAP | Stato |
|---|---|---|---|---|
| Partner | Partner commerciale IS-U legato al cliente SD tramite integrazione propria | Business Partner obbligatorio (CVI): clienti e fornitori solo da transazione `BP`. Prima della conversione si eseguono i report `REU_CVI_CUST_LINK` e `REU_CVI_EKUN_TO_BUT0ID`; la direzione CVI BP→cliente si attiva solo dopo la conversione | 2344100 (CVI), 2354282 (report) | |
| Front office | `CIC0` (Customer Interaction Center) e `EC20` | Non disponibili. Sostituto: Interaction Center di S/4HANA Utilities for Customer Engagement (vedi §2). Rimossa anche l'area menu ISUCC (customizing CIC) | 2270510 | |
| Vendita | IS-U Sales Processing (`ISU_SALES_QUOTATION`, `ISU_SALES_ORDER`) | Rimosso | 2270507 | |
| Self-service web | UCES (Utilities Customer E-Services) | Non disponibile; equivalente funzionale: SAP Multichannel Foundation for Utilities and Public Sector (OData). L'add-on UMCERP01 è integrato nel layer IS-UT dalla 1610; template UI5 da adattare (nota 2352104) | 2270504, 2329190 | |
| Arretrato | Backlog Reduction Engine (`BLOG`, `BNR`, `BRECLEAR`, `MISS`) | Deprecato: si usa BPEM (Business Process Exception Management) | 3521524, 2495833 | |
| Billing tool | `EA22_TOOL` | Deprecato: schermata «Billing periods» in `ES32` | 3014556 | |
| Enterprise Services | Servizi IS-U classici | Alcuni non più disponibili da 1511 | 1541831, 1527380 | |
| FI-CA | Contract Accounting | Resta come sottolibro mastro (nome invariato) | - | |

Altre voci Utilities nella stessa lista (2023), solo titolo e numero nota; il dettaglio non è stato letto:
IDE Outgoing Payment Processing 2574483; Late Payment Change 2681020; IS-Utilities Settlement Control 2694441;
Maintenance of non-billable PoD services 2843756; Refund Claim for Germany 3326146; Monitoring Profile Value Import
2270502; Prepayment solution for utilities 3375865; Utilities customer score for SAP Marketing Cloud 3422783; ML
Scenario for Utilities Billing 3480987; IS-U statistiche UIS/BW 2270505; Loyalty Program 2270509; GIS Business
Connector 2270511; Waste and Recycling 2437332, 3245321; localizzazione CEE Utility&Telco 2338097.
**INCERTO** il contenuto di queste voci. **INCERTO** anche se la lista 2025 differisce dalla 2023 (letta solo la 2023).
**INCERTO** l'impatto su IDE/IDEX ed EDM: nessuna voce «rimossa» trovata; l'help S/4HANA 2025 FPS02 li descrive come
parte di S/4HANA Utilities.

Nota: `EC50E` e `EC55E` (move-in/move-out) esistono già in ECC (programma `EMOVEINOUT`): non sono una differenza S/4.
In S/4 con Utilities for Customer Engagement le tcode con suffisso E sono le versioni «enhanced» integrate coi
contratti di vendita; `EC60` e `EC70` sono contenute nei processi.

## 2. Componenti S/4HANA

| Componente | Cosa è | Stato |
|---|---|---|
| S/4HANA Utilities | Meter-to-cash: struttura regionale, device management, energy data management, funzioni utilities di service | |
| S/4HANA Utilities for Customer Engagement (CE) | Versione semplificata di CRM incorporata: vendita commodity su canali CX, Process Framework (New Contract, Change Product, End Contract), UPIL (traduce attributi prodotto in master data di fatturazione), Interaction Center (CRM Web UI, tema Fiori). Embedded del tutto dalla 1909 (prima add-on S4CRM). Edizioni: Enterprise (oltre 50 processi standard) e Basic per Customer Interaction Center (nessun processo standard, per chi sostituisce CIC0/EC20) | |
| Market Process Management for Utilities | Modella, esegue e monitora processi con scambio messaggi verso i partner di mercato | |
| SAP Cloud for Utilities Foundation | Industry cloud su BTP; contiene Measurement Concept Management (MCM) per dati master tecnici e di business, anche con sistemi terzi | |
| S/4HANA for Convergent Invoicing | Billing+invoicing integrato per prodotti commodity e non, revenue share con terzi, sconti cross-product. Nell'help appare come «Invoicing». Rapporto con SAP BRIM | **INCERTO** (BRIM) |
| SAP Utilities Core | Offerta meter-to-cash in abbonamento; richiede RISE with SAP S/4HANA Cloud, private edition. Varianti: Core for Germany (processi deregolati tedeschi e market communication), Core (framework processi deregolati per paese + Convergent Invoicing), Core enhanced (per utility regolate: Service Cloud e Field Service Management, senza Convergent Invoicing). Il documento SAP dice «due versioni» ma ne elenca tre | |
| SAP Service Cloud V2 add-on for Utilities (ex C4C utilities) | Lato customer experience; rapporto esatto con «Utilities for Customer Engagement» | **INCERTO** |
| SAP DER / Utilities Customer Self-Service Agent | Esistono (pagina SAP Community Utilities); dettagli non letti | **INCERTO** (dettagli) |

## 3. Novità S/4HANA 2025 (blog SAP Community, 9 ott 2025)

- Market process management e prepayment non sono più add-on separati: sono parte tecnica di S/4HANA Utilities.
- Fiori «Business Partner Financial Overview» con dati utilities (es. budget billing plans).
- Estrazione dei contratti di vendita utilities verso Datasphere/SAC; ricerca conversazionale Joule sull'help.
- Release con novità utilities: 2023 (FPS3, feb 2025), 2025, 2025 FPS01, 2025 FPS02 (help del 2026).

## 4. App Fiori (App ID, help S/4HANA 2025 FPS02)

Sono app di monitoraggio e gestione eccezioni, non sostituti 1:1 della GUI.

| App | ID | App | ID |
|---|---|---|---|
| Resolve Implausible Meter Readings | F2185 | Display Outstanding Billing Items | F3134 |
| Resolve Outsorted Billing Documents | F2186 | Periodic Billing and Invoicing Analysis | F3424 |
| Outstanding Billing Overview | F2801 | Process Billing Errors | F3358 |
| Periodic Billing Overview | F2709 | BPEM Clarification Case Overview | F7255 |
| Release Blocked Utilities Contracts | F2708 | Manage BPEM Clarification Cases | F7256 |
| Periodic Meter Reading Overview | F2786 | Display Utilities Time Series Values | F8929 |
| Block Utilities Contracts | F3131 | Process Billing Orders | F3339 |
| Display Suppressed Billing Orders | F3132 | Process Missing Billing Orders | F3133 |
| Resolve Outsorted Invoicing Documents | F3253 | Periodic Invoicing Overview | F3135 |

App ID per Utilities for Customer Engagement: non trovati (**INCERTO**). La Fiori Apps Reference Library classica è in
dismissione: gli ID vengono dall'help, non dalla library.

## 5. Migrazione contratti IS-U verso Utilities Sales Contract (cookbook SAP, S/4HANA 2021 + novità 2023 FPS3)

| Voce | Contenuto |
|---|---|
| Cosa non si migra | Business partner e contract account (modello dati armonizzato) |
| Cosa cambia | Contratto IS-U → sales contract con product determination; contatti BP → interaction record (solo i rilevanti); dati di billing → materiali dei prodotti; customizing CIC0/EC20 → customizing Interaction Center e alberi BOL |
| Prerequisito customizing | SPRO > SAP Utilities > Customer Engagement > Utilities Sales Contract Management > Settings for IS-U Contract Integration: attivare integrazione per divisione, definire product proposal (un prodotto senza rate category oppure uno per rate category) e valori di configurazione; prodotti creati prima come materiali (`MM02`); integrazione prodotto via UPIL |
| Esecuzione (ERP→S4 e S4→S4) | Report `CRMS4_IU_CM_CONTRACT_MIGRATION` da `SE38`, filtrabile (es. per divisione) e schedulabile (da release 2020 FPS0) |
| Esecuzione (altri sistemi) | `EMIGALL` con oggetti `MOVE_IN` e `MOVE_OUT` |
| Estensione | Enhancement spot `CRMS4_IU_CM_PROCESS_FRAMEWORK`; BAdI `CRMS4_IU_CM_INTEGRATION` (interfaccia `IF_CRMS4_IU_CM_INTEGRAT_BADI`, metodi `CHECK_PRECONDITION` e `PERFORM_INTEGRATION`); filtri `MOVE_IN_CREATE/CHANGE/CANCEL` e `MOVE_OUT_CREATE/CHANGE/CANCEL` |
| Con storico (2023 FPS3) | API-Process astratto `CL_CRMS4_IU_CM_PFP_API_MIGCREH`: un item per time slice, kind `NEW_CONTRACT`, `CHANGE_PRODUCT`, `END_CONTRACT`; l'esempio SAP legge `EANLH` e determina il prodotto da `CRMS4C_IU_INTPRD` via rate category |
| Da CRM side car | Contract account ↔ business agreement; interaction record con S/4HANA Migration Cockpit; tool `CRM_S4_BTX_ACTIVITY_MIGRATION`; ruolo `UTIL_IC_LEAN` → `S4C_UT_IC` |

## 6. Fine manutenzione ECC / IS-U

**INCERTO.** Una fonte non SAP indica fine supporto IS-U a fine 2027; non confermata né collegabile a 2030/2033.
Verificare sulla maintenance strategy ufficiale SAP (SAP Note e SAP Product Availability Matrix) prima di citare date.

## 7. Cosa resta uguale (regola pratica)

- Il modello dati IS-U (partner, conto contrattuale, contratto, impianto, premise, apparecchio) e FI-CA restano
  concetti centrali anche in S/4: **INCERTO** a livello di singola tabella, da verificare con `SE11`.
- Le transazioni classiche `EA*`, `EL*`, `EG*`, `ES*`, `FP*` sono in gran parte ancora richiamabili da SAP GUI:
  **INCERTO** voce per voce. Test: `SE93` (la transazione esiste?) o `/nNOMETCODE`; per quelle rimosse vedi §1.
- Le app Fiori (§4) si affiancano alla GUI per le eccezioni (letture non plausibili, documenti in outsorting).
- Estensioni classiche (exit CMOD, BAdI, eventi FI-CA `FQEVENTS`) continuano a funzionare in genere ma vanno
  controllate nella Simplification List e col tool di custom code check: **INCERTO** caso per caso.

## Fonti

- Simplification List for SAP S/4HANA 2023 (on-premise), SAP: https://help.sap.com/doc/c34b5ef72430484cb4d8895d5edd12af/2023/en-US/SIMPL_OP2023.pdf
- Help S/4HANA on-premise, Utilities for Customer Engagement: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/021b182b0c47416c8fafed67ebfd78a9/5e160811e2344e2c834bfabe8d8ddeab.html
- Help S/4HANA 2025 FPS02 (novità e Invoicing): https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/021b182b0c47416c8fafed67ebfd78a9/266dce53118d4308e10000000a174cb4.html
- Help, app Fiori Utilities (2025 FPS02, cache 15 nov 2026): https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/021b182b0c47416c8fafed67ebfd78a9/e431355889729344e10000000a4450e5.html
- SAP Community, «SAP S/4HANA 2025: what's in it for the utilities industry» (9 ott 2025): https://community.sap.com/t5/sap-for-utilities-blog-posts/sap-s-4hana-2025-what-s-in-it-for-the-utilities-industry/ba-p/14216995
- SAP Community, Utilities Roadmap 2025 onwards (17 dic 2024): https://community.sap.com/t5/sap-for-utilities-blog-posts/sap-utilities-roadmap-2025-onwards/ba-p/13964567
- SAP Learning, Utilities for Customer Engagement: https://learning.sap.com/courses/discovering-business-processes-in-sap-s-4hana-utilities/applying-sap-s-4hana-utilities-for-customer-engagement-architecture-and-integration-1
- Documenti SAP (senza URL pubblico): «SAP Utilities Core» (2024); cookbook «Migration IS-U/CRM to S/4HANA Utilities for Customer Engagement» (S/4HANA 2021, novità 2023 FPS3); «SAP for Utilities Master Guide».
- Fonte non SAP (solo per §6, INCERTO): https://us.arvato-systems.com/portfolio/technologies/sap/sap-is-u
