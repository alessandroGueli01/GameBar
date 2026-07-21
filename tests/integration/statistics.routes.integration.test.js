jest.mock('../../backend/statistics-service/Statistic', () => ({
  findOne: jest.fn(),
  findOrCreate: jest.fn(),
  findAll: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const Statistic = require('../../backend/statistics-service/Statistic');
const statisticsRoutes = require('../../backend/statistics-service/statisticsRoutes');

describe('Statistics routes integration', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/stats', statisticsRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/stats/update processes match result', async () => {
    Statistic.findOrCreate.mockImplementation(async ({ where, defaults }) => {
      return [
        {
          ...defaults,
          userId: where.userId,
          save: jest.fn().mockResolvedValue(undefined)
        },
        true
      ];
    });

    const payload = {
      players: [
        { userId: 'u1', username: 'Mario', team: 'A' },
        { userId: 'u2', username: 'Luigi', team: 'B' }
      ],
      score: { teamA: 3, teamB: 1 }
    };

    const response = await request(app)
      .post('/api/stats/update')
      .send(payload)
      .expect(200);

    expect(response.body).toEqual({ message: 'Statistiche aggiornate correttamente' });
    expect(Statistic.findOrCreate).toHaveBeenCalledTimes(2);
  });

  test('GET /api/stats/leaderboard returns ordered data', async () => {
    const leaderboard = [
      { userId: 'u1', username: 'Mario', points: 9 },
      { userId: 'u2', username: 'Luigi', points: 6 }
    ];

    Statistic.findAll.mockResolvedValue(leaderboard);

    const response = await request(app)
      .get('/api/stats/leaderboard?limit=5')
      .expect(200);

    expect(response.body).toEqual(leaderboard);
    expect(Statistic.findAll).toHaveBeenCalledTimes(1);
  });
});
