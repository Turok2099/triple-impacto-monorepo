# Migraciones

Ejecutar en orden numérico cuando la BD ya está desplegada con un schema anterior.

| Orden | Archivo                                        | Descripción                                                                                                                                                                                            |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | `001_bonda_affiliate_code_nullable.sql`        | Hace nullable `usuarios.bonda_affiliate_code` (afiliado se crea tras pago Fiserv).                                                                                                                     |
| 2     | `002_usuarios_bonda_afiliados.sql`             | Crea tabla `usuarios_bonda_afiliados` (afiliado por usuario + micrositio/ONG), migra datos existentes y elimina columnas `bonda_affiliate_code`, `bonda_sync_status`, `bonda_synced_at` de `usuarios`. |
| 3     | `003_organizaciones_monto_minimo_sugerido.sql` | Añade `monto_minimo` y `monto_sugerido` en `organizaciones` para donaciones por ONG.                                                                                                                   |

Para una instalación nueva, usar el `supabase-schema.sql` actual (ya incluye la tabla `usuarios_bonda_afiliados`, usuarios sin esas columnas, y organizaciones con monto_minimo/monto_sugerido).

## Seeds disponibles

| Archivo                     | Descripción                                              | Cuándo ejecutar                                                                       |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `seed-bonda-microsites.sql` | Carga los 12 micrositios Bonda con tokens y microsite_id | Después de crear schema; necesario para cupones por usuario                           |
| `seed-public-coupons.sql`   | Carga cupones mock para landing pública (sin códigos)    | Después de crear schema; necesario para mostrar catálogo público                      |
| `seed-test-user-bonda.sql`  | Crea usuario de prueba con affiliate_code en Bonda       | Solo para desarrollo/testing; requiere que `seed-bonda-microsites.sql` esté ejecutado |

## Plan de pruebas

Ver `PLAN-PRUEBAS-BONDA.md` en el directorio `database/` para instrucciones completas sobre cómo probar la integración con Bonda (landing pública + cupones de usuarios autenticados).
