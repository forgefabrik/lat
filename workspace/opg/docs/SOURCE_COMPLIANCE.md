# Source Compliance

This file tracks external sources OPG references for design ideas and ported features.
OPG is built from scratch; no code is copied verbatim from the sources below.
Only concepts, UX ideas, and feature behaviors are ported.

## Source A: texel-studio
- URL: https://github.com/EYamanS/texel-studio
- License: not yet verified — verify before production
- Ported behaviors: live pixel painting, reference image workflow, agent step timeline

## Source B: falsprite
- URL: https://github.com/lovisdotio/falsprite
- License: not yet verified — verify before production
- Ported behaviors: sprite-sheet generation, manual pixel editing, history, palette management

## Source C: free-image-generation-api
- URL: https://github.com/saurav-z/free-image-generation-api
- License: not yet verified — verify before production
- Ported behaviors: Cloudflare Workers REST wrapper around Workers AI, API-key auth, prompt-based sprite generation

## Compliance rule

Before any production deploy, verify each source license and confirm:
- which parts are MIT / source-available / commercial-allowed
- which parts must not be copied as competing SaaS

OPG will only port concepts, architecture ideas, UX ideas, and feature behaviors.
OPG will NOT copy unverified third-party code, assets, trademarks, or UI copies.
