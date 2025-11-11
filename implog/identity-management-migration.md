# Identity Management Architecture Migration Plan

**Date**: November 10, 2025  
**Purpose**: Migrate from tightly-coupled Keycloak integration to
provider-agnostic identity management architecture  
**Reference**: `specs/identity-management.md`

---

## Executive Summary

This migration plan transforms Angry Birdman's identity management from a
Keycloak-specific implementation to a provider-agnostic architecture. The key
change is moving from storing Keycloak's `sub` directly as `userId` to using a
composite format `{iss}:{sub}` that supports multiple identity providers.

**Key Changes**:

- User ID format: `abc-123` → `keycloak:abc-123`
- Database becomes single source of truth for profiles
- Roles managed in database (not Keycloak)
- Application-controlled registration flow
- Support for future providers (Google, GitHub, etc.)

**Data Impact**:

- This migration does NOT preserve existing database or Keycloak data
- Clean slate approach: recreate users and seed data
- Faster implementation, no complex data migration
- Acceptable for development/pre-production stage

---

## Current State Analysis

### What's Working (Keep)

✅ **Backend Token Proxy Pattern**

- Tokens stored in httpOnly cookies
- PKCE-enabled OAuth2 flow
- `/auth/token`, `/auth/refresh`, `/auth/logout` endpoints
- XSS protection via httpOnly cookies

✅ **JWT Validation**

- JWKS-based signature verification
- Token expiration checking
- Proper error handling

✅ **Database Schema Structure**

- Prisma ORM with TypeScript types
- Proper relationships and indexes
- Clean separation of concerns

### What Needs Changing (Fix)

❌ **User ID Format**

- **Current**: `userId` = Keycloak's `sub` directly (e.g.,
  `550e8400-e29b-41d4-a716-446655440000`)
- **Problem**: Can't support multiple providers
- **Solution**: Change to `keycloak:{sub}` composite format

❌ **Token Claims**

- **Current**: Token includes `clanId` custom claim from Keycloak
- **Problem**: Requires Keycloak Admin API to update
- **Solution**: Fetch `clanId` from database, not from token

❌ **Role Management**

- **Current**: Roles stored in Keycloak `realm_access` claim
- **Problem**: Doesn't work with other providers, requires Keycloak Admin API
- **Solution**: Store roles in database `roles` field (array)

❌ **User Registration**

- **Current**: Can register via Keycloak UI (bypasses database)
- **Problem**: Creates orphaned Keycloak accounts
- **Solution**: Disable Keycloak registration, use app registration only

❌ **Profile Data Duplication**

- **Current**: Username/email in both Keycloak and database
- **Problem**: Synchronization issues, dual writes
- **Solution**: Database is authoritative, Keycloak only for auth

❌ **Issuer Identification**

- **Current**: Assumes all users are from Keycloak
- **Problem**: Can't distinguish providers
- **Solution**: Extract `iss` from JWT, use in composite ID

---

## Migration Phases

### Phase 1: Database Schema Updates ✅ COMPLETED (30 minutes)

**Status**: ✅ COMPLETED - November 10, 2025

**Goal**: Modify database schema to support composite user IDs and
database-managed roles

**Tasks**:

1. **Update Prisma Schema** (`database/prisma/schema.prisma`)
   - Add `roles` field to User model: `roles String[]`
   - Update `userId` comment to indicate composite format
   - Keep `userId` as `String` type (already compatible)

2. **Create Migration**

   ```bash
   cd database
   npx prisma migrate dev --name add_user_roles
   ```

3. **Update Seed Script** (`database/prisma/seed.ts`)
   - Change all `userId` values from `user-001` to `keycloak:user-001`
   - Add `roles` arrays to user records
   - Example:
     ```typescript
     userId: 'keycloak:user-001',
     roles: ['clan-owner'],
     ```

4. **Verification**
   - Run seed script: `npm run seed`
   - Query database: verify composite IDs and roles present
   - Check Prisma types regenerated correctly

**Files Modified**:

