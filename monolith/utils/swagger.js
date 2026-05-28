const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Football Tournament Manager API',
      version: '1.0.0',
      description: 'REST API for managing football tournaments',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [__filename],
};

/**
 * @openapi
 * /public/tournaments:
 *   get:
 *     summary: List all tournaments
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Array of tournaments
 */

/**
 * @openapi
 * /public/bracket:
 *   get:
 *     summary: Get bracket for a tournament
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: tournament_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bracket rounds keyed by round name
 */

/**
 * @openapi
 * /public/standings:
 *   get:
 *     summary: Get standings for a tournament
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: tournament_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of team standings
 */

/**
 * @openapi
 * /public/top-scorers:
 *   get:
 *     summary: Get top scorers for a tournament
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: tournament_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Array of top scorers
 */

/**
 * @openapi
 * /public/reports/{matchId}:
 *   get:
 *     summary: Get match report
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Match report object
 *       404:
 *         description: Report not found
 */

/**
 * @openapi
 * /public/matches/{matchId}/commentary:
 *   get:
 *     summary: Get match commentary
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of commentary entries ordered by minute
 */

/**
 * @openapi
 * /public/tournament-stats/{id}:
 *   get:
 *     summary: Get tournament statistics
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Aggregate stats, top scorer, and winner
 */

/**
 * @openapi
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token
 *       401:
 *         description: Invalid credentials
 */

/**
 * @openapi
 * /admin/enrollment:
 *   get:
 *     summary: List enrolled teams
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournament_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of teams
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Register a team
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tournament_id, name]
 *             properties:
 *               tournament_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               players:
 *                 type: string
 *                 description: Newline-separated player names
 *     responses:
 *       201:
 *         description: Created team
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/enrollment/{id}:
 *   patch:
 *     summary: Update team status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *               seed:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated team
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/bracket/generate:
 *   post:
 *     summary: Generate tournament bracket
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tournament_id]
 *             properties:
 *               tournament_id:
 *                 type: integer
 *               seeded:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Generated matches
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/bracket:
 *   get:
 *     summary: Get bracket (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournament_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bracket rounds keyed by round name
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/matches/{id}/result:
 *   patch:
 *     summary: Submit match result
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [score_team1, score_team2]
 *             properties:
 *               score_team1:
 *                 type: integer
 *               score_team2:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated match
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/tournaments:
 *   get:
 *     summary: List tournaments (admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of tournaments
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a tournament
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               format:
 *                 type: string
 *                 default: single-elimination
 *     responses:
 *       201:
 *         description: Created tournament
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/matches/{matchId}/commentary:
 *   post:
 *     summary: Add commentary entry to a match
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               minute:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 120
 *               type:
 *                 type: string
 *                 enum: [comment, goal, yellow_card, red_card, substitution, info]
 *                 default: comment
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created commentary entry
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/matches/{matchId}/goals:
 *   post:
 *     summary: Add a goal to a match
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [player_id, team_id]
 *             properties:
 *               player_id:
 *                 type: integer
 *               team_id:
 *                 type: integer
 *               minute:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created goal entry
 *       401:
 *         description: Unauthorized
 */

module.exports = swaggerJsdoc(options);
