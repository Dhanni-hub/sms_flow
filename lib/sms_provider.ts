export interface SmsProviderSendInput {
  sender: string;
  to: string;
  body: string;
}

export interface SmsProviderSendResult {
  provider: string;
  providerMessageId?: string;
  providerStatus?: string;
  raw?: unknown;
}

export class SmsProviderConfigurationError extends Error {
  constructor(message = "SMS provider is not configured.") {
    super(message);
    this.name = "SmsProviderConfigurationError";
  }
}

export interface SmsProvider {
  send(input: SmsProviderSendInput): Promise<SmsProviderSendResult>;
}

export type NormalizedDeliveryStatus = "DELIVERED" | "PENDING" | "QUEUED" | "FAILED" | "SENT";

export function normalizeProviderStatus(status?: string | null): NormalizedDeliveryStatus {
  const value = (status ?? "").toLowerCase();
  if (["delivered", "delivery successful", "success", "sent successfully"].some((token) => value.includes(token))) return "DELIVERED";
  if (["queued", "accepted"].some((token) => value.includes(token))) return "QUEUED";
  if (["failed", "rejected", "expired", "undeliverable", "blacklist"].some((token) => value.includes(token))) return "FAILED";
  if (["sent", "message sent"].some((token) => value.includes(token))) return "SENT";
  return "PENDING";
}

class DisabledSmsProvider implements SmsProvider {
  async send(): Promise<SmsProviderSendResult> {
    throw new SmsProviderConfigurationError(
      "SMS sending is disabled. Set SMS_PROVIDER and provider credentials before sending live SMS."
    );
  }
}

class InfobipSmsProvider implements SmsProvider {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async send(input: SmsProviderSendInput): Promise<SmsProviderSendResult> {
    const normalizedBaseUrl = this.baseUrl.startsWith("http") ? this.baseUrl : `https://${this.baseUrl}`;
    const response = await fetch(`${normalizedBaseUrl.replace(/\/$/, "")}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        Authorization: `App ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            from: input.sender,
            destinations: [{ to: input.to.replace(/^\+/, "") }],
            text: input.body,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`SMS provider error (${response.status}): ${detail.slice(0, 240)}`);
    }

    const payload = (await response.json()) as {
      messages?: Array<{ messageId?: string; status?: { name?: string } }>;
    };
    const message = payload.messages?.[0];
    return {
      provider: "infobip",
      providerMessageId: message?.messageId,
      providerStatus: message?.status?.name,
      raw: payload,
    };
  }
}

class TermiiSmsProvider implements SmsProvider {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async send(input: SmsProviderSendInput): Promise<SmsProviderSendResult> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: input.to.replace(/^\+/, ""),
        from: input.sender,
        sms: input.body,
        type: "plain",
        channel: process.env.TERMII_CHANNEL ?? "generic",
        api_key: this.apiKey,
      }),
    });

    const text = await response.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      const message = typeof payload.message === "string" ? payload.message : text;
      throw new Error(`Termii SMS error (${response.status}): ${message.slice(0, 240)}`);
    }

    const providerMessageId =
      typeof payload.message_id === "string"
        ? payload.message_id
        : typeof payload.messageId === "string"
          ? payload.messageId
          : typeof payload.id === "string"
            ? payload.id
            : undefined;

    const providerStatus =
      typeof payload.message === "string"
        ? payload.message
        : typeof payload.status === "string"
          ? payload.status
          : undefined;

    return {
      provider: "termii",
      providerMessageId,
      providerStatus,
      raw: payload,
    };
  }
}

export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === "termii") {
    if (!process.env.TERMII_BASE_URL || !process.env.TERMII_API_KEY) {
      throw new SmsProviderConfigurationError("TERMII_BASE_URL and TERMII_API_KEY are required.");
    }
    return new TermiiSmsProvider(process.env.TERMII_BASE_URL, process.env.TERMII_API_KEY);
  }
  if (process.env.SMS_PROVIDER === "infobip") {
    if (!process.env.INFOBIP_BASE_URL || !process.env.INFOBIP_API_KEY) {
      throw new SmsProviderConfigurationError("INFOBIP_BASE_URL and INFOBIP_API_KEY are required.");
    }
    return new InfobipSmsProvider(process.env.INFOBIP_BASE_URL, process.env.INFOBIP_API_KEY);
  }
  return new DisabledSmsProvider();
}
