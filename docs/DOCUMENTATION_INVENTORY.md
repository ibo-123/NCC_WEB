# NCC_DSA Documentation Inventory

Package: `NCC_DSA_Documentation_Package.zip`. Built from the documents produced and revised in the project conversation. File contents were copied byte for byte; nothing was reconciled, rewritten or re-approved while packaging. This inventory is the only file added.

## 1. How to apply
Copy the **contents of `repo/`** (`README.md` and `docs/`) into the repository root. `DOCUMENTATION_INVENTORY.md` is a packaging record and is not meant to be committed. The layout is flat (`docs/<FILE>.md`) on purpose: the documents reference each other by those paths, and changing them would require editing approved content.

## 2. Included files
| Package path | Source location | Class | Revision and status | sha256 | Bytes |
|---|---|---|---|---|---|
| `repo/README.md` | `/mnt/user-data/outputs/README.md` | Supporting | Project README for the repository root. Revised in Phase 3 batch 4; status lines predate the approvals listed in section 5. | `cd8c7a3bc97593ad…` | 3089 |
| `repo/docs/DECISIONS.md` | `/mnt/user-data/outputs/docs/DECISIONS.md` | Authoritative (frozen) | Header: batches A-B, revision 5 (final candidate). Decision authority. Frozen by the lead. | `c0395c1f4e3f95e0…` | 26303 |
| `repo/docs/MASTER_ARCHITECTURE.md` | `/mnt/user-data/outputs/docs/MASTER_ARCHITECTURE.md` | Authoritative (frozen) | Header: batch B, revision 5 (final candidate). Architecture authority. Frozen by the lead. | `51ae423e048174cd…` | 38419 |
| `repo/docs/DATABASE_SCHEMA.md` | `/mnt/user-data/outputs/docs/DATABASE_SCHEMA.md` | Authoritative | Header: batch C, revision 3. Approved by the lead as the implementation baseline with open items (approval recorded in conversation, see section 5). | `d7f00803c523a760…` | 31806 |
| `repo/docs/AUTH_AND_SECURITY.md` | `/mnt/user-data/outputs/docs/AUTH_AND_SECURITY.md` | Authoritative (contract draft) | Header: batch 1. S-1, S-2, S-3, S-5, S-7, S-8 provisionally approved; S-4 per-IP threshold not fixed; S-6 replay prevention approved. | `35949345aa488579…` | 22211 |
| `repo/docs/API_CONTRACT.md` | `/mnt/user-data/outputs/docs/API_CONTRACT.md` | Authoritative (contract draft) | Header: batch 2. Contract direction approved; LA-1 to LA-5 and BLOCKED items stay blocked. | `03db1d58c9092124…` | 21296 |
| `repo/docs/SERVICES.md` | `/mnt/user-data/outputs/docs/SERVICES.md` | Authoritative (contract draft) | Header: batch 4. Direction approved; BLOCKED items still blocked. | `e6ba82951e16eaa1…` | 11313 |
| `repo/docs/TEAM_WORKFLOW.md` | `/mnt/user-data/outputs/docs/TEAM_WORKFLOW.md` | Authoritative (contract draft) | Header: batch 3. Ownership assignments confirmed by A1 (middleware A4, admin dashboard A5, admin audit-log A4). | `3c5cd8f15d820a4c…` | 8226 |
| `repo/docs/IMPLEMENTATION_PLAN.md` | `/mnt/user-data/outputs/docs/IMPLEMENTATION_PLAN.md` | Authoritative (contract draft) | Header: batch 3. Gates and launch blockers LB-1 to LB-4. | `838e40aea1800e53…` | 7027 |
| `repo/docs/audit/NCC_DSA-architecture.md` | `/mnt/user-data/outputs/docs/audit/NCC_DSA-architecture.md` | Historical | Original architecture audit against commit e4418cc plus a status banner. Not a current contract. | `894cff75ef105741…` | 47181 |

Full sha256 values:

