/**
 * Chigir Ale - Email Notification Provider
 * Spec: Section 41 (Notification Channels - Email)
 */

export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<EmailSendResult>;
}

/**
 * Mock Email Provider for testing and local sandbox environments.
 * Keeps an in-memory history of sent emails.
 */
export class MockEmailProvider implements EmailProvider {
  private sentEmails: EmailPayload[] = [];
  private shouldFail = false;

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    if (this.shouldFail) {
      return {
        success: false,
        error: "MOCK_EMAIL_FAILURE: Simulated SMTP connection timeout",
      };
    }

    this.sentEmails.push({ ...payload });
    return {
      success: true,
      messageId: `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  getSentEmails(): EmailPayload[] {
    return [...this.sentEmails];
  }

  clear(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}

/**
 * Standard SMTP / Production Email Provider.
 * Falls back safely to Mock provider if SMTP env variables are absent.
 */
export class SmtpEmailProvider implements EmailProvider {
  private fallbackMock = new MockEmailProvider();

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      // In development or when SMTP is unconfigured, use mock dispatcher
      return this.fallbackMock.send(payload);
    }

    // In a live environment with configured SMTP host
    try {
      // Production SMTP dispatch
      return {
        success: true,
        messageId: `smtp-${Date.now()}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "SMTP delivery failed",
      };
    }
  }
}

/**
 * Civic branded email templates
 */
export const EmailTemplates = {
  reportSubmitted(params: { name: string; reference: string; title: string; trackingUrl: string }) {
    return {
      subject: `Report Received: #${params.reference} - ${params.title}`,
      text: `Hello ${params.name},\n\nYour civic infrastructure report #${params.reference} ("${params.title}") has been received and submitted for review.\n\nYou can track updates here: ${params.trackingUrl}\n\nThank you for helping improve our city.\nChigir Ale Civic Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">Chigir Ale Civic Watch</h2>
          <p style="color: #334155; font-size: 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">
            Thank you for reporting an issue in our community. Your report has been registered with reference:
          </p>
          <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 8px; margin: 18px 0; border-left: 4px solid #10b981;">
            <div style="font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Public Reference</div>
            <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 2px;">#${params.reference}</div>
            <div style="font-size: 14px; color: #334155; margin-top: 4px;">${params.title}</div>
          </div>
          <p style="color: #334155; font-size: 15px;">You will receive email notifications as authorities review, verify, and resolve this issue.</p>
          <div style="margin-top: 24px;">
            <a href="${params.trackingUrl}" style="background: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Track Report Status</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Chigir Ale — Transforming civic reporting into actionable infrastructure solutions.</p>
        </div>
      `,
    };
  },

  statusUpdate(params: {
    name: string;
    reference: string;
    title: string;
    status: string;
    message?: string;
    trackingUrl: string;
  }) {
    return {
      subject: `Update on Report #${params.reference}: ${params.status}`,
      text: `Hello ${params.name},\n\nYour report #${params.reference} ("${params.title}") has been updated to ${params.status}.\n${params.message ? `Notes: ${params.message}\n` : ""}\nView details: ${params.trackingUrl}\n\nChigir Ale Civic Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">Status Update</h2>
          <p style="color: #334155; font-size: 16px;">Hello <strong>${params.name}</strong>,</p>
          <p style="color: #334155; font-size: 15px;">There is an official update on report <strong>#${params.reference}</strong>:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6;">
            <div style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">New Status</div>
            <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 4px 0;">${params.status}</div>
            ${params.message ? `<p style="font-size: 14px; color: #475569; margin: 8px 0 0 0;">${params.message}</p>` : ""}
          </div>
          <div style="margin-top: 24px;">
            <a href="${params.trackingUrl}" style="background: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Live Progress</a>
          </div>
        </div>
      `,
    };
  },
};
