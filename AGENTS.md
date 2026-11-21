# AGENTS.md — zero1code-skills

Regole per qualunque agente di coding in questo repo. `CLAUDE.md` importa solo questo file.

Catalogo pubblico delle skill letto dall'app desktop di zero1code. Ogni modifica a una skill ricostruisce `index.json` (`node scripts/build-index.mjs`) nello stesso commit; i test (`node --test scripts/`) devono passare.

## Skill e comunicazione — NON NEGOZIABILE

- Invoca con il tool Skill le skill pertinenti PRIMA di iniziare, non a posteriori: UI → `ui-ux-pro-max`; codice → `ponytail lite`; nessuna copre il task → `find-skills`. A fine task elenca le skill usate ("nessuna" richiede motivo).
- Comunicazione: `caveman` ultra, italiano per le spiegazioni, inglese per identificatori e commenti di codice, zero filler.
- Se esiste `graphify-out/`, per architettura, flussi e impatto interroga prima il grafo (`graphify query "..."`); Grep/Read solo per confermare.

## Git

- Commit, push e ogni altra operazione Git solo su richiesta esplicita dell'utente, una volta per ciascuna.
- Mai segreti (chiavi, `.env`, password) nel codice, nei log o nei commit.
