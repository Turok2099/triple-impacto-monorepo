/**
 * Pruebas automatizadas de Fiserv Checkout Connect usando tarjetas de prueba oficiales.
 * Usa Playwright para abrir el navegador, completar el formulario de Connect y capturar el redirect.
 *
 * Uso (desde apps/backend):
 *   npx playwright install chromium   # primera vez
 *   npm run test:fiserv-connect
 */

import * as http from 'http';
import * as url from 'url';
import { chromium, type Browser, type Page } from 'playwright';
import axios from 'axios';

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  backendUrl: process.env.FISERV_TEST_BACKEND_URL || 'http://localhost:3000',
  createOrderEndpoint:
    process.env.FISERV_TEST_CREATE_ORDER_ENDPOINT || 'api/payments/fiserv/crear-transaccion',
  loginEndpoint: 'api/auth/login',
  callbackPort: parseInt(process.env.FISERV_TEST_CALLBACK_PORT || '8766', 10),
  defaultAmount: 5000,
  testTimeoutMs: 60_000,
  email: 'jorge.castro.cruz@hotmail.com',
  password: 'pompis11',
  jwt: '',
};

interface TestScenario {
  id: string;
  name: string;
  storename?: string;
  txntype?: string;
  numberOfInstallments?: string;
  cardName: string;
  cardNumber: string;
  cardExp: string;
  cardCvv: string;
  expected: 'APPROVED' | 'DECLINED';
  backendAction?: 'POSAUTH' | 'VOID' | 'RETURN_TOTAL' | 'RETURN_PARCIAL' | 'SPLIT_A' | 'SPLIT_B';
}

const TEST_CARDS = {
  visa: {
    name: 'Visa Crédito',
    number: '4704550000000005',
    exp: '12/29',
    cvv: '123',
  },
  master: {
    name: 'Mastercard Crédito',
    number: '5165850000000008',
    exp: '12/29',
    cvv: '123',
  },
  data_only: {
    name: 'Data Only 3DS',
    number: '5239290700000028',
    exp: '12/29',
    cvv: '123',
  },
  invalid: {
    name: 'Tarjeta inválida (Auth Failure)',
    number: '5188340000000052',
    exp: '12/29',
    cvv: '123',
  },
};

