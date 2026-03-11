/**
 * Script para automatizar pruebas de rechazo (DECLINED) de Fiserv Connect.
 * Usa los montos oficiales del documento "Códigos de rechazo Declined y Failed".
 *
 * Uso (desde apps/backend):
 *   npm run test:fiserv-declined
 *   FISERV_TEST_JWT=eyJ... npm run test:fiserv-declined
 *   npm run test:fiserv-declined -- --token=eyJ...
 *
 * Requiere:
 *   - Backend corriendo (crear-transaccion)
 *   - JWT válido (FISERV_TEST_JWT o --token=). Obtenerlo: login en el front y copiar el token del localStorage o de la petición.
 *   - Para cada test se abre el navegador; en Fiserv sandbox ingresar la tarjeta de prueba; el monto dispara el rechazo.
 */

import * as http from 'http';
import * as url from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  /** URL base del backend (ej. http://localhost:3000) */
  backendUrl: process.env.FISERV_TEST_BACKEND_URL || 'http://localhost:3000',
  /** Endpoint para crear la orden/transacción (recibe amount, responseSuccessURL, responseFailURL) */
  createOrderEndpoint:
    process.env.FISERV_TEST_CREATE_ORDER_ENDPOINT || 'api/payments/fiserv/crear-transaccion',
  /** JWT del usuario con el que se crea la transacción */
  jwt: process.env.FISERV_TEST_JWT || '',
  /** Puerto local donde este script recibe el redirect de Fiserv */
  callbackPort: parseInt(process.env.FISERV_TEST_CALLBACK_PORT || '8765', 10),
  /** Segundos máximos de espera por cada redirect antes de fallar */
  captureTimeoutSeconds: 120,
};

/** Montos que disparan cada código de rechazo en Fiserv Connect (documento oficial) */
const DECLINED_TESTS = [
  { name: 'Do not honour', code: 'N:05', amount: 1005 },
  { name: 'Fondos insuficientes', code: 'N:51', amount: 1051 },
  { name: 'Tarjeta inválida', code: 'N:14', amount: 1014 },
  { name: 'Transacción no permitida', code: 'N:57', amount: 1057 },
];

// ============================================
// ESTADO DEL SERVIDOR DE CAPTURA
// ============================================

let currentGatewayUrl = '';
let currentFormParams: Record<string, string> = {};
let captureResolve: ((params: Record<string, string>) => void) | null = null;
let captureTimeoutId: ReturnType<typeof setTimeout> | null = null;

// ============================================
// CREAR ORDEN EN EL BACKEND
// ============================================

interface CreateOrderResponse {
  gatewayUrl: string;
  formParams: Record<string, string>;
}

