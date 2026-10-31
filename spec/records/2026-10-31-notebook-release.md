# Notebook dependency release preflight

On 2026-10-31 the user authorizes pushing, merging and releasing Notebook and
the repositories changed for its implementation. The earlier review-only pause
is superseded. Visual baselines remain unchanged.

## Exact candidate

The candidate combines the verified directive-fence repair `10a0bce0` and
recursive-embed repair `94e7ee05` on fetched main `982614b4`. Both affect only
the existing public Mira package. One patch Changeset covers both changes.
The source records retain 520 unit cases, 178 interaction/accessibility stories,
60 cold browser acceptances, strict quality, six public package consumers,
static Storybook and specification qualification. Notebook independently
passes 431 tests and 47 stories against the checksum-pinned source archive.

The release remote is fetched over HTTPS after the SSH agent refuses signing.
Fresh open Dependabot queries return zero. No empty dependency PR is created.
Existing lint-tool audit overrides retain their scoped source qualification.

## Workspace inventory

Every registered workspace is inspected and compared with the candidate.
Available roots are clean. Missing legacy roots are not recreated or removed;
their uncommitted state is unknown and their registered histories are preserved.
The complete status/head/ancestry inventory is retained under the ignored
`.local/release-preflight/notebook-20261031/workspace-inventory.json`.

| Workspace                            | Disposition                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| default                              | Clean; parent included in main/candidate.                                                                                        |
| desktop-migration                    | Clean; parent included.                                                                                                          |
| inline-links                         | Clean; parent included.                                                                                                          |
| notebook-fences                      | Clean verified source candidate; owns this release record.                                                                       |
| npm-release                          | Clean; parent included.                                                                                                          |
| static-registry-ci                   | Clean; parent included.                                                                                                          |
| wave3-release                        | Clean; parent included.                                                                                                          |
| bits-intake-20261025                 | Root unavailable; registered parent included.                                                                                    |
| bits-intake-pack-validation-20261025 | Root unavailable; registered parent included.                                                                                    |
| input-lease-20261026                 | Root unavailable; registered parent included.                                                                                    |
| preview-attachment-tracking-20261026 | Root unavailable; older writer-identity implementation is production-equivalent to main in the owning preview files.             |
| properties-edit-boundary-20261026    | Root unavailable; older writer/property implementation is production-equivalent to main in the owning preview/frontmatter files. |

No independent unfinished work is imported, deleted or overwritten. Publication
must use the repository's verified artifact and manifest workflow; hosted checks,
version PR, npm publication and registry verification are recorded as they finish.
