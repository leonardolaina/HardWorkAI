# HardWorkAI Firestore Security Specification

## Data Invariants
1. **Default Deny & PII Isolation**: All unmatched paths are denied (`allow read, write: if false`). `/users/{userId}` forbids `list` and `delete`; `get`, `create`, and `update` require a verified email (`email_verified == true`), matching `request.auth.uid == userId`, and a valid email matching `request.auth.token.email`.
2. **Master Gate Parent Binding**: An `McpConnection` document at `/users/{userId}/mcpConnections/{connectionId}` requires an existing parent `/users/{userId}` document whose stored `uid` and `email` match the authenticated user (`hasVerifiedParentAccount`), evaluated only after auth and static schema checks to prevent Denial-of-Wallet attacks.
3. **Strict Endpoint & URL Hygiene**:
   - `photoURL` (when non-empty) and HTTP/SSE MCP endpoints (`streamable-http`, `sse`) MUST use `https://` without whitespace (`isValidHttpsUrl`).
   - `stdio` MCP endpoints MUST match a safe command pattern (`^(stdio://)?[a-zA-Z0-9._\-/ @:]+$`), rejecting shell metacharacters (`;`, `|`, `&`, `` ` ``, `$`, `<`, `>`, etc.).
4. **Action-Based Updates & Immutability**:
   - `UserAccount` updates may only mutate `displayName`, `photoURL`, and `updatedAt`.
   - `McpConnection` updates are split into `isMcpToggleAction()` (`connected`, `updatedAt`) and `isMcpConfigUpdateAction()`, preserving strict immutability on `ownerUid`, `accountEmail`, `connectorId`, `approvedAppsOnly`, `custom`, and `createdAt`.
5. **Logical Consistency & Bounds**:
   - When `toolsSelection == 'all'`, `selectedTools` MUST be empty (`selectedTools.size() == 0`).
   - All strings, IDs, and arrays enforce strict regex, enum, and size bounds; shadow fields are blocked via `hasAll` + `hasOnly`.
   - `createdAt` and `updatedAt` timestamps must match server `request.time`.
   - `list`, `get`, `update`, and `delete` on `mcpConnections` enforce both `ownerUid == request.auth.uid` and `accountEmail == request.auth.token.email`.

## Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated read** of `/users/u1` or `/users/u1/mcpConnections/github`.
2. **Cross-user read/list** of `/users/victimUid` or `/users/victimUid/mcpConnections` by authenticated attacker `attackerUid`.
3. **Unverified email write** where `email_verified == false`.
4. **Identity spoofing on create**: writing `ownerUid: "victimUid"` inside `/users/attackerUid/mcpConnections/github`.
5. **Email spoofing on create/read**: writing or querying `accountEmail: "other@corp.com"` not matching `request.auth.token.email`.
6. **Shadow field injection**: adding `"isAdmin": true` or `"role": "superadmin"` to `UserAccount` or `McpConnection`.
7. **Orphaned / mismatched parent MCP write**: creating `/users/u1/mcpConnections/github` when parent `/users/u1` does not exist or its email differs.
8. **ID poisoning**: using a document ID containing invalid characters or > 128 chars.
9. **Client timestamp forgery**: supplying a past/future client timestamp instead of `request.time`.
10. **Immutable field mutation**: modifying `ownerUid`, `accountEmail`, `connectorId`, `approvedAppsOnly`, `custom`, or `createdAt` during update.
11. **Array overflow / type poisoning / inconsistent tools**: sending > 50 entries in `people`/`teams`/`selectedTools`, a non-string element `[123]`, or non-empty `selectedTools` when `toolsSelection == 'all'`.
12. **Insecure endpoint / command injection**: supplying `http://` or `javascript:` for `streamable-http`/`sse`, or `npx mcp; rm -rf /` for `stdio`.