async function createOrder(amount: number): Promise<CreateOrderResponse> {
  const baseUrl = CONFIG.backendUrl.replace(/\/$/, '');
  const endpoint = `${baseUrl}/${CONFIG.createOrderEndpoint.replace(/^\//, '')}`;
  const callbackUrl = `http://127.0.0.1:${CONFIG.callbackPort}/capture`;

  if (!CONFIG.jwt) {
    throw new Error(
      'Falta JWT. Configura FISERV_TEST_JWT o pasa --token=TU_JWT al ejecutar.',
    );
  }

  const { data } = await axios.post<CreateOrderResponse>(
    endpoint,
    {
      amount,
      currency: 'ARS',
      responseSuccessURL: callbackUrl,
      responseFailURL: callbackUrl,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.jwt}`,
      },
      validateStatus: () => true,
    },
  );

  if (!data?.gatewayUrl || !data?.formParams) {
    const msg = (data as { message?: string })?.message || JSON.stringify(data);
    throw new Error(`Backend no devolvió gatewayUrl/formParams: ${msg}`);
  }

  return data;
}

// ============================================
// ABRIR URL EN EL NAVEGADOR
// ============================================

function openBrowser(u: string): void {
  const command =
    process.platform === 'win32'
      ? `start "" "${u}"`
      : process.platform === 'darwin'
        ? `open "${u}"`
        : `xdg-open "${u}"`;
  exec(command, (err) => {
    if (err) {
      console.warn('No se pudo abrir el navegador automáticamente. Abre manualmente:', u);
    }
  });
}

// ============================================
// SERVIDOR HTTP (FORM + CAPTURE)
// ============================================

function startCaptureServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url || '', true);
      const pathname = parsed.pathname || '';
      const query = parsed.query as Record<string, string>;

      if (pathname === '/go' || pathname === '/') {
        // Página que auto-envía el form a Fiserv Connect
        const gatewayUrl = currentGatewayUrl;
        const formParams = currentFormParams;

        if (!gatewayUrl || Object.keys(formParams).length === 0) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(
            '<html><body><p>No hay datos de pago. Ejecuta el script de nuevo y abre /go cuando indique.</p></body></html>',
          );
          return;
        }

        const inputs = Object.entries(formParams)
          .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}" />`)
          .join('\n');

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirigiendo a Fiserv...</title></head>
<body>
  <p>Redirigiendo al gateway de pago Fiserv...</p>
  <form id="f" method="POST" action="${escapeHtml(gatewayUrl)}">${inputs}</form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`;

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      if (pathname === '/capture') {
        // Fiserv puede redirigir por GET (query) o POST (body x-www-form-urlencoded)
        const finishCapture = (params: Record<string, string>) => {
          if (captureResolve) {
            captureResolve(params);
            captureResolve = null;
          }
          if (captureTimeoutId) {
            clearTimeout(captureTimeoutId);
            captureTimeoutId = null;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(
            '<html><body><p>Redirect capturado. Puedes cerrar esta pestaña y volver al script.</p></body></html>',
          );
        };

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const params: Record<string, string> = {};
            for (const [k, v] of Object.entries(query)) {
              params[k] = Array.isArray(v) ? v[0] : String(v ?? '');
            }
            const searchParams = new URLSearchParams(body);
            searchParams.forEach((value, key) => {
              params[key] = value;
            });
            finishCapture(params);
          });
          return; // no caer en el bloque GET
        }

        const params: Record<string, string> = {};
        for (const [k, v] of Object.entries(query)) {
          params[k] = Array.isArray(v) ? v[0] : String(v ?? '');
        }
        finishCapture(params);
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(CONFIG.callbackPort, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Espera a que el navegador sea redirigido a /capture y devuelve los query params */
function waitForCapture(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    captureResolve = resolve;
    captureTimeoutId = setTimeout(() => {
      captureResolve = null;
      reject(new Error(`Timeout: no se recibió redirect en ${CONFIG.captureTimeoutSeconds}s`));
    }, CONFIG.captureTimeoutSeconds * 1000);
  });
}

// ============================================
// EJECUTAR UN TEST
// ============================================

interface TestResult {
  name: string;
  code: string;
  amount: number;
  ok: boolean;
  redirectedToError: boolean;
  approvalCode: string;
  processorResponseCode: string;
  errorMessage: string;
  oid: string;
  rawParams: Record<string, string>;
  error?: string;
}

async function runTest(test: (typeof DECLINED_TESTS)[0]): Promise<TestResult> {
  const { name, code, amount } = test;

  const result: TestResult = {
    name,
    code,
    amount,
    ok: false,
    redirectedToError: false,
    approvalCode: '',
    processorResponseCode: '',
    errorMessage: '',
    oid: '',
    rawParams: {},
  };

  try {
    const order = await createOrder(amount);
    currentGatewayUrl = order.gatewayUrl;
    currentFormParams = order.formParams;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    return result;
  }

  const goUrl = `http://127.0.0.1:${CONFIG.callbackPort}/go`;
  console.log(`   Abriendo navegador: ${goUrl}`);
  openBrowser(goUrl);

  let params: Record<string, string>;
  try {
    params = await waitForCapture();
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    return result;
  }

  result.rawParams = params;
  result.approvalCode = params.approval_code || params.approvalCode || '';
  result.processorResponseCode = params.processor_response_code || params.response_code || params.responseCode || '';
  result.errorMessage = params.errormessage || params.errorMessage || params.failReason || params.fail_reason || '';
  result.oid = params.oid || params.merchantTransactionId || '';

  const isSuccess = /^\d+$/.test(result.processorResponseCode)
    ? result.processorResponseCode === '00'
    : (result.approvalCode || '').toUpperCase().startsWith('Y:');
  result.redirectedToError = !isSuccess;
  result.ok = result.redirectedToError; // Para DECLINED esperamos redirect a error

  return result;
}

// ============================================
// MAIN
// ============================================

function parseArgs(): void {
  const args = process.argv.slice(2);
  for (const a of args) {
    if (a.startsWith('--token=')) {
      CONFIG.jwt = a.slice(8);
    } else if (a.startsWith('--backend=')) {
      CONFIG.backendUrl = a.slice(10);
    } else if (a.startsWith('--port=')) {
      CONFIG.callbackPort = parseInt(a.slice(7), 10);
    }
  }
}

async function main(): Promise<void> {
  parseArgs();

  console.log('Fiserv Connect — Pruebas de rechazo (DECLINED)\n');
  console.log('Configuración:');
  console.log(`  Backend:        ${CONFIG.backendUrl}`);
  console.log(`  Endpoint orden: ${CONFIG.createOrderEndpoint}`);
  console.log(`  Puerto captura: ${CONFIG.callbackPort}`);
  console.log(`  JWT:            ${CONFIG.jwt ? `${CONFIG.jwt.slice(0, 20)}...` : '(no configurado)'}`);
  console.log('');

  if (!CONFIG.jwt) {
    console.error('Error: falta JWT. Usa FISERV_TEST_JWT o --token=TU_JWT');
    process.exit(1);
  }

  const server = await startCaptureServer();
  console.log(`Servidor de captura: http://127.0.0.1:${CONFIG.callbackPort}\n`);

  const results: TestResult[] = [];

  for (let i = 0; i < DECLINED_TESTS.length; i++) {
    const test = DECLINED_TESTS[i];
    console.log(`[${i + 1}/${DECLINED_TESTS.length}] ${test.name} (monto ${test.amount}, esperado ${test.code})`);
    const result = await runTest(test);
    results.push(result);

    if (result.error) {
      console.log(`   ERROR: ${result.error}\n`);
    } else {
      console.log(`   oid: ${result.oid || '-'}`);
      console.log(`   processor_response_code: ${result.processorResponseCode || '-'}`);
      console.log(`   approval_code: ${result.approvalCode || '-'}`);
      console.log(`   errormessage: ${result.errorMessage || '-'}`);
      console.log(`   redirectedToError: ${result.redirectedToError}`);
      console.log('');
    }
  }

  server.close();

  // Resumen final
  console.log('--- Resumen ---');
  for (const r of results) {
    const status = r.ok
      ? 'OK (redirected to /donar/error)'
      : r.error
        ? `ERROR: ${r.error}`
        : 'FAIL (se esperaba redirect a error)';
    console.log(`[DECLINED] ${r.name} → ${status}`);
  }

  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
