// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { authenticateToken } = require('../middleware/auth'); // Добавили для /users
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/register', async (req, res) => {
  console.log('POST /auth/register');
  try {
    const { username, email, password, firstName, lastName, patronymic } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь или email уже существует' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      patronymic,
      fullName: `${firstName} ${lastName} ${patronymic}`.trim(),
    });
    await user.save();
    console.log('Пользователь зарегистрирован:', user);
    const token = jwt.sign(
      { username: user.username, userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, username: user.username, userId: user.userId, fullName: user.fullName });
  } catch (err) {
    console.error('Ошибка регистрации:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  console.log('POST /auth/login');
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
    }
    const token = jwt.sign(
      { username: user.username, userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Пользователь вошёл:', user);
    res.json({ token, username: user.username, userId: user.userId, fullName: user.fullName });
  } catch (err) {
    console.error('Ошибка входа:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/logout', (req, res) => {
  console.log('POST /auth/logout');
  res.status(200).send();
});

router.get('/users', authenticateToken, async (req, res) => { // Добавили auth
  console.log('GET /auth/users');
  try {
    const users = await User.find({}, 'userId username fullName email status');
    console.log('Загружены пользователи:', users);
    res.json(users);
  } catch (err) {
    console.error('Ошибка загрузки пользователей:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;