# Keycloak Configuration

This directory contains configuration files for Keycloak, the Identity Provider
(IdP) used by Angry Birdman for authentication and user management.

## Directory Contents

- **angrybirdman-realm.json** - Keycloak realm configuration for Angry Birdman
  (✅ imported and active)
- **README.md** - This file (comprehensive configuration documentation)

## Keycloak Realm Configuration

The `angrybirdman-realm.json` file defines:

### Realm Settings

- **Realm Name**: `angrybirdman`
- **Registration**: Enabled (users can self-register)
- **Email Verification**: Disabled in development (should be enabled in
  production)
- **Remember Me**: Enabled
- **Reset Password**: Enabled
- **Brute Force Protection**: Enabled (5 failed attempts trigger lockout)

### User Roles

Four distinct roles are defined:

1. **superadmin** - Full system access across all clans
   - Can manage all clans, users, and system settings
   - Highest privilege level

2. **clan-owner** - Full control over their clan
   - Can manage roster and battle data
   - Can promote/demote clan admins
   - Can transfer ownership or deactivate clan

3. **clan-admin** - Management access to their clan
   - Can manage roster and battle data
   - Cannot change ownership or deactivate clan

4. **user** - Basic authenticated user
   - Default role for registered users
   - Can be promoted to admin roles

### Clients

Two OAuth2/OIDC clients are configured:

#### 1. angrybirdman-frontend (Public Client)

- **Purpose**: React frontend application authentication
- **Flow**: Authorization Code with PKCE
- **Redirect URIs**:
  - `http://localhost:3000/*` (production build)
  - `http://localhost:5173/*` (Vite dev server)
- **PKCE**: Required (S256 method)
- **Token Lifetime**: 15 minutes (900 seconds)

#### 2. angrybirdman-api (Confidential Client)

