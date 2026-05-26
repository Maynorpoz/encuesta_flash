import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-para-encuestas-serverless-2026';

// Handler para Registro de Usuario (Simula Lambda signup)
export async function registerHandler(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son obligatorios' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'El username debe tener al menos 3 caracteres' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si ya existe el usuario
    const existingUser = db.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'El nombre de usuario ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Guardar usuario
    const user = db.createUser({
      username,
      passwordHash
    });

    // Generar token JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Error en registerHandler:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Handler para Inicio de Sesión (Simula Lambda login)
export async function loginHandler(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son obligatorios' });
    }

    // Buscar usuario
    const user = db.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Error en loginHandler:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Middleware de Autenticación (Simula Authorizer de API Gateway)
export function verifyAuthToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}