const SCENARIOS: TestScenario[] = [
  {
    id: '1',
    name: 'Validar redirección a Hosted Payment Page',
    storename: '5926012005',
    txntype: 'sale',
    cardName: TEST_CARDS.visa.name,
    cardNumber: TEST_CARDS.visa.number,
    cardExp: TEST_CARDS.visa.exp,
    cardCvv: TEST_CARDS.visa.cvv,
    expected: 'APPROVED',
  },
  {
    id: '2',
    name: 'Venta aprobada Mastercard (StoreID 5926012005)',
    storename: '5926012005',
    txntype: 'sale',
    cardName: TEST_CARDS.master.name,
    cardNumber: TEST_CARDS.master.number,
    cardExp: TEST_CARDS.master.exp,
    cardCvv: TEST_CARDS.master.cvv,
    expected: 'APPROVED',
  },
  {
    id: '3',
    name: 'Venta aprobada Visa (StoreID 5926012006)',
    storename: '5926012006',
    txntype: 'sale',
    cardName: TEST_CARDS.visa.name,
    cardNumber: TEST_CARDS.visa.number,
    cardExp: TEST_CARDS.visa.exp,
    cardCvv: TEST_CARDS.visa.cvv,
    expected: 'APPROVED',
  },
  {
    id: '4',
    name: 'Venta en cuotas Visa',
    storename: '5926012006',
    txntype: 'sale',
    numberOfInstallments: '3',
    cardName: TEST_CARDS.visa.name,
    cardNumber: TEST_CARDS.visa.number,
    cardExp: TEST_CARDS.visa.exp,
    cardCvv: TEST_CARDS.visa.cvv,
    expected: 'APPROVED',
  },
  {
    id: '5',
    name: 'Flujo PREAUTH + POSAUTH',
    storename: '5926012005',
    txntype: 'preauth',
    cardName: TEST_CARDS.visa.name,
    cardNumber: TEST_CARDS.visa.number,
    cardExp: TEST_CARDS.visa.exp,
    cardCvv: TEST_CARDS.visa.cvv,
    expected: 'APPROVED', // PREAUTH Ok
    backendAction: 'POSAUTH',
  },
  {
    id: '6',
    name: 'VOID',
    storename: '5926012005',
    txntype: 'sale',
    cardName: TEST_CARDS.master.name,
    cardNumber: TEST_CARDS.master.number,
    cardExp: TEST_CARDS.master.exp,
    cardCvv: TEST_CARDS.master.cvv,
    expected: 'APPROVED', // Require approved first
    backendAction: 'VOID',
  },
  {
    id: '7',
    name: 'RETURN total',
    storename: '5926012005',
    txntype: 'sale',
    cardName: TEST_CARDS.visa.name,
    cardNumber: TEST_CARDS.visa.number,
    cardExp: TEST_CARDS.visa.exp,
    cardCvv: TEST_CARDS.visa.cvv,
    expected: 'APPROVED',
    backendAction: 'RETURN_TOTAL',
  },
  {
    id: '8',
    name: 'RETURN parcial',
    storename: '5926012005',
    txntype: 'sale',
    cardName: TEST_CARDS.visa.name,
    cardNumber: TEST_CARDS.visa.number,
    cardExp: TEST_CARDS.visa.exp,
    cardCvv: TEST_CARDS.visa.cvv,
    expected: 'APPROVED',
    backendAction: 'RETURN_PARCIAL',
  },
  {
    id: '9',
    name: 'SPLIT pago (Fallado): StoreID 1 (Aprobada) + StoreID 2 (Negada) + VOID',
    // La prueba ejecutará el rechazo visualmente para demostrar el flujo negativo
    storename: '5926012006',
    txntype: 'sale',
    cardName: TEST_CARDS.invalid.name,
    cardNumber: TEST_CARDS.invalid.number,
    cardExp: TEST_CARDS.invalid.exp,
    cardCvv: TEST_CARDS.invalid.cvv,
    expected: 'DECLINED',
    backendAction: 'SPLIT_A', // VOID en background simulado sobre Store 1
  },
  {
    id: '10',
    name: 'SPLIT pago (Exitoso): StoreID 1 (Aprobada) + StoreID 2 (Aprobada)',
    storename: '5926012005',
    txntype: 'sale',
    cardName: TEST_CARDS.visa.name,
    cardNumber: TEST_CARDS.visa.number,
    cardExp: TEST_CARDS.visa.exp,
    cardCvv: TEST_CARDS.visa.cvv,
    expected: 'APPROVED',
    backendAction: 'SPLIT_B', // Segunda venta en background/api simulada
  },
  {
    id: '11',
    name: 'Transacción Data Only con tarjeta de prueba (crítica para 3DS)',
    storename: '5926012005',
    txntype: 'sale',
    cardName: TEST_CARDS.data_only.name,
    cardNumber: TEST_CARDS.data_only.number,
    cardExp: TEST_CARDS.data_only.exp,
    cardCvv: TEST_CARDS.data_only.cvv,
    expected: 'APPROVED',
  },
];

// ============================================
// TIPOS Y ESTADO GLOBAL
// ============================================

interface CreateOrderResponse {
  gatewayUrl: string;
  formParams: Record<string, string>;
}

interface CaptureParams {
  approval_code?: string;
  processor_response_code?: string;
  response_code?: string;
  errormessage?: string;
  failReason?: string;
  oid?: string;
  merchantTransactionId?: string;
  [key: string]: string | undefined;
}

interface TestResult {
  id: string;
  name: string;
  expected: 'APPROVED' | 'DECLINED';
  ok: boolean;
  approvalCode: string;
  processorResponseCode: string;
  errorMessage: string;
  oid: string;
  actual: 'APPROVED' | 'DECLINED';
  error?: string;
}

let currentGatewayUrl = '';
let currentFormParams: Record<string, string> = {};
let lastCaptureParams: CaptureParams | null = null;
const globalResults: TestResult[] = [];

// ============================================
// LOGIN Y CREAR ORDEN
// ============================================

