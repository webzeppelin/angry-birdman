#!/usr/bin/env node

/**
 * Keycloak Authentication Test Script
 * 
 * This script tests authentication flows for the Angry Birdman Keycloak realm.
 * It validates user authentication, JWT token generation, and token claims.
 */

const http = require('http');
const https = require('https');
const querystring = require('querystring');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const REALM = process.env.KEYCLOAK_REALM || 'angrybirdman';
const CLIENT_ID = process.env.CLIENT_ID || 'angrybirdman-frontend';

/**
 * Make HTTP request (supports both http and https)
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const requestOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = lib.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({ status: res.statusCode, data: parsed });
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data });
          } else {
            reject({ status: res.statusCode, data });
          }
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Parse JWT token without verification (for testing purposes only)
 */
function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  
  const payload = Buffer.from(parts[1], 'base64').toString('utf8');
  return JSON.parse(payload);
}

/**
 * Test user authentication with password grant
 */
async function testPasswordGrant(username, password) {
  console.log(`\n🔐 Testing password grant for user: ${username}`);
  
  try {
    const tokenUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
    const body = querystring.stringify({
      grant_type: 'password',
      client_id: CLIENT_ID,
      username,
      password
    });

    const response = await makeRequest(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      },
      body
    });

    const tokens = response.data;
    
    console.log('✅ Authentication successful');
    console.log(`   Access Token Type: ${tokens.token_type}`);
    console.log(`   Expires In: ${tokens.expires_in} seconds`);
    console.log(`   Refresh Token Provided: ${!!tokens.refresh_token}`);
    
    // Parse and display token claims
    const claims = parseJwt(tokens.access_token);
    console.log('\n📋 Token Claims:');
    console.log(`   Subject (sub): ${claims.sub}`);
    console.log(`   Preferred Username: ${claims.preferred_username}`);
    console.log(`   Email: ${claims.email || 'N/A'}`);
    console.log(`   Roles: ${JSON.stringify(claims.realm_access?.roles || [])}`);
    console.log(`   Clan ID: ${claims.clanId || 'N/A'}`);
    console.log(`   Issued At: ${new Date(claims.iat * 1000).toISOString()}`);
    console.log(`   Expires At: ${new Date(claims.exp * 1000).toISOString()}`);
    
    return { success: true, tokens, claims };
  } catch (error) {
    console.log('❌ Authentication failed');
    if (error.data?.error_description) {
      console.log(`   Error: ${error.data.error_description}`);
    } else {
      console.log(`   Error: ${error.message || JSON.stringify(error)}`);
    }
    return { success: false, error };
  }
}

/**
 * Test user info endpoint
 */
async function testUserInfo(accessToken) {
  console.log('\n👤 Testing user info endpoint');
  
  try {
    const userInfoUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/userinfo`;
    
    const response = await makeRequest(userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userInfo = response.data;
    console.log('✅ User info retrieved successfully');
    console.log(`   Sub: ${userInfo.sub}`);
    console.log(`   Username: ${userInfo.preferred_username}`);
    console.log(`   Email: ${userInfo.email || 'N/A'}`);
    console.log(`   Email Verified: ${userInfo.email_verified || false}`);
    
    return { success: true, userInfo };
  } catch (error) {
    console.log('❌ User info retrieval failed');
    console.log(`   Error: ${error.message || JSON.stringify(error)}`);
    return { success: false, error };
  }
}

/**
 * Test token refresh
 */
async function testTokenRefresh(refreshToken) {
  console.log('\n🔄 Testing token refresh');
  
  try {
    const tokenUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
    const body = querystring.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken
    });

    const response = await makeRequest(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      },
      body
    });

    console.log('✅ Token refresh successful');
    console.log(`   New Access Token: ${response.data.access_token.substring(0, 20)}...`);
    
    return { success: true, tokens: response.data };
  } catch (error) {
    console.log('❌ Token refresh failed');
    console.log(`   Error: ${error.message || JSON.stringify(error)}`);
    return { success: false, error };
  }
}

/**
 * Verify realm configuration
 */
async function verifyRealmConfiguration() {
  console.log('\n🔍 Verifying Realm Configuration');
  console.log('='.repeat(60));
  
  try {
    const configUrl = `${KEYCLOAK_URL}/realms/${REALM}/.well-known/openid-configuration`;
    const response = await makeRequest(configUrl);
    const config = response.data;
    
    console.log('✅ Realm is accessible');
    console.log(`   Issuer: ${config.issuer}`);
    console.log(`   Authorization Endpoint: ${config.authorization_endpoint}`);
    console.log(`   Token Endpoint: ${config.token_endpoint}`);
    console.log(`   User Info Endpoint: ${config.userinfo_endpoint}`);
    console.log(`   Supported Grant Types: ${config.grant_types_supported.join(', ')}`);
    
    return { success: true, config };
  } catch (error) {
    console.log('❌ Failed to access realm configuration');
    console.log(`   Error: ${error.message || JSON.stringify(error)}`);
    return { success: false, error };
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Angry Birdman - Keycloak Authentication Test Suite     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nKeycloak URL: ${KEYCLOAK_URL}`);
  console.log(`Realm: ${REALM}`);
  console.log(`Client ID: ${CLIENT_ID}\n`);

  // Step 1: Verify realm configuration
  const realmResult = await verifyRealmConfiguration();
  if (!realmResult.success) {
    console.log('\n❌ Cannot proceed - realm configuration is not accessible');
    process.exit(1);
  }

  // Step 2: Test authentication with test users
  const testUsers = [
    { username: process.env.TEST_USERNAME || 'testuser', password: process.env.TEST_PASSWORD || 'password' }
  ];

  for (const user of testUsers) {
    const authResult = await testPasswordGrant(user.username, user.password);
    
    if (authResult.success) {
      // Test user info endpoint
      await testUserInfo(authResult.tokens.access_token);
      
      // Test token refresh
      if (authResult.tokens.refresh_token) {
        await testTokenRefresh(authResult.tokens.refresh_token);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test suite completed');
  console.log('='.repeat(60) + '\n');
}

// Run tests if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testPasswordGrant,
  testUserInfo,
  testTokenRefresh,
  verifyRealmConfiguration
};