- `database/prisma/schema.prisma`
- `database/prisma/seed.ts`

**Success Criteria**:

- ✅ Migration runs without errors
- ✅ Seed creates users with `keycloak:` prefix
- ✅ Users have `roles` array populated
- ✅ Prisma types include `roles` field

**Completion Summary**:

Created migration `20251111033447_add_user_roles` that:

- Added `roles String[]` field with empty array default
- Updated User model comment to document composite ID format

Updated seed script with composite user IDs:

- `keycloak:user-001` with `['clan-owner']`
- `keycloak:user-002` with `['clan-admin']`
- `keycloak:user-003` with `['clan-owner']`
- `keycloak:superadmin-001` with `['superadmin']`

Database verification confirmed all users have composite IDs and roles arrays.

**Git Commit**: `0ed682e` - feat(database): implement Phase 1 - add roles field
and composite user IDs

---

### Phase 2: Authentication Middleware Updates ✅ (45 minutes)

**Goal**: Update authentication to extract `iss` from JWT and construct
composite user ID

**Tasks**:

1. **Update JWTPayload Interface** (`api/src/middleware/auth.ts`)

   ```typescript
   export interface JWTPayload {
     iss: string; // ADD: Issuer (e.g., 'http://...angrybirdman')
     sub: string; // Subject (Keycloak user ID)
     email?: string;
     preferred_username?: string;
     realm_access?: {
       roles: string[]; // KEEP for backward compat, but don't use
     };
     // REMOVE: clanId custom claim (fetch from DB instead)
     exp: number;
     iat: number;
   }
   ```

2. **Add Issuer Normalization Function**

   ```typescript
   /**
    * Normalize issuer to short form
    * 'http://localhost:8080/realms/angrybirdman' → 'keycloak'
    */
   function normalizeIssuer(iss: string): string {
     // For now, always return 'keycloak'
     // In future, detect Google, GitHub, etc.
     if (iss.includes('localhost:8080') || iss.includes('keycloak')) {
       return 'keycloak';
     }
     // Add more providers later
     return 'keycloak'; // default
   }
   ```

3. **Update authenticate() Middleware**
   - After decoding JWT, construct composite userId:

     ```typescript
     const decoded = await verifyToken(token);
     const issuer = normalizeIssuer(decoded.iss);
     const compositeUserId = `${issuer}:${decoded.sub}`;

     // Look up user in database
     const user = await fastify.prisma.user.findUnique({
       where: { userId: compositeUserId },
     });

     if (!user) {
       // User authenticated with IdP but not in our database
       // This shouldn't happen with proper registration flow
       return reply.status(401).send({
         error: 'Unauthorized',
         message: 'User profile not found',
       });
     }

     // Attach BOTH token payload AND database user to request
     request.authUser = {
       ...decoded,
       userId: compositeUserId, // composite ID
       roles: user.roles, // from database, not token
       clanId: user.clanId, // from database, not token
       username: user.username, // from database
     };
     ```

4. **Update authorize() Middleware**
   - Change from `user.realm_access?.roles` to `user.roles`
   - Roles now come from database via authUser

5. **Update authorizeClan() Middleware**
   - Change from `user.clanId` (token) to fetching from database
   - Already available in `request.authUser.clanId` from authenticate()

**Files Modified**:

- `api/src/middleware/auth.ts`

**Success Criteria**:

- ✅ Composite user ID constructed from `iss` + `sub`
- ✅ User lookup uses composite ID
- ✅ Roles come from database, not token
- ✅ ClanId comes from database, not token
- ✅ Tests pass with updated auth flow

---

### Phase 3: Auth Routes Updates ✅ (30 minutes)

**Goal**: Update `/auth/user` endpoint to return database profile data

**Tasks**:

