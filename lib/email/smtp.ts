import { connect } from "cloudflare:sockets";

export type SmtpConfig = {
  host: string;
  port: number;
  tlsMode: "starttls" | "tls";
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  heloHostname: string;
};

type SmtpResponse = {
  code: number;
  lines: string[];
};

type Socket = ReturnType<typeof connect>;

const encoder = new TextEncoder();

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function utf8Base64(value: string): string {
  return bytesToBase64(encoder.encode(value));
}

function wrapBase64(value: string): string {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function encodedWord(value: string): string {
  return `=?UTF-8?B?${utf8Base64(sanitizeHeader(value))}?=`;
}

function dotStuff(value: string): string {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

class SmtpConnection {
  private socket: Socket;
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private buffer = "";
  private readonly decoder = new TextDecoder();

  constructor(socket: Socket) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  async opened() {
    await this.socket.opened;
  }

  async readResponse(expectedCodes: number[]): Promise<SmtpResponse> {
    const lines: string[] = [];
    let responseCode = 0;

    while (true) {
      const newline = this.buffer.indexOf("\n");
      if (newline < 0) {
        const chunk = await this.reader.read();
        if (chunk.done) throw new Error("SMTP connection closed before a complete response");
        this.buffer += this.decoder.decode(chunk.value, { stream: true });
        continue;
      }

      const line = this.buffer.slice(0, newline + 1).replace(/\r?\n$/, "");
      this.buffer = this.buffer.slice(newline + 1);
      const match = /^(\d{3})([ -])(.*)$/.exec(line);
      if (!match) throw new Error("SMTP server returned a malformed response");
      const code = Number(match[1]);
      responseCode ||= code;
      if (code !== responseCode)
        throw new Error("SMTP server returned inconsistent response codes");
      lines.push(match[3]);
      if (match[2] === " ") break;
    }

    if (!expectedCodes.includes(responseCode)) {
      throw new Error(`SMTP command failed with status ${responseCode}`);
    }
    return { code: responseCode, lines };
  }

  async command(command: string, expectedCodes: number[]) {
    await this.writer.write(encoder.encode(`${command}\r\n`));
    return this.readResponse(expectedCodes);
  }

  async startTls(expectedServerHostname: string) {
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.socket = this.socket.startTls({ expectedServerHostname });
    this.reader = this.socket.readable.getReader();
    this.writer = this.socket.writable.getWriter();
    this.buffer = "";
    await this.socket.opened;
  }

  close() {
    try {
      void this.socket.close().catch(() => {});
    } catch {
      // The socket may already be closed after a protocol or network failure.
    }
  }
}

function buildMessage(input: {
  fromEmail: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const boundary = `stitch-and-slow-${crypto.randomUUID()}`;
  const messageIdHost = input.fromEmail.split("@")[1] || "localhost";
  const headers = [
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${sanitizeHeader(messageIdHost)}>`,
    `From: ${encodedWord(input.fromName)} <${sanitizeHeader(input.fromEmail)}>`,
    `To: ${sanitizeHeader(input.to)}`,
    `Subject: ${encodedWord(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(utf8Base64(input.text)),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(utf8Base64(input.html)),
    `--${boundary}--`,
    "",
  ];
  return dotStuff([...headers, "", ...body].join("\r\n"));
}

export async function sendSmtpMail(
  config: SmtpConfig,
  message: { to: string; subject: string; text: string; html: string },
) {
  const smtpToken = /^[\x21-\x7e]+$/;
  const mailbox = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+$/;
  if (!smtpToken.test(config.host) || !smtpToken.test(config.heloHostname)) {
    throw new Error("SMTP host configuration contains unsupported characters");
  }
  if (!mailbox.test(config.fromEmail) || !mailbox.test(message.to)) {
    throw new Error("SMTP envelope contains an invalid email address");
  }
  const socket = connect(
    { hostname: config.host, port: config.port },
    { secureTransport: config.tlsMode === "tls" ? "on" : "starttls", allowHalfOpen: false },
  );
  const smtp = new SmtpConnection(socket);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    smtp.close();
  }, 15_000);

  try {
    await smtp.opened();
    await smtp.readResponse([220]);
    let capabilities = await smtp.command(`EHLO ${config.heloHostname}`, [250]);

    if (config.tlsMode === "starttls") {
      if (!capabilities.lines.some((line) => line.toUpperCase().startsWith("STARTTLS"))) {
        throw new Error("SMTP server does not advertise STARTTLS");
      }
      await smtp.command("STARTTLS", [220]);
      await smtp.startTls(config.host);
      capabilities = await smtp.command(`EHLO ${config.heloHostname}`, [250]);
    }

    const authMethods = new Set(
      capabilities.lines
        .filter((line) => /^AUTH(?:=|\s)/i.test(line))
        .flatMap((line) =>
          line
            .replace(/^AUTH(?:=|\s)+/i, "")
            .toUpperCase()
            .split(/\s+/),
        ),
    );
    if (authMethods.has("PLAIN")) {
      const credentials = utf8Base64(`\0${config.username}\0${config.password}`);
      await smtp.command(`AUTH PLAIN ${credentials}`, [235]);
    } else if (authMethods.has("LOGIN")) {
      await smtp.command("AUTH LOGIN", [334]);
      await smtp.command(utf8Base64(config.username), [334]);
      await smtp.command(utf8Base64(config.password), [235]);
    } else {
      throw new Error("SMTP server does not advertise a supported authentication method");
    }

    await smtp.command(`MAIL FROM:<${config.fromEmail}>`, [250]);
    await smtp.command(`RCPT TO:<${message.to}>`, [250, 251]);
    await smtp.command("DATA", [354]);
    const data = buildMessage({
      ...message,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    });
    await smtp.command(`${data}\r\n.`, [250]);
    await smtp.command("QUIT", [221]);
  } catch (error) {
    if (timedOut) {
      throw new Error(
        `SMTP connection timed out after 15 seconds (${config.host}:${config.port}, ${config.tlsMode})`,
        { cause: error },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    smtp.close();
  }
}
