# zero1code-skills

Catalogo delle skill di zero1code. L'app desktop legge `index.json` e installa le skill scelte dall'utente.

Pubblico in lettura. Solo i collaboratori dell'organizzazione scrivono su `main`.

## Due tipi di voce

- **Ospitate** (`skills/<nome>/`): skill scritte da noi, nel repository. Fanno eccezione le copie modificate di skill di
  terzi che servono come predefinite (una predefinita deve essere ospitata): `zero1-code-review` (da
  `mattpocock/skills`, MIT) e `zero1-security-review` (da `getsentry/skills`, Apache-2.0, con riferimenti OWASP
  CC BY-SA 4.0). Tengono la licenza degli autori nella loro cartella e, in testa a `SKILL.md`, la sorgente, il commit
  di partenza e le modifiche. Le modifiche sono descritte come dati in `catalog.json` (`hostedCopies`: repo, `ref`,
  cartella, file esclusi, file extra dalla radice, `edits` testo→testo) e `scripts/sync-skills.mjs` le riapplica a ogni
  aggiornamento; `node scripts/sync-skills.mjs --verify` controlla che la cartella coincida byte per byte con l'originale
  al `ref` più le modifiche. Non ricevono il gruppo `zero1code skill` (non sono nostre).
- **Riferimenti** (`catalog.json`): skill di terzi. **Qui non c'è nessuna copia del loro lavoro.** L'indice riporta, per ogni
  skill, il repository dell'autore, un commit fissato e l'hash di ogni file. L'app scarica da `raw.githubusercontent.com` a quel
  commit, verifica dimensione e sha256 e mette accanto alla skill i file di licenza del repository originale (`LICENSE`,
  `NOTICE`…). Le licenze restano quelle degli autori (MIT, Apache-2.0, GPL-3.0 per le skill SAP).

## Skill nostre (MIT, copyright zero1code)

`zero1-skill-creator` guida l'agente (e l'utente) a creare, correggere e controllare una skill (`skill_tool.py`, solo libreria standard). `zero1-docx`, `zero1-xlsx`, `zero1-pptx`: Word, Excel e PowerPoint con `python-docx`, `openpyxl` e `python-pptx`, scritte
da zero dalla documentazione pubblica delle librerie (non derivano da altre skill). Ognuna ha script di controllo
(`describe.py --check`), aiuti per ciò che le librerie non fanno (`helpers.py`) e, dove serve, modifiche tracciate
(`track.py`), ricalcolo delle formule (`recalc.py`), compilazione di modelli (`replace_text.py`) e anteprima
(`render.py`, richiede LibreOffice). I test Python sono in `tests/` (`python -m unittest discover -s tests`).
`zero1-sap-isu`: conoscenza di SAP IS-U standard (ECC 6.0 e S/4HANA Utilities) per Master data, Meter reading, Billing
e Credit/FI-CA, con stato verificato/incerto di ogni transazione e tabella e procedure di analisi; solo `references/`,
nessuno script.

## Aggiungere una skill nostra

1. Crea `skills/<nome>/SKILL.md` (nome = cartella: minuscole, cifre, `.`, `_`, `-`).
2. Frontmatter obbligatorio:

   ```yaml
   ---
   name: <nome>
   description: cosa fa e quando usarla
   license: MIT
   metadata:
     category: sviluppo
     author: zero1
   ---
   ```

3. `node scripts/build-index.mjs` rigenera `index.json`; committalo con la skill.

## Aggiungere un riferimento a una skill di terzi

1. Leggi la licenza del repository e della cartella: senza una licenza che permetta la redistribuzione, non entra.
2. In `catalog.json` aggiungi la skill sotto la sua sorgente (`repo`, `ref` = commit completo da 40 caratteri, `license`,
   `licenseFiles` = file di licenza alla radice del repo). `path` è la cartella della skill nel repository; `files` limita
   i file; `rename` ne rinomina uno (es. `skill.md` → `SKILL.md`). Il nome nel catalogo deve coincidere con il campo `name`
   del suo `SKILL.md`.
3. `GITHUB_TOKEN=$(gh auth token) node scripts/build-index.mjs` scarica i file ai commit indicati e rigenera `index.json`.
4. L'aggiornamento è automatico (vedi sotto): non serve spostare `ref` a mano.

