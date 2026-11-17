Update the Zeexco frontend to match the backend’s cookie-based authentication and session endpoints. Inspect the existing API client, authentication state, forms, routing, and route guards before making changes. Follow the project’s established patterns.

Backend contract

1. Registration — POST /api/v1/auth/register

Request:
{
  "first_name": "...",
  "last_name": "...",
  "business_name": "...",
  "email": "...",
  "password": "..."
}

Success: HTTP 202
{
  "status_code": 202,
  "message": "Registration successful. Please check your email to activate your account."
}

Registration does not return user details, business details, tokens, or next_step. It does not create an authenticated session. Show the verification instructions and require email verification before login.

Passwords require:
- At least 8 characters.
- At most 72 UTF-8 bytes.
- At least one letter, uppercase OR lowercase; both cases are not required.
- At least one decimal digit.
- At least one punctuation or symbol character. Spaces do not count as symbols.
- Preserve the password exactly; do not trim it.

Keep frontend validation aligned with backend Unicode handling and show backend validation messages.

2. Login — POST /api/v1/auth/login

Request:
{
  "email": "...",
  "password": "..."
}

Success: HTTP 200
{
  "status_code": 200,
  "message": "Login successful. Welcome back"
}

The backend sets HttpOnly access and refresh cookies. No tokens or account details appear in the response.

After login succeeds, fetch GET /api/v1/auth/session before entering the authenticated platform.

Pending-verification login returns HTTP 403:
{
  "error": {
    "code": "EMAIL_VERIFICATION_REQUIRED",
    "message": "Account is pending verification. Please check your email to activate your account."
  }
}

Display this message and keep the user unauthenticated.

3. Session — GET /api/v1/auth/session

Send cookies with the request.

Success: HTTP 200
{
  "status_code": 200,
  "message": "Session retrieved successfully.",
  "user": {
    "id": "...",
    "first_name": "...",
    "last_name": "...",
    "email": "...",
    "status": "ACTIVE"
  },
  "businesses": [
    {
      "id": "...",
      "name": "...",
      "status": "ACTIVE",
      "membership_role": "OWNER"
    }
  ]
}

Use this endpoint after login and during application startup/page reload to initialize authentication and authorization state.

Membership roles are OWNER, ADMIN, or STAFF. Business status may be ACTIVE or SUSPENDED. Use current memberships and existing product rules to control navigation and UI actions; do not invent a permission matrix or assume every user is an owner.

Handle an empty businesses array gracefully. If the selected business is no longer available, clear that selection and use the existing business-selection/onboarding flow.

Session responses:
- 401: Missing, invalid, expired token, or account no longer exists.
- 403: Account is no longer active.
- 500: Session lookup failed. Show a recoverable error rather than treating it as invalid credentials.

GET session does not renew cookies.

4. Refresh — POST /api/v1/auth/refresh

No token in the request body. Send cookies.

Success: HTTP 200
{
  "status_code": 200,
  "message": "Session refreshed successfully."
}

The backend renews the access cookie and rotates the refresh cookie. No tokens, user details, or businesses appear in the response.

Implement one shared refresh operation for concurrent 401 responses:
- Refresh once, then retry the original request once.
- Concurrent requests must share the same refresh promise.
- Do not recursively intercept login, registration, verification, refresh, or logout errors.
- Never loop refresh attempts.
- If refresh returns 401, clear frontend session state and redirect to login.
- Handle network/5xx failures as recoverable errors without retry loops or falsely reporting invalid credentials.
- Prevent an in-flight refresh or session request from restoring frontend authentication after logout.
- During startup, a session 401 may trigger refresh once, followed by one session retry.

5. Logout — POST /api/v1/auth/logout

Send cookies. Success is HTTP 204 with no JSON body. The backend revokes the refresh session and expires both cookies.

On successful logout, clear authentication state, selected business, and cached tenant data, then redirect to login. Handle a failed logout explicitly; frontend JavaScript cannot clear the HttpOnly cookies.

Cookie and API-client requirements

- Use fetch credentials: "include", or Axios withCredentials: true, for authentication and protected API requests.
- Remove token extraction from login/refresh response bodies.
- Remove browser token storage, manual JWT decoding, and frontend-generated Authorization headers.
- Remove legacy token entries from localStorage/sessionStorage without clearing unrelated application data.
- Never attempt to read HttpOnly cookies using JavaScript.
- Use the configured backend base URL; do not hardcode localhost into production code.
- Login, refresh, logout, and other unsafe cookie-authenticated requests require an Origin matching the backend PUBLIC_FRONTEND_BASE_URL. Browsers supply Origin automatically; do not attempt to set it manually.
- For local HTTP development, the backend must use AUTH_REFRESH_COOKIE_SECURE=false and PUBLIC_FRONTEND_BASE_URL matching the exact frontend origin. Keep production cookies Secure.

Authentication state and routing

- Represent loading/checking, authenticated, unauthenticated, and recoverable-error states explicitly.
- Wait for the initial session check before redirecting protected routes, avoiding a login-page flash.
- Preserve a validated internal return destination when redirecting to login.
- Scope cached business data by business ID and clear it when changing accounts or businesses.
- Backend authorization remains authoritative; UI visibility is not a security boundary.
- Keep login and refresh responses limited to their actual status/message contract.

Verification

Add or update focused tests for:
- Registration status/message handling and password validation.
- Login followed by session loading.
- Pending-verification login.
- Session restoration after page reload.
- One refresh shared by concurrent 401 responses.
- Retry limits and invalid-refresh handling.
- Recoverable session/network failures.
- Logout, including in-flight refresh/session races.
- Empty memberships, suspended accounts/businesses, and business selection.

Run the relevant tests and production build. Implement the changes fully, then summarize what changed, validation results, and any backend configuration needed. Do not modify unrelated features.