const express = require('express');
const { register, login } = require('../controllers/authController');
const { registerRules, loginRules } = require('../middleware/validators');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new attendee account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already registered }
 *       422: { description: Validation failed }
 */
router.post('/register', registerRules, validate, register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, token returned }
 *       401: { description: Incorrect email or password }
 */
router.post('/login', loginRules, validate, login);

module.exports = router;
