Implement the WhatsApp browser registration fallback for Zico, using the existing web registration, email activation, and cookie-based authentication flows.

Inspect the existing routing, registration form, verification page, API client, authentication state, and tests before changing anything. Follow the project’s architecture and reuse existing components. Implement the changes fully rather than only proposing a plan.

Goal

A merchant starts in WhatsApp, clicks Get started, registers in the browser with email and password, activates their email, then returns to the original WhatsApp conversation to continue onboarding.

The browser must preserve the onboarding token and submit it with registration details. The backend derives the WhatsApp sender and provider from that token. The frontend must never supply or determine those identities.

1. Registration entry and token handling

The WhatsApp Get started button opens:

/register?token=<opaque-onboarding-token>

On the registration route:

- If token is present, enter WhatsApp browser registration mode.
- If token is absent, retain the existing ordinary web registration flow.
- Treat the token as opaque. Do not decode it, derive identity from it, or replace it.
- Reject empty or repeated token query parameters rather than choosing one arbitrarily.
- Validate a supplied token before enabling registration.
- Keep the token available while the user completes the form and corrects validation errors.
- Never put the token in analytics, error reports, console logs, WhatsApp messages, or third-party requests.
- Do not store credentials or tokens in localStorage/sessionStorage.
- Avoid third-party assets or analytics that could capture the token-bearing URL. Use a no-referrer policy for this journey where supported.
- After registration succeeds, replace the token-bearing registration URL when navigating to the existing Check your email screen.
- Do not automatically resubmit registration after a reload.

The token on /register is an ONBOARDING token.
The token on the email verification route is a DIFFERENT, signed EMAIL-VERIFICATION token.
Never interchange them.

2. Validate the onboarding token

GET /api/v1/whatsapp/onboarding/validate?token=<URL-encoded-token>

Successful response: HTTP 200

{
"valid": true,
"status": "PENDING",
"expires_at": "<ISO timestamp>"
}

This means the registration form may be shown. It does not mean the user is registered, authenticated, or email-verified.

Handle:

- 400 ONBOARDING_TOKEN_REQUIRED: Missing, empty, or repeated parameter.
- 400 ONBOARDING_TOKEN_INVALID: Malformed token.
- 404 ONBOARDING_TOKEN_INVALID: Unknown token.
- 410 ONBOARDING_TOKEN_EXPIRED: Explain that the user should return to WhatsApp and request a new Get started link.
- 409 ONBOARDING_VERIFICATION_PENDING: Registration was already submitted. Show Check your email instead of another registration form.
- 409 ONBOARDING_TOKEN_CONSUMED: The link was already used. Explain this and offer the existing login/manual return-to-WhatsApp guidance.
- 429: Respect Retry-After where available.
- Network/5xx: Show a recoverable error with a retry action; do not call the token expired or invalid without that response from the backend.

Use explicit loading, valid, pending-verification, unavailable, and recoverable-error states. Do not briefly display an enabled form before validation finishes.

3. Registration fields and validation

Use the existing registration form with:

- first_name
- last_name
- business_name
- email — required
- password — required

Do not collect or submit:

- provider
- WhatsApp ID
- sender phone number
- Meta phone-number ID
- user ID
- business ID

Password rules must match the backend:

- At least 8 Unicode code points.
- At most 72 UTF-8 bytes.
- At least one Unicode letter, uppercase OR lowercase. Both cases are not required.
- At least one Unicode decimal digit.
- At least one Unicode punctuation or symbol character.
- Spaces do not count as symbols.
- Preserve the password exactly; never trim it.

For JavaScript, use Unicode-aware validation equivalent to:

- Array.from(password).length for the character minimum.
- new TextEncoder().encode(password).length for the byte maximum.
- \p{L}, \p{Nd}, and [\p{P}\p{S}] with the u flag for composition.

Reuse existing password visibility and accessibility patterns. If there is a confirm-password field, validate it locally and do not send it to the backend.

Display backend validation messages next to the relevant fields. Never include passwords in logging or persisted form state.

4. Submit registration

Prefer the shared endpoint:

POST /api/v1/auth/register
Content-Type: application/json

WhatsApp-originated request:

{
"first_name": "Ada",
"last_name": "Lovelace",
"business_name": "Ada Store",
"email": "ada@example.com",
"password": "Securepass1!",
"onboarding_token": "<token from Get started link>"
}

Ordinary web registration sends the same account fields but OMITS onboarding_token.

The dedicated endpoint also supports WhatsApp browser signup:

POST /api/v1/whatsapp/onboarding/register

It accepts the same fields and REQUIRES onboarding_token. If the project already uses this endpoint for WhatsApp mode, it may continue doing so. Use one endpoint per submission, never both.

Success: HTTP 202

{
"status_code": 202,
"message": "Registration successful. Please check your email to activate your account."
}

On success:

- Show Check your email using the existing UI.
- Do not expect user, business, next_step, or tokens in this response.
- Do not mark the user authenticated.
- Do not redirect to the platform dashboard.
- Do not redirect to WhatsApp before email activation succeeds.
- Clear the password from form state.
- Disable duplicate submissions while the request is in flight.

The backend creates a PENDING account and reserves the onboarding session as EMAIL_VERIFICATION_PENDING. WhatsApp identity linking happens after activation.

Registration error handling:

