// Imports desde Lambda Layer (/opt/nodejs/)
// Los módulos npm se importan directamente, SAM los encuentra en el layer
import bcrypt from 'bcryptjs';
import { db } from '/opt/nodejs/index.mjs';
import { generateToken } from '/opt/nodejs/index.mjs';

/**
 * Lambda Handler - Registro de Usuario
 *
 * Crea un nuevo usuario con username y password hasheado
 * Retorna token JWT para autenticación inmediata
 *
 * Event body: { username: string, password: string }
 */
export const handler = async (event) => {
  console.log('RegisterHandler - Event:', JSON.stringify(event, null, 2));

  try {
    // Parsear body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { username, password } = body;

    // Validaciones
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Username y password son obligatorios' })
      };
    }

    if (username.length < 3) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'El username debe tener al menos 3 caracteres' })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' })
      };
    }

    // Verificar si el usuario ya existe
    const existingUser = await db.findUserByUsername(username);
    if (existingUser) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'El nombre de usuario ya está registrado' })
      };
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario en DynamoDB
    const user = await db.createUser({
      username,
      passwordHash
    });

    // Generar token JWT
    const token = generateToken({ userId: user.id, username: user.username });

    // Respuesta exitosa
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: user.id,
          username: user.username
        }
      })
    };

  } catch (error) {
    console.error('Error en registerHandler:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Error interno del servidor',
        message: error.message
      })
    };
  }
};
