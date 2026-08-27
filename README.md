# TrustPay web

The TrustPay web client is a React 19, Vite 8, and Tailwind CSS 4 application. It presents project records maintained by `trustpay-api`; it does **not** hold, release, transfer, safeguard, or guarantee money.

## M00 baseline

M00 records the executable baseline and removes prototype credential leakage from production builds. The screen/component/token inventory, responsive test plan, accessibility baseline, known limitations, and shared security evidence are in [docs/m00-baseline.md](docs/m00-baseline.md) and the API's [M00 control register](../trustpay-api/docs/m00-baseline.md) when the repositories are checked out side-by-side.

## Requirements

- Node.js 22 (Mise configuration: `.mise.toml`)
- pnpm 10.34.3 (`packageManager` in `package.json`)
- A local API at `http://localhost:3001` by default

Install reproducibly with the committed lockfile:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3001` | TrustPay API origin used for credentialed browser requests |

The local development server listens on port 8443. Run the API database setup and API server first. Development-only prototype-account shortcuts are intentionally omitted from production builds; use the normal organization invitation/login flow for any non-development environment.

## Checks

```powershell
pnpm run typecheck
pnpm run format:check
pnpm run build
pnpm run check
```

There is no frontend automated test harness in the established baseline. M00 does not add one; browser smoke, responsive, and keyboard verification are documented in `docs/m00-baseline.md`. CI runs type checking, formatting, build, dependency auditing, and secret scanning.
