### PR Checklist

**SAFE Cleanup Required**

- [ ] `pnpm run audit:references`
- [ ] `pnpm run audit:links`
- [ ] `pnpm run audit:duplicates`
- [ ] `pnpm run audit:scripts`
- [ ] `pnpm run audit:assets`
- [ ] `pnpm run audit:binaries`
- [ ] `pnpm run test:smoke` (ensure green smoke test)