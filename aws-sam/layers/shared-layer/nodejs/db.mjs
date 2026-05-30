import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

// Cliente DynamoDB configurado
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Para desarrollo local con DynamoDB Local
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT
  })
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'EncuestaFlashTable-development';

/**
 * Clase Database - Abstracción sobre DynamoDB
 * Migrada desde el sistema basado en archivos JSON
 * Utiliza Single Table Design con PK/SK
 */
class Database {
  constructor() {
    this.tableName = TABLE_NAME;
  }

  /**
   * Genera un ID único aleatorio
   */
  _generateId() {
    return crypto.randomBytes(6).toString('hex');
  }

  // ==========================================
  // USUARIOS
  // ==========================================

  /**
   * Crear nuevo usuario
   * PK: USER#<userId>
   * SK: PROFILE
   * GSI UsernameIndex: username -> userId
   */
  async createUser(user) {
    const userId = this._generateId();
    const createdAt = new Date().toISOString();

    const newUser = {
      id: userId,
      username: user.username,
      passwordHash: user.passwordHash,
      createdAt
    };

    // Escribir dos items: uno para acceso por ID, otro para GSI de username
    await docClient.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: this.tableName,
            Item: {
              PK: `USER#${userId}`,
              SK: 'PROFILE',
              ...newUser
            },
            ConditionExpression: 'attribute_not_exists(PK)'
          }
        },
        {
          Put: {
            TableName: this.tableName,
            Item: {
              PK: `USERNAME#${user.username.toLowerCase()}`,
              SK: 'PROFILE',
              userId,
              username: user.username,
              passwordHash: user.passwordHash,
              createdAt
            },
            ConditionExpression: 'attribute_not_exists(PK)'
          }
        }
      ]
    }));

    return newUser;
  }

  /**
   * Buscar usuario por username
   * Usa el item USERNAME#<username>
   */
  async findUserByUsername(username) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USERNAME#${username.toLowerCase()}`,
          SK: 'PROFILE'
        }
      }));

      if (!result.Item) {
        return null;
      }

      // Retornar en el formato esperado
      return {
        id: result.Item.userId,
        username: result.Item.username,
        passwordHash: result.Item.passwordHash,
        createdAt: result.Item.createdAt
      };
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  /**
   * Buscar usuario por ID
   * PK: USER#<userId>, SK: PROFILE
   */
  async findUserById(id) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: 'PROFILE'
        }
      }));

      if (!result.Item) {
        return null;
      }

      return {
        id: result.Item.id,
        username: result.Item.username,
        passwordHash: result.Item.passwordHash,
        createdAt: result.Item.createdAt
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  // ==========================================
  // ENCUESTAS (POLLS)
  // ==========================================

  /**
   * Crear nueva encuesta
   * PK: POLL#<pollId>, SK: METADATA
   * También crea entrada para GSI CreatorIndex: CREATOR#<creatorId> + POLL#<pollId>
   */
  async createPoll(poll) {
    const pollId = this._generateId();
    const createdAt = new Date().toISOString();

    const newPoll = {
      id: pollId,
      creatorId: poll.creatorId,
      title: poll.title,
      description: poll.description || '',
      options: poll.options,
      settings: poll.settings,
      active: poll.active !== undefined ? poll.active : true,
      createdAt
    };

    // Transacción: crear poll + entrada para GSI de creator
    await docClient.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: this.tableName,
            Item: {
              PK: `POLL#${pollId}`,
              SK: 'METADATA',
              ...newPoll,
              creatorId: poll.creatorId,
              createdAt
            }
          }
        },
        {
          Put: {
            TableName: this.tableName,
            Item: {
              PK: `CREATOR#${poll.creatorId}`,
              SK: `POLL#${pollId}`,
              pollId,
              title: poll.title,
              createdAt,
              creatorId: poll.creatorId
            }
          }
        }
      ]
    }));

    return newPoll;
  }

  /**
   * Obtener todas las encuestas (para admin/debug)
   * Nota: En producción, esto no se usaría debido al scan completo
   */
  async getPolls() {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'CreatorIndex',
        KeyConditionExpression: 'begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':sk': 'POLL#'
        }
      }));

      return result.Items || [];
    } catch (error) {
      console.error('Error getting all polls:', error);
      return [];
    }
  }

  /**
   * Obtener encuesta por ID
   * PK: POLL#<pollId>, SK: METADATA
   */
  async getPollById(id) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `POLL#${id}`,
          SK: 'METADATA'
        }
      }));

      if (!result.Item) {
        return null;
      }

      return {
        id: result.Item.id,
        creatorId: result.Item.creatorId,
        title: result.Item.title,
        description: result.Item.description,
        options: result.Item.options,
        settings: result.Item.settings,
        active: result.Item.active,
        createdAt: result.Item.createdAt
      };
    } catch (error) {
      console.error('Error getting poll by ID:', error);
      return null;
    }
  }

  /**
   * Obtener encuestas creadas por un usuario
   * Usa GSI CreatorIndex: creatorId
   */
  async getPollsByCreator(creatorId) {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `CREATOR#${creatorId}`
        }
      }));

      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      // Obtener los detalles completos de cada poll
      const pollIds = result.Items.map(item => item.pollId);
      const polls = await Promise.all(
        pollIds.map(pollId => this.getPollById(pollId))
      );

      return polls.filter(poll => poll !== null);
    } catch (error) {
      console.error('Error getting polls by creator:', error);
      return [];
    }
  }

  // ==========================================
  // VOTOS
  // ==========================================

  /**
   * Agregar voto
   * PK: POLL#<pollId>, SK: VOTE#<voterId>
   * Usa ConditionExpression para prevenir votos duplicados
   */
  async addVote(vote) {
    const voteId = this._generateId();
    const votedAt = new Date().toISOString();

    const newVote = {
      id: voteId,
      pollId: vote.pollId,
      optionId: vote.optionId,
      voterId: vote.voterId,
      votedAt
    };

    try {
      await docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `POLL#${vote.pollId}`,
          SK: `VOTE#${vote.voterId}`,
          ...newVote
        },
        // Prevenir votos duplicados
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
      }));

      return newVote;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Usuario ya votó en esta encuesta');
      }
      console.error('Error adding vote:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los votos de una encuesta
   * Query: PK = POLL#<pollId> AND begins_with(SK, 'VOTE#')
   */
  async getVotesByPollId(pollId) {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `POLL#${pollId}`,
          ':sk': 'VOTE#'
        }
      }));

      return (result.Items || []).map(item => ({
        id: item.id,
        pollId: item.pollId,
        optionId: item.optionId,
        voterId: item.voterId,
        votedAt: item.votedAt
      }));
    } catch (error) {
      console.error('Error getting votes by poll ID:', error);
      return [];
    }
  }

  /**
   * Verificar si un usuario ya votó en una encuesta
   * Get: PK = POLL#<pollId>, SK = VOTE#<voterId>
   */
  async hasUserVoted(pollId, voterId) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `POLL#${pollId}`,
          SK: `VOTE#${voterId}`
        }
      }));

      return !!result.Item;
    } catch (error) {
      console.error('Error checking if user voted:', error);
      return false;
    }
  }

  // ==========================================
  // RESULTADOS AGREGADOS
  // ==========================================

  /**
   * Calcular resultados agregados de una encuesta
   * Obtiene el poll y todos sus votos, luego calcula porcentajes
   */
  async getPollResults(pollId) {
    try {
      const poll = await this.getPollById(pollId);
      if (!poll) {
        return null;
      }

      const votes = await this.getVotesByPollId(pollId);

      // Contar votos por opción
      const optionCounts = {};
      poll.options.forEach(opt => {
        optionCounts[opt.id] = 0;
      });

      votes.forEach(vote => {
        if (optionCounts[vote.optionId] !== undefined) {
          optionCounts[vote.optionId]++;
        }
      });

      const totalVotes = votes.length;

      const results = poll.options.map(opt => {
        const count = optionCounts[opt.id];
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          optionId: opt.id,
          text: opt.text,
          votes: count,
          percentage
        };
      });

      return {
        pollId: poll.id,
        title: poll.title,
        description: poll.description,
        totalVotes,
        results,
        settings: poll.settings
      };
    } catch (error) {
      console.error('Error getting poll results:', error);
      return null;
    }
  }

  // ==========================================
  // CONEXIONES WEBSOCKET (para Fase 4)
  // ==========================================

  /**
   * Registrar conexión WebSocket
   * PK: CONNECTION#<connectionId>, SK: METADATA
   */
  async addConnection(connectionId, pollId = null) {
    const timestamp = Date.now();
    const ttl = Math.floor(timestamp / 1000) + 3600; // 1 hora

    const item = {
      PK: `CONNECTION#${connectionId}`,
      SK: 'METADATA',
      connectionId,
      timestamp,
      ttl
    };

    // Solo agregar pollId si no es null (evita error en GSI PollIdIndex)
    if (pollId) {
      item.pollId = pollId;
    }

    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));
  }

  /**
   * Actualizar pollId de una conexión (suscripción)
   */
  async updateConnectionPoll(connectionId, pollId) {
    await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `CONNECTION#${connectionId}`,
        SK: 'METADATA'
      },
      UpdateExpression: 'SET pollId = :pollId',
      ExpressionAttributeValues: {
        ':pollId': pollId
      }
    }));
  }

  /**
   * Eliminar conexión WebSocket
   */
  async removeConnection(connectionId) {
    await docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `CONNECTION#${connectionId}`,
        SK: 'METADATA'
      }
    }));
  }

  /**
   * Obtener todas las conexiones suscritas a un poll
   * Usa GSI PollIdIndex
   */
  async getConnectionsByPollId(pollId) {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'PollIdIndex',
        KeyConditionExpression: 'pollId = :pollId',
        ExpressionAttributeValues: {
          ':pollId': pollId
        }
      }));

      // Filtrar solo las conexiones (PK empieza con CONNECTION#)
      return (result.Items || [])
        .filter(item => item.PK && item.PK.startsWith('CONNECTION#'))
        .map(item => ({
          connectionId: item.connectionId,
          pollId: item.pollId,
          timestamp: item.timestamp
        }));
    } catch (error) {
      console.error('Error getting connections by poll ID:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export const db = new Database();

// También exportar la clase para testing
export { Database };
