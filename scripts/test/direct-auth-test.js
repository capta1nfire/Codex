#!/usr/bin/env node

// Script para probar autenticación directamente

const API_BASE_URL = 'http://localhost:3004';
const LOGIN_ENDPOINT = '/api/auth/login';

// Credenciales hardcodeadas para prueba
const TEST_CREDENTIALS = {
  email: 'capta1nfire@me.com',
  password: '$123Abc!'
};

async function testDirectAuth() {
  console.log('🔐 Probando autenticación directa con QReable...\n');
  
  console.log('Credenciales:');
  console.log('Email:', TEST_CREDENTIALS.email);
  console.log('Password:', '*'.repeat(TEST_CREDENTIALS.password.length));
  console.log('');
  
  try {
    console.log('Enviando request de autenticación...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Tiempo de respuesta: ${responseTime}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\nRespuesta raw:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('\nRespuesta parseada:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error parseando JSON:', e.message);
      return;
    }
    
    if (response.ok && data.token) {
      console.log('\n✅ AUTENTICACIÓN EXITOSA!');
      console.log('═══════════════════════════');
      console.log('Token:', data.token.substring(0, 50) + '...');
      console.log('Usuario ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Rol:', data.user?.role);
      console.log('Nombre:', data.user?.firstName, data.user?.lastName);
      
      // Guardar token para pruebas posteriores
      const fs = await import('fs');
      const tokenData = {
        token: data.token,
        user: data.user,
        timestamp: new Date().toISOString()
      };
      
      await fs.promises.writeFile(
        '/Users/inseqio/Codex Project/.test-token.json',
        JSON.stringify(tokenData, null, 2)
      );
      
      console.log('\n💾 Token guardado en .test-token.json');
      console.log('🚀 Listo para ejecutar pruebas de carga!');
      
      return data.token;
    } else {
      console.log('\n❌ AUTENTICACIÓN FALLIDA');
      console.log('═══════════════════════════');
      if (data.error) {
        console.log('Código:', data.error.code);
        console.log('Mensaje:', data.error.message);
        console.log('Detalles:', data.error.details);
      }
      return null;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:');
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔍 Verificando servicios...');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health/status`);
      console.log('Backend health check:', healthResponse.status);
    } catch (e) {
      console.log('Backend no responde en', API_BASE_URL);
    }
    
    return null;
  }
}

// Ejecutar test
console.log('🚀 QReable Direct Authentication Test\n');
console.log('Endpoint:', `${API_BASE_URL}${LOGIN_ENDPOINT}`);
console.log('Timestamp:', new Date().toISOString());
console.log('═══════════════════════════════════════\n');

testDirectAuth().then(token => {
  if (token) {
    console.log('\n✅ Test completado exitosamente');
    process.exit(0);
  } else {
    console.log('\n❌ Test fallido');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Error inesperado:', error);
  process.exit(1);
});