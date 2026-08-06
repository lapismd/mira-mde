# AI Plugin

`@lapismd/mira-plugin-ai` contributes portable editor actions while leaving model
selection, credentials, networking, persistence, and policy to the consumer.

## Requirements

| ID          | Requirement                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| MIRA-AI-001 | The AI plugin MUST accept a consumer-owned asynchronous `run` callback and MUST NOT call a model provider directly. |
| MIRA-AI-002 | AI contributions MUST be usable through slash commands, block actions, and optional declarative toolbar actions.    |
| MIRA-AI-003 | AI actions MUST respect readonly and selection/block context supplied by the Mira extension runtime.                |
| MIRA-AI-004 | Storybook MUST provide a deterministic stubbed AI story and interaction test with no network dependency.            |

The plugin is an orchestration adapter, not an agent runtime or data store. Its
implementation consumes editor context and block-range helpers through the
supported `@lapismd/mira/extensions` contract rather than importing CodeMirror
implementation modules.

The package is shipped only as `@lapismd/mira-plugin-ai`, begins at `0.0.1`, and
then versions independently with a package-owned changelog. Its source,
manifest, packed output, Storybook examples, and tests must not retain the
pre-release package identity. Its public Mira dependency uses `workspace:~` so
the packed pre-1.0 range remains compatible without accepting unrelated minor
releases.
