import axios from 'axios';
import * as crypto from 'crypto';

// ============================================================================
// CONFIGURACIÓN DE FISERV (REST API)
// ============================================================================
// URL de prueba para Fiserv REST API (Reemplazar según documentación exacta de la región)
const FISERV_REST_API_URL = 'https://test.ipg-online.com/ipgapi/services/rest';

// Credenciales
const STORE_ID = process.env.FISERV_CONNECT_STORE_ID_1 || '5926012005';
const SHARED_SECRET = process.env.FISERV_CONNECT_SHARED_SECRET || 'TU_SHARED_SECRET';
const API_KEY = process.env.FISERV_API_KEY || 'TU_API_KEY'; // Requerido para REST API usualmente
const API_SECRET = process.env.FISERV_API_SECRET || 'TU_API_SECRET';

// Función auxiliar para firmar peticiones REST de Fiserv (Pseudocódigo real)
// La firma generalmente usa HMAC-SHA256 con el Api-Secret + payload en Fiserv REST
function generateHeaders(payload: any) {
    const clientRequestId = crypto.randomUUID();
    const timestamp = Date.now().toString();
    const messageStr = API_KEY + clientRequestId + timestamp + JSON.stringify(payload);

    const signature = crypto
        .createHmac('sha256', API_SECRET || SHARED_SECRET) // Frecuentemente se usa el secret
        .update(messageStr)
        .digest('base64');

    return {
        'Content-Type': 'application/json',
        'Api-Key': API_KEY,
        'Client-Request-Id': clientRequestId,
        'Timestamp': timestamp,
        'Message-Signature': signature,
    };
}

// Cliente Axios base
const apiClient = axios.create({
    baseURL: FISERV_REST_API_URL,
});

apiClient.interceptors.request.use((config) => {
    if (config.data) {
        const headers = generateHeaders(config.data);
        config.headers = { ...config.headers, ...headers } as any;
    }
    return config;
});

// ============================================================================
// OPERACIONES BACK-OFFICE (Server-to-Server)
// ============================================================================

/**
 * 1. VOID (Anular)
 * Anula una transacción (sale o preauth) si aún no hizo el cierre de lote (settlement).
 * @param oid El ID de orden original generado por Fiserv Connect
 */
async function voidTransaction(oid: string) {
    console.log(`\n--- Ejecutando VOID para OID: ${oid} ---`);

    const payload = {
        transactionType: "VOID",
        storeId: STORE_ID,
        referenceTransactionId: oid // OID original a anular
    };

    try {
        const response = await apiClient.post('/transactions', payload);
        console.log('✅ VOID Exitoso:');
        console.log(response.data);
    } catch (error: any) {
        console.error('❌ Error en VOID:', error.response?.data || error.message);
    }
}

/**
 * 2. RETURN TOTAL (Reembolso Total)
 * Reembolsa la totalidad de una venta ya liquidada.
 * @param oid El ID de orden original generado por Fiserv Connect
 */
async function returnTotal(oid: string) {
    console.log(`\n--- Ejecutando RETURN TOTAL para OID: ${oid} ---`);

    const payload = {
        transactionType: "RETURN",
        storeId: STORE_ID,
        referenceTransactionId: oid // OID original
    };

    try {
        const response = await apiClient.post('/transactions', payload);
        console.log('✅ RETURN TOTAL Exitoso:');
        console.log(response.data);
    } catch (error: any) {
        console.error('❌ Error en RETURN TOTAL:', error.response?.data || error.message);
    }
}

/**
 * 3. RETURN PARCIAL (Reembolso Parcial)
 * Reembolsa solo una fracción del total de una venta ya liquidada.
 * @param oid El ID de orden original generado por Fiserv Connect
 * @param amount El importe a reembolsar
 * @param currency Moneda en formato numérico o string (ej: '032' o 'ARS')
 */
async function returnPartial(oid: string, amount: string, currency: string = '032') {
    console.log(`\n--- Ejecutando RETURN PARCIAL (${amount} ${currency}) para OID: ${oid} ---`);

    const payload = {
        transactionType: "RETURN",
        storeId: STORE_ID,
        referenceTransactionId: oid, // OID original
        transactionAmount: {
            total: amount,
            currency: currency
        }
    };

    try {
        const response = await apiClient.post('/transactions', payload);
        console.log('✅ RETURN PARCIAL Exitoso:');
        console.log(response.data);
    } catch (error: any) {
        console.error('❌ Error en RETURN PARCIAL:', error.response?.data || error.message);
    }
}

/**
 * 4. POSAUTH (Captura)
 * Captura (liquida) un PREAUTH reservado previamente.
 * @param oid El ID de orden original generado por el PreAuth
 * @param amount Monto final a capturar (puede ser menor o igual al PreAuth)
 */
async function posAuth(oid: string, amount: string, currency: string = '032') {
    console.log(`\n--- Ejecutando POSAUTH (Captura) de ${amount} ${currency} para OID: ${oid} ---`);

    const payload = {
        transactionType: "POSTAUTH", // Fiserv usualmente lo define como POSTAUTH o CAPTURE
        storeId: STORE_ID,
        referenceTransactionId: oid,
        transactionAmount: {
            total: amount,
            currency: currency
        }
    };

    try {
        const response = await apiClient.post('/transactions', payload);
        console.log('✅ POSAUTH Exitoso:');
        console.log(response.data);
    } catch (error: any) {
        console.error('❌ Error en POSAUTH:', error.response?.data || error.message);
    }
}

// ============================================================================
// EJECUCIÓN DEL SCRIPT
// ============================================================================
// Modifica los valores de OID por los IDs devueltos por la web para ejecutar la prueba manual.

async function runTests() {
    const MOCK_OID_SALE = 'R-5047aeaf-6f91-4475-b3e5-820108873fb0';
    const MOCK_OID_PREAUTH = 'R-1122aeaf-6f91-4475-b3e5-999908873aaa';

    console.log("Iniciando Pruebas Back-Office (REST API) para Fiserv...\n");

    // 1. VOID (Anulación de Compra No Liquidada)
    await voidTransaction(MOCK_OID_SALE);

    // 2. RETURN TOTAL (Devolución total)
    await returnTotal(MOCK_OID_SALE);

    // 3. RETURN PARCIAL (Devolución parcial de $1000)
    await returnPartial(MOCK_OID_SALE, "1000.00");

    // 4. POSAUTH (Captura de Autorización Previa)
    await posAuth(MOCK_OID_PREAUTH, "5000.00");
}

// Ejecutar si se llama a este script directamente
if (require.main === module) {
    runTests();
}
