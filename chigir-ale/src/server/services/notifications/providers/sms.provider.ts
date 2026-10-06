/**
 * Chigir Ale - SMS Notification Provider
 * Spec: Section 41 (Optional SMS Channel)
 */

export interface SmsPayload {
  to: string; // E.164 phone number, e.g. +251911223344
  text: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(payload: SmsPayload): Promise<SmsSendResult>;
}

export class MockSmsProvider implements SmsProvider {
  private sentSms: SmsPayload[] = [];
  private shouldFail = false;

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  async send(payload: SmsPayload): Promise<SmsSendResult> {
    if (this.shouldFail) {
      return {
        success: false,
        error: "MOCK_SMS_FAILURE: SMS gateway failure",
      };
    }

    this.sentSms.push({ ...payload });
    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
    };
  }

  getSentSms(): SmsPayload[] {
    return [...this.sentSms];
  }

  clear(): void {
    this.sentSms = [];
    this.shouldFail = false;
  }
}
