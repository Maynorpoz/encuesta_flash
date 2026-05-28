// Imports desde Lambda Layer (/opt/nodejs/)
// Los módulos npm se importan directamente, SAM los encuentra en el layer
import bcrypt from 'bcryptjs';
import { db } from '/opt/nodejs/index.mjs';
import { generateToken } from '/opt/nodejs/index.mjs';

/**
 * Lambda Handler - Login de Usuario
 *
 * Valida credenciales y retorna token JWT
 *
 * Event body: { username: string, password: string }
 */
export const handler = async (event) => {
  console.log('LoginHandler - Event:', JSON.stringify(event, null, 2));

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

    // Buscar usuario en DynamoDB
    const user = await db.findUserByUsername(username);
    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Credenciales inválidas' })
      };
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Credenciales inválidas' })
      };
    }

    // Generar token JWT
    const token = generateToken({ userId: user.id, username: user.username });

    // Respuesta exitosa
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user.id,
          username: user.username
        }
      })
    };

  } catch (error) {
    console.error('Error en loginHandler:', error);

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
