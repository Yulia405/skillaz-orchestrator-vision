# Retail learning demos

Three fictional, protected programmes are bundled in `learning-data.js`:

| ID | Programme | Cards | Branches |
| --- | --- | --- | --- |
| retail-learning-new | New employee training | 45 | Common + cashier, sales, shelf replenishment |
| retail-learning-cycle | Recurring verification and remediation | 41 | Same four branches |
| retail-learning-update | New product and standards | 45 | Same four branches |

Each has six stages, role-specific experts, a group curator, tests and field evaluation sheets. Goals and adaptation checkpoint meetings are excluded. Existing adaptation demos and user drafts retain their previous behaviour.

## Demonstration

Open a programme from the process list, then **Проверить путь**. Pick a position and start. Complete cards, enter test scores, or flag a critical field assessment mistake. A failed cyclical diagnostic assigns two courses. Practice waits for both common and role knowledge. Failed practice assigns a remedial course and an expert-reviewed task. Three unsuccessful attempts pause the demo route and record an escalation.

The simulator operates in memory. It does not send notifications or enrol real employees. Launch events, publication versions and six/twelve-month cadence are editable prototype configuration; no production scheduler or HRIS integration is implied.

## Persistence and catalogue

Programme changes are stored per built-in ID in browser localStorage, with a seed schema version. Built-ins cannot be deleted from the list; their launch page can restore the seed. Drafts are still stored by the existing demo database. Saving a simulation does not change the programme.

Each programme has a scoped catalogue, nine extra retail practice cases, and a scoped live AI request using the existing server endpoint. AI proposals must be reviewed before addition. Existing titles/source IDs are excluded; catalogue fallback is labelled by the existing AI UI. Outcomes of new AI cards remain configurable with **Если выполнен / не выполнен**.

All seed arrows use exact placement keys (`cell::itemId`). Moving a seed card remaps incoming/outgoing routes and prerequisites by its unique ID. The simulator supports seed actions (assign, repeat, notify, escalate, pause, continue); it does not execute third-party catalogue integrations.

## Verification

`node --test tests/learning-demos.test.cjs tests/workflow-scenarios.test.cjs`

Tests cover nine successful role paths, remedial paths, AND prerequisites, multiple course assignment, field thresholds/critical mistakes, attempt limits, overdue notifications and moving cards. Existing adaptation regression tests run in the same command.
