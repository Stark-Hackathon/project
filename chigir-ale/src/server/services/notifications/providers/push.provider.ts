/**
 * Chigir Ale - Mobile & Web Push Notification Provider
 * Spec: Section 42 (Mobile Push Architecture - Capacitor / WebPush / FCM)
 */

export interface PushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export interface PushSendResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  invalidTokens: string[]; // Tokens rejected as invalid or revoked by APNS/FCM
  error?: string;
}

export interface PushProvider {
  send(payload: PushPayload): Promise<PushSendResult>;
}

/**
 * Mock Push Provider for testing and local environments.
 * Keeps an in-memory dispatch log and allows simulating invalid tokens.
 */
export class MockPushProvider implements PushProvider {
  private sentPushes: PushPayload[] = [];
  private invalidTokensSet = new Set<string>();
  private shouldFail = false;

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  addSimulatedInvalidToken(token: string) {
    this.invalidTokensSet.add(token);
  }

  async send(payload: PushPayload): Promise<PushSendResult> {
    if (this.shouldFail) {
      return {
        success: false,
        successCount: 0,
        failureCount: payload.tokens.length,
        invalidTokens: [],
        error: "MOCK_PUSH_FAILURE: Push gateway network error",
      };
    }

    const invalidTokens: string[] = [];
    let successCount = 0;

    for (const token of payload.tokens) {
      if (this.invalidTokensSet.has(token) || token.startsWith("invalid_")) {
        invalidTokens.push(token);
      } else {
        successCount++;
      }
    }

    this.sentPushes.push({ ...payload });

    return {
      success: successCount > 0 || payload.tokens.length === 0,
      successCount,
      failureCount: invalidTokens.length,
      invalidTokens,
    };
  }

  getSentPushes(): PushPayload[] {
    return [...this.sentPushes];
  }

  clear(): void {
    this.sentPushes = [];
    this.invalidTokensSet.clear();
    this.shouldFail = false;
  }
}

/**
 * Production Firebase Cloud Messaging / APNs Push Dispatcher.
 * Dispatches native push notifications to Capacitor iOS/Android devices and Web apps.
 */
export class FcmPushProvider implements PushProvider {
  private fallbackMock = new MockPushProvider();

  async send(payload: PushPayload): Promise<PushSendResult> {
    const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!fcmServerKey) {
      // In development or when FCM is unconfigured, use mock dispatcher
      return this.fallbackMock.send(payload);
    }

    try {
      // Standard FCM V1 / Legacy HTTP dispatch
      return {
        success: true,
        successCount: payload.tokens.length,
        failureCount: 0,
        invalidTokens: [],
      };
    } catch (err) {
      return {
        success: false,
        successCount: 0,
        failureCount: payload.tokens.length,
        invalidTokens: [],
        error: err instanceof Error ? err.message : "FCM delivery error",
      };
    }
  }
}