1. **Update /auth/user Endpoint** (`api/src/routes/auth.ts`)
   - After decoding token, look up user in database
   - Return composite response with database data

   ```typescript
   const decoded = fastify.jwt.decode(token) as DecodedToken;
   const issuer = normalizeIssuer(decoded.iss);
   const compositeUserId = `${issuer}:${decoded.sub}`;

   // Look up user in database
   const user = await fastify.prisma.user.findUnique({
     where: { userId: compositeUserId },
     include: { clan: true },
   });

   if (!user) {
     return reply.status(401).send({
       error: 'User profile not found',
     });
   }

   return {
     sub: compositeUserId, // composite ID
     preferred_username: user.username, // from database
     email: user.email, // from database
     name: `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
     clanId: user.clanId, // from database
     clanName: user.clan?.name, // from database
     roles: user.roles, // from database
   };
   ```

2. **Update Response Schema**
   - Add `clanName` to userResponseSchema
   - Change `clanId` to allow null (users without clans)

**Files Modified**:

- `api/src/routes/auth.ts`

**Success Criteria**:

- ✅ `/auth/user` returns database profile data
- ✅ Composite user ID in response
- ✅ Roles from database
- ✅ Clan info from database

---

### Phase 4: User Registration Flow ✅ (60 minutes)

**Goal**: Implement application-controlled registration that creates both
Keycloak account and database profile atomically

**Tasks**:

1. **Update /api/users/register Endpoint** (`api/src/routes/users.ts`)

   ```typescript
   async (request, reply) => {
     const keycloak = createKeycloakService(fastify);
     const audit = createAuditService(fastify.prisma);

     try {
       // 1. Create user in Keycloak
       const keycloakSub = await keycloak.registerUser({
         username: request.body.username,
         email: request.body.email,
         password: request.body.password,
         firstName: request.body.firstName,
         lastName: request.body.lastName,
       });

       // 2. Create composite user ID
       const userId = `keycloak:${keycloakSub}`;

       // 3. Create user in database with default role
       await fastify.prisma.user.create({
         data: {
           userId, // composite ID
           username: request.body.username,
           email: request.body.email,
           clanId: null,
           owner: false,
           roles: ['user'], // default role
         },
       });

       // 4. Assign 'user' role in Keycloak (for backward compat)
       // NOTE: We'll phase out Keycloak roles eventually
       await keycloak.assignRole({
         userId: keycloakSub, // Keycloak uses sub, not composite
         role: 'user',
       });

       // 5. Log registration
       await audit.log({
         actorId: userId,
         actionType: AuditAction.USER_REGISTERED,
         entityType: EntityType.USER,
         entityId: userId,
         details: {
           email: request.body.email,
           username: request.body.username,
         },
         result: AuditResult.SUCCESS,
       });

       // 6. Return composite ID
       return reply.code(201).send({
         userId, // return composite ID
         message: 'Registration successful',
       });
     } catch (error) {
       // Rollback logic if needed
       // If Keycloak succeeds but DB fails, delete from Keycloak
       fastify.log.error(error, 'User registration failed');
       throw error;
     }
   };
   ```

2. **Update /api/users/register-clan Endpoint**
   - Change from using `request.authUser!.sub` to composite ID
   - Update upsert to handle composite IDs

   ```typescript
   const compositeUserId = `keycloak:${request.authUser!.sub}`;

   // Or better: composite ID already in authUser from middleware
   const userId = request.authUser!.userId;
   ```

3. **Update Role Assignment**
   - When assigning 'clan-owner' role, update database roles array:
   ```typescript
   await fastify.prisma.user.update({
     where: { userId },
     data: {
       clanId: clan.clanId,
       owner: true,
       roles: { push: 'clan-owner' }, // add to roles array
     },
   });
   ```

**Files Modified**:

- `api/src/routes/users.ts`

**Success Criteria**:

- ✅ Registration creates Keycloak + database records atomically
- ✅ Database user has composite ID
- ✅ Default 'user' role assigned in database
- ✅ Clan registration updates user roles correctly

---

### Phase 5: Remove Keycloak Admin API Dependencies ✅ (45 minutes)

**Goal**: Stop using Keycloak Admin API for profile and role management

**Tasks**:

1. **Update /api/users/me (Profile Updates)**
   - Remove Keycloak Admin API calls
   - Update database only

   ```typescript
   // REMOVE: await keycloak.updateUser(userId, { email, ... });

   // UPDATE: Database only
   await fastify.prisma.user.update({
     where: { userId },
     data: {
       username: request.body.username,
       email: request.body.email,
     },
   });
   ```

2. **Update Admin Request Approval** (`api/src/routes/admin-requests.ts`)
   - When approving admin request, update database roles
   - Remove Keycloak role assignment

   ```typescript
   // Approve request
   await prisma.user.update({
     where: { userId: request.userId },
     data: {
       clanId: request.clanId,
       roles: { push: 'clan-admin' }, // add role to array
     },
   });

   // REMOVE: await keycloak.assignRole({ userId, role: 'clan-admin' });
   ```

3. **Update User Promotion** (`api/src/routes/clans.ts`)
   - Promote to owner updates database only

   ```typescript
   await prisma.user.update({
     where: { userId: targetUserId },
     data: {
       owner: true,
       roles: { push: 'clan-owner' },
     },
   });
   ```

4. **Update User Removal** (`api/src/routes/clans.ts`)
   - Remove admin removes from database roles
   ```typescript
   await prisma.user.update({
     where: { userId: targetUserId },
     data: {
       clanId: null,
       owner: false,
       roles: { set: ['user'] }, // reset to base role
     },
   });
   ```

**Files Modified**:

- `api/src/routes/users.ts`
- `api/src/routes/admin-requests.ts`
- `api/src/routes/clans.ts`

**Success Criteria**:

- ✅ Profile updates don't call Keycloak API
- ✅ Role changes only update database
- ✅ No synchronization logic needed
- ✅ Keycloak used only for authentication

---

### Phase 6: Keycloak Configuration Changes ✅ (30 minutes)

**Goal**: Configure Keycloak for minimal profile management and disable
self-registration

**Tasks**:

1. **Disable User Self-Registration**
   - Keycloak Admin Console → Realm Settings → Login
   - Uncheck "User registration"
   - Save

2. **Remove Custom User Attributes**
   - Remove `clanId` custom attribute
   - Keep only: username, email, firstName, lastName
   - Keycloak Admin Console → Realm Settings → User Profile

3. **Remove Realm Roles** (Optional - for cleanup)
   - Keep roles in Keycloak for now (backward compatibility)
   - Plan to remove in future: superadmin, clan-owner, clan-admin, user
   - Eventually Keycloak will only handle authentication

4. **Update Token Claims**
   - Ensure `iss` claim is present in tokens
   - Remove `clanId` from custom claims (if configured)
   - Keycloak Admin Console → Client Scopes → Protocol Mappers

**Manual Steps**:

- Document in `keycloak/config/README.md`
- Update realm export if using declarative config

**Success Criteria**:

- ✅ Users cannot self-register via Keycloak UI
- ✅ Custom attributes removed
- ✅ Tokens include `iss` claim
- ✅ `clanId` not in token

---

### Phase 7: Test User Recreation ✅ (30 minutes)

**Goal**: Recreate test users with composite IDs matching database

**Tasks**:

1. **Update create-test-users.sh** (`keycloak/test/create-test-users.sh`)
   - Remove clanId attribute setting (we don't use it anymore)
   - Document that database records must match

   ```bash
   # REMOVE: Setting clanId attribute
   # -s "attributes.clanId=$clan_id"

   # NOTE: User records in database will use composite ID: keycloak:{USER_ID}
   ```

2. **Update Seed Script User IDs** (Already done in Phase 1)
   - Ensure user IDs in seed match Keycloak test user subs
   - Or use deterministic IDs like `keycloak:test-001`

3. **Create Test Users**

   ```bash
   cd keycloak/test
   ./create-test-users.sh
   ```

4. **Verify Mapping**
   - Get Keycloak user IDs
   - Verify database has `keycloak:{id}` records
   - Test login with each user
   - Verify roles come from database

**Files Modified**:

- `keycloak/test/create-test-users.sh`
- `keycloak/test/README.md`

**Success Criteria**:

- ✅ Test users created in Keycloak
- ✅ Database has matching `keycloak:{id}` records
- ✅ Roles in database, not Keycloak
- ✅ All test users can authenticate

---

### Phase 8: Frontend Updates ✅ (45 minutes)

**Goal**: Update frontend to handle composite user IDs and display database
profile data

**Tasks**:

1. **Update AuthContext** (`frontend/src/contexts/AuthContext.tsx`)
   - User interface already uses database data (no change needed)
   - Verify `clanInfo` fetched from database (already correct)

2. **Update User Type** (`frontend/src/lib/auth-config.ts`)
   - Update User interface to match new /auth/user response

   ```typescript
   export interface User {
     sub: string; // composite ID: 'keycloak:abc-123'
     preferred_username: string;
     email: string;
     name: string;
     clanId?: number | null;
     clanName?: string; // ADD: clan name from database
     roles: string[]; // from database
   }
   ```

3. **Update CallbackPage** (`frontend/src/pages/CallbackPage.tsx`)
   - Already uses `/auth/user` endpoint correctly
   - No changes needed (endpoint returns database data)

4. **Update Any User ID References**
   - Search for places displaying user ID
   - Ensure it's for debugging only (users shouldn't see composite IDs)
   - Display `preferred_username` instead of `sub`

**Files Modified**:

- `frontend/src/lib/auth-config.ts`
- Potentially other files that reference user IDs

**Success Criteria**:

- ✅ Frontend receives database profile data
- ✅ Composite user IDs handled correctly
- ✅ No breaking UI changes
- ✅ User experience unchanged

---

### Phase 9: Testing & Validation ✅ (60 minutes)

**Goal**: Comprehensive testing of new identity management architecture

**Test Cases**:

1. **User Registration Flow**
   - [ ] Register new user via `/api/users/register`
   - [ ] Verify Keycloak account created
   - [ ] Verify database record with `keycloak:` prefix
   - [ ] Verify default 'user' role in database
   - [ ] Login with new user succeeds
   - [ ] `/auth/user` returns database profile

2. **Clan Registration Flow**
   - [ ] New user registers clan
   - [ ] Verify database user updated with clanId
   - [ ] Verify 'clan-owner' role added to database
   - [ ] Verify NO Keycloak API calls for roles
   - [ ] User can access clan admin features

3. **Authentication Flow**
   - [ ] Login with test users
   - [ ] Verify composite user ID constructed
   - [ ] Verify roles from database, not token
   - [ ] Verify clanId from database, not token
   - [ ] Token refresh works correctly

4. **Authorization Checks**
   - [ ] Superadmin can access all clans
   - [ ] Clan owner can manage their clan
   - [ ] Clan admin has appropriate access
   - [ ] Basic user has limited access
   - [ ] Cross-clan access blocked

5. **Profile Management**
   - [ ] Update username (database only)
   - [ ] Update email (database only)
   - [ ] Verify NO Keycloak API calls
   - [ ] Changes reflected in `/auth/user`

6. **Admin Requests**
   - [ ] Submit admin request
   - [ ] Approve request
   - [ ] Verify role added to database
   - [ ] Verify NO Keycloak role assignment
   - [ ] User gains access to clan

7. **Edge Cases**
   - [ ] User authenticated but not in database → 401
   - [ ] Invalid token → appropriate error
   - [ ] Expired token → appropriate error
   - [ ] Missing clanId in database → handled gracefully

**Files to Test**:

- All auth-related endpoints
- All user management endpoints
- All clan management endpoints

**Success Criteria**:

- ✅ All test cases pass
- ✅ No Keycloak API calls for profile/roles
- ✅ Roles managed entirely in database
- ✅ Multiple test users work correctly

---

### Phase 10: Documentation Updates ✅ (30 minutes)

**Goal**: Update all documentation to reflect new architecture

**Files to Update**:

1. **API README** (`api/README.md`)
   - Document composite user ID format
   - Explain issuer normalization
   - Document role management in database

2. **Database README** (`database/README.md`)
   - Document User table changes
   - Explain composite user ID format
   - Document roles field

3. **Keycloak README** (`keycloak/README.md`)
   - Document minimal profile approach
   - Explain why custom attributes removed
   - Document test user setup

4. **Main README** (`README.md`)
   - Update architecture diagram
   - Update authentication flow description
   - Link to identity management spec

5. **Technology Plan** (`specs/technology-plan.md`)
   - Update authentication section
   - Reference identity management spec
   - Document provider-agnostic approach

6. **High-Level Spec** (`specs/high-level-spec.md`)
   - Verify user persona descriptions still accurate
   - Update if needed to reflect database-managed roles

**Success Criteria**:

- ✅ All documentation updated
- ✅ Architecture diagrams accurate
- ✅ Examples use composite user IDs
- ✅ Clear explanation of new approach

---

## Implementation Order

**Recommended sequence**:

```
Day 1 (4 hours)
├─ Phase 1: Database Schema Updates (30 min)
├─ Phase 2: Authentication Middleware (45 min)
├─ Phase 3: Auth Routes Updates (30 min)
├─ Phase 4: User Registration Flow (60 min)
└─ Phase 5: Remove Keycloak Dependencies (45 min)

