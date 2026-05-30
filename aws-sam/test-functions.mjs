#!/usr/bin/env node

/**
 * Script de Testing Local - Funciones Auth
 *
 * Prueba las funciones Lambda de autenticación directamente
 * sin necesidad de SAM Local
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar variables de entorno
process.env.DYNAMODB_TABLE = 'EncuestaFlashTable-development';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
process.env.JWT_SECRET = 'secret-key-para-encuestas-serverless-2026';
process.env.NODE_ENV = 'development';
process.env.AWS_REGION = 'us-east-1';

// Credenciales dummy para DynamoDB Local (requeridas por AWS SDK)
process.env.AWS_ACCESS_KEY_ID = 'dummy';
process.env.AWS_SECRET_ACCESS_KEY = 'dummy';

// Añadir el layer al path de módulos
process.env.NODE_PATH = resolve(__dirname, 'layers/shared-layer/nodejs/node_modules');
import('module').then(m => m.default.Module._initPaths());

console.log('='.repeat(60));
console.log('  TESTING FUNCIONES DE AUTENTICACIÓN');
console.log('='.repeat(60));
console.log(`DynamoDB Endpoint: ${process.env.DYNAMODB_ENDPOINT}`);
console.log(`Tabla: ${process.env.DYNAMODB_TABLE}`);
console.log('='.repeat(60) + '\n');

// Importar las funciones
async function testRegister() {
  console.log('📝 TEST 1: Register Function');
  console.log('-'.repeat(60));

  try {
    // Importar la función
    const { handler } = await import('./functions/auth/register.mjs');

    // Crear evento de prueba
    const event = {
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('📤 Input:', JSON.parse(event.body));

    // Ejecutar función
    const result = await handler(event);

    // Parsear resultado
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Message:', body.message);
    console.log('   User:', body.user);
    console.log('   Token:', body.token ? body.token.substring(0, 20) + '...' : 'N/A');

    if (result.statusCode === 201) {
      console.log('✅ TEST PASSED: Usuario registrado exitosamente\n');
      return { success: true, token: body.token, user: body.user };
    } else {
      console.log('❌ TEST FAILED: Status inesperado\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false };
  }
}

async function testLogin(registeredUser) {
  console.log('🔐 TEST 2: Login Function');
  console.log('-'.repeat(60));

  try {
    // Importar la función
    const { handler } = await import('./functions/auth/login.mjs');

    // Usar el usuario recién registrado en TEST 1
    const event = {
      body: JSON.stringify({
        username: registeredUser.username,
        password: 'password123'  // Password conocida del TEST 1
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('📤 Input:', JSON.parse(event.body));

    // Ejecutar función
    const result = await handler(event);

    // Parsear resultado
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Message:', body.message || body.error);
    console.log('   User:', body.user);
    console.log('   Token:', body.token ? body.token.substring(0, 20) + '...' : 'N/A');

    if (result.statusCode === 200) {
      console.log('✅ TEST PASSED: Login exitoso\n');
      return { success: true, token: body.token };
    } else {
      console.log('❌ TEST FAILED: Login falló\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false };
  }
}

async function testLoginInvalid() {
  console.log('🚫 TEST 3: Login con credenciales inválidas');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/auth/login.mjs');

    const event = {
      body: JSON.stringify({
        username: 'usuarioInexistente',
        password: 'wrongpassword'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('📤 Input:', JSON.parse(event.body));

    const result = await handler(event);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Error:', body.error);

    if (result.statusCode === 401) {
      console.log('✅ TEST PASSED: Rechazó credenciales inválidas correctamente\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: Debería retornar 401\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

async function testValidation() {
  console.log('⚠️  TEST 4: Validación de datos');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/auth/register.mjs');

    // Test: Username muy corto
    const event = {
      body: JSON.stringify({
        username: 'ab',
        password: 'password123'
      })
    };

    console.log('📤 Input (username corto):', JSON.parse(event.body));

    const result = await handler(event);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Error:', body.error);

    if (result.statusCode === 400 && body.error.includes('3 caracteres')) {
      console.log('✅ TEST PASSED: Validación de username funciona\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: Validación no funcionó correctamente\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  const results = [];

  const registerResult = await testRegister();
  results.push(registerResult);

  // Pasar el usuario registrado al test de login
  if (registerResult.success && registerResult.user) {
    results.push(await testLogin(registerResult.user));
  } else {
    console.log('⚠️  Saltando TEST 2: El registro falló\n');
    results.push({ success: false });
  }

  results.push(await testLoginInvalid());
  results.push(await testValidation());

  // Resumen
  console.log('='.repeat(60));
  console.log('  RESUMEN DE TESTS');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;

  console.log(`Total:   ${results.length} tests`);
  console.log(`Passed:  ${passed} ✅`);
  console.log(`Failed:  ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    console.log('🎉 TODOS LOS TESTS PASARON!\n');
    process.exit(0);
  } else {
    console.log('⚠️  ALGUNOS TESTS FALLARON\n');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Error ejecutando tests:', error);
  process.exit(1);
});