- `repo/README.md`: `cd8c7a3bc97593ad6293e4887dbc7949224f8e0fb85dec7147c4e8d8ca1477a8`
- `repo/docs/DECISIONS.md`: `c0395c1f4e3f95e09cd678e792ae2e56fdf26446e23483e9a5ad840f6e0d8fe0`
- `repo/docs/MASTER_ARCHITECTURE.md`: `51ae423e048174cd082f4a678882049719eb642dfa52bdd49b8795b02827ee42`
- `repo/docs/DATABASE_SCHEMA.md`: `d7f00803c523a76051850c207ed5f8533963361db3a6669855f3fffc0f90db33`
- `repo/docs/AUTH_AND_SECURITY.md`: `35949345aa488579497781eac6a868bd8a6c0f836b3818d96666bc30c7991e5d`
- `repo/docs/API_CONTRACT.md`: `03db1d58c90921242635ad32dd146837e47ccf7acb9475a437637bb076433b18`
- `repo/docs/SERVICES.md`: `e6ba82951e16eaa17a1f0e9340533577829790a4878d875476fa7e0f94add3b1`
- `repo/docs/TEAM_WORKFLOW.md`: `3c5cd8f15d820a4c4870975fd47e67352ae9d3ae733c53eab86084d723b96353`
- `repo/docs/IMPLEMENTATION_PLAN.md`: `838e40aea1800e538b515668c69091dc6c0085d26363dbc18e24718055f4c001`
- `repo/docs/audit/NCC_DSA-architecture.md`: `894cff75ef1057415477ae10daae477020a5ab49105cb5f51386372c5470d17d`

## 3. Version comparison
The repository at HEAD `851c94f` holds earlier drafts of nine documents at its root. Comparison with the included versions:

| File | Repository copy | Result |
|---|---|---|
| `README.md` | `/home/claude/NCC_WEB/README.md` (commit 851c94f) | differs from the included version (superseded) |
| `DECISIONS.md` | `/home/claude/NCC_WEB/DECISIONS.md` (commit 851c94f) | differs from the included version (superseded) |
| `MASTER_ARCHITECTURE.md` | `/home/claude/NCC_WEB/MASTER_ARCHITECTURE.md` (commit 851c94f) | differs from the included version (superseded) |
| `DATABASE_SCHEMA.md` | `/home/claude/NCC_WEB/DATABASE_SCHEMA.md` (commit 851c94f) | differs from the included version (superseded) |
| `AUTH_AND_SECURITY.md` | `/home/claude/NCC_WEB/AUTH_AND_SECURITY.md` (commit 851c94f) | differs from the included version (superseded) |
| `API_CONTRACT.md` | `/home/claude/NCC_WEB/API_CONTRACT.md` (commit 851c94f) | differs from the included version (superseded) |
| `TEAM_WORKFLOW.md` | `/home/claude/NCC_WEB/TEAM_WORKFLOW.md` (commit 851c94f) | differs from the included version (superseded) |
| `IMPLEMENTATION_PLAN.md` | `/home/claude/NCC_WEB/IMPLEMENTATION_PLAN.md` (commit 851c94f) | differs from the included version (superseded) |
| `NCC_DSA-architecture.md` | `/home/claude/NCC_WEB/NCC_DSA-architecture.md` (commit 851c94f) | identical body except the added banner |

No filename appears twice in the package. Only the latest version of each document is included.

## 4. Not packaged, and why
| Item | Location | Reason |
|---|---|---|
| Earlier drafts of `README`, `DECISIONS`, `MASTER_ARCHITECTURE`, `DATABASE_SCHEMA`, `AUTH_AND_SECURITY`, `API_CONTRACT`, `TEAM_WORKFLOW`, `IMPLEMENTATION_PLAN` | repo root at `851c94f`; also `/mnt/user-data/outputs/original-drafts/` for five of them | Superseded by the included versions; kept in git history. Including them would put two conflicting versions under one filename. |
| Intermediate working copies (`DECISIONS_v1-v5`, `MASTER_v1-v5`, `SCHEMA_v1-v3`, backups) | `/tmp` | Scratch backups made during editing; not approved versions. |
| `NCC_DSA Phase 2: Conflict and Gap Report` | A Claude Doc, https://claude.ai/artifact/UwDviDcwofzL671c2HaxZw | Not a file in the sandbox and not exported. Its findings are superseded by the approved decisions in `DECISIONS.md`. Export it from the Doc if you want a copy. |
| Implementation increment 1 (`package.json`, lockfile, `vitest.config.mjs`, `tests/tooling.test.js`, patch) | `/mnt/user-data/outputs/implementation/a2-tooling/` | Application and tooling files, not documentation. |
| Prototype, `.env.example`, `node_modules`, `.next`, build output | repo | Not documentation; nothing secret was included. |

