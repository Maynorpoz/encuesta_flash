#!/usr/bin/env node

/**
 * Script de Testing - Funciones CRUD de Polls
 *
 * Prueba todas las funciones Lambda de polls:
 * - createPoll, getUserPolls, getPoll, vote, getResults
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

// Credenciales dummy para DynamoDB Local
process.env.AWS_ACCESS_KEY_ID = 'dummy';
process.env.AWS_SECRET_ACCESS_KEY = 'dummy';

// Añadir el layer al path de módulos
process.env.NODE_PATH = resolve(__dirname, 'layers/shared-layer/nodejs/node_modules');
import('module').then(m => m.default.Module._initPaths());

console.log('='.repeat(60));
console.log('  TESTING FUNCIONES CRUD DE POLLS');
console.log('='.repeat(60));
console.log(`DynamoDB Endpoint: ${process.env.DYNAMODB_ENDPOINT}`);
console.log(`Tabla: ${process.env.DYNAMODB_TABLE}`);
console.log('='.repeat(60) + '\n');

// Variables globales para compartir entre tests
let testUserId = 'testuser123';
let testUsername = 'testuser';
let createdPollId = null;
let createdOptionId = null;

/**
 * TEST 1: Crear Encuesta
 */
async function testCreatePoll() {
  console.log('📝 TEST 1: CreatePoll Function');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/polls/createPoll.mjs');

    const event = {
      body: JSON.stringify({
        title: 'Test Poll - La IA va a reemplazar programadores?',
        description: 'Encuesta de prueba creada por test automatizado',
        options: [
          'Sí, completamente',
          'No, nunca',
          'Parcialmente'
        ],
        settings: {
          anonymous: true,
          multipleChoice: false
        }
      }),
      requestContext: {
        authorizer: {
          userId: testUserId,
          username: testUsername
        }
      }
    };

    console.log('📤 Input:', JSON.parse(event.body));

    const result = await handler(event);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Message:', body.message);
    console.log('   Poll ID:', body.poll?.id);
    console.log('   Options:', body.poll?.options?.length);

    if (result.statusCode === 201 && body.poll && body.poll.id) {
      createdPollId = body.poll.id;
      createdOptionId = body.poll.options[0].id;
      console.log('✅ TEST PASSED: Encuesta creada exitosamente\n');
      return { success: true, pollId: body.poll.id };
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
 * TEST 2: Obtener Encuestas del Usuario
 */
async function testGetUserPolls() {
  console.log('📋 TEST 2: GetUserPolls Function');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/polls/getUserPolls.mjs');

    const event = {
      requestContext: {
        authorizer: {
          userId: testUserId,
          username: testUsername
        }
      }
    };

    console.log('📤 User ID:', testUserId);

    const result = await handler(event);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Polls encontrados:', body.length);

    if (result.statusCode === 200 && Array.isArray(body) && body.length > 0) {
      console.log('   Primera encuesta:', body[0].title);
      console.log('   Total votos:', body[0].totalVotes);
      console.log('✅ TEST PASSED: Encuestas del usuario obtenidas\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: No se encontraron encuestas\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

/**
 * TEST 3: Obtener Encuesta por ID
 */
async function testGetPoll(pollId) {
  console.log('🔍 TEST 3: GetPoll Function');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/polls/getPoll.mjs');

    const event = {
      pathParameters: {
        pollId: pollId
      }
    };

    console.log('📤 Poll ID:', pollId);

    const result = await handler(event);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Title:', body.title);
    console.log('   Options:', body.options?.length);

    if (result.statusCode === 200 && body.id === pollId) {
      console.log('✅ TEST PASSED: Encuesta obtenida correctamente\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: Datos incorrectos\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

/**
 * TEST 4: Registrar Voto
 */
async function testVote(pollId, optionId) {
  console.log('🗳️  TEST 4: Vote Function');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/polls/vote.mjs');

    const voterId = `voter_test_${Date.now()}`;

    const event = {
      body: JSON.stringify({
        pollId: pollId,
        optionId: optionId,
        voterId: voterId
      })
    };

    console.log('📤 Input:', JSON.parse(event.body));

    const result = await handler(event);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Message:', body.message);

    if (result.statusCode === 201) {
      console.log('✅ TEST PASSED: Voto registrado exitosamente\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: Voto no registrado\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

/**
 * TEST 5: Obtener Resultados
 */
async function testGetResults(pollId) {
  console.log('📊 TEST 5: GetResults Function');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/polls/getResults.mjs');

    const event = {
      pathParameters: {
        pollId: pollId
      }
    };

    console.log('📤 Poll ID:', pollId);

    const result = await handler(event);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Total votos:', body.totalVotes);
    console.log('   Opciones con votos:', body.results?.length);

    if (body.results && body.results.length > 0) {
      body.results.forEach(opt => {
        console.log(`   - ${opt.text}: ${opt.votes} votos (${opt.percentage}%)`);
      });
    }

    if (result.statusCode === 200 && body.totalVotes >= 0) {
      console.log('✅ TEST PASSED: Resultados obtenidos correctamente\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: Resultados incorrectos\n');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false };
  }
}

/**
 * TEST 6: Validación - Voto Duplicado
 */
async function testDuplicateVote(pollId, optionId) {
  console.log('🚫 TEST 6: Prevención de Voto Duplicado');
  console.log('-'.repeat(60));

  try {
    const { handler } = await import('./functions/polls/vote.mjs');

    const voterId = 'voter_duplicate_test';

    // Primer voto
    const event1 = {
      body: JSON.stringify({
        pollId: pollId,
        optionId: optionId,
        voterId: voterId
      })
    };

    await handler(event1);

    // Segundo voto con mismo voterId
    const event2 = {
      body: JSON.stringify({
        pollId: pollId,
        optionId: optionId,
        voterId: voterId
      })
    };

    console.log('📤 Intentando votar dos veces con mismo voterId');

    const result = await handler(event2);
    const body = JSON.parse(result.body);

    console.log('📥 Output:');
    console.log('   Status:', result.statusCode);
    console.log('   Error:', body.error);

    if (result.statusCode === 409) {
      console.log('✅ TEST PASSED: Voto duplicado rechazado correctamente\n');
      return { success: true };
    } else {
      console.log('❌ TEST FAILED: Debería rechazar voto duplicado\n');
      return { success: false };
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

  // Test 1: Crear encuesta
  const createResult = await testCreatePoll();
  results.push(createResult);

  if (!createResult.success || !createdPollId) {
    console.log('⚠️  Saltando tests restantes: fallo crear encuesta\n');
    printSummary(results);
    return;
  }

  // Test 2: Obtener encuestas del usuario
  results.push(await testGetUserPolls());

  // Test 3: Obtener encuesta por ID
  results.push(await testGetPoll(createdPollId));

  // Test 4: Votar
  results.push(await testVote(createdPollId, createdOptionId));

  // Test 5: Obtener resultados
  results.push(await testGetResults(createdPollId));

  // Test 6: Voto duplicado
  results.push(await testDuplicateVote(createdPollId, createdOptionId));

  printSummary(results);
}

function printSummary(results) {
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
    console.log('🎉 TODOS LOS TESTS DE POLLS PASARON!\n');
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
