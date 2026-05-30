#!/usr/bin/env node

/**
 * Script de Testing - Lambda Authorizer
 *
 * Prueba la función Lambda Authorizer con tokens válidos e inválidos
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar variables de entorno
process.env.JWT_SECRET = 'secret-key-para-encuestas-serverless-2026';
process.env.NODE_ENV = 'development';
process.env.AWS_REGION = 'us-east-1';

// Añadir el layer al path de módulos
process.env.NODE_PATH = resolve(__dirname, 'layers/shared-layer/nodejs/node_modules');
import('module').then(m => m.default.Module._initPaths());

console.log('='.repeat(60));
console.log('  TESTING LAMBDA AUTHORIZER');
console.log('='.repeat(60));
console.log(`JWT Secret: ${process.env.JWT_SECRET.substring(0, 20)}...`);
console.log('='.repeat(60) + '\n');

/**
 * Genera un token JWT válido para testing
 */
async function generateTestToken() {
  const { generateToken } = await import('./layers/shared-layer/nodejs/auth.mjs');
  return generateToken({ userId: 'test123', username: 'testuser' });
}

/**
 * TEST 1: Authorizer con token válido
 */
async function testAuthorizerWithValidToken() {
  console.log('✅ TEST 1: Authorizer con token válido');
  console.log('-'.repeat(60));

  try {
    // Generar token válido
    const validToken = await generateTestToken();
    console.log('📤 Token generado:', validToken.substring(0, 30) + '...');

    // Importar función authorizer
    const { handler } = await import('./functions/auth/authorizer.mjs');

    // Crear evento de prueba
    const event = {
      type: 'TOKEN',
      authorizationToken: `Bearer ${validToken}`,
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/POST/polls'
    };

    console.log('📤 Method ARN:', event.methodArn);

    // Ejecutar authorizer
    const result = await handler(event);

    console.log('📥 Output:');
    console.log('   Principal ID:', result.principalId);
    console.log('   Effect:', result.policyDocument.Statement[0].Effect);
    console.log('   Resource:', result.policyDocument.Statement[0].Resource);
    console.log('   Context:', result.context);

    if (
      result.principalId === 'test123' &&
      result.policyDocument.Statement[0].Effect === 'Allow' &&
      result.context.userId === 'test123' &&
      result.context.username === 'testuser'
    ) {
      console.log('✅ TEST PASSED: Token válido aceptado correctamente\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: Respuesta inesperada\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false };
  }
}

/**
 * TEST 2: Authorizer con token inválido
 */
async function testAuthorizerWithInvalidToken() {
  console.log('🚫 TEST 2: Authorizer con token inválido');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/auth/authorizer.mjs');

    const event = {
      type: 'TOKEN',
      authorizationToken: 'Bearer invalid.token.here',
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/POST/polls'
    };

    console.log('📤 Token inválido:', event.authorizationToken);

    // Ejecutar authorizer - debería lanzar error
    try {
      await handler(event);
      console.log('❌ TEST FAILED: Debería haber lanzado error "Unauthorized"\n');
      return { success: false };
    } catch (error) {
      if (error.message === 'Unauthorized') {
        console.log('📥 Error capturado:', error.message);
        console.log('✅ TEST PASSED: Token inválido rechazado correctamente\n');
        return { success: true };
      } else {
        console.log('❌ TEST FAILED: Error inesperado:', error.message);
        return { success: false };
      }
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

/**
 * TEST 3: Authorizer sin token
 */
async function testAuthorizerWithoutToken() {
  console.log('⚠️  TEST 3: Authorizer sin token en header');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/auth/authorizer.mjs');

    const event = {
      type: 'TOKEN',
      authorizationToken: '',
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/POST/polls'
    };

    console.log('📤 Authorization header vacío');

    try {
      await handler(event);
      console.log('❌ TEST FAILED: Debería haber rechazado request sin token\n');
      return { success: false };
    } catch (error) {
      if (error.message === 'Unauthorized') {
        console.log('📥 Error capturado:', error.message);
        console.log('✅ TEST PASSED: Request sin token rechazado correctamente\n');
        return { success: true };
      } else {
        console.log('❌ TEST FAILED: Error inesperado:', error.message);
        return { success: false };
      }
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

/**
 * TEST 4: Authorizer con token expirado
 */
async function testAuthorizerWithExpiredToken() {
  console.log('⏰ TEST 4: Authorizer con token expirado');
  console.log('-'.repeat(60));

  try {
    const { generateToken } = await import('./layers/shared-layer/nodejs/auth.mjs');
    const { handler } = await import('./functions/auth/authorizer.mjs');

    // Generar token con expiración inmediata
    const expiredToken = generateToken(
      { userId: 'test123', username: 'testuser' },
      '0s' // Expira inmediatamente
    );

    console.log('📤 Token con expiración 0s:', expiredToken.substring(0, 30) + '...');

    // Esperar un poco para asegurar que expire
    await new Promise(resolve => setTimeout(resolve, 100));

    const event = {
      type: 'TOKEN',
      authorizationToken: `Bearer ${expiredToken}`,
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/POST/polls'
    };

    try {
      await handler(event);
      console.log('❌ TEST FAILED: Debería haber rechazado token expirado\n');
      return { success: false };
    } catch (error) {
      if (error.message === 'Unauthorized') {
        console.log('📥 Error capturado:', error.message);
        console.log('✅ TEST PASSED: Token expirado rechazado correctamente\n');
        return { success: true };
      } else {
        console.log('❌ TEST FAILED: Error inesperado:', error.message);
        return { success: false };
      }
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  const results = [];

  results.push(await testAuthorizerWithValidToken());
  results.push(await testAuthorizerWithInvalidToken());
  results.push(await testAuthorizerWithoutToken());
  results.push(await testAuthorizerWithExpiredToken());

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
    console.log('🎉 TODOS LOS TESTS DEL AUTHORIZER PASARON!\n');
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
