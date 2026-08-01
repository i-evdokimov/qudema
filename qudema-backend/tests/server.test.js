const request = require('supertest');
const { app, pool } = require('../server'); // Импортируем наше приложение и пул БД

// Изолируем внешние вызовы API Telegram и Почты во время тестов
jest.mock('node-telegram-bot-api');
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-email-id' })
  })
}));

describe('🧪 ПОЛНЫЙ ИНТЕГРАЦИОННЫЙ ПАКЕТ ТЕСТОВ QUDEMA CRM', () => {
  let studentToken;
  let teacherToken;
  let testStudentId;
  let testTeacherId;
  let testGroupId;
  let testHomeworkId;

  // Инициализация тестовой БД перед всеми тестами
  beforeAll(async () => {
    // Очищаем таблицы перед тестированием, чтобы избежать дубликатов
    await pool.query('TRUNCATE users, groups, homeworks, submissions, attendance, auth_codes CASCADE');

    // 1. Создаем тестового преподавателя
    const teacherRes = await pool.query(
      "INSERT INTO users (email, password_hash, first_name, role) VALUES ($1, $2, $3, $4) RETURNING id",
      ['teacher@qudema.com', '$2b$10$abcdefghijklmnopqrstuv', 'Ольга Николаевна', 'teacher']
    );
    testTeacherId = teacherRes.rows[0].id;

    // Генерируем JWT для преподавателя
    const jwt = require('jsonwebtoken');
    teacherToken = jwt.sign(
      { id: testTeacherId, role: 'teacher' },
      process.env.JWT_SECRET || 'super_secret_qudema_key',
      { expiresIn: '1h' }
    );

    // 2. Создаем тестовую группу для преподавателя
    const groupRes = await pool.query(
      "INSERT INTO groups (name, teacher_id, static_link) VALUES ($1, $2, $3) RETURNING id",
      ['Веб-Разработка 101', testTeacherId, 'https://telemost.yandex.ru/test-room']
    );
    testGroupId = groupRes.rows[0].id;
  });

  // Закрываем пул БД после прохождения тестов
  afterAll(async () => {
    await pool.end();
  });

  // ==========================================
  // БЛОК 1: ТЕСТИРОВАНИЕ РЕГИСТРАЦИИ И АВТОРskipИЗАЦИИ
  // ==========================================
  describe('🔐 Авторизация и регистрация', () => {
    
    it('должен успешно зарегистрировать нового студента', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          email: 'student@qudema.com',
          password: 'Password123',
          first_name: 'Алексей',
          role: 'student'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('student@qudema.com');
      expect(res.body).toHaveProperty('token');
      
      studentToken = res.body.token;
      testStudentId = res.body.user.id;

      // Привязываем студента к созданной ранее группе в БД для следующих тестов
      await pool.query('UPDATE users SET group_id = $1 WHERE id = $2', [testGroupId, testStudentId]);
    });

    it('должен выдать ошибку при попытке регистрации существующего Email', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          email: 'student@qudema.com',
          password: 'Password123',
          first_name: 'Алексей'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });

    it('должен успешно авторизовать студента по Email и паролю', async () => {
      const res = await request(app)
        .post('/api/login/email')
        .send({
          email: 'student@qudema.com',
          password: 'Password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
    });

    it('должен отклонить авторизацию при неверном пароле', async () => {
      const res = await request(app)
        .post('/api/login/email')
        .send({
          email: 'student@qudema.com',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBe('Неверный пароль');
    });
  });

  // ==========================================
  // БЛОК 2: ТЕСТИРОВАНИЕ СИСТЕМЫ ЖИЗНЕЙ
  // ==========================================
  describe('❤️ Система жизней учеников', () => {
    
    it('должен позволить преподавателю обновить количество жизней ученика', async () => {
      const res = await request(app)
        .put(`/api/students/${testStudentId}/lives`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ lives: 3 });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.lives).toBe(3);

      // Проверяем изменения непосредственно в БД
      const dbCheck = await pool.query('SELECT lives FROM users WHERE id = $1', [testStudentId]);
      expect(dbCheck.rows[0].lives).toBe(3);
    });

    it('должен вернуть ошибку 403 при изменении жизней без авторизации преподавателя', async () => {
      const res = await request(app)
        .put(`/api/students/${testStudentId}/lives`)
        .set('Authorization', `Bearer ${studentToken}`) // Передаем токен студента вместо преподавателя
        .send({ lives: 2 });

      expect(res.statusCode).toEqual(403);
    });
  });

  // ==========================================
  // БЛОК 3: ТЕСТИРОВАНИЕ ДОМАШНИХ ЗАДАНИЙ (HW)
  // ==========================================
  describe('📝 Создание, сдача и проверка ДЗ', () => {

    it('должен позволить преподавателю создать новое ДЗ', async () => {
      const res = await request(app)
        .post('/api/homeworks/create')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('groupId', testGroupId)
        .field('title', 'Создание адаптивной сетки CSS Grid')
        .field('description', 'Необходимо разработать макет лендинга с использованием CSS Grid.')
        .field('deadline', '2026-12-31T23:59:00');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Получаем ID созданного домашнего задания из БД
      const hwCheck = await pool.query('SELECT id FROM homeworks ORDER BY id DESC LIMIT 1');
      testHomeworkId = hwCheck.rows[0].id;
    });

    it('должен вернуть список домашних заданий для студента', async () => {
      const res = await request(app)
        .get('/api/student/homeworks')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe('Создание адаптивной сетки CSS Grid');
    });

    it('должен позволить студенту отправить решение ДЗ на проверку', async () => {
      const res = await request(app)
        .post('/api/submissions/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('homeworkId', testHomeworkId)
        .field('link', 'https://github.com/student/css-grid-homework');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    it('должен позволить преподавателю отклонить ДЗ и автоматически списать 1 жизнь', async () => {
      // Сначала проверим текущие жизни в БД
      const livesBefore = await pool.query('SELECT lives FROM users WHERE id = $1', [testStudentId]);
      const initialLives = livesBefore.rows[0].lives;

      const res = await request(app)
        .post('/api/homework/review')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentId: testStudentId,
          homeworkId: testHomeworkId,
          status: 'rejected',
          feedback: 'К сожалению, адаптивность на мобильных устройствах сломана. Переделай.'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Проверяем, что списалась ровно 1 жизнь
      const livesAfter = await pool.query('SELECT lives FROM users WHERE id = $1', [testStudentId]);
      expect(livesAfter.rows[0].lives).toBe(initialLives - 1);
    });
  });

  // ==========================================
  // БЛОК 4: ТЕСТИРОВАНИЕ ОПРОСОВ ПОСЕЩАЕМОСТИ
  // ==========================================
  describe('🗓 Мониторинг посещаемости', () => {

    it('преподаватель должен успешно запустить опрос посещаемости в группе', async () => {
      const res = await request(app)
        .post('/api/teacher/start-attendance')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ groupId: testGroupId });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // В таблице attendance должен появиться статус "pending" для нашего студента
      const attCheck = await pool.query('SELECT status FROM attendance WHERE student_id = $1', [testStudentId]);
      expect(attCheck.rows[0].status).toBe('pending');
    });

    it('студент должен видеть активный опрос присутствия на уроке', async () => {
      const res = await request(app)
        .get('/api/student/attendance-status')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).not.toBeNull();
      expect(res.body.status).toBe('pending');
    });

    it('студент должен успешно подтвердить присутствие на следующем уроке через сайт', async () => {
      const res = await request(app)
        .post('/api/student/submit-attendance')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          groupId: testGroupId,
          status: 'confirmed'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Проверяем обновленный статус в БД
      const attCheck = await pool.query('SELECT status FROM attendance WHERE student_id = $1', [testStudentId]);
      expect(attCheck.rows[0].status).toBe('confirmed');
    });
  });
});