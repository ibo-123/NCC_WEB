# NCC DSA Platform — Engineering Documentation

These documents are the shared engineering source of truth for the six-account Claude team.

## Read order
1. `MASTER_ARCHITECTURE.md`
2. `DECISIONS.md`
3. `DATABASE_SCHEMA.md`
4. `AUTH_AND_SECURITY.md`
5. `API_CONTRACT.md`
6. `TEAM_WORKFLOW.md`
7. `IMPLEMENTATION_PLAN.md`

The architecture audit is an input, not proof that the app builds or that every prototype state is implemented. Confirm current repository contents and validate the prototype before implementation.

## Authority and change control
- Approved decisions in `DECISIONS.md` and contracts in these files override individual assumptions.
- If documents conflict, stop and report the conflict to the project lead. Do not silently choose one.
- Only the lead may approve changes to shared contracts. A contract change must update every affected document and include migration/compatibility notes.
- Items marked **OPEN** or **PROPOSED** are not final business policy.
- Do not commit secrets, `.env` files, real personal data, or production credentials.

## Current status
These documents are an initial contract draft derived from the architecture audit summary. Review against the full audit and repository before treating the endpoint list or schema details as frozen.
