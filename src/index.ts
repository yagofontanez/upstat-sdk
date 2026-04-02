const DEFAULT_ENDPOINT =
  "https://api.upstat.online/api/sdk/heartbeat";
const DEFAULT_INTERVAL_MS = 60_000;

type CheckStatus = "up" | "down";

interface CheckResult {
  name: string;
  status: CheckStatus;
  latency_ms?: number;
  message?: string;
}

type CheckFn = () => Promise<unknown | unknown>;

interface CheckDefinition {
  name: string;
  fn: CheckFn;
}

interface UpstatOptions {
  apiKey: string;
  interval?: number;
  endpoint?: string;
  silent?: boolean;
}

class UpstatSDK {
  private apiKey: string;
  private interval: number;
  private endpoint: string;
  private silent: boolean;
  private checks: CheckDefinition[] = [];
  private timer: any = null;

  constructor(options: UpstatOptions) {
    if (!options.apiKey) throw new Error("[UpStat] apiKey é obrigatório");
    this.apiKey = options.apiKey;
    this.interval = options.interval ?? DEFAULT_INTERVAL_MS;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.silent = options.silent ?? false;
  }

  check(name: string, fn: CheckFn): this {
    if (!name || typeof fn !== "function") {
      throw new Error("[UpStat] check() requer nome e função");
    }

    this.checks.push({ name, fn });
    return this;
  }

  start(): this {
    if (this.checks.length === 0) {
      this.log(
        "warn",
        "Nenhum check registrado. Use .check() antes de .start()",
      );
      return this;
    }
    this.log(
      "info",
      `Iniciando ${this.checks.length} check(s) a cada ${this.interval / 1000}s`,
    );
    this.runAll();
    this.timer = setInterval(() => this.runAll(), this.interval);
    if (this.timer.unref) this.timer.unref();
    return this;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.log("info", "Monitoramento encerrado");
    }
  }

  private async runAll(): Promise<void> {
    const results: CheckResult[] = await Promise.all(
      this.checks.map((c) => this.runOne(c)),
    );

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({ checks: results }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.log("error", `Heartbeat falhou: ${res.status} ${body}`);
      } else {
        this.log(
          "info",
          `Heartbeat: ${results.map((r) => `${r.name}=${r.status}`).join(", ")}`,
        );
      }
    } catch (e: any) {
      this.log("error", `Erro ao enviar heartbeat: ${e?.message}`);
    }
  }

  private async runOne(check: CheckDefinition): Promise<CheckResult> {
    const start = Date.now();

    try {
      await check.fn();
      return {
        name: check.name,
        status: "up",
        latency_ms: Date.now() - start,
      };
    } catch (e: any) {
      return {
        name: check.name,
        status: "down",
        latency_ms: Date.now() - start,
        message: e?.message ?? "unknown error",
      };
    }
  }

  private log(level: "info" | "warn" | "error", msg: string): void {
    if (this.silent) return;

    const prefix = `[UpStat] ${new Date().toISOString()}`;

    if (level === "error") console.error(`${prefix} ${msg}`);
    else if (level === "warn") console.warn(`${prefix} ${msg}`);
    else console.log(`${prefix} ${msg}`);
  }
}

export function createUpstat(options: UpstatOptions): UpstatSDK {
  return new UpstatSDK(options);
}

export type { UpstatOptions, CheckFn, CheckResult };
