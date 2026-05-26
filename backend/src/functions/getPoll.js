import { db } from '../services/db.js';

// Handler para obtener detalles públicos de una encuesta (Simula Lambda getPoll)
export async function getPollHandler(req, res) {
  try {
    const { pollId } = req.params;

    if (!pollId) {
      return res.status(400).json({ error: 'Falta el identificador de la encuesta (pollId)' });
    }

    const poll = db.getPollById(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'La encuesta solicitada no existe' });
    }

    // No retornar información sensible como el ID del creador en la vista pública
    const publicPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      settings: poll.settings,
      createdAt: poll.createdAt
    };

    return res.status(200).json(publicPoll);
  } catch (error) {
    console.error('Error en getPollHandler:', error);
    return res.status(500).json({ error: 'Error al obtener la encuesta' });
  }
}
