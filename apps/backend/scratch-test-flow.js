const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testBondaFlow() {
  try {
    console.log('--- 1. Iniciando sesión ---');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'jorge.castro.cruz@hotmail.com',
      password: 'pompis10'
    });
    
    const token = loginRes.data.access_token;
    const user = loginRes.data.user;
    console.log('Login exitoso. User ID:', user.id);
    
    // Asumimos que el micrositio de Fundación Padres es el principal
    const micrositioSlug = 'beneficios-fundacion-padres';

    console.log(`\n--- 2. Obteniendo cupones del catálogo para ${micrositioSlug} ---`);
    // Primero, obtener el catálogo de cupones para el usuario para sacar un ID válido
    const cuponesRes = await axios.get(`${API_BASE}/bonda/cupones/65168161`, {
      params: { slug: micrositioSlug },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const cupones = cuponesRes.data.cupones;
    console.log(`Se encontraron ${cupones.length} cupones en total.`);
    
    if (cupones.length === 0) {
      console.log('No hay cupones disponibles para probar.');
      return;
    }
    
    // Elegir el primer cupón
    const targetCupon = cupones[0];
    console.log(`Seleccionando el cupón ID: ${targetCupon.id} (${targetCupon.title || 'Sin título'})`);
    
    console.log(`\n--- 3. Solicitando código del cupón ---`);
    // Simulando el body enviado por el frontend
    const requestBody = {
      bondaCuponId: targetCupon.id.toString(),
      codigoAfiliado: '65168161', // Obtenido de los logs, en el front lo saca del estado del usuario
      micrositioSlug: micrositioSlug,
      celular: '1122334455' // Simulando celular
    };
    
    console.log('Enviando payload:', requestBody);
    
    const solicitarRes = await axios.post(`${API_BASE}/bonda/solicitar-cupon`, requestBody, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ ÉXITO! Respuesta del backend:');
    console.log(JSON.stringify(solicitarRes.data, null, 2));

  } catch (error) {
    console.error('\n❌ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testBondaFlow();
