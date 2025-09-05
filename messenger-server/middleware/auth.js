// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Используйте env

const authenticateToken = (req, res, next) => {
  console.log(`Middleware: Проверка токена для ${req.method} ${req.path}`);
  const authHeader = req.headers['authorization'];
  console.log('Middleware: Заголовок Authorization:', authHeader);

  if (!authHeader) {
    console.error('Middleware: Токен отсутствует');
    return res.status(401).json({ error: 'Токен отсутствует' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('Middleware: Неверный формат токена');
    return res.status(401).json({ error: 'Неверный формат токена' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Middleware: Токен верифицирован, пользователь:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Middleware: Ошибка верификации токена:', err.message);
    return res.status(403).json({ error: 'Неверный или истёкший токен' });
  }
};

module.exports = { authenticateToken };