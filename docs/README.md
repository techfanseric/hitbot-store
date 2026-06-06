# Docs Index

This directory separates source requirements, research evidence, design rules, implementation verification, and historical screenshots.

## Structure

| Path                   | Purpose                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `product/`             | Product requirements and meeting transcripts.                                                            |
| `research/`            | Research reports for the public website and HitbotOS prototype.                                          |
| `research/references/` | Screenshots captured during research. These are evidence/reference assets, not implementation snapshots. |
| `design/`              | Design-system source, token mapping, and measured header/footer rules.                                   |
| `verification/`        | M0 acceptance checklist and final implementation screenshots.                                            |
| `audits/`              | Temporary audit screenshots from review passes.                                                          |
| `archive/`             | Historical design iterations kept for traceability.                                                      |

## Source Of Truth

- Product scope: `product/PRD.md`
- Design source: `design/store-design-system.html`
- Implemented token mapping: `design/DESIGN-TOKENS.md`
- Header/footer measurements: `design/header-footer-spec.md`
- Official website integration review: `design/hitbot-cc-store-integration-review.md`
- M0 verification: `verification/M0-VERIFICATION.md`

## Screenshot Policy

Keep final, user-facing verification captures in `verification/screenshots/`.
Keep research captures under `research/references/`.
Keep process or audit captures in dated folders under `audits/`.
Move superseded design iterations to `archive/` instead of mixing them with current verification assets.
