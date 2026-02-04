# ============================================
# Script PowerShell para probar endpoint /api/cupones de Bonda
# Prueba cupones DISPONIBLES (no usados)
# ============================================

$BONDA_API_URL = "https://apiv1.cuponstar.com"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 PRUEBA DE ENDPOINT: /api/cupones" -ForegroundColor Cyan
Write-Host "   (Catálogo de cupones DISPONIBLES)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Función para probar un micrositio
# ============================================
function Test-Microsite {
    param(
        [string]$Nombre,
        [string]$MicrositeId,
        [string]$ApiToken
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "📍 Micrositio: $Nombre" -ForegroundColor Blue
    Write-Host "   ID: $MicrositeId" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    
    try {
        # Hacer la petición
        $url = "$BONDA_API_URL/api/cupones?key=$ApiToken" + "&" + "micrositio_id=$MicrositeId"
        $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
        
        Write-Host "✅ Status: 200 OK" -ForegroundColor Green
        
        # Contar cupones
        if ($response.count) {
            Write-Host "📦 Total de cupones en catálogo: $($response.count)" -ForegroundColor Green
        }
        
        # Mostrar primeros cupones
        Write-Host ""
        Write-Host "🎟️  Primeros cupones encontrados:" -ForegroundColor Yellow
        $counter = 1
        foreach ($cupon in $response.results | Select-Object -First 5) {
            Write-Host "  $counter. $($cupon.nombre) - $($cupon.descuento)" -ForegroundColor White
            $counter++
        }
        
        # Guardar respuesta
        $outputFile = "cupones-$MicrositeId.json"
        $response | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8
        Write-Host ""
        Write-Host "💾 Respuesta completa guardada en: $outputFile" -ForegroundColor Yellow
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Respuesta: $($_.Exception.Response)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host ""
}

# ============================================
# PROBAR 3 MICROSITIOS DIFERENTES
# ============================================

# 1. Fundación Padres (el que usas para pruebas)
Test-Microsite `
    -Nombre "Beneficios Fundación Padres" `
    -MicrositeId "911299" `
    -ApiToken "DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq"

# 2. Club de Impacto Proyectar
Test-Microsite `
    -Nombre "Club de Impacto Proyectar" `
    -MicrositeId "911436" `
    -ApiToken "DbMd4IZG6S6d9fAQ4Uro0J5EPjf9fZwC2256liZXrwkJg9i3HDXZuCbdZzED62Rg"

# 3. Club Plato Lleno
Test-Microsite `
    -Nombre "Club Plato Lleno" `
    -MicrositeId "911322" `
    -ApiToken "s2uwjlmPcWsQmy9pEJFSmm2Zm8qNs8oUwA9G69hdVNdGwGOMSJ1NLtPUHeF1OzXC"

# ============================================
# RESUMEN
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ PRUEBA COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Archivos generados:" -ForegroundColor Cyan
Get-ChildItem -Path . -Filter "cupones-*.json" | Select-Object Name, Length, LastWriteTime
Write-Host ""
Write-Host "💡 Próximo paso:" -ForegroundColor Yellow
Write-Host "   1. Revisa los archivos JSON generados" -ForegroundColor White
Write-Host "   2. Si ves cupones disponibles, el endpoint funciona ✅" -ForegroundColor White
Write-Host "   3. Cambiar el código backend para usar /api/cupones" -ForegroundColor White
Write-Host ""