- **Purpose**: Backend API service account
- **Flow**: Service account (client credentials)
- **Bearer Only**: True (validates tokens, doesn't issue them)

### Client Scopes

Custom client scope for multi-tenancy:

- **clan-context**: Includes `clanId` attribute in JWT tokens
  - Enables clan-scoped authorization
  - Added to access tokens and ID tokens
  - Used for tenant isolation

### Password Policy

Development password policy (should be strengthened for production):

- Minimum length: 8 characters
- Must not contain username
- Must not contain email

**Production Recommendations**:

- Increase minimum length to 12+ characters
- Require uppercase, lowercase, digits, and special characters
- Implement password history (prevent reuse)
- Consider requiring periodic password changes

### Token Lifespans

- **Access Token**: 15 minutes (900 seconds)
- **SSO Session Idle**: 30 minutes (1800 seconds)
- **SSO Session Max**: 10 hours (36000 seconds)
- **Refresh Token (Offline)**: 30 days (2592000 seconds)

## Importing the Realm

### Automatic Import on Container Start

To automatically import the realm when Keycloak starts:

1. Ensure `angrybirdman-realm.json` is in the `keycloak/config/` directory
2. Uncomment the import command in `docker-compose.override.yml`:
   ```yaml
   keycloak:
     command: start-dev --import-realm
   ```
3. Start Keycloak: `docker-compose up keycloak`

**Note**: The `--import-realm` flag imports all JSON files from
`/opt/keycloak/data/import` directory.

### Manual Import via Admin Console

1. Access Keycloak Admin Console: http://localhost:8080
2. Login with admin credentials (defined in .env)
3. Hover over the realm dropdown (top left) and click "Create Realm"
4. Click "Browse" and select `angrybirdman-realm.json`
5. Click "Create"

### Manual Import via CLI

```bash
# Copy realm file into running container
docker cp keycloak/config/angrybirdman-realm.json angrybirdman-keycloak:/tmp/

# Import using Keycloak CLI
docker exec angrybirdman-keycloak \
  /opt/keycloak/bin/kc.sh import \
  --file /tmp/angrybirdman-realm.json
```

## Exporting the Realm

To export the current realm configuration (after making changes via Admin
Console):

```bash
# Export realm to file
docker exec angrybirdman-keycloak \
  /opt/keycloak/bin/kc.sh export \
  --realm angrybirdman \
  --file /tmp/angrybirdman-realm-export.json

# Copy exported file from container
docker cp angrybirdman-keycloak:/tmp/angrybirdman-realm-export.json \
  keycloak/config/angrybirdman-realm.json
```

**Warning**: Exported realms may contain sensitive data (client secrets, etc.).
Review before committing to version control.

## Accessing Keycloak

### Admin Console

- **URL**: http://localhost:8080
- **Username**: Set via `KEYCLOAK_ADMIN_USER` in .env (default: admin)
- **Password**: Set via `KEYCLOAK_ADMIN_PASSWORD` in .env (default: admin)

### Realm-Specific Endpoints

After importing the `angrybirdman` realm:

- **Account Console**: http://localhost:8080/realms/angrybirdman/account
- **OpenID Configuration**:
  http://localhost:8080/realms/angrybirdman/.well-known/openid-configuration
- **Token Endpoint**:
  http://localhost:8080/realms/angrybirdman/protocol/openid-connect/token
- **Authorization Endpoint**:
  http://localhost:8080/realms/angrybirdman/protocol/openid-connect/auth

## User Management

### Creating Users

Users can be created in three ways:

1. **Self-Registration**: Users register via the frontend application
2. **Admin Console**: Manually create users via Keycloak Admin Console
3. **API**: Use Keycloak Admin REST API for bulk operations

### Assigning Roles

To assign roles to users:

1. Login to Keycloak Admin Console
2. Navigate to Users → Select user → Role Mapping tab
3. Click "Assign role"
4. Select appropriate role (superadmin, clan-owner, clan-admin, user)
5. Click "Assign"

### Setting Clan Association

To associate a user with a clan (required for clan-owner and clan-admin roles):

1. Navigate to Users → Select user → Attributes tab
2. Add attribute:
   - **Key**: `clanId`
   - **Value**: Numeric clan ID from database
3. Save

This `clanId` attribute is included in JWT tokens via the `clan-context` client
scope.

## Security Considerations

### Development vs Production

This configuration is designed for **development environments**. For production:

#### Must Change:

- [ ] Enable HTTPS/TLS (`sslRequired: "all"`)
- [ ] Enable email verification (`verifyEmail: true`)
- [ ] Configure SMTP server for emails
- [ ] Strengthen password policy
- [ ] Update redirect URIs to production URLs
- [ ] Change default admin credentials
- [ ] Enable event logging and monitoring
- [ ] Configure session timeouts appropriately
- [ ] Review and minimize client permissions

#### Recommended:

- [ ] Enable multi-factor authentication (MFA/2FA)
- [ ] Configure rate limiting
- [ ] Enable CAPTCHA for registration
- [ ] Set up backup authentication flows
- [ ] Configure user federation (LDAP/AD) if applicable
- [ ] Enable admin event logging
- [ ] Set up monitoring and alerting
- [ ] Review and audit security settings regularly

### Client Secrets

The `angrybirdman-api` client (confidential client) will have a client secret.
To retrieve it:

1. Navigate to Clients → angrybirdman-api → Credentials tab
2. Copy the client secret
3. Store securely (environment variable, secrets manager)
4. **Never commit client secrets to version control**

## Troubleshooting

### Realm Import Fails

If realm import fails:

- Check Keycloak logs: `docker-compose logs keycloak`
- Verify JSON syntax is valid: `cat angrybirdman-realm.json | jq`
- Ensure Keycloak version compatibility
- Try manual import via Admin Console

### Authentication Errors

If users can't authenticate:

- Verify realm is enabled
- Check user exists and is enabled
- Verify client redirect URIs match application URLs
- Review Keycloak event logs (Events section in Admin Console)
- Check CORS configuration matches frontend URLs

### Token Issues

If JWT tokens are invalid or missing claims:

- Verify client scopes are properly configured
- Check user attributes are set (especially `clanId`)
- Ensure client has proper scope assignments
- Review token claims in JWT debugger (https://jwt.io)

## Related Documentation

- [Keycloak Official Documentation](https://www.keycloak.org/documentation)
- [Keycloak Server Administration](https://www.keycloak.org/docs/latest/server_admin/)
- [Keycloak Securing Applications](https://www.keycloak.org/docs/latest/securing_apps/)
- [OAuth 2.0 and OIDC](https://oauth.net/2/)
