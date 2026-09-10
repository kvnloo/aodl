# Security

AODL is a specification and a static validator. It does not spawn agents, hold tokens, or execute graphs.

- Do not open issues with secrets, pairing tokens, or ChatGPT/Hermes transcripts.
- `~/.dash/token`, API keys, and Relay tokens belong in the consuming product, never here.
- Unknown `specVersion` and undeclared privileged capability (`payment`, `sudo`, `secret`, …) fail closed by design. Weakening those checks is a security change.
- Report vulnerabilities privately to the maintainer (`kvnloo`). There is no runtime to RCE.