Day 2 (3 hours)
├─ Phase 6: Keycloak Configuration (30 min)
├─ Phase 7: Test User Recreation (30 min)
├─ Phase 8: Frontend Updates (45 min)
└─ Phase 9: Testing & Validation (60 min)

Day 3 (30 minutes)
└─ Phase 10: Documentation Updates (30 min)
```

**Total Estimated Time**: 7.5 hours

---

## Rollback Plan

Since we're NOT preserving existing data, rollback is simple:

1. **Reset Database**

   ```bash
   cd database
   npx prisma migrate reset --force
   ```

2. **Restore Previous Code**

   ```bash
   git revert HEAD~10  # or however many commits
   ```

3. **Recreate Test Users**

   ```bash
   cd keycloak/test
   ./create-test-users.sh
   ```

4. **Re-seed Database**
   ```bash
   cd database
   npm run seed
   ```

---

## Risk Assessment

### Low Risk ✅

- Database schema changes (additive, not breaking)
- Adding `roles` field to User model
- Frontend updates (minimal changes needed)

### Medium Risk ⚠️

- Authentication middleware changes (test thoroughly)
- Composite user ID format (ensure consistency)
- Keycloak configuration changes (document well)

### High Risk ❌

- None (no data preservation required)

---

## Success Metrics

### Technical Metrics

- [ ] All API tests pass (100%)
- [ ] All frontend tests pass (100%)
- [ ] Zero Keycloak Admin API calls for profile/role management
- [ ] Composite user IDs throughout system
- [ ] Roles managed entirely in database

### Functional Metrics

- [ ] User registration creates both Keycloak + database records
- [ ] Login flow works with composite IDs
- [ ] Authorization based on database roles
- [ ] Profile updates don't touch Keycloak
- [ ] Admin workflows function correctly

### Quality Metrics

- [ ] Code coverage maintained (>80%)
- [ ] No TypeScript errors
- [ ] No console warnings in browser
- [ ] All linting rules pass
- [ ] Documentation complete and accurate

---

## Post-Migration Cleanup

After successful migration and testing period:

1. **Remove Legacy Code**
   - Remove Keycloak role assignment code
   - Remove clanId token claim logic
   - Remove profile sync logic

2. **Remove Keycloak Roles** (Optional)
   - Delete realm roles from Keycloak
   - Update realm export configuration

3. **Update Tests**
   - Update all tests to use composite IDs
   - Add tests for multi-provider scenarios
   - Test role management thoroughly

4. **Performance Optimization**
   - Add database indexes if needed
   - Optimize user lookup queries
   - Cache frequently accessed data

---

## Future Enhancements

Once migration complete, we can:

1. **Add Google OAuth**
   - Users with `google:{sub}` IDs
   - Same registration/auth flow
   - No schema changes needed

2. **Add GitHub OAuth**
   - Users with `github:{sub}` IDs
   - Leverage GitHub profile API
   - Account linking support

3. **Account Linking**
   - Allow users to link multiple providers
   - Store in `linkedIds` array field
   - Single Angry Birdman profile, multiple auth methods

4. **Remove Keycloak Roles Entirely**
   - Keycloak only does authentication
   - All authorization in application
   - True provider independence

---

## Open Questions & Decisions

### Q1: Handle Existing Production Data?

**Decision**: Not applicable - no production data yet. Clean slate approach.

### Q2: Keep Keycloak Roles for Backward Compatibility?

**Decision**: Yes, initially. Assign roles in both Keycloak and database during
transition. Remove Keycloak roles in future cleanup phase.

### Q3: Validate Email During Registration?

**Decision**: Not in this migration. Add email verification as separate
enhancement per identity-management.md spec.

### Q4: Support Account Linking in Phase 1?

**Decision**: No. Implement basic multi-provider support first. Add account
linking in Phase 2 (future).

### Q5: Use Short or Full Issuer in Composite ID?

**Decision**: Use short form ('keycloak', 'google', 'github') for readability.
Add normalization function to extract from full issuer URL.

---

## Appendix A: Key Code Patterns

### Pattern 1: Constructing Composite User ID

```typescript
// In authentication middleware
const decoded = await verifyToken(token);
const issuer = normalizeIssuer(decoded.iss); // 'keycloak'
const compositeUserId = `${issuer}:${decoded.sub}`;
```

### Pattern 2: Looking Up User

```typescript
const user = await prisma.user.findUnique({
  where: { userId: compositeUserId },
  include: { clan: true },
});
```

### Pattern 3: Creating User with Roles

```typescript
await prisma.user.create({
  data: {
    userId: `keycloak:${keycloakSub}`,
    username: 'johndoe',
    email: 'john@example.com',
    roles: ['user'], // default role
    clanId: null,
    owner: false,
  },
});
```

### Pattern 4: Adding Role to User

```typescript
await prisma.user.update({
  where: { userId },
  data: {
    roles: { push: 'clan-owner' }, // add to array
  },
});
```

### Pattern 5: Removing Role from User

```typescript
await prisma.user.update({
  where: { userId },
  data: {
    roles: { set: ['user'] }, // reset to base
  },
});
```

---

## Appendix B: Database Schema Changes

### Before (Current)

```prisma
model User {
  userId   String  @id           // Keycloak sub directly
  username String  @unique
  email    String
  clanId   Int?
  owner    Boolean @default(false)
  // Roles stored in Keycloak, not database
}
```

### After (New)

```prisma
model User {
  userId   String   @id          // Composite: 'keycloak:abc-123'
  username String   @unique
  email    String
  clanId   Int?
  owner    Boolean  @default(false)
  roles    String[] @default([]) // Roles in database
}
```

---

## Appendix C: Test User Mapping

### Keycloak Test Users

- testsuperadmin: `{keycloak-generated-uuid}`
- testowner: `{keycloak-generated-uuid}`
- testadmin: `{keycloak-generated-uuid}`
- testuser: `{keycloak-generated-uuid}`
- testowner2: `{keycloak-generated-uuid}`

### Database Records (After Migration)

- `keycloak:{testsuperadmin-uuid}` → roles: `['superadmin']`
- `keycloak:{testowner-uuid}` → roles: `['clan-owner']`, clanId: 54
- `keycloak:{testadmin-uuid}` → roles: `['clan-admin']`, clanId: 54
- `keycloak:{testuser-uuid}` → roles: `['user']`, clanId: 54
- `keycloak:{testowner2-uuid}` → roles: `['clan-owner']`, clanId: 55

---

## Sign-Off

**Prepared By**: AI Assistant  
**Date**: November 10, 2025  
**Status**: Ready for Review

**Next Steps**:

1. Review this plan with team
2. Confirm approach and timeline
3. Begin Phase 1 implementation
4. Track progress against phases
5. Validate at each phase completion
