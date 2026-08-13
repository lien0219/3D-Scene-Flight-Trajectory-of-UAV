# Pull Request

## Summary

Describe the user-visible and architectural effects of this change.

## Validation

- [ ] `cd api && go test ./... && go vet ./...`
- [ ] `cd web && pnpm check && pnpm test && pnpm build`
- [ ] `cd web && pnpm test:e2e` when UI, WebSocket, Cesium, or Three.js behavior changed
- [ ] `cd web && pnpm lint:md` when Markdown changed
- [ ] Desktop and mobile screenshots reviewed when UI, workspace navigation, or 3D rendering changed

## Checklist

- [ ] The change is focused and backward compatibility is documented.
- [ ] New behavior includes proportionate tests.
- [ ] Configuration and public contracts are documented.
- [ ] Three.js resources, Cesium entities, subscriptions, and animation frames are cleaned up on unmount.
- [ ] New assets include source and license information in `THIRD_PARTY_NOTICES.md`.
- [ ] No credentials, tokens, private coordinates, or generated build output are included.
