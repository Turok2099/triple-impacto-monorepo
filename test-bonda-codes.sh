#!/bin/bash

# Script de prueba para validar códigos de afiliado en Bonda
# Ejecutar: bash test-bonda-codes.sh

echo "🧪 SCRIPT DE PRUEBA - CÓDIGOS BONDA"
echo "====================================="
echo ""

# ⚠️ REEMPLAZAR CON CREDENCIALES REALES SI LAS TIENES
# Si no las tienes, este script mostrará que necesitas configurarlas
BONDA_API_KEY="TU_API_KEY_AQUI"
BONDA_MICROSITE="beneficios-fundacion-padres"
BONDA_BASE_URL="https://apiv1.cuponstar.com"

# Verificar si hay API key configurada
if [ "$BONDA_API_KEY" == "TU_API_KEY_AQUI" ]; then
    echo "⚠️  ADVERTENCIA: No hay API key configurada"
    echo ""
    echo "Para ejecutar este test necesitas:"
    echo "1. Obtener tu API key real de Bonda"
    echo "2. Editar este script y reemplazar BONDA_API_KEY"
    echo ""
    echo "Mientras tanto, verificando configuración local..."
    echo ""
    
    # Verificar si el backend local responde
    echo "📡 Test 1: Verificar backend local"
    echo "-----------------------------------"
    curl -s "http://localhost:3000/api/public/cupones" | head -n 5
    echo ""
    echo ""
    
    # Verificar conteo de cupones
    echo "📊 Test 2: Contar cupones en backend local"
    echo "-------------------------------------------"
    COUNT=$(curl -s "http://localhost:3000/api/public/cupones" | grep -o '"id"' | wc -l)
    echo "Cupones encontrados: $COUNT"
    echo ""
    
    if [ "$COUNT" -gt 0 ]; then
        echo "✅ El backend local está sirviendo cupones (probablemente mocks)"
    else
        echo "❌ El backend local NO tiene cupones"
        echo "   → Ejecuta: curl -X POST 'http://localhost:3000/api/public/sync-cupones?secret=dev-secret-change-in-production'"
    fi
    echo ""
    
    exit 0
fi

# Si llegamos aquí, hay API key configurada
echo "🔑 API Key: ${BONDA_API_KEY:0:10}..."
echo "🏢 Microsite: $BONDA_MICROSITE"
echo "🌐 Base URL: $BONDA_BASE_URL"
echo ""
echo ""

# Test 1: Código válido (22380612 - Fundación Padres)
echo "=========================================="
echo "TEST 1: Código Válido (22380612)"
echo "=========================================="
echo "Request: GET /api/cupones_recibidos"
echo "Params: codigo_afiliado=22380612"
echo ""

RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "${BONDA_BASE_URL}/api/cupones_recibidos?key=${BONDA_API_KEY}&micrositio_id=${BONDA_MICROSITE}&codigo_afiliado=22380612")

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS1"
echo "Response:"
echo "$BODY1" | head -n 20
echo ""

if [ "$HTTP_STATUS1" == "200" ]; then
    COUNT1=$(echo "$BODY1" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo "✅ ÉXITO: Retornó $COUNT1 cupones"
    if [ "$COUNT1" -gt 0 ]; then
        echo "   → Código válido con cupones activos"
    else
        echo "   → Código aceptado pero sin cupones solicitados"
    fi
else
    echo "❌ ERROR HTTP: $HTTP_STATUS1"
fi
echo ""
echo ""

# Test 2: Código inventado (99999999)
echo "=========================================="
echo "TEST 2: Código Inventado (99999999)"
echo "=========================================="
echo "Request: GET /api/cupones_recibidos"
echo "Params: codigo_afiliado=99999999"
echo ""

RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "${BONDA_BASE_URL}/api/cupones_recibidos?key=${BONDA_API_KEY}&micrositio_id=${BONDA_MICROSITE}&codigo_afiliado=99999999")

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS2"
echo "Response:"
echo "$BODY2" | head -n 20
echo ""

if [ "$HTTP_STATUS2" == "200" ]; then
    COUNT2=$(echo "$BODY2" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo "✅ ÉXITO: Retornó $COUNT2 cupones"
    if [ "$COUNT2" -eq 0 ]; then
        echo "   → Código aceptado sin validación (puedes usar códigos genéricos)"
    fi
else
    echo "❌ ERROR HTTP: $HTTP_STATUS2"
    echo "   → Bonda valida que el código exista"
fi
echo ""
echo ""

# Test 3: Código vacío
echo "=========================================="
echo "TEST 3: Código Vacío ('')"
echo "=========================================="
echo "Request: GET /api/cupones_recibidos"
echo "Params: codigo_afiliado="
echo ""

RESPONSE3=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "${BONDA_BASE_URL}/api/cupones_recibidos?key=${BONDA_API_KEY}&micrositio_id=${BONDA_MICROSITE}&codigo_afiliado=")

HTTP_STATUS3=$(echo "$RESPONSE3" | grep "HTTP_STATUS" | cut -d: -f2)
BODY3=$(echo "$RESPONSE3" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS3"
echo "Response:"
echo "$BODY3" | head -n 10
echo ""

if [ "$HTTP_STATUS3" == "200" ]; then
    echo "✅ Acepta código vacío"
else
    echo "❌ Rechaza código vacío (esperado)"
fi
echo ""
echo ""

# Resumen final
echo "=========================================="
echo "📊 RESUMEN DE RESULTADOS"
echo "=========================================="
echo "Test 1 (código válido):    $HTTP_STATUS1"
echo "Test 2 (código inventado): $HTTP_STATUS2"
echo "Test 3 (código vacío):     $HTTP_STATUS3"
echo ""

if [ "$HTTP_STATUS1" == "200" ] && [ "$HTTP_STATUS2" == "200" ]; then
    echo "🎯 CONCLUSIÓN:"
    echo "   ✅ Bonda ACEPTA códigos genéricos (no valida existencia)"
    echo "   → Puedes usar códigos inventados para mostrar cupones"
    echo "   → Solo retornará cupones si ese código los ha solicitado antes"
elif [ "$HTTP_STATUS1" == "200" ] && [ "$HTTP_STATUS2" != "200" ]; then
    echo "🎯 CONCLUSIÓN:"
    echo "   ❌ Bonda VALIDA códigos (deben estar registrados)"
    echo "   → Debes crear afiliados antes de consultar cupones"
    echo "   → Usa POST /api/v2/microsite/{id}/affiliates para crear"
else
    echo "🎯 CONCLUSIÓN:"
    echo "   ⚠️  Resultados inesperados o error de configuración"
    echo "   → Verifica tus credenciales de Bonda"
fi

echo ""
echo "✅ Tests completados"
