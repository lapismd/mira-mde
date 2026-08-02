# `@lapismd/mira-plugin-ai`

Optional Mira extension for consumer-owned AI workflows. The package never
selects a model or owns credentials; provide an asynchronous `run` callback.

```ts
import { aiExtension } from "@lapismd/mira-plugin-ai";

const extension = aiExtension({
  async run(request) {
    return runYourModel(request.prompt);
  },
});
```

See the AI plugin Storybook page and `spec/src/plugins/ai.md` for the complete
contract.