async function login(): Promise<void> {
  const baseUrl = CONFIG.backendUrl.replace(/\/$/, '');
  const url = `${baseUrl}/${CONFIG.loginEndpoint}`;
  console.log(`Intentando login en ${url}...`);
  try {
    const { data } = await axios.post<{ token: string }>(url, {
      email: CONFIG.email,
      password: CONFIG.password,
    });
    CONFIG.jwt = data.token;
    console.log('✅ Login exitoso. Token adquirido.');
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message;
    console.error(`❌ Error en Login: ${msg}`);
    console.error('Detalles del error de Login:', err);
    process.exit(1);
  }
}

async function createOrder(scenario: TestScenario): Promise<CreateOrderResponse> {
  const baseUrl = CONFIG.backendUrl.replace(/\/$/, '');
  const endpoint = `${baseUrl}/${CONFIG.createOrderEndpoint.replace(/^\//, '')}`;
  const callbackUrl = `http://127.0.0.1:${CONFIG.callbackPort}/capture`;

  const { data } = await axios.post<CreateOrderResponse>(
    endpoint,
    {
      amount: CONFIG.defaultAmount,
      currency: 'ARS',
      responseSuccessURL: callbackUrl,
      responseFailURL: callbackUrl,
      storename: scenario.storename,
      txntype: scenario.txntype,
      numberOfInstallments: scenario.numberOfInstallments,
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

async function invokeBackendAction(action: string, oid: string) {
  const baseUrl = CONFIG.backendUrl.replace(/\/$/, '');
  let endpoint = '';
  if (action === 'POSAUTH') endpoint = '/api/payments/fiserv/posauth';
  else if (action === 'VOID' || action === 'SPLIT_A') endpoint = '/api/payments/fiserv/void';
  else if (action.startsWith('RETURN')) endpoint = '/api/payments/fiserv/return';

  if (!endpoint) return;

  console.log(`   [API] Invocando operación de backend: ${action} sobre OrderID ${oid}...`);
  try {
    const { data } = await axios.post(
      `${baseUrl}${endpoint}`,
      { orderId: oid, action },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONFIG.jwt}`,
        },
        validateStatus: () => true,
      }
    );
    console.log(`   [API] Respuesta de Backend para ${action}:`, data);
  } catch (e: any) {
    console.error(`   [API] Error ejecutando ${action}: ${e.message}`);
  }
}

// ============================================
// SERVIDOR CALLBACK
// ============================================

function startCaptureServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url || '', true);
      const pathname = parsed.pathname || '';
      const query = parsed.query as Record<string, string>;

      const toParams = (q: Record<string, string | string[] | undefined>): Record<string, string> => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(q)) {
          out[k] = Array.isArray(v) ? v[0] ?? '' : String(v ?? '');
        }
        return out;
      };

      if (pathname === '/go' || pathname === '/') {
        if (!currentGatewayUrl || Object.keys(currentFormParams).length === 0) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<html><body><p>Error en params.</p></body></html>');
          return;
        }
        const inputs = Object.entries(currentFormParams)
          .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}" />`)
          .join('\n');
        const html = `<!DOCTYPE html><html><body><form id="f" method="POST" action="${escapeHtml(currentGatewayUrl)}">${inputs}</form><script>document.getElementById('f').submit();</script></body></html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      if (pathname === '/capture') {
        const finish = (params: CaptureParams) => {
          lastCaptureParams = params;
          const html = `<!DOCTYPE html><html><body><script>window.__FISERV_PARAMS__ = ${JSON.stringify(params)};</script>Redirect capturado.</body></html>`;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        };
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk.toString(); });
          req.on('end', () => {
            const params = toParams(query);
            const searchParams = new URLSearchParams(body);
            searchParams.forEach((value, key) => { params[key] = value; });
            finish(params as CaptureParams);
          });
          return;
        }
        finish(toParams(query) as CaptureParams);
        return;
      }
      res.writeHead(404);
      res.end('Not found');
    });
    server.listen(CONFIG.callbackPort, '127.0.0.1', () => resolve(server));
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================
// PLAYWRIGHT
// ============================================

async function runTest(browser: Browser, scenario: TestScenario, goUrl: string): Promise<TestResult> {
  const result: TestResult = {
    id: scenario.id,
    name: scenario.name,
    expected: scenario.expected,
    ok: false,
    approvalCode: '',
    processorResponseCode: '',
    errorMessage: '',
    oid: '',
    actual: 'DECLINED',
  };

  const page = await browser.newPage();
  page.setDefaultTimeout(35000);

  try {
    lastCaptureParams = null;
    const order = await createOrder(scenario);
    currentGatewayUrl = order.gatewayUrl;
    currentFormParams = order.formParams;

    await page.goto(goUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Esperar la navegación generada por el autoredirect del formulario POST
    await page.waitForURL(/ipg|fiserv|connect|secure/, { timeout: 30000 });

    if (!/ipg|fiserv|connect|secure/.test(page.url())) {
      throw new Error('No se llegó a la página de Fiserv');
    }

    // Fiserv puede inyectar el form en iframes o directamente en la vista (depende si es lightbox o IPG genérico)
    await page.waitForTimeout(4000); // Darle unos segundos a Fiserv para armar la UI

    // -- BYPASS DE LA PAGINA INTERMEDIA (Payment Type Selection) --
    const brand = scenario.cardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD';
    try {
      const isSelectionPage = await page.locator('button:has-text("CONTINUAR"), input[value="CONTINUAR"], :text("Forma de pago")').count() > 0;
      if (isSelectionPage) {
        console.log("   * Página intermedia detectada. Seleccionando marca y clicando Continuar...");
        try { await page.locator('select').first().selectOption({ label: brand }, { timeout: 2000 }); } catch (e) { }
        try { await page.locator(`img[src*="${brand}" i], img[alt*="${brand}" i]`).first().click({ timeout: 2000 }); } catch (e) { }

        await page.locator('button:has-text("CONTINUAR"), input[value="CONTINUAR"], .btn-primary, button[type="submit"]').first().click({ timeout: 5000 });
        await page.waitForTimeout(4000); // Esperar que cargue la vista final
      }
    } catch (e) { /* ignore */ }

    let targetFrame: any = null;
    console.log("   * Buscando inputs de tarjeta y esperando carga asíncrona...");

    for (let attempts = 0; attempts < 15; attempts++) {
      const allFrames = [page as any, ...page.frames()];
      for (const frm of allFrames) {

        // 1. Si existe un selector de marca en esta vista, seleccionarlo para forzar que aparezcan los inputs
        try {
          const brandSelectors = frm.locator('#brandTypeSelect, select[name="paymentMethod"]');
          if (await brandSelectors.count() > 0) {
            // Intentar seleccionarlo
            try { await brandSelectors.first().selectOption({ label: brand }, { timeout: 1000 }); }
            catch { try { await brandSelectors.first().selectOption(brand, { timeout: 1000 }); } catch (e) { } }
          }
        } catch (e) { }

        // 2. Verificar si los inputs ya se cargaron (esperar 1s extra si no están)
        try {
          const count = await frm.locator('input[name="cardnumber"], #cardNumber, input[id*="cardNumber"], input[name*="card"], input[type="tel"]').count();
          if (count > 0) {
            targetFrame = frm;
            break;
          }
        } catch (e) { /* ignore CORS errors */ }
      }
      if (targetFrame) break;
      await page.waitForTimeout(2000); // Re-poll y espacio para cargar async inputs
    }

    if (!targetFrame) {
      console.error("\\n--- DEBUG: NO INPUT FOUND ---");
      await page.screenshot({ path: 'fiserv_fail.png', fullPage: true });
      let i = 0;
      for (const frm of [page as any, ...page.frames()]) {
        try {
          const content = await frm.content();
          console.error(`\\n--- FRAME ${i} (${await frm.url()}) ---\\n${content.substring(0, 3000)}`);
        } catch (e) { console.error(`Failed to dump frame ${i}`); }
        i++;
      }
      throw new Error(`No se pudo encontrar el input de tarjeta. Iframes en página: ${page.frames().length}. Se guardó fiserv_fail.png`);
    }

    const frameLoc = targetFrame; // usar frameLoc para re-usar las lineas siguientes sin error de sintaxis

    // Nos aseguramos que estén visibles (espera final)
    await frameLoc.locator('input[name="cardnumber"], #cardNumber, input[id*="cardNumber"]').first().waitFor({ state: 'visible', timeout: 5000 });

    const expParts = scenario.cardExp.split('/');
    // Algunos campos en Fiserv IPG existen varias veces ocultos. Usar .first() para rehuir Strict Mode.
    await frameLoc.locator('input[name="cardnumber"], #cardNumber, input[id*="cardNumber"]').first().fill(scenario.cardNumber);
    await frameLoc.locator('input[name="cardholder"], #cardholderName, input[id*="cardholder"]').first().fill('Test User');
    await frameLoc.locator('select[name="expmonth"], #expMonth').first().selectOption(expParts[0]?.trim() || '12');
    await frameLoc.locator('select[name="expyear"], #expYear').first().selectOption((expParts[1]?.trim() || '29').slice(-2));
    await frameLoc.locator('input[name="cvv"], input[name="securitycode"], #securityCode, input[id*="security"]').first().fill(scenario.cardCvv);

    // Enviar form
    await frameLoc.locator('button[type="submit"], input[type="submit"], .btn-primary, button[id*="submit"]').first().click();

    // Esperar redireccion de vuelta
    await page.waitForURL(new RegExp(`127\\.0\\.0\\.1:${CONFIG.callbackPort}/capture`), {
      timeout: CONFIG.testTimeoutMs,
    });

    const params = lastCaptureParams || (await page.evaluate(() => (window as any).__FISERV_PARAMS__)) || {};

    const approval = params.approval_code || params.approvalCode || '';
    const code = params.processor_response_code || params.response_code || params.responseCode || '';
    const errMsg = params.errormessage || params.errorMessage || params.failReason || params.fail_reason || '';

    const isApproved = code === '00' || (approval.toUpperCase().startsWith('Y:') && approval.length > 2);

    result.actual = isApproved ? 'APPROVED' : 'DECLINED';
    result.approvalCode = approval;
    result.processorResponseCode = code;
    result.errorMessage = errMsg;
    result.oid = params.oid || params.merchantTransactionId || '';
    result.ok = result.actual === scenario.expected;

    if (scenario.backendAction) {
      console.log(`   * Ejecutando Back-end operation posterior...`);
      await invokeBackendAction(scenario.backendAction, result.oid);
    }
  } catch (e: any) {
    result.error = e.message;
  } finally {
    await page.close();
  }
  return result;
}

// ============================================
// MAIN
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  for (const a of args) {
    if (a.startsWith('--backend=')) CONFIG.backendUrl = a.slice(10);
    else if (a.startsWith('--port=')) CONFIG.callbackPort = parseInt(a.slice(7), 10);
  }

  console.log('Fiserv Connect — Pruebas Automatizadas de Homologación\n');
  await login();

  const server = await startCaptureServer();
  const goUrl = `http://127.0.0.1:${CONFIG.callbackPort}/go`;
  console.log(`Servidor de interceptación en: ${goUrl}\n`);

  const browser = await chromium.launch({ headless: false, args: ['--disable-web-security', '--disable-site-isolation-trials', '--no-sandbox'] });

  for (const scenario of SCENARIOS) {
    console.log(`[Escenario ${scenario.id}] ${scenario.name}`);
    const r = await runTest(browser, scenario, goUrl);
    globalResults.push(r);

    if (r.error) {
      console.log(`   ERROR: ${r.error}\n`);
    } else {
      console.log(`   Code: ${r.processorResponseCode || '-'} | Approval: ${r.approvalCode || '-'}`);
      console.log(`   Result: ${r.actual} → ${r.ok ? '✅ OK' : '❌ FAIL'}\n`);
    }
  }

  await browser.close();
  server.close();

  console.log('--- REPORTE FINAL DE AUDITORÍA PARA FISERV ---');
  console.log('Asegúrese de copiar estos OIDs/Approval Codes para enviarlos al equipo de Fiserv a auditar los logs:\n');

  for (const r of globalResults) {
    const status = r.ok ? '✅ OK' : '❌ FAIL';
    console.log(`Prueba ${r.id}: ${r.name}`);
    console.log(`  - Resultado: ${status} (Esperado: ${r.expected}, Obtenido: ${r.actual})`);
    console.log(`  - OrderID (OID): ${r.oid || 'No generado'}`);
    console.log(`  - Approval Code: ${r.approvalCode || 'N/A'}`);
    console.log(`---------------------------------------------------------------------`);
  }

  const failed = globalResults.filter((r) => !r.ok);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(console.error);
