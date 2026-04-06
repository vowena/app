# Security Policy

Security issues in the dashboard can directly affect wallet flows, billing automation, secrets, and user trust. We take reports seriously.

## Report a vulnerability

Do not open public issues or pull requests for vulnerabilities.

Preferred reporting path:

1. Open a private GitHub security advisory: <https://github.com/vowena/dashboard/security/advisories/new>
2. If that is not available, email `security@vowena.xyz` with the subject `[SECURITY] dashboard vulnerability report`

## What to include

- A clear description of the issue
- Steps to reproduce
- Affected routes, components, or services
- Impact and worst-case outcome
- Any mitigation ideas you already tested

## Response targets

- Acknowledgment within 48 hours
- Initial assessment within 7 days
- Regular updates until the issue is resolved or scoped

## In scope

- Authentication and authorization flaws
- Secret leakage
- Unsafe transaction-signing flows
- Database exposure or injection risks
- Billing job or webhook abuse
- Cross-site scripting, open redirects, or other user-impacting web issues

## Out of scope

- Vulnerabilities in third-party services that must be reported upstream
- Issues that require unrealistic attacker capabilities
- Purely theoretical findings without a demonstrable impact

## Coordinated disclosure

Please give us time to investigate, patch, and communicate safely before public disclosure.
