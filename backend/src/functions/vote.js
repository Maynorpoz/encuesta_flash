import { db } from '../services/db.js';
import { broadcastResultsUpdate } from './wsHandler.js';

// Handler para registrar un voto (Simula Lambda vote)
export async function voteHandler(req, res) {
  try {
    const { pollId, optionId, voterId } = req.body;

    if (!pollId || !optionId || !voterId) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios: pollId, optionId o voterId' });
    }

    // 1. Obtener la encuesta
    const poll = db.getPollById(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'La encuesta no existe' });
    }

    // 2. Validar que la opción seleccionada pertenezca a la encuesta
    const optionExists = poll.options.some(opt => opt.id === optionId);
    if (!optionExists) {
      return res.status(400).json({ error: 'La opción seleccionada no pertenece a esta encuesta' });
    }

    // 3. Control de duplicados de votos si la configuración no permite múltiples votos
    if (!poll.settings?.multipleChoice) {
      const alreadyVoted = db.hasUserVoted(pollId, voterId);
      if (alreadyVoted) {
        return res.status(409).json({ error: 'Ya has registrado tu voto en esta encuesta' });
      }
    }

    // 4. Registrar el voto en la base de datos
    db.addVote({
      pollId,
      optionId,
      voterId
    });

    // 5. Difundir en tiempo real a través del WebSocket Handler (Simula Stream Trigger Lambda)
    broadcastResultsUpdate(pollId);

    return res.status(201).json({
      message: 'Voto registrado exitosamente',
      pollId,
      optionId
    });
  } catch (error) {
    console.error('Error en voteHandler:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el voto' });
  }
}
