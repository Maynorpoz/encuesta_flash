import { db } from '../services/db.js';

// Handler para crear una encuesta (Simula Lambda createPoll)
export async function createPollHandler(req, res) {
  try {
    const { title, description, options, settings } = req.body;
    const creatorId = req.user.userId; // Obtenido del token JWT verificado por el Authorizer

    // Validaciones básicas
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'La encuesta requiere un título y al menos 2 opciones' });
    }

    if (options.length > 10) {
      return res.status(400).json({ error: 'La encuesta no puede tener más de 10 opciones' });
    }

    // Validar y limpiar opciones
    const formattedOptions = options.map((opt, index) => {
      const text = typeof opt === 'string' ? opt.trim() : opt.text?.trim();
      if (!text) {
        throw new Error(`La opción en la posición ${index + 1} no puede estar vacía`);
      }
      return {
        id: `opt_${Math.random().toString(36).substring(2, 9)}`,
        text
      };
    });

    // Configuración por defecto
    const pollSettings = {
      anonymous: true,
      multipleChoice: false,
      ...settings
    };

    // Crear la encuesta en base de datos
    const newPoll = db.createPoll({
      creatorId,
      title: title.trim(),
      description: description?.trim() || '',
      options: formattedOptions,
      settings: pollSettings,
      active: true
    });

    return res.status(201).json({
      message: 'Encuesta creada exitosamente',
      poll: newPoll
    });
  } catch (error) {
    console.error('Error en createPollHandler:', error.message);
    if (error.message.includes('opción')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor al crear la encuesta' });
  }
}

// Handler para listar encuestas del usuario autenticado
export async function getUserPollsHandler(req, res) {
  try {
    const creatorId = req.user.userId;
    const polls = db.getPollsByCreator(creatorId);
    
    // Obtener información adicional como cantidad de votos para cada encuesta
    const pollsWithStats = polls.map(poll => {
      const votes = db.getVotesByPollId(poll.id);
      return {
        ...poll,
        totalVotes: votes.length
      };
    });

    return res.status(200).json(pollsWithStats);
  } catch (error) {
    console.error('Error en getUserPollsHandler:', error);
    return res.status(500).json({ error: 'Error al obtener tus encuestas' });
  }
}
