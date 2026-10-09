interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  GITHUB_ACTIONS_TOKEN: string;
  GITHUB_REPOSITORY: string;
  GITHUB_WORKFLOW: string;
  GITHUB_REF: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUDIENCE: string;
  SITE_ORIGIN: string;
}

interface AccessClaims {
  aud?: string | string[];
  exp?: number;
  iat?: number;
  iss?: string;
  nbf?: number;
  email?: string;
}

interface AccessJwk {
  kty: string;
  n: string;
  e: string;
  alg?: string;
  kid?: string;
  use?: string;
}

interface AccessCertificates {
  keys: AccessJwk[];
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function copyToArrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.byteLength);
  new Uint8Array(buffer).set(value);
  return buffer;
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

function hasAudience(claim: string | string[] | undefined, expected: string): boolean {
  return Array.isArray(claim) ? claim.includes(expected) : claim === expected;
}

async function validateAccessToken(request: Request, env: Env): Promise<AccessClaims> {
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) {
    throw new Error('Missing Cloudflare Access token');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Cloudflare Access token');
  }

  const header = decodeJson<{ alg?: string; kid?: string }>(parts[0]);
  const claims = decodeJson<AccessClaims>(parts[1]);
  const teamDomain = env.ACCESS_TEAM_DOMAIN.replace(/\/$/, '');

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported Cloudflare Access token');
  }

  if (claims.iss !== teamDomain || !hasAudience(claims.aud, env.ACCESS_AUDIENCE)) {
    throw new Error('Cloudflare Access token is for another application');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= now) {
    throw new Error('Cloudflare Access token has expired');
  }

  if (typeof claims.nbf === 'number' && claims.nbf > now + 30) {
    throw new Error('Cloudflare Access token is not active');
  }

  const certificatesResponse = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!certificatesResponse.ok) {
    throw new Error('Unable to load Cloudflare Access certificates');
  }

  const certificates = (await certificatesResponse.json()) as AccessCertificates;
  const jwk = certificates.keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new Error('Cloudflare Access signing key was not found');
  }

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    copyToArrayBuffer(decodeBase64Url(parts[2])),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );

  if (!valid) {
    throw new Error('Cloudflare Access token signature is invalid');
  }

  return claims;
}

function validateOrigin(request: Request, env: Env): void {
  const origin = request.headers.get('origin');
  if (!origin || origin !== env.SITE_ORIGIN.replace(/\/$/, '')) {
    throw new Error('Request origin is not allowed');
  }
}

async function dispatchReportWorkflow(env: Env, requestId: string): Promise<string> {
  const [owner, repo] = env.GITHUB_REPOSITORY.split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY must be in owner/repository format');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(env.GITHUB_WORKFLOW)}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_ACTIONS_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'stock-research-agent-cloudflare-worker',
        'X-GitHub-Api-Version': '2026-03-10',
      },
      body: JSON.stringify({
        ref: env.GITHUB_REF,
        inputs: { request_id: requestId },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub workflow dispatch failed with status ${response.status}`);
  }

  return `https://github.com/${env.GITHUB_REPOSITORY}/actions/workflows/${env.GITHUB_WORKFLOW}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/run-report') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }

      try {
        validateOrigin(request, env);
        const claims = await validateAccessToken(request, env);
        const requestId = crypto.randomUUID();
        const workflowUrl = await dispatchReportWorkflow(env, requestId);

        return jsonResponse({
          ok: true,
          status: 'queued',
          requestId,
          requestedBy: claims.email ?? 'authenticated user',
          workflowUrl,
        }, 202);
      } catch (error) {
        console.error('Report trigger failed', error);
        return jsonResponse({ error: 'Report run could not be queued' }, 403);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
