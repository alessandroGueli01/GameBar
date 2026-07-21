jest.mock('../../backend/statistics-service/Statistic', () => ({
  findOne: jest.fn(),
  findOrCreate: jest.fn(),
  findAll: jest.fn()
}));

const Statistic = require('../../backend/statistics-service/Statistic');
const statisticsController = require('../../backend/statistics-service/statisticsController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('Statistics controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processMatchResult updates stats for all players', async () => {
    const req = {
      body: {
        players: [
          { userId: 'u1', username: 'Mario', team: 'A' },
          { userId: 'u2', username: 'Luigi', team: 'B' }
        ],
        score: { teamA: 2, teamB: 1 }
      }
    };
    const res = createRes();

    Statistic.findOrCreate
      .mockResolvedValueOnce([
        {
          username: 'Mario',
          matchesPlayed: 4,
          wins: 1,
          losses: 2,
          draws: 1,
          points: 4,
          save: jest.fn().mockResolvedValue(undefined)
        },
        false
      ])
      .mockResolvedValueOnce([
        {
          username: 'Luigi',
          matchesPlayed: 3,
          wins: 1,
          losses: 1,
          draws: 1,
          points: 4,
          save: jest.fn().mockResolvedValue(undefined)
        },
        false
      ]);

    await statisticsController.processMatchResult(req, res);

    expect(Statistic.findOrCreate).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ message: 'Statistiche aggiornate correttamente' });
  });

  test('getUserStats returns 404 when user statistics are missing', async () => {
    const req = {
      params: { userId: 'missing-user' }
    };
    const res = createRes();

    Statistic.findOne.mockResolvedValue(null);

    await statisticsController.getUserStats(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Statistiche non trovate per questo utente' });
  });
});
