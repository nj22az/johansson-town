# Inputs: Nhung becomes the island doctor (22 October 2026)

- **Task (the owner, 22 October 2026):** "Audit the doctor use the best looking one", then "Can they be consolidated into
  other characters? Have this female doctor replace Nhung". Answers to the follow-up questions, same day:
  - Nhung becomes the doctor: she keeps her name, family (Kōji, Riku, her sisters) and home at 3 Kitahama, takes the
    clinic doctor's look (white coat over a pale-blue shirt, half-rim glasses, ponytail, white shoes) and the post. Dr Ken
    Kakazu retires into her; his stories and schedule go to her.
  - The paper: Nhung does both; she prints it in the evenings.
  - The bookshop: Sakura takes the stock (books and stationery, and the office-supply trade); Front-Row stays as the
    paper's print room, where Nhung works in the evenings.
  - Weekends: clinic on Saturday (9–12), Sakura on Sunday.
- **Audit result (before the owner's second message):** the clinic room's own `DOCTOR_RECIPE` (white coat, glasses) read
  as a doctor at a glance; the cast's Dr Kakazu (plain smock) did not. Stills: scratchpad `before/` of session
  01285rM173huMzsYB78mhTfM (not committed).
- **Output:** `johansson-town/src` (roster, cast, avatars, clinic, social day, Sakura rota, merchandising), the guide, the
  tests that state the old canon, a rebuilt runtime, and this folder.
- **Scope limits:** no new buildings or geometry; the Front-Row building stays as drawn. Thuan's weekend on Kitano-jima
  (addendum 4) is not changed.
- **Fixed evaluator:** `node tools/ci-guard.mjs` (baseline taken before the change) plus every test file that names
  Nhung, Dr Kakazu, Front-Row or Sakura's rota, run before and after.
