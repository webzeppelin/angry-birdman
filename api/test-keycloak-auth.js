/**
 * Test script to verify Keycloak service account authentication
 *
 * Run with: npx tsx test-keycloak-auth.ts
 */
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { config } from 'dotenv';
// Load environment variables
config({ path: '../.env' });
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'angrybirdman';
const CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || '';
const CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '';
console.log('Testing Keycloak Service Account Authentication...\n');
console.log('Configuration:');
console.log('  Base URL:', KEYCLOAK_URL);
console.log('  Realm:', KEYCLOAK_REALM);
console.log('  Client ID:', CLIENT_ID);
console.log('  Client Secret:', CLIENT_SECRET ? '***' + CLIENT_SECRET.slice(-4) : 'NOT SET');
console.log('');
async function testAuth() {
    const adminClient = new KcAdminClient({
        baseUrl: KEYCLOAK_URL,
        realmName: KEYCLOAK_REALM,
    });
    try {
        console.log('Attempting authentication...');
        await adminClient.auth({
            grantType: 'client_credentials',
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
        });
        console.log('✅ Authentication successful!');
        console.log('');
        // Decode and display the access token
        const accessToken = adminClient.accessToken;
        console.log('=== ACCESS TOKEN ===');
        console.log('Raw token (first 50 chars):', accessToken?.substring(0, 50) + '...');
        console.log('');
        if (accessToken) {
            // Decode JWT token (it's base64 encoded JSON)
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3 && tokenParts[1]) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                console.log('=== TOKEN PAYLOAD ===');
                console.log(JSON.stringify(payload, null, 2));
                console.log('');
                console.log('=== RELEVANT FIELDS ===');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                console.log('Subject (sub):', payload.sub);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                console.log('Client ID (azp):', payload.azp);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                console.log('Realm access roles:', payload.realm_access?.roles || 'none');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                console.log('Resource access:', JSON.stringify(payload.resource_access, null, 2));
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                console.log('Scope:', payload.scope);
                console.log('');
            }
        }
        // Test user management permissions (the critical one)
        console.log('Testing user management permissions...');
        console.log('Requesting: GET /admin/realms/' + KEYCLOAK_REALM + '/users?max=1');
        console.log('');
        const users = await adminClient.users.find({
            realm: KEYCLOAK_REALM,
            max: 1,
        });
        console.log('✅ User query successful. Found', users.length, 'user(s)');
        console.log('');
        console.log('🎉 All tests passed! Service account is configured correctly.');
    }
    catch (error) {
        console.error('❌ Authentication failed!');
        console.error('');
        console.error('Error details:', error);
        console.error('');
        console.error('Troubleshooting steps:');
        console.error('1. Verify the client exists in Keycloak Admin Console');
        console.error('2. Ensure "Client authentication" is enabled');
        console.error('3. Verify "Service accounts roles" is enabled');
        console.error('4. Check that the client secret matches');
        console.error('5. Ensure realm-management roles are assigned');
        process.exit(1);
    }
}
void testAuth();
//# sourceMappingURL=test-keycloak-auth.js.map