## 5. Approvals granted after the last revision of these files
The file text predates these lead decisions, which were given in the conversation. The files were **not** edited to reflect them.

1. **Batch C approved with open items.** `DATABASE_SCHEMA.md` revision 3 is the implementation baseline, including decisions A1 to C4 and the three corrections. The `twoFactor.lastUsedStep` field is approved. Handle patterns, resource-URL length, the `unmatchedHandles` cap, lazy-closure audit logging and the B16 wording stay unresolved. Index verification by A3 has not happened. Stale wording: `README.md` lines 10 and 34; `DATABASE_SCHEMA.md` header and the `lastUsedStep` row (marked PROPOSED); `AUTH_AND_SECURITY.md` header; `TEAM_WORKFLOW.md` section 4 item 1 and section 5/6; `IMPLEMENTATION_PLAN.md` lines 10, 15 and 25.
2. **Tooling approved.** Node `^22.12.0 || ^24.0.0` (no Node 20 fallback without approval); exact versions `bcryptjs` 3.0.3, `otpauth` 9.5.2, `server-only` 0.0.1, `vitest` 5.0.3, `@playwright/test` 1.63.0, `mongodb-memory-server` 11.3.0; `qrcode` deferred until 2FA is enabled; the PostCSS/Next advisory accepted provisionally, with A2 to investigate a compatible override. The frozen `MASTER_ARCHITECTURE.md` section 3 still lists these as PROPOSED.
3. **Findings from implementation increment 1 (not in any document).** `vitest@5.0.3` fails to install with npm 10.9.7 and installs with npm 11, so dependency changes need npm 11 (installs from the lockfile work with npm 10). An override `postcss: 8.5.30` removed the audit findings in testing. The sandbox cannot reach Google Fonts, the `mongod` download or the Playwright browser download, so the build was verified only in a font-free copy and replica-set tests were not run. ESLint 9.39.5 is reported deprecated.

## 6. Known unresolved decisions and conflicts
- **No conflicting versions** of any included document were found.
- **Unresolved decisions** are tracked in `docs/DECISIONS.md` (sections 4.1, 6, 8) and `docs/AUTH_AND_SECURITY.md` section 12: LA-1 to LA-5, the NCC approvals, launch blockers LB-1 to LB-4, the S-4 per-IP threshold, and the five BLOCKED response contracts.
- **Stale status text** listed in section 5, item 1, is a documentation lag, not a contradiction of an approved decision.

## 7. Searched for and not found
- `TRACEABILITY.md`, `CHANGE_REPORT.md`: planned in an early README, never created, and dropped when the lead ended further documentation batches. The included README no longer links them.
- `NCC_DSA_ARCHITECTURE_AUDIT.md`: the name used in a prompt; the actual file is `NCC_DSA-architecture.md`.
- A `docs/` folder in the repository: absent at `851c94f`.
- Uploaded files, transcripts and tool-result files: the folders `/mnt/user-data/uploads`, `/mnt/user-data/tool_results` and `/mnt/transcripts` are empty.

## 8. Sources inspected
Inspected: the repository clone (`/home/claude/NCC_WEB`, HEAD `851c94f`, working tree), `/mnt/user-data/outputs`, the three empty `/mnt/user-data` and `/mnt/transcripts` folders, `/tmp`, and `/home/claude` (a full-text search of Markdown and text files for the project name). **Not accessible:** your own machine, the GitHub repository beyond the public clone, other Claude accounts' workspaces, and the content of the Claude Doc (existence confirmed earlier, not re-read here). The package therefore contains every document found in the accessible sources, not necessarily every document ever created.
