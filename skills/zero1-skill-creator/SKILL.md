---
name: zero1-skill-creator
description: >
  Guide the user through creating, improving or checking an agent skill (a SKILL.md with instructions the agent loads
  on demand) and save it where zero1code reads it. Use when the user says "crea una skill", "voglio una skill che...",
  "trasforma questa procedura in una skill", "migliora/correggi la mia skill", or asks how to teach the agent a
  repeatable task, a house style or a company procedure.
license: MIT
metadata:
  category: Skill
  author: zero1code
---

# Creating a skill

A skill is a folder with a `SKILL.md`: a short header (`name`, `description`) and the instructions. The agent always
sees the header of every skill, and loads the body only when a request matches the description. So: the description
decides **when** the skill is used, the body decides **how well** it is done.

Talk to the user in their language. Be brief: ask only what you need, then write.

## 1. Understand the task (ask, don't guess)

Ask at most four short questions, skipping what the user already said:

1. What should the agent do with this skill? Ask for one real example request, with input and the result they expect.
2. When should it apply, and when not (which requests, files, situations)?
3. Are there fixed rules: format, tone, company wording, mandatory steps, things to never do?
4. Should it be only for zero1code, or shared with the user's other coding tools (global)?

If the user pasted a procedure, a document or an example output, work from it: extract the steps and the rules.

## 2. Write the description first

The description is the most important line. In 1-3 sentences say **what the skill does and when to use it**, naming the
situations, request phrases or file types that should trigger it (in the user's language and the words they would
really type). Make it specific enough not to fire on unrelated requests and wide enough to fire on the real ones.

Good: "Scrive e riassume verbali di riunione nel formato aziendale (decisioni, azioni con responsabile e scadenza).
Usala quando l'utente chiede un verbale, un riassunto di riunione o le azioni emerse da una chiamata."
Weak: "Aiuta con le riunioni."

Agents tend to under-use skills: when the description is timid, the skill sits unused even when it would help. So be
a little insistent: add the near-neighbours of the request ("also when the user does not say 'skill' or names the
document only by its purpose") and the typical wording, including casual or misspelled phrasings. Keep the "when" in
the description, not in the body: the body is read only after the skill has already been chosen.

Maximum 1024 characters. Then re-read it as if you were the agent seeing only the header: would you pick this skill for
the example request from step 1? And would you wrongly pick it for a similar but different request?

## 3. Write the body

- Start with the goal in one sentence, then **when to use it** and **when not to**.
- Give the steps as a numbered list of imperative instructions the agent can follow without guessing.
- Show the expected output once (a short template or example), not five.
- State the rules and the failure cases ("se manca la data, chiedila; non inventarla").
- Explain **why** for rules that are not obvious. Prefer "use the company wording, because clients compare documents
  side by side" to "ALWAYS use the company wording": capitals and rigid commands make the agent literal and brittle,
  a stated reason lets it handle cases you did not foresee. If you catch yourself shouting, rewrite as a reason.
- Write for the general case, not only for the user's one example: a skill that works only on that example is useless
  the second time. Prefer a short example of the pattern ("Input: ... Output: ...") to a long list of special cases.
- Keep it short: every line should earn its place; cut what does not change the agent's behaviour. Aim well under
  500 lines.
- Layer the content (progressive disclosure): the header is always loaded, the body whenever the skill triggers, extra
  files only when needed. So keep `SKILL.md` to the workflow and the rules; move long material (templates, glossaries,
  tables, one file per variant such as `references/cliente-a.md`) to `references/...` and say in the body **when** to
  read each file. Put deterministic or repetitive operations (convert, validate, compute) in small scripts under
  `scripts/...` and say how to run them: a script runs without filling the agent's context.
- No secrets, tokens or passwords: skills are plain files and may be shared.

## 4. Save it

Use the helper, which validates and never overwrites an existing skill. Write the body to a temporary file first:

```bash
python scripts/skill_tool.py new verbali-riunione --scope local \
  --description "Scrive verbali di riunione nel formato aziendale. Usala quando..." \
  --body-file corpo.md
```

- `--scope local`: only zero1code (`~/.dsh/skills/<name>`).
- `--scope global`: shared library `~/.agents/skills/<name>` plus a link so zero1code uses it too.
- Names: lowercase letters, digits, `-`, `.`, `_`, at most 64 characters, equal to the `name` in the header.
- Extra files (references, scripts) go inside the same folder: create them next to `SKILL.md` after `new`.

Then run `python scripts/skill_tool.py check <name>`; fix every error and read the advice.

## 5. Test it with the user

1. Tell the user the skill is saved; it appears in the Skill panel and in the `/` menu (a new chat may be needed).
2. Agree on 2-3 realistic requests, written the way the user would really type them (one is the example from step 1,
   one is a variant, one is a near-miss that should **not** use the skill). Vague test prompts prove nothing.
3. Run them one at a time in a new chat, with the skill, and look at what actually happened, not only the final
   answer: did the skill load? did the agent follow the steps or skip some? did it waste time on something useless?
   Ask the user to judge the result and say what was missing or wrong.
4. Fix the cause, not the symptom. Did not trigger or triggered too often: adjust the description. Result off: adjust
   the body, preferably by explaining the reason of the rule rather than adding a stricter command. The same helper
   code written by hand in every run: put it in `scripts/`. Keep changes small, run `check`, repeat the requests.
5. Stop when the user is satisfied or after three rounds without real progress; then say what is still open.

## Improving an existing skill

Read its `SKILL.md` first, change only what the user asked, keep the header valid (`name` unchanged), and run `check`.
If it is shared (global), say that the change applies to the user's other tools too. Never delete a skill without an
explicit request.