Ogni lunedì il workflow `upstream` (`scripts/sync-skills.mjs`, lanciabile anche a mano da Actions o in locale con
`GITHUB_TOKEN=$(gh auth token) node scripts/sync-skills.mjs [--apply]`; senza `--apply` è un dry run che non scrive nemmeno lo stato) porta `ref` a un nuovo commit dell'autore, per
i riferimenti e per le copie ospitate, solo se **lo abbiamo visto come testa del ramo predefinito da almeno 7 giorni** e se passa
tutti i cancelli. L'attesa si basa sulle nostre osservazioni, non sulle date dei commit (le sceglie l'autore): a ogni
esecuzione il workflow registra la testa di ogni repository in `upstream-state.json` (`{sha, seen}`, al massimo 20 per repository,
nessuna più vecchia di 60 giorni) e lo committa da solo (`chore(skills): record upstream heads`, solo se il file è cambiato; si
committa anche se i controlli falliscono). Il candidato è l'osservazione più recente vecchia di 7 giorni che discende dal `ref`
attuale e precede o è la testa e ogni testa osservata dopo di lui (un commit nascosto da un force-push e poi rimesso non
conta come pubblico da 7 giorni); una testa che torna dopo un'altra riparte da zero. Se la testa ha tolto righe o file che il
candidato aveva aggiunto (es. un revert dopo una compromissione, o una riga appena aggiunta e già cambiata) il candidato non si
pubblica e si aspetta la testa. Una testa non ancora abbastanza vecchia è «in attesa» nel report (non è un problema, non apre
l'issue). `--now` simula il tempo solo nei dry run locali: è rifiutato in CI e con `--apply`. Cancelli: stesso repository (non rinominato né trasferito) e
nuovo commit discendente da quello fissato (niente force-push o cambio di ramo su un'altra storia); nessun file di licenza
cambiato o sparito; frontmatter di `SKILL.md` invariato salvo `description`, `argument-hint`, `metadata` e simili (licenza,
`allowed-tools`, modello… bloccano); **nessuna modifica** (aggiunta, cambio, rimozione, cambio di modo) a script o file
eseguibili (estensioni di `hasScripts`, cartelle `scripts/` a qualunque livello, modo 100755); niente link simbolici,
sottomoduli, file binari (salvo immagini e font), caratteri Unicode invisibili o percorsi non sicuri; nessuna riga aggiunta
sospetta (istruzioni di ignorare le precedenti, scarica-ed-esegui, invio di dati, segreti, installazioni, `rm -rf`,
`chmod +x`…, anche divise su due righe o scritte con caratteri equivalenti); limiti di file e dimensione; per le copie le
`edits` ancora applicabili e nessun fine riga CR. Le righe sospette sono un allarme, non una garanzia: un testo che dice
all'agente di fare danni senza quelle parole passa. Una sorgente con più skill si aggiorna solo se passano tutte.

**Eccezione sugli script** (decisa da Marco il 22/11/2026): la sorgente di `impeccable` ha `"allowScriptChanges": true` in
`catalog.json`, perché cambia gli script a quasi ogni rilascio. Per lei modifica, aggiunta, rimozione di script e cambio di
modo 100755 non bloccano e il report li elenca a parte (`Script cambiati`); restano attivi attesa, licenza, discendenza,
frontmatter, Unicode, binari, percorsi, limiti e le righe sospette, che valgono anche dentro gli script. Il campo è vietato
sulle copie ospitate (le predefinite): `build-index.mjs` lo rifiuta.

Poi ricostruisce `index.json`, esegue `--check`,
i test e `--verify` e, se tutto passa, committa e pubblica su `main`. Solo i casi bloccati (o un controllo fallito, nel
qual caso non si aggiorna nessuna skill) finiscono nell'issue «Skill di terzi da rivedere», con il motivo e il link al confronto:
si rivede il diff e si sposta `ref` a mano (per le copie, adattando le `edits`). `scripts/check-upstream.mjs` resta come
controllo di sola lettura.

## Gruppi

Ogni skill ha da 1 a 4 gruppi (può comparire in più gruppi): l'app li usa per filtrare l'elenco. Per i riferimenti si scrivono in `catalog.json` (campo `groups`, obbligatorio: la costruzione dell'indice fallisce senza); per le skill ospitate si aggiunge il nome in `hostedGroups` (il gruppo `zero1code skill` è automatico). Un nome con ` · ` (es. `SAP · ABAP`) è un sotto-gruppo di `SAP`.

## Skill predefinite dell'app

Le skill elencate in `defaultSkills` (`catalog.json`) sono ospitate qui e l'app desktop le installa da sola: l'indice le
segna con `default: true`. La build dell'app le prende da qui a un commit fissato (file `default-skills.lock.json` del
repo dell'app) e le include nell'installer, così ci sono anche al primo avvio senza rete; a ogni avvio l'app le porta
alla versione del catalogo, ma solo se l'utente non le ha modificate. Un push su `main` arriva quindi a tutti gli utenti
senza un rilascio dell'app (tranne per le predefinite con script, che cambiano solo col rilascio): i controlli che prima
si facevano al rilascio (la guida non nomina l'origine del motore) girano in CI (`scripts/default-skills.test.mjs`).
Aggiungere o togliere una predefinita richiede un rilascio dell'app.

- `zero1code-guida`: `guida.md` e `novita.md` sono anche la guida che l'app mostra nel pannello «Guida» (dalla copia
  inclusa nell'installer). Aggiorna `novita.md` per una versione solo quando quella versione è pubblicata.
- `zero1-code-review`: revisione delle modifiche da un punto fisso su due assi, regole del repository e aderenza alla
  specifica, con due sottoagenti (o in sequenza se non ci sono).
- `zero1-security-review`: revisione di sicurezza del codice, segnala solo ciò che è confermato; non lancia scanner né
  comandi di rete se l'utente non lo chiede.

## Controlli

`node --test "scripts/*.test.mjs"` e `node scripts/build-index.mjs --check` (offline: l'indice corrisponde a `skills/` e a `catalog.json`) girano
in CI. Limiti per skill: 200 file, 5 MB. `hasScripts: true` segnala `scripts/` o file eseguibili: l'app lo mostra prima
dell'installazione; rivedi ogni script prima di aggiungere la voce.

## Formato di `index.json` (schema 2)

`{ schema: 2, skills: [{ name, description, license, category, author, groups, hasScripts, default?, files: [{ path, size, sha256, url? }], source?, repo?, ref?, path? }] }`.
`url` è presente per i riferimenti ed è sempre un URL `raw.githubusercontent.com` con commit completo; l'app rifiuta
qualsiasi altro host.
