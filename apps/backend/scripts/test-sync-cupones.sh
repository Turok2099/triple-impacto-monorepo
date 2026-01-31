#!/bin/bash
# Script para probar el sync manual de cupones de Bonda

echo "🔄 Ejecutando sync manual de cupones..."
echo ""

# URL del backend (cambiar si usás otro puerto)
BACKEND_URL="http://localhost:3000"

# Secret (debe coincidir con SYNC_SECRET en .env)
SECRET="dev-secret-change-in-production"

# Ejecutar sync
response=$(curl -s -X POST "${BACKEND_URL}/api/public/sync-cupones?secret=${SECRET}")

echo "Respuesta:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Verificar en Supabase (requiere psql configurado)
# echo "📊 Verificando cupones en Supabase..."
# psql $DATABASE_URL -c "SELECT titulo, descuento, empresa FROM public_coupons ORDER BY orden LIMIT 5;"

echo "✅ Listo. Revisá la landing en http://localhost:3001 para ver los cupones."
