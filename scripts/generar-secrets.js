#!/usr/bin/env node
/**
 * Script para generar secrets seguros para producción
 * Uso: node scripts/generar-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generando secrets seguros para producción...\n');
console.log('=' .repeat(70));

// JWT Secret (64 bytes = 128 caracteres hex)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📌 JWT_SECRET (para Railway):');
console.log('   Copiar y pegar en Railway → Variables:');
console.log('   ');
console.log(`   JWT_SECRET=${jwtSecret}`);

// Sync Secret (32 bytes = 64 caracteres hex)
const syncSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📌 SYNC_SECRET (para Railway):');
console.log('   Copiar y pegar en Railway → Variables:');
console.log('   ');
console.log(`   SYNC_SECRET=${syncSecret}`);

// También generar un UUID por si lo prefieren
const { randomUUID } = require('crypto');
const uuid1 = randomUUID();
const uuid2 = randomUUID();
const uuidCombined = `${uuid1}${uuid2}`.replace(/-/g, '');

console.log('\n📌 Alternativa con UUIDs combinados:');
console.log('   ');
console.log(`   JWT_SECRET=${uuidCombined}`);

console.log('\n' + '=' .repeat(70));
console.log('\n⚠️  IMPORTANTE:');
console.log('   - Guardá estos valores en un lugar seguro');
console.log('   - NO los commitees al repositorio');
console.log('   - Usá el JWT_SECRET en Railway');
console.log('   - Usá el SYNC_SECRET en Railway');
console.log('   - Una vez configurados, NO los cambies (o perderás sesiones activas)');
console.log('\n✅ Secrets generados exitosamente!\n');
