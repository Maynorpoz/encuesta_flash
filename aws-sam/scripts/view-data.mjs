#!/usr/bin/env node

/**
 * Script para Ver Datos en DynamoDB Local
 *
 * Visualiza los datos almacenados en DynamoDB Local
 * sin necesidad de AWS CLI
 *
 * Uso:
 *   node view-data.mjs              # Ver todos los datos
 *   node view-data.mjs --users      # Ver solo usuarios
 *   node view-data.mjs --polls      # Ver solo encuestas
 *   node view-data.mjs --votes      # Ver solo votos
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'EncuestaFlashTable-development';

const args = process.argv.slice(2);
const showUsers = args.includes('--users');
const showPolls = args.includes('--polls');
const showVotes = args.includes('--votes');
const showAll = !showUsers && !showPolls && !showVotes;

async function scanTable() {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME
    }));

    return result.Items || [];
  } catch (error) {
    console.error('❌ Error escaneando tabla:', error.message);
    console.error('\n⚠️  Asegúrate de que DynamoDB Local está corriendo:');
    console.error('   docker ps | grep dynamodb-local\n');
    process.exit(1);
  }
}

function formatItem(item) {
  return JSON.stringify(item, null, 2);
}

async function main() {
  console.log('='.repeat(60));
  console.log('  VISUALIZADOR DE DATOS - DynamoDB Local');
  console.log('='.repeat(60));
  console.log(`Tabla: ${TABLE_NAME}`);
  console.log(`Endpoint: http://localhost:8000`);
  console.log('='.repeat(60) + '\n');

  const items = await scanTable();

  if (items.length === 0) {
    console.log('⚠️  No hay datos en la tabla.\n');
    return;
  }

  // Categorizar items
  const users = items.filter(item => item.PK.startsWith('USER#') && item.SK === 'PROFILE');
  const usernameEntries = items.filter(item => item.PK.startsWith('USERNAME#'));
  const polls = items.filter(item => item.PK.startsWith('POLL#') && item.SK === 'METADATA');
  const creatorEntries = items.filter(item => item.PK.startsWith('CREATOR#'));
  const votes = items.filter(item => item.PK.startsWith('POLL#') && item.SK.startsWith('VOTE#'));
  const connections = items.filter(item => item.PK.startsWith('CONNECTION#'));

  console.log('📊 RESUMEN DE DATOS:\n');
  console.log(`   Usuarios:    ${users.length}`);
  console.log(`   Encuestas:   ${polls.length}`);
  console.log(`   Votos:       ${votes.length}`);
  console.log(`   Conexiones:  ${connections.length}`);
  console.log(`   Total Items: ${items.length}\n`);

  // Mostrar usuarios
  if (showAll || showUsers) {
    console.log('='.repeat(60));
    console.log('👥 USUARIOS');
    console.log('='.repeat(60) + '\n');

    if (users.length === 0) {
      console.log('   (Sin usuarios)\n');
    } else {
      users.forEach((user, idx) => {
        console.log(`Usuario #${idx + 1}:`);
        console.log(`   ID:         ${user.id}`);
        console.log(`   Username:   ${user.username}`);
        console.log(`   Creado:     ${user.createdAt}`);
        console.log(`   PK:         ${user.PK}`);
        console.log(`   SK:         ${user.SK}`);
        console.log();
      });
    }
  }

  // Mostrar encuestas
  if (showAll || showPolls) {
    console.log('='.repeat(60));
    console.log('📋 ENCUESTAS');
    console.log('='.repeat(60) + '\n');

    if (polls.length === 0) {
      console.log('   (Sin encuestas)\n');
    } else {
      polls.forEach((poll, idx) => {
        console.log(`Encuesta #${idx + 1}:`);
        console.log(`   ID:          ${poll.id}`);
        console.log(`   Título:      ${poll.title}`);
        console.log(`   Descripción: ${poll.description || '(sin descripción)'}`);
        console.log(`   Creador:     ${poll.creatorId}`);
        console.log(`   Opciones:    ${poll.options.length}`);
        poll.options.forEach((opt, i) => {
          console.log(`      ${i + 1}. ${opt.text} (${opt.id})`);
        });
        console.log(`   Settings:    anonymous=${poll.settings.anonymous}, multipleChoice=${poll.settings.multipleChoice}`);
        console.log(`   Activa:      ${poll.active}`);
        console.log(`   Creada:      ${poll.createdAt}`);
        console.log(`   PK:          ${poll.PK}`);
        console.log(`   SK:          ${poll.SK}`);
        console.log();
      });
    }
  }

  // Mostrar votos
  if (showAll || showVotes) {
    console.log('='.repeat(60));
    console.log('🗳️  VOTOS');
    console.log('='.repeat(60) + '\n');

    if (votes.length === 0) {
      console.log('   (Sin votos)\n');
    } else {
      votes.forEach((vote, idx) => {
        console.log(`Voto #${idx + 1}:`);
        console.log(`   ID:        ${vote.id}`);
        console.log(`   Poll ID:   ${vote.pollId}`);
        console.log(`   Opción:    ${vote.optionId}`);
        console.log(`   Votante:   ${vote.voterId}`);
        console.log(`   Fecha:     ${vote.votedAt}`);
        console.log(`   PK:        ${vote.PK}`);
        console.log(`   SK:        ${vote.SK}`);
        console.log();
      });
    }
  }

  // Mostrar items técnicos
  if (showAll) {
    if (usernameEntries.length > 0) {
      console.log('='.repeat(60));
      console.log('🔍 ÍNDICES DE USERNAME (GSI)');
      console.log('='.repeat(60) + '\n');
      console.log(`   Total: ${usernameEntries.length} entries\n`);
    }

    if (creatorEntries.length > 0) {
      console.log('='.repeat(60));
      console.log('🔍 ÍNDICES DE CREATOR (GSI)');
      console.log('='.repeat(60) + '\n');
      console.log(`   Total: ${creatorEntries.length} entries\n`);
    }

    if (connections.length > 0) {
      console.log('='.repeat(60));
      console.log('🔌 CONEXIONES WEBSOCKET');
      console.log('='.repeat(60) + '\n');
      connections.forEach((conn, idx) => {
        console.log(`Conexión #${idx + 1}:`);
        console.log(`   Connection ID: ${conn.connectionId}`);
        console.log(`   Poll ID:       ${conn.pollId || '(sin suscripción)'}`);
        console.log(`   Timestamp:     ${new Date(conn.timestamp).toISOString()}`);
        console.log(`   TTL:           ${conn.ttl}`);
        console.log();
      });
    }
  }

  console.log('='.repeat(60) + '\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
