// OVDS JSON Authentication Script for OWASP ZAP Authentication Helper add-on
//
// Usage in ZAP Desktop:
//   1. Right-click the OVDS context → Authentication...
//   2. Set Method = "Script-based authentication"
//   3. Point this script at .zap/scripts/authentication/ovds-json-auth.js
//   4. ZAP will call this for re-authentication during authenticated scanning.
//
// The script performs a POST /api/auth/login for each ZAP user and extracts
// the JWT returned in the JSON body. ZAP attaches the returned
// "Authorization: Bearer <token>" header to subsequent in-scope requests.
//
// Parameters provided by ZAP at call time:
//   - parameters.get('username')       -> OVDS user email
//   - parameters.get('password')       -> Plain-text test password
//   - parameters.get('url')            -> Inferred backend URL
//
// Output (JavaScript object):
//   - messageTypes: array of message names (e.g. ['Request', 'Response'])
//   - scriptParameters: object with values to remember (token, user, etc.)
//   - result: boolean
//   - error: optional error string
//
// NOTE: This script must run inside ZAP's Nashorn / Rhino JS engine.
// ES6+ features are not supported — stick to ES5 syntax.

function authenticate(helper, paramsValues, credentials) {
  var url = (paramsValues && paramsValues.get('url')) || 'http://localhost:3001';
  var loginUrl = url.replace(/\/$/, '') + '/api/auth/login';

  var requestBody = JSON.stringify({
    email: credentials.get('username'),
    password: credentials.get('password')
  });

  var httpResponse = helper.sendRequest(
    loginUrl,
    'POST',
    'Content-Type: application/json',
    [],
    requestBody,
    30
  );

  if (httpResponse == null) {
    return {
      result: false,
      error: 'No response from ' + loginUrl
    };
  }

  var status = httpResponse.getStatus();
  if (status < 200 || status >= 300) {
    return {
      result: false,
      error: 'Login failed for ' + credentials.get('username') + ' (status=' + status + ')'
    };
  }

  var body = httpResponse.getBody();
  var token = null;
  var userId = null;
  var companyId = null;

  // Naive parsing without JSON.parse — Nashorn/Rhino compatibility.
  var tokenMatch = body.match(/"(?:access_token|token)"\s*:\s*"([^"]+)"/);
  if (tokenMatch) {
    token = tokenMatch[1];
  }
  var userIdMatch = body.match(/"id"\s*:\s*"([^"]+)"/);
  if (userIdMatch) {
    userId = userIdMatch[1];
  }
  var companyMatch = body.match(/"companyId"\s*:\s*"([^"]+)"/);
  if (companyMatch) {
    companyId = companyMatch[1];
  }

  if (token == null) {
    return {
      result: false,
      error: 'No access_token found in response body'
    };
  }

  helper.addAuthHeader('Authorization', 'Bearer ' + token);

  if (companyId != null) {
    helper.addAuthHeader('x-company-id', companyId);
  }

  return {
    result: true,
    messageTypes: ['Request', 'Response'],
    scriptParameters: {
      token: token,
      userId: userId || '',
      companyId: companyId || '',
      loggedInAt: String(new Date().getTime())
    }
  };
}

function getRequiredParamsNames() {
  return ['url'];
}

function getOptionalParamsNames() {
  return ['tenantSubdomain'];
}

function getCredentialsParamsNames() {
  return ['username', 'password'];
}