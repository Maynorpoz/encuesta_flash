import { db } from '../services/db.js';

// Handler para consultar los resultados agregados (Simula Lambda getResults)
export async function getResultsHandler(req, res) {
  try {
    const { pollId } = req.params;

    if (!pollId) {
      return res.status(400).json({ error: 'Falta el identificador de la encuesta (pollId)' });
    }

    const results = db.getPollResults(pollId);
    if (!results) {
      return res.status(404).json({ error: 'La encuesta solicitada no existe o no tiene resultados' });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error en getResultsHandler:', error);
    return res.status(500).json({ error: 'Error al obtener los resultados de la encuesta' });
  }
}
