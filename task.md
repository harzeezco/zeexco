Task 6.4B implementation is complete. Do NOT redesign or expand the feature.

Your job is to perform final verification and reconcile the frontend against the actual Task 6.4A backend contract.

## Development / E2E environment

The Zeexco backend currently runs locally in Docker.

Backend API container/service:

```text
zeexco-api
```

Backend application/container port:

```text
8080
```

Local host API base URL:

```text
http://localhost:8080
```

The hosted frontend is:

```text
https://www.zeexco.com
```

For real WhatsApp E2E testing, the hosted frontend cannot use localhost directly.

We will expose:

```text
http://localhost:8080
```

through a Cloudflare Quick Tunnel:

```bash
cloudflared tunnel --url http://localhost:8080
```

This produces a temporary HTTPS URL conceptually like:

```text
https://<random-name>.trycloudflare.com
```

The hosted frontend must use that HTTPS tunnel URL as:

```env
NEXT_PUBLIC_API_BASE_URL=https://<current-tunnel>.trycloudflare.com
```

Do NOT hardcode a specific Quick Tunnel hostname because Quick Tunnel URLs are ephemeral.

Do NOT change the application to use `localhost:8080` from the production-hosted browser.

The backend must allow the frontend origin:

```text
https://www.zeexco.com
```

through its existing CORS configuration.

For local frontend development, the backend remains reachable directly at:

```text
http://localhost:8080
```

---

## 1. Verify the actual backend contract

Inspect the Task 6.4A backend/OpenAPI implementation.

Confirm exactly:

- `GET /api/v1/whatsapp/onboarding/validate?token=...`
- `POST /api/v1/whatsapp/onboarding/register`
- `POST /api/v1/auth/register`

Verify:

- exact request bodies;
- exact success response bodies;
- HTTP status codes;
- actual error response shape;
- actual error-code field name;
- actual error-code values;
- behavior of `FIRST_PRODUCT_PENDING`;
- whether web registration returns authentication/session information or requires subsequent login.

Do not continue supporting guessed contracts if the backend proves otherwise.

Update the frontend only where required to match the real backend.

---

## 2. Confirm WhatsApp registration contract

The intended contract is:

```json
{
  "first_name": "Wakil",
  "last_name": "Azeez",
  "business_name": "Wakil Stores",
  "onboarding_token": "<token>"
}
```

or optionally:

```json
{
  "first_name": "Wakil",
  "last_name": "Azeez",
  "business_name": "Wakil Stores",
  "email": "optional@example.com",
  "onboarding_token": "<token>"
}
```

Verify that the frontend:

- never sends password;
- never sends confirm_password;
- omits empty email;
- sends the onboarding token;
- does not send WhatsApp number;
- does not send provider identity;
- does not send User ID;
- does not send Business ID.

---

## 3. Confirm Web registration contract

Verify `/register` sends:

```json
{
  "first_name": "Wakil",
  "last_name": "Azeez",
  "business_name": "Wakil Stores",
  "email": "wakil@example.com",
  "password": "..."
}
```

`confirmPassword` is frontend validation only and must NOT be sent to the backend.

No onboarding token should be sent.

---

## 4. Verify API base URL behavior

Inspect `lib/api-client.ts`.

Confirm:

```text
NEXT_PUBLIC_API_BASE_URL
```

is used as the Axios base URL when configured.

The code must work with:

```env
NEXT_PUBLIC_API_BASE_URL=https://<cloudflare-quick-tunnel>.trycloudflare.com
```

Do not append `/api` automatically unless that matches the actual backend route structure.

For example, given:

```env
NEXT_PUBLIC_API_BASE_URL=https://example.trycloudflare.com
```

WhatsApp validation should resolve to:

```text
https://example.trycloudflare.com/api/v1/whatsapp/onboarding/validate?token=...
```

and WhatsApp registration to:

```text
https://example.trycloudflare.com/api/v1/whatsapp/onboarding/register
```

Do not expose or log the onboarding token.

---

## 5. CORS reconciliation

Confirm the backend CORS configuration permits requests originating from:

```text
https://www.zeexco.com
```

Do not solve CORS by allowing every origin globally unless the existing development policy explicitly requires that.

The target E2E path is:

```text
www.zeexco.com
        ↓
Cloudflare HTTPS tunnel
        ↓
localhost:8080
        ↓
zeexco-api
```

---

## 6. Run automated tests

Run the complete relevant Vitest suite.

The previous run found DOM cleanup leakage and cleanup was added.

Verify the fix with a fresh final run.

Do not report PASS unless the final run actually passes.

---

## 7. TypeScript

Run the TypeScript typecheck after all current Task 6.4 changes.

Report the exact result.

---

## 8. Lint

Run the normal lint command.

Fix Task 6.4-related failures.

Report the final result.

---

## 9. Production build

Run the normal Next.js production build.

Verify:

- `/register` builds;
- `/whatsapp/register` builds;
- App Router/Suspense requirements;
- environment handling;
- React Query integration.

Report the final result.

---

## 10. Security regression

Confirm:

- onboarding token is not rendered;
- onboarding token is not logged;
- onboarding token is not stored in localStorage;
- onboarding token is not stored in sessionStorage;
- onboarding token is not directly included in React Query query keys;
- WhatsApp registration contains no password;
- Web registration does not send onboarding tokens;
- WhatsApp registration does not trust client-supplied WhatsApp identity.

---

## 11. Route regression

Confirm:

```text
/register
→ Web registration
```

```text
/whatsapp/register?token=...
→ WhatsApp registration
```

and legacy:

```text
/register?token=...
```

redirects to the canonical WhatsApp route while preserving the token.

There should be only one permanent WhatsApp registration implementation.

---

## 12. Missing-token behavior

Verify:

```text
/whatsapp/register
```

without a token shows the intended invalid-link state and does NOT display the registration form.

---

## 13. Visual smoke check

If browser tooling is available, perform a mobile-width smoke check of:

- `/register`;
- `/whatsapp/register` missing-token state;
- valid-token WhatsApp registration if a safe development token exists.

If no valid token exists, state this clearly.

---

## 14. Do not expand scope

Do NOT implement:

- Products;
- WhatsApp passwordless login;
- Payments;
- KYC;
- account merging;
- Redux;
- staff management;
- new authentication architecture.

---

## 15. Final report

Return:

1. Backend contract inspected.
2. Validation endpoint exact response.
3. WhatsApp registration exact success response.
4. Web registration exact success response.
5. Actual backend error shape.
6. Actual error-code field.
7. Error codes reconciled.
8. `FIRST_PRODUCT_PENDING` behavior.
9. Web post-registration behavior.
10. WhatsApp payload.
11. Web payload.
12. Axios base URL behavior.
13. Local backend URL confirmed.
14. Container/API port confirmed.
15. Cloudflare tunnel compatibility confirmed.
16. CORS compatibility confirmed.
17. Vitest command/result.
18. Tests passed/failed.
19. Typecheck command/result.
20. Lint command/result.
21. Production-build command/result.
22. Security regression result.
23. Route regression result.
24. Missing-token result.
25. Visual smoke-check result.
26. Files changed.
27. Remaining blockers before real WhatsApp E2E.

Do not start another feature.