# Identity Management Strategy for Angry Birdman

## 1. Overview

This document defines the identity management strategy for Angry Birdman,
establishing clear separation between authentication (handled by identity
providers) and user profile data (managed by the application database).

### Design Principles

1. **Identity Provider Agnostic**: Minimize coupling to any specific identity
   provider (IdP)
2. **Single Source of Truth**: Application database is authoritative for user
   profiles
3. **Minimal IdP Dependency**: Only require `iss` (issuer) and `sub` (subject)
   claims from IdP
4. **Future-Proof**: Support multiple authentication methods (local accounts,
   social login, enterprise SSO)
5. **Data Ownership**: Application controls all business-critical user data
6. **No Duplication**: Avoid synchronization issues by storing data in one place

### Key Concepts

- **Identity**: Combination of `iss` (issuer) and `sub` (subject) that uniquely
  identifies a user across all IdPs
- **User Profile**: Application-managed data stored in local database
- **Authentication**: Verifying user identity via IdP (Keycloak, Google, etc.)
- **Authorization**: Determining user permissions based on local profile data

---

## 2. Architecture

### Two-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Identity Provider Layer                   │
│              (Keycloak, Google, GitHub, etc.)                │
│                                                              │
│  Responsibilities:                                           │
│  - User authentication (password, 2FA, biometric)           │
│  - OAuth2/OIDC token issuance                               │
│  - Account recovery (password reset, email verification)   │
│                                                              │
│  Provides to Application:                                    │
│  - iss (issuer) - identifies which IdP authenticated user   │
│  - sub (subject) - unique identifier within that IdP        │
│  - Optional: email, name (display purposes only)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    JWT Token (iss + sub)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Application Database Layer                  │
│                      (PostgreSQL + Prisma)                   │
│                                                              │
│  Responsibilities:                                           │
│  - User profiles (username, email, preferences)             │
│  - Clan associations and ownership                          │
│  - Role assignments and permissions                         │
│  - Application-specific data (battle stats, etc.)           │
│                                                              │
│  User Record Structure:                                      │
│  - userId: string (composite: iss + sub)                    │
│  - username: string (application username)                  │
│  - email: string (contact email, may differ from IdP)       │
│  - clanId: number (clan association)                        │
│  - owner: boolean (clan ownership flag)                     │
│  - roles: string[] (application roles)                      │
│  - createdAt, updatedAt timestamps                          │
└─────────────────────────────────────────────────────────────┘
```

### Identity Mapping

**Composite User ID Format**: `{iss}:{sub}`

Examples:

- Keycloak user: `keycloak:550e8400-e29b-41d4-a716-446655440000`
- Google user: `google:108612345678901234567`
- GitHub user: `github:12345678`

This format:

- Guarantees uniqueness across all IdPs
- Enables multi-provider support without conflicts
- Clearly identifies the authentication source
- Supports future provider additions without schema changes

---

## 3. User Registration Flow

### Application-Managed Registration (Recommended)

Users register through Angry Birdman's registration page, not the IdP's
registration UI.

**Flow**:

1. **User visits `/register` page in Angry Birdman**
   - Form collects: username, email, password, first name, last name
   - Frontend validates input (password strength, email format, etc.)

2. **Frontend submits to `/api/users/register`**
   - Backend validates uniqueness (username, email)
   - Backend creates account in Keycloak via Admin API
   - Backend receives `sub` from Keycloak
   - Backend creates user record in database with composite userId

3. **Backend creates user profile in database**

   ```sql
   INSERT INTO users (
     user_id,      -- 'keycloak:{sub}'
     username,     -- User-chosen username
     email,        -- User-provided email
     clan_id,      -- NULL (no clan yet)
     owner,        -- FALSE
     created_at
   )
   ```

4. **User is automatically logged in**
   - Backend initiates OAuth flow or issues session
   - User proceeds to post-registration triage

**Benefits**:

- Application controls registration UX
- Collects all required data in one step
- No synchronization issues
- Consistent experience across IdPs
- Can customize validation rules

### Direct IdP Registration (Fallback/Legacy)

If user somehow registers directly through IdP (before we disable it), handle
gracefully.

**Flow**:

1. **User registers via Keycloak UI** (will be disabled)
2. **User completes OAuth callback**
3. **Backend checks if user exists in database** (auth middleware)
4. **If not found, create "just-in-time" profile**

   ```typescript
   // In auth middleware or first authenticated request
   const userId = `${iss}:${sub}`;
   await prisma.user.upsert({
     where: { userId },
     update: {}, // Already exists, do nothing
     create: {
       userId,
       username: preferred_username || email || userId,
       email: email || '',
       clanId: null,
       owner: false,
     },
   });
   ```

5. **Redirect to registration completion flow**
   - User fills out any missing required fields
   - Improves profile with application-specific data

**Note**: This is a safety mechanism. Primary registration should be disabled at
the IdP level.

---

## 4. Authentication Flow

### Login Process

1. **User clicks "Sign In" on frontend**
2. **Frontend initiates OAuth2 authorization code flow**
   - Redirect to IdP (Keycloak, Google, etc.)
   - Include PKCE for security

3. **User authenticates with IdP**
   - Enter credentials, complete 2FA, etc.
   - IdP handles all authentication concerns

4. **IdP redirects back with authorization code**
5. **Backend exchanges code for tokens** (via `/auth/token` proxy)
   - Validates code with IdP
   - Receives JWT with `iss` and `sub` claims
   - Stores tokens in httpOnly cookies (XSS protection)

6. **Backend looks up user profile**

   ```typescript
   const userId = `${token.iss}:${token.sub}`;
   const user = await prisma.user.findUnique({
     where: { userId },
     include: { clan: true },
   });
   ```

7. **Backend enriches token claims** (optional)
   - Add `clanId` claim from database
   - Add `roles` array from database
   - Return enriched user data to frontend

8. **Frontend stores authentication state**
   - User profile from database (not from IdP)
   - Display name, clan info, roles, etc.

### Token Validation (API Requests)

1. **API receives request with JWT in cookie**
2. **Validate JWT signature against IdP's public keys**
3. **Extract `iss` and `sub` from token**
4. **Look up user profile in database**
   ```typescript
   const userId = `${decoded.iss}:${decoded.sub}`;
   const user = await prisma.user.findUnique({ where: { userId } });
   ```
5. **Authorize request based on database profile**
   - Check user roles
   - Verify clan association
   - Apply business rules

---

## 5. Database Schema

### Users Table

```prisma
model User {
  // Identity (composite from IdP)
  userId        String    @id @map("user_id")  // Format: '{iss}:{sub}'

  // Profile Data (application-managed)
  username      String    @unique
  email         String

  // Clan Association
  clanId        Int?      @map("clan_id")
  clan          Clan?     @relation(fields: [clanId], references: [clanId])
  owner         Boolean   @default(false)  // Is clan owner?

  // Audit
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  auditLogs     AuditLog[]
  adminRequests AdminRequest[]

  @@map("users")
}
```

**Key Points**:

- `userId` is composite: `{iss}:{sub}` (e.g., `keycloak:123-456-789`)
- No password, firstName, lastName in database (IdP manages these)
- Username and email are application-specific (may differ from IdP)
- All business data (clan, roles, permissions) stored here

### Migration from Current Schema

Current schema uses `userId` as Keycloak's `sub` only. Migration needed:

```sql
-- Add new column for composite ID
ALTER TABLE users ADD COLUMN user_id_composite VARCHAR(255);

-- Populate with 'keycloak:' prefix for existing users
UPDATE users SET user_id_composite = 'keycloak:' || user_id;

-- Create unique index
CREATE UNIQUE INDEX users_user_id_composite_idx ON users(user_id_composite);

-- After verification, rename columns
ALTER TABLE users RENAME COLUMN user_id TO user_id_legacy;
ALTER TABLE users RENAME COLUMN user_id_composite TO user_id;

-- Update primary key (requires recreating constraints)
-- ... (detailed migration steps in implementation)
```

---

## 6. Multi-Provider Support

### Supported Identity Providers

**Phase 1 (Current)**:

- Keycloak (local accounts)

**Phase 2 (Future)**:

- Google OAuth2
- GitHub OAuth2
- Microsoft Azure AD

**Phase 3 (Future)**:

- Facebook
- Twitter/X
- Apple Sign-In

### Provider Configuration

Each IdP requires configuration in backend:

```typescript
interface IdentityProvider {
  issuer: string; // Unique issuer identifier
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint?: string;
  jwksUri: string; // For JWT validation
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

const providers: Record<string, IdentityProvider> = {
  keycloak: {
    issuer: 'keycloak',
    authorizationEndpoint:
      'http://localhost:8080/realms/angrybirdman/protocol/openid-connect/auth',
    tokenEndpoint:
      'http://localhost:8080/realms/angrybirdman/protocol/openid-connect/token',
    jwksUri:
      'http://localhost:8080/realms/angrybirdman/protocol/openid-connect/certs',
    clientId: 'angrybirdman-frontend',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    scopes: ['openid', 'profile', 'email'],
  },
  google: {
    issuer: 'google',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: ['openid', 'profile', 'email'],
  },
  // ... other providers
};
```

### Account Linking

Allow users to link multiple IdP accounts to single Angry Birdman profile.

**Users Table Extension**:

```prisma
model User {
  userId        String   @id  // Primary identity
  linkedIds     String[]      // Additional identities
  // ... rest of fields
}
```

**Example**:

- User registers with Keycloak: `userId = 'keycloak:abc123'`
- User later links Google: `linkedIds = ['google:xyz789']`
- User can sign in with either identity

---

## 7. Role-Based Access Control (RBAC)

### Role Storage

**Option A: Database-Managed (Recommended)**

Store roles in application database:

```prisma
model User {
  userId   String   @id
  username String
  email    String
  roles    String[]  // ['clan-admin', 'superadmin']
  // ...
}
```

**Benefits**:

- Full control over role assignments
- No IdP dependency for authorization
- Easy to query and report on roles
- Consistent across all IdPs

**Option B: IdP-Managed (Current, Not Recommended)**

Store roles in Keycloak realm_access claim:

**Issues**:

- Requires Keycloak Admin API calls to manage roles
- Doesn't work with other IdPs (Google, GitHub)
- Tightly couples authorization to specific IdP
- Synchronization complexity

**Recommendation**: Migrate to database-managed roles.

### Role Definitions

```typescript
enum Role {
  SUPERADMIN = 'superadmin', // Full system access
  CLAN_OWNER = 'clan-owner', // Owns a clan
  CLAN_ADMIN = 'clan-admin', // Administers a clan
  USER = 'user', // Basic authenticated user
}
```

### Permission Checks

```typescript
// Middleware
function requireRole(allowedRoles: Role[]) {
  return async (request, reply) => {
    const userId = `${request.authUser.iss}:${request.authUser.sub}`;
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user || !user.roles.some((r) => allowedRoles.includes(r))) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}

// Usage
fastify.get(
  '/api/admin/users',
  {
    onRequest: [authenticate, requireRole([Role.SUPERADMIN])],
  },
  handler
);
```

---

## 8. Migration Plan

### Current State Issues

1. **Tight Coupling**: `userId` directly stores Keycloak's `sub`
2. **Duplication**: Username and email stored in both Keycloak and database
3. **Sync Problems**: Changes in Keycloak not reflected in database
4. **Single Provider**: Can't add Google/GitHub login without schema changes
5. **Registration Gap**: Keycloak registration doesn't create database record

### Migration Steps

#### Phase 1: Schema Update (Non-Breaking)

1. **Add composite ID field**

   ```sql
   ALTER TABLE users ADD COLUMN user_id_new VARCHAR(255);
   UPDATE users SET user_id_new = 'keycloak:' || user_id;
   ```

2. **Create custom registration endpoint**
   - Build `/register` page in frontend
   - Implement `/api/users/register` to create both Keycloak and DB records
   - Test end-to-end flow

3. **Disable Keycloak self-registration**
   - Update Keycloak realm settings
   - Redirect registration button to app's `/register` page

#### Phase 2: Code Updates (Gradual)

1. **Update auth middleware**
   - Extract `iss` and `sub` from JWT
   - Construct composite `userId`
   - Fall back to legacy `userId` if new field is null

2. **Update all user lookups**
   - Change `where: { userId: sub }` to `where: { userId: 'keycloak:' + sub }`
   - Or use composite field when available

3. **Add just-in-time profile creation**
   - If user authenticated but not in DB, create record
   - Handle legacy users gracefully

#### Phase 3: Data Migration (One-Time)

1. **Backup database**
2. **Run migration script** to populate composite IDs
3. **Verify data integrity**
4. **Switch primary key** to composite ID field
5. **Drop legacy field** (after verification period)

#### Phase 4: Cleanup

1. **Remove Keycloak Admin API calls** for user profile updates
2. **Remove sync logic** between Keycloak and database
3. **Update documentation** and developer guides
4. **Remove deprecated code paths**

---

## 9. Keycloak Configuration Changes

### Disable Self-Registration

In Keycloak Admin Console:

1. Navigate to Realm Settings → Login
2. Uncheck "User registration"
3. Save

### Custom Registration Link

1. Navigate to Realm Settings → Themes
2. Set custom theme or override templates
3. Change registration link to point to `https://angrybirdman.com/register`

### Minimal User Attributes

Keycloak only needs to store:

- Username (for login)
- Email (for account recovery)
- Password hash
- Email verification status

All other attributes should be removed from Keycloak user profile.

### Token Configuration

Ensure JWT tokens include:

- `iss`: Issuer (e.g., `http://localhost:8080/realms/angrybirdman`)
- `sub`: Subject (Keycloak's internal user ID)
- `email`: User's email (optional, for display)
- `preferred_username`: Username (optional, for display)

Remove custom claims like `clanId` from token (fetch from database instead).

---

## 10. Future Enhancements

### Account Linking UI

Allow users to link multiple authentication methods:

- "Link Google Account" button in profile settings
- Initiate OAuth flow for secondary provider
- Store additional identity in `linkedIds` array
- Display all linked accounts in UI

### Social Login Buttons

Add "Sign in with Google", "Sign in with GitHub" buttons:

- Each provider initiates its own OAuth flow
- Same backend token proxy handles all providers
- Look up user by composite `{provider}:{sub}` ID
- Create profile on first login if doesn't exist

### Single Sign-On (SSO)

Support enterprise SSO via SAML or OIDC:

- Keycloak can act as SAML/OIDC broker
- Or integrate directly with enterprise IdP
- Same composite ID approach: `{enterprise-domain}:{employeeId}`

### Email Verification

Add email verification to registration flow:

- Send verification email after registration
- User must verify before accessing admin features
- Store verification status in database (not Keycloak)

### Multi-Factor Authentication (MFA)

Leverage IdP's MFA capabilities:

- Keycloak supports TOTP, SMS, WebAuthn
- Google/GitHub have built-in 2FA
- No application code changes needed

---

## 11. Security Considerations

### Token Security

- **httpOnly Cookies**: Tokens stored in httpOnly cookies (not localStorage)
- **XSS Protection**: JavaScript cannot access tokens
- **CSRF Protection**: SameSite cookie attribute + CSRF tokens
- **Short Expiration**: Access tokens expire in 15 minutes
- **Refresh Rotation**: Refresh tokens rotated on use

### Data Privacy

- **Minimal IdP Data**: Only store `iss` and `sub` from IdP
- **Email Opt-In**: User controls if email is public/private
- **Data Portability**: Users can export their data
- **Right to Deletion**: Users can delete account and all data

### Rate Limiting

- **Login Attempts**: Limit failed login attempts (IdP handles this)
- **Registration**: Limit registration requests per IP
- **API Calls**: Rate limit all API endpoints
- **Token Refresh**: Limit refresh token usage

---

## 12. Testing Strategy

### Unit Tests

- JWT token parsing and validation
- User profile creation logic
- Composite ID generation
- Role-based authorization checks

### Integration Tests

- Full registration flow (app → Keycloak → database)
- Login flow with token exchange
- Profile updates (ensure no Keycloak sync)
- Multi-provider authentication

### End-to-End Tests

- User registers via app
- User logs in
- User registers clan
- User logs out and back in
- User updates profile

### Migration Tests

- Migrate test database with legacy data
- Verify all users have composite IDs
- Test authentication with migrated accounts
- Verify no data loss

---

## 13. Documentation Requirements

### Developer Documentation

- Architecture diagrams showing IdP separation
- Code examples for user lookups
- Migration guide for schema changes
- Provider integration guide

### Operations Documentation

- Keycloak configuration steps
- Environment variable setup
- Backup and recovery procedures
- Monitoring and alerting

### User Documentation

- How to register an account
- How to reset password (redirects to IdP)
- How to link additional accounts
- Privacy policy and data usage

---

## 14. Success Criteria

### Technical Goals

- [ ] User profile is single source of truth for all business data
- [ ] No duplicate data between IdP and database
- [ ] Support for multiple IdPs without schema changes
- [ ] Zero synchronization logic between systems
- [ ] Authentication works with composite user IDs

### User Experience Goals

- [ ] Users register through Angry Birdman (not Keycloak UI)
- [ ] Registration flow collects all required information
- [ ] Users can log in with any configured provider
- [ ] Profile updates don't require IdP API calls
- [ ] Account linking works seamlessly

### Operational Goals

- [ ] Migration completed with zero data loss
- [ ] Legacy users can still authenticate
- [ ] New users follow new registration flow
- [ ] Monitoring in place for authentication issues
- [ ] Documentation updated and complete

---

## 15. Conclusion

This identity management strategy establishes clear boundaries between
authentication (IdP responsibility) and user profile management (application
responsibility). By using composite user IDs (`{iss}:{sub}`) and storing all
business data in the application database, Angry Birdman achieves:

1. **Provider Independence**: Can add/remove IdPs without schema changes
2. **No Synchronization**: Single source of truth eliminates sync issues
3. **Flexibility**: Users can authenticate via multiple methods
4. **Control**: Application owns all business-critical data
5. **Scalability**: Architecture supports future growth

The migration from the current tightly-coupled design to this clean architecture
requires careful planning but delivers significant long-term benefits.
