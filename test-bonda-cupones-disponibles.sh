#!/bin/bash

# ============================================
# Script para probar endpoint /api/cupones de Bonda
# Prueba cupones DISPONIBLES (no usados)
# ============================================

BONDA_API_URL="https://apiv1.cuponstar.com"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "============================================"
echo "🧪 PRUEBA DE ENDPOINT: /api/cupones"
echo "   (Catálogo de cupones DISPONIBLES)"
echo "============================================"
echo ""

# ============================================
# Función para probar un micrositio
# ============================================
test_microsite() {
  local NOMBRE=$1
  local MICROSITE_ID=$2
  local API_TOKEN=$3
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📍 Micrositio: $NOMBRE${NC}"
  echo -e "${BLUE}   ID: $MICROSITE_ID${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  # Hacer la petición al endpoint de cupones DISPONIBLES
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    "$BONDA_API_URL/api/cupones?key=$API_TOKEN&micrositio_id=$MICROSITE_ID")
  
  # Separar body y status code
  HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
  HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')
  
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Status: $HTTP_STATUS OK${NC}"
    
    # Contar cupones (si el response tiene "count" o "results")
    COUNT=$(echo "$HTTP_BODY" | grep -o '"count":[0-9]*' | grep -o '[0-9]*' | head -1)
    RESULTS=$(echo "$HTTP_BODY" | grep -o '"results":\[' | wc -l)
    
    if [ ! -z "$COUNT" ]; then
      echo -e "${GREEN}📦 Total de cupones en catálogo: $COUNT${NC}"
    fi
    
    # Mostrar primeros 3 cupones (nombres)
    echo ""
    echo -e "${YELLOW}🎟️  Primeros cupones encontrados:${NC}"
    echo "$HTTP_BODY" | grep -o '"nombre":"[^"]*"' | head -5 | sed 's/"nombre":"//g' | sed 's/"$//g' | nl
    
    # Guardar respuesta completa en archivo
    OUTPUT_FILE="cupones-$MICROSITE_ID.json"
    echo "$HTTP_BODY" | python3 -m json.tool > "$OUTPUT_FILE" 2>/dev/null || echo "$HTTP_BODY" > "$OUTPUT_FILE"
    echo ""
    echo -e "${YELLOW}💾 Respuesta completa guardada en: $OUTPUT_FILE${NC}"
    
  else
    echo -e "${RED}❌ Error: HTTP $HTTP_STATUS${NC}"
    echo -e "${RED}Respuesta:${NC}"
    echo "$HTTP_BODY" | head -20
  fi
  
  echo ""
  echo ""
}

# ============================================
# PROBAR 3 MICROSITIOS DIFERENTES
# ============================================

# 1. Fundación Padres (el que usas para pruebas)
test_microsite \
  "Beneficios Fundación Padres" \
  "911299" \
  "DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq"

# 2. Club de Impacto Proyectar
test_microsite \
  "Club de Impacto Proyectar" \
  "911436" \
  "DbMd4IZG6S6d9fAQ4Uro0J5EPjf9fZwC2256liZXrwkJg9i3HDXZuCbdZzED62Rg"

# 3. Club Plato Lleno
test_microsite \
  "Club Plato Lleno" \
  "911322" \
  "s2uwjlmPcWsQmy9pEJFSmm2Zm8qNs8oUwA9G69hdVNdGwGOMSJ1NLtPUHeF1OzXC"

# ============================================
# RESUMEN
# ============================================
echo "============================================"
echo -e "${GREEN}✅ PRUEBA COMPLETADA${NC}"
echo "============================================"
echo ""
echo "📋 Archivos generados:"
ls -lh cupones-*.json 2>/dev/null || echo "   (No se generaron archivos JSON)"
echo ""
echo "💡 Próximo paso:"
echo "   1. Revisa los archivos JSON generados"
echo "   2. Si ves cupones disponibles, el endpoint funciona ✅"
echo "   3. Cambiar el código backend para usar /api/cupones"
echo ""
