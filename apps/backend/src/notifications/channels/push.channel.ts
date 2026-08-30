/**
 * Firebase Cloud Messaging (FCM) push notification channel.
 *
 * Uses FCM HTTP v1 API (OAuth2) instead of the deprecated Legacy API.
 * The service account JSON is loaded from FIREBASE_SERVICE_ACCOUNT_JSON env var.
 *
 * For web push, the paired service worker (firebase-messaging-sw.js) must be
 * registered at the app root — see apps/frontend/public/firebase-messaging-sw.js.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { INotificationChannel } from './notification-channel.interface';
import type { PushJobData } from '../notification.jobs';

interface FcmServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

@Injectable()
export class PushChannel implements INotificationChannel<PushJobData> {
  readonly channelName = 'push';
  private readonly logger = new Logger(PushChannel.name);
  private serviceAccount: FcmServiceAccount | null = null;

  /** Cached OAuth2 token — reused until 60 seconds before expiry */
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (raw) {
      try {
        this.serviceAccount = JSON.parse(raw) as FcmServiceAccount;
      } catch {
        this.logger.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON — push disabled');
      }
    }
  }

  async send(payload: PushJobData): Promise<void> {
    if (!this.serviceAccount) {
      this.logger.warn('Push channel not configured — skipping');
      return;
    }

    const accessToken = await this.getAccessToken();
    const projectId   = this.serviceAccount.project_id;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const message = {
      message: {
        token:        payload.fcmToken,
        notification: { title: payload.title, body: payload.body },
        data:         payload.data ?? {},
        webpush: {
          fcm_options: { link: payload.data?.link ?? '/' },
        },
      },
    };

    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`FCM error ${res.status}: ${err}`);
    }

    this.logger.debug(`Push sent to token ${payload.fcmToken.slice(0, 12)}…`);
  }

  /** Mint a short-lived OAuth2 access token from the service-account private key.
   *  Tokens are cached for their lifetime (3600 s) minus a 60 s safety margin.
   */
  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if still valid
    if (this.cachedToken && now < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const sa = this.serviceAccount!;

    // Build JWT header and claim-set using base64url encoding (RFC 4648 §5)
    const toBase64Url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');

    const header   = toBase64Url({ alg: 'RS256', typ: 'JWT' });
    const claimSet = toBase64Url({
      iss:   sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud:   'https://oauth2.googleapis.com/token',
      iat:   now,
      exp:   now + 3600,
    });

    const toSign = `${header}.${claimSet}`;

    // Import private key and sign using Web Crypto API (available in Node 18+)
    const pemKey = sa.private_key.replace(/\\n/g, '\n');
    const keyBuffer = Buffer.from(
      pemKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''),
      'base64',
    );

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      Buffer.from(toSign),
    );

    const jwt = `${toSign}.${Buffer.from(signature).toString('base64url')}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion:  jwt,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`FCM OAuth2 token request failed ${tokenRes.status}: ${errText}`);
    }

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error('FCM OAuth2 response did not contain an access_token');
    }

    // Cache the token; expire 60 s early to avoid using a token right at its boundary
    this.cachedToken    = tokenData.access_token;
    this.tokenExpiresAt = now + 3600 - 60;

    return this.cachedToken;
  }
}
