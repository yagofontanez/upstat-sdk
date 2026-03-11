# Upstat SDK

SDK oficial para enviar **heartbeats e health checks** para o
**Upstat**, permitindo monitorar serviços, APIs, workers e jobs
diretamente do seu código.

Com ele você pode registrar funções de verificação (`checks`) que serão
executadas periodicamente. O resultado é enviado automaticamente para o
Upstat.

---

# Instalação

```bash
npm install upstat-sdk
```

ou

```bash
yarn add upstat-sdk
```

---

# Uso básico

```ts
import { createUpstat } from "upstat-sdk";

const monitor = createUpstat({
  apiKey: "YOUR_API_KEY",
});

monitor
  .check("database", async () => {
    await db.query("SELECT 1");
  })
  .check("redis", async () => {
    await redis.ping();
  })
  .start();
```

O SDK irá:

- Executar os checks
- Medir latência
- Detectar erros
- Enviar o resultado para o Upstat

---

# Como funciona

Cada `check` é uma função assíncrona.

Se a função **resolver sem erro**, o status será:

    up

Se a função **lançar erro**, o status será:

    down

Exemplo:

```ts
monitor.check("api", async () => {
  const res = await fetch("https://api.example.com/health");

  if (!res.ok) {
    throw new Error("API retornou erro");
  }
});
```

---

# Opções

```ts
createUpstat(options);
```

Opção Tipo Obrigatório Descrição

---

`apiKey` string sim API Key do monitor
`interval` number não Intervalo entre checks (ms)
`endpoint` string não Endpoint do Upstat
`silent` boolean não Desativa logs

### Valores padrão

```ts
interval: 60000 // 60s
endpoint: https://upstat-backend.onrender.com/api/sdk/heartbeat
```

---

# API

## createUpstat(options)

Cria uma instância do monitor.

```ts
const monitor = createUpstat({
  apiKey: "your-key",
});
```

---

## check(name, fn)

Registra um check.

```ts
monitor.check("database", async () => {
  await db.query("SELECT 1");
});
```

### Parâmetros

Nome Tipo Descrição

---

`name` string Nome do check
`fn` function Função que executa a verificação

---

## start()

Inicia o monitoramento.

```ts
monitor.start();
```

Executa todos os checks imediatamente e depois em intervalos definidos.

---

## stop()

Para o monitoramento.

```ts
monitor.stop();
```

---

# Exemplo completo

```ts
import { createUpstat } from "upstat-sdk";
import redis from "./redis";
import db from "./db";

const upstat = createUpstat({
  apiKey: process.env.UPSTAT_API_KEY!,
  interval: 30000,
});

upstat
  .check("database", async () => {
    await db.query("SELECT 1");
  })
  .check("redis", async () => {
    await redis.ping();
  })
  .check("external-api", async () => {
    const res = await fetch("https://api.example.com/health");

    if (!res.ok) {
      throw new Error("API offline");
    }
  })
  .start();
```

---

# Logs

O SDK exibe logs no console por padrão.

Exemplo:

    [UpStat] 2026-03-10T22:00:00.000Z Iniciando 3 check(s) a cada 60s
    [UpStat] 2026-03-10T22:00:00.120Z Heartbeat: database=up, redis=up, external-api=up

Para desativar logs:

```ts
createUpstat({
  apiKey: "...",
  silent: true,
});
```

---

# Resultado enviado

O SDK envia para o Upstat:

```json
{
  "checks": [
    {
      "name": "database",
      "status": "up",
      "latency_ms": 12
    },
    {
      "name": "redis",
      "status": "down",
      "latency_ms": 3,
      "message": "connection refused"
    }
  ]
}
```

---

# Casos de uso

Você pode monitorar:

- APIs
- banco de dados
- Redis
- workers
- filas
- serviços externos
- cron jobs
- microservices

---

# Licença

MIT