- VALIDATION_ERROR: Show the field-specific backend message.
- EMAIL_ALREADY_REGISTERED: Offer login guidance. Do not silently merge accounts or claim WhatsApp was linked.
- ONBOARDING_TOKEN_INVALID: Show an invalid-link state.
- ONBOARDING_TOKEN_EXPIRED: Ask the user to restart from WhatsApp.
- ONBOARDING_TOKEN_CONSUMED: Do not retry registration automatically.
- 429/network/5xx: Handle as recoverable without duplicate submissions or misleading success.

Authenticated linking of an already-existing account is separate backend work. Do not implement a frontend-only workaround based on matching email or phone number.

5. Email activation

Keep the existing email verification route and extract its signed verification token.

Submit:

POST /api/v1/auth/verify-email
Content-Type: application/json

{
"token": "<signed-email-verification-token>"
}

Do not send the original onboarding token, provider, phone number, or a browser-supplied redirect URL.

Support BOTH successful activation contracts:

A. Ordinary web registration:
HTTP 204, no response body.

Do not attempt response.json() on a 204 response.
Show the existing successful activation state and login action.

B. WhatsApp browser registration:
HTTP 200

{
"status_code": 200,
"message": "Account activated successfully. Continue in WhatsApp.",
"next_step": "CONTINUE_IN_WHATSAPP",
"redirect_url": "https://wa.me/15551892941?text=Continue"
}

For CONTINUE_IN_WHATSAPP:

- Show an activation success state.
- Make Continue in WhatsApp the primary action.
- Use the redirect_url returned by the backend.
- Explain: “Open WhatsApp, then tap Send to continue.”
- Prefer a user-clicked link/button instead of immediately opening an app or popup.
- Do not hardcode the test number in frontend application logic.
- Do not construct a destination from browser query parameters or user-entered phone numbers.
- Accept only a valid HTTPS wa.me destination without URL credentials. Treat an unexpected destination as unavailable.
- redirect_url is optional when the backend has no public return number configured. In that case, show clear instructions to return to the existing WhatsApp chat manually.
- An optional secondary login action may use the existing web login route.
- Do not mark browser authentication successful merely because email activation succeeded.

The wa.me link opens the chat and prefills Continue. It does NOT send the message automatically. The user must tap Send. That inbound message lets the backend recognize the linked WhatsApp identity and send the deterministic Create first product invitation.

The frontend should not call WhatsApp Cloud API, send a WhatsApp message itself, or simulate successful product creation.

Activation errors:

- 400 EMAIL_VERIFICATION_INVALID: Invalid verification link.
- 410 EMAIL_VERIFICATION_EXPIRED: Explain expiry and provide the existing recovery/login guidance.
- 409 EMAIL_VERIFICATION_CONSUMED: Show an already-used-link state; do not blindly repeat activation or assume an authenticated session.
- Network/5xx: Show a recoverable error and retry action.

Prevent duplicate activation requests caused by React Strict Mode, repeated effects, or multiple renders. Do not disable Strict Mode to solve this.

6. Preserve cookie-based browser authentication

Keep the existing backend session contract:

- Login and refresh return only status_code and message.
- The backend stores access and refresh credentials in HttpOnly cookies.
- Use fetch credentials: "include" or Axios withCredentials: true.
- Never read HttpOnly cookies, manually decode browser JWTs, or restore frontend token storage.
- After actual login, use GET /api/v1/auth/session to initialize user and business authorization context.
- Preserve the existing single-flight refresh and logout handling.
- Registration and activation do not automatically establish a browser session.

The browser supplies Origin automatically. Do not attempt to set that header from frontend JavaScript. Backend PUBLIC_FRONTEND_BASE_URL must exactly match the frontend origin.

7. Backend configuration reference

The development WhatsApp test account is +1 (555) 189-2941.

The backend configuration is:

WHATSAPP_ONBOARDING_RETURN_URL=https://wa.me/15551892941

This is the public phone number, not Meta’s phone-number ID. The backend adds the prefilled Continue text.

Keep this configuration on the backend. The frontend consumes redirect_url.

Native WhatsApp Flow signup is separate and awaiting publication. Do not replace the browser fallback with native Flow logic or change the backend’s provider/identity rules.

8. Tests and verification

Add focused tests covering:

- Ordinary registration with no onboarding token.
- WhatsApp registration with a valid token.
- Missing/empty/repeated/invalid/expired/consumed tokens.
- ONBOARDING_VERIFICATION_PENDING showing Check your email.
- Form submission preserving the exact token.
- Required email/password and Unicode password boundaries.
- Passwords and tokens excluded from logs and persisted state.
- Registration 202 containing only status/message.
- Duplicate-submit prevention.
- Ordinary activation 204 without JSON parsing.
- WhatsApp activation 200 rendering the returned Continue link.
- Missing or unsafe redirect_url handling.
- Activation errors and duplicate-effect protection.
- No authenticated frontend state before actual login.
- Existing login, session restoration, refresh, and logout behavior.

Run relevant tests, type checking, linting, and the production build using the project’s scripts. Inspect the registration, Check your email, and activation success states at mobile and desktop widths.

Deliver the completed implementation with:

- Changed files and resulting behavior.
- Tests and build results.
- Any required environment configuration.
- Any remaining backend dependency or live-test limitation.

Use the backend guide docs/flows/whatsapp-browser-registration.md and OpenAPI contract as references when available. Do not modify unrelated features.
