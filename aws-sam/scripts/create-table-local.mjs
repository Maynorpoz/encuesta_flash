#!/usr/bin/env node

/**
 * Script para Crear Tabla en DynamoDB Local
 *
 * Crea la tabla EncuestaFlashTable en DynamoDB Local
 * con todos los GSI necesarios
 *
 * Uso:
 *   node create-table-local.mjs
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const TABLE_NAME = 'EncuestaFlashTable-development';

async function createTable() {
  console.log('='.repeat(60));
  console.log('  CREAR TABLA EN DYNAMODB LOCAL');
  console.log('='.repeat(60));
  console.log(`Tabla: ${TABLE_NAME}`);
  console.log(`Endpoint: http://localhost:8000`);
  console.log('='.repeat(60) + '\n');

  try {
    // Verificar si la tabla ya existe
    const listResult = await client.send(new ListTablesCommand({}));
    if (listResult.TableNames && listResult.TableNames.includes(TABLE_NAME)) {
      console.log(`⚠️  La tabla "${TABLE_NAME}" ya existe.`);
      console.log('   Si desea recrearla, primero elimínela manualmente.\n');
      return;
    }

    // Crear tabla
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'username', AttributeType: 'S' },
        { AttributeName: 'creatorId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'pollId', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UsernameIndex',
          KeySchema: [
            { AttributeName: 'username', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' }
        },
        {
          IndexName: 'CreatorIndex',
          KeySchema: [
            { AttributeName: 'creatorId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' }
        },
        {
          IndexName: 'PollIdIndex',
          KeySchema: [
            { AttributeName: 'pollId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' }
        }
      ],
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      }
    });

    console.log('Creando tabla...');
    const result = await client.send(command);

    console.log('\n✅ Tabla creada exitosamente!\n');
    console.log('Detalles:');
    console.log(`  - Nombre: ${result.TableDescription.TableName}`);
    console.log(`  - Estado: ${result.TableDescription.TableStatus}`);
    console.log(`  - GSI: ${result.TableDescription.GlobalSecondaryIndexes.length}`);
    console.log(`  - Stream: ${result.TableDescription.StreamSpecification.StreamEnabled ? 'Habilitado' : 'Deshabilitado'}`);
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error creando tabla:', error.message);
    process.exit(1);
  }
}

createTable();
