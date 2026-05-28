#!/usr/bin/env node

/**
 * Script de Migración de Datos
 *
 * Migra datos desde el archivo JSON local (backend/data/database.json)
 * hacia DynamoDB (local o AWS)
 *
 * Uso:
 *   node migrate-data.mjs --local     # Migrar a DynamoDB Local
 *   node migrate-data.mjs --aws       # Migrar a DynamoDB en AWS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Argumentos de línea de comandos
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isAws = args.includes('--aws');

if (!isLocal && !isAws) {
  console.error('Error: Debe especificar --local o --aws');
  console.error('Uso: node migrate-data.mjs [--local|--aws]');
  process.exit(1);
}

// Configuración de DynamoDB
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocal && {
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'dummy',
      secretAccessKey: 'dummy'
    }
  })
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'EncuestaFlashTable-development';

// Ruta al archivo JSON
const JSON_FILE = path.join(__dirname, '../../backend/data/database.json');

/**
 * Leer datos del archivo JSON
 */
function readJsonData() {
  try {
    if (!fs.existsSync(JSON_FILE)) {
      console.warn(`⚠️  Archivo ${JSON_FILE} no existe`);
      return { users: [], polls: [], votes: [] };
    }

    const data = fs.readFileSync(JSON_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo archivo JSON:', error);
    process.exit(1);
  }
}

/**
 * Migrar usuarios a DynamoDB
 */
async function migrateUsers(users) {
  if (users.length === 0) {
    console.log('No hay usuarios para migrar');
    return 0;
  }

  console.log(`\nMigrando ${users.length} usuarios...`);

  for (const user of users) {
    // Crear dos items por usuario: USER#id y USERNAME#username
    try {
      // Item principal por ID
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${user.id}`,
          SK: 'PROFILE',
          id: user.id,
          username: user.username,
          passwordHash: user.passwordHash,
          createdAt: user.createdAt
        }
      }));

      // Item para búsqueda por username (GSI)
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USERNAME#${user.username.toLowerCase()}`,
          SK: 'PROFILE',
          userId: user.id,
          username: user.username,
          passwordHash: user.passwordHash,
          createdAt: user.createdAt
        }
      }));

      console.log(`  ✓ Usuario migrado: ${user.username}`);
    } catch (error) {
      console.error(`  ✗ Error migrando usuario ${user.username}:`, error.message);
    }
  }

  return users.length;
}

/**
 * Migrar encuestas a DynamoDB
 */
async function migratePolls(polls) {
  if (polls.length === 0) {
    console.log('No hay encuestas para migrar');
    return 0;
  }

  console.log(`\nMigrando ${polls.length} encuestas...`);

  for (const poll of polls) {
    try {
      // Item principal de la encuesta
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `POLL#${poll.id}`,
          SK: 'METADATA',
          id: poll.id,
          creatorId: poll.creatorId,
          title: poll.title,
          description: poll.description || '',
          options: poll.options,
          settings: poll.settings,
          active: poll.active !== undefined ? poll.active : true,
          createdAt: poll.createdAt
        }
      }));

      // Item para GSI de creator
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CREATOR#${poll.creatorId}`,
          SK: `POLL#${poll.id}`,
          pollId: poll.id,
          title: poll.title,
          creatorId: poll.creatorId,
          createdAt: poll.createdAt
        }
      }));

      console.log(`  ✓ Encuesta migrada: ${poll.title}`);
    } catch (error) {
      console.error(`  ✗ Error migrando encuesta ${poll.title}:`, error.message);
    }
  }

  return polls.length;
}

/**
 * Migrar votos a DynamoDB
 */
async function migrateVotes(votes) {
  if (votes.length === 0) {
    console.log('No hay votos para migrar');
    return 0;
  }

  console.log(`\nMigrando ${votes.length} votos...`);

  for (const vote of votes) {
    try {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `POLL#${vote.pollId}`,
          SK: `VOTE#${vote.voterId}`,
          id: vote.id,
          pollId: vote.pollId,
          optionId: vote.optionId,
          voterId: vote.voterId,
          votedAt: vote.votedAt
        }
      }));

      console.log(`  ✓ Voto migrado: ${vote.id}`);
    } catch (error) {
      console.error(`  ✗ Error migrando voto ${vote.id}:`, error.message);
    }
  }

  return votes.length;
}

/**
 * Función principal
 */
async function main() {
  console.log('='.repeat(60));
  console.log('  MIGRACIÓN DE DATOS: JSON → DynamoDB');
  console.log('='.repeat(60));
  console.log(`Origen:  ${JSON_FILE}`);
  console.log(`Destino: ${isLocal ? 'DynamoDB Local (http://localhost:8000)' : 'DynamoDB AWS'}`);
  console.log(`Tabla:   ${TABLE_NAME}`);
  console.log('='.repeat(60));

  // Leer datos JSON
  const data = readJsonData();
  console.log(`\n📊 Datos encontrados:`);
  console.log(`   - Usuarios:  ${data.users.length}`);
  console.log(`   - Encuestas: ${data.polls.length}`);
  console.log(`   - Votos:     ${data.votes.length}`);

  if (data.users.length === 0 && data.polls.length === 0 && data.votes.length === 0) {
    console.log('\n⚠️  No hay datos para migrar. Base de datos vacía.');
    process.exit(0);
  }

  // Confirmar migración
  console.log('\n⚠️  Esta operación sobrescribirá datos existentes en DynamoDB.');

  // Migrar datos
  let totalMigrated = 0;

  totalMigrated += await migrateUsers(data.users);
  totalMigrated += await migratePolls(data.polls);
  totalMigrated += await migrateVotes(data.votes);

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('  ✅ MIGRACIÓN COMPLETADA');
  console.log('='.repeat(60));
  console.log(`Total de items migrados: ${totalMigrated}`);
  console.log('='.repeat(60) + '\n');
}

// Ejecutar
main().catch(error => {
  console.error('\n❌ Error durante la migración:', error);
  process.exit(1);
});
