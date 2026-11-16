Implement the frontend changes required for Zeexco’s updated email-verification and account-activation backend.

Backend behavior already implemented


1. Registration

POST /api/v1/auth/register

A successful browser registration:

- Creates the user with PENDING status.
- Queues an email-verification message asynchronously.
- Returns HTTP 202.
- Does not log the user in.
- Does not queue the welcome email yet.
- The verification email is sent from:
  Zeexco <no-reply@zeexco.com>

The response includes:

- pending user information
- business information
- next_step: "VERIFY_EMAIL"

2. Verification link

The backend generates verification links using:

EMAIL_VERIFICATION_FRONTEND_URL=http://localhost:3000/verify-email

The resulting URL has this shape:

http://localhost:3000/verify-email?token=<signed-token>

3. Verify email endpoint

POST /api/v1/auth/verify-email

Request body:

{
  "token": "<signed-token>"
}

A successful request returns HTTP 204 with no response body.

On the first successful verification, the backend atomically:

- Changes the user from PENDING to ACTIVE.
- Marks the email as verified.
- Queues exactly one asynchronous welcome email.
- Returns without waiting for Resend.

The welcome email is sent from:

Zeexco <hello@zeexco.com>

4. Verification errors

Handle these backend responses:

- 400: invalid token or malformed request
- 409: token has already been consumed
- 410: token has expired
- 500: verification could not be completed

The backend may return error codes such as:

- EMAIL_VERIFICATION_INVALID
- EMAIL_VERIFICATION_CONSUMED
- EMAIL_VERIFICATION_EXPIRED
- EMAIL_VERIFICATION_FAILED

Implementation requirements

1. Registration flow

Update the registration UI so that after a 202 response with:

next_step: "VERIFY_EMAIL"

the frontend does not attempt to authenticate or create a session.

Show a confirmation screen containing:

- A clear “Check your email” heading.
- The registered email address when available.
- An explanation that the user must verify their email before signing in.
- A link or button to return to the login page.
- No claim that the account is already active.

Preserve the existing handling for validation errors, duplicate emails, network errors, and loading states.

2. Verification page

Create or update the Next.js route:

/verify-email

Read the token from the URL query string.

When a token is present:

- Send it to POST /api/v1/auth/verify-email.
- Send the request only from the browser or through an appropriate server-side API wrapper that preserves the backend contract.
- Do not expose backend secrets.
- Prevent React development-mode rerenders from causing uncontrolled duplicate requests.
- Show a loading state while verification is in progress.

On HTTP 204:

- Show that the account is active and ready.
- Provide a clear “Log in” CTA.
- Optionally redirect to /login after a short delay, but keep an accessible manual CTA.

Handle errors with useful states:

- Missing token:
  “This verification link is invalid.”

- 400 / EMAIL_VERIFICATION_INVALID:
  “This verification link is invalid.”

- 409 / EMAIL_VERIFICATION_CONSUMED:
  Explain that the link has already been used and provide a login CTA. Do not repeatedly retry.

- 410 / EMAIL_VERIFICATION_EXPIRED:
  Explain that the link has expired. If no resend endpoint exists in the backend contract, do not display a functional resend button. Provide navigation back to registration or login instead.

- 500 / EMAIL_VERIFICATION_FAILED:
  Explain that verification could not be completed and allow a controlled retry.

- Network failure:
  Show a temporary connection error and allow retry.

3. API contract

Use the frontend’s existing API client and base URL configuration. Do not hardcode the backend host.

The verification request must be exactly:

POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "<token>"
}

Treat HTTP 204 as success without attempting to parse JSON.

Keep request and response types centralized with the existing authentication types.

4. Security requirements

Never add these variables to any `NEXT_PUBLIC_*` environment variable:

- RESEND_API_KEY
- RESEND_SECURITY_FROM_EMAIL
- RESEND_LIFECYCLE_FROM_EMAIL
- EMAIL_VERIFICATION_HMAC_SECRET_BASE64

These values belong exclusively to the Go backend.

The frontend only needs its existing public backend/API base URL. It must not send email directly or call Resend.

Do not log the verification token, include it in analytics events, persist it in localStorage, or place it in error-monitoring metadata.

After reading the token, remove it from the visible browser URL with `router.replace` or the History API when doing so will not break the request lifecycle.

5. Welcome email behavior

Do not implement welcome-email sending in the frontend.

The backend queues the welcome email after successful verification. The verification page must not wait for, poll for, or report the delivery status of that email.

A temporary email-provider failure does not mean account activation failed.

6. UX and accessibility

Provide accessible loading, success, invalid, consumed, expired, server-error, and network-error states.

Requirements:

- Keyboard-accessible buttons and links.
- Clear focus behavior when state changes.
- `aria-live` for asynchronous status messages where appropriate.
- Responsive mobile layout.
- No indefinite spinner.
- Disable duplicate submissions while a verification request is active.

7. Tests

Add or update tests covering:

- Registration 202 with VERIFY_EMAIL shows the check-email screen.
- Registration does not log in a PENDING user.
- Missing verification token shows an invalid-link state.
- A valid token is submitted correctly.
- HTTP 204 shows activation success and login CTA.
- The frontend does not parse a body from the 204 response.
- HTTP 400 shows invalid-link state.
- HTTP 409 shows already-used state and login CTA.
- HTTP 410 shows expired-link state.
- HTTP 500 allows controlled retry.
- Network failure allows retry.
- Duplicate renders or clicks do not create uncontrolled concurrent requests.
- Tokens and backend secrets are not logged or persisted.
- Existing authentication tests continue to pass.

8. Documentation and validation

Update the frontend environment example and authentication documentation where necessary.

Run:

- TypeScript type checking
- linting
- unit/component tests
- production build
- relevant end-to-end tests, if available

Inspect the existing frontend architecture first and extend established authentication, API-client, routing, form, and design-system patterns instead of creating a parallel implementation.

At completion, report:

- files changed
- routes/components introduced or updated
- API types/client changes
- environment variables required
- test commands and results
- any assumptions or backend mismatches
- anything requiring manual browser or live integration verification