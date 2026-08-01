require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_qudema_key'; 
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const BotConstructor = TelegramBot.default || TelegramBot;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'posadiptic@gmail.com',
        pass: 'tvoy_app_password' 
    }
});

// express
const app = express();
app.use(cors());
app.use(express.json());

// multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Buffer.from(file.originalname, 'latin1').toString('utf8'));
    }
});
const upload = multer({ storage });

// БД
const pool = new Pool({
    connectionString: process.env.DB_URL,
});

pool.on('error', (err) => {
    console.error('⚠️ Фоновая ошибка пула БД (но сервер работает дальше):', err.message);
});

pool.connect()
    .then(client => {
        console.log('✅ База данных PostgreSQL подключена!');
        client.release();
    })
    .catch(err => console.error('❌ Ошибка подключения к БД:', err));

// БОТ
const bot = new BotConstructor(process.env.BOT_TOKEN, { polling: true });

bot.on('polling_error', (error) => {});

// меню бота
const getMainMenu = (lives) => {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🌐 Получить код для входа на сайт', callback_data: 'site_login' }],
                [{ text: '🎥 Ссылка на занятие', callback_data: 'get_link' }],
                [{ text: `❤️ Мои жизни: ${lives}/4`, callback_data: 'check_lives' }]
            ]
        }
    };
};

// /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || '';
    const firstName = msg.chat.first_name || 'Ученик';

    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [chatId]);
        let user;

        if (userCheck.rows.length === 0) {
            const insertRes = await pool.query(
                'INSERT INTO users (telegram_id, username, first_name, role, lives) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [chatId, username, firstName, 'none', 4]
            );
            user = insertRes.rows[0];
            bot.sendMessage(chatId, `🎉 Привет, ${firstName}! Ты успешно зарегистрирован в системе QUDEMA.`);
        } else {
            user = userCheck.rows[0];
            bot.sendMessage(chatId, `С возвращением, ${firstName}!`);
        }

        if (user.role === 'none') {
            bot.sendMessage(chatId, `Здравствуйте, ${user.first_name}! Выберите ваш статус в системе QUDEMA:`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '👨‍🎓 Я ученик', callback_data: 'role_student' }],
                        [{ text: '👨‍👩‍👧 Я родитель', callback_data: 'role_parent' }],
                        [{ text: '💼 Я взрослый (повышение квалификации)', callback_data: 'role_adult' }]
                    ]
                }
            });
        } else {
            bot.sendMessage(chatId, 'Главное меню QUDEMA:', getMainMenu(user.lives));
        }

    } catch (err) {
        console.error('Ошибка в обработчике /start:', err);
        bot.sendMessage(chatId, '⚠️ Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже.');
    }
});

// обработчик генерации кода привязки tg к веб-аккаунту
bot.onText(/\/link/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        // Генерируем уникальный 6-значный код
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Очищаем старые коды этого пользователя, если они были
        await pool.query('DELETE FROM auth_codes WHERE telegram_id = $1', [chatId]);
        
        // Записываем код в БД
        await pool.query('INSERT INTO auth_codes (telegram_id, code) VALUES ($1, $2)', [chatId, code]);
        
        bot.sendMessage(
            chatId, 
            `🔑 *Код привязки аккаунта:* \`${code}\`\n\nВведите этот код на сайте в личном кабинете в разделе "Привязать Telegram". Срок действия кода — 10 минут.`, 
            { parse_mode: 'Markdown' }
        );
    } catch (err) {
        console.error('Ошибка при генерации кода привязки:', err);
        bot.sendMessage(chatId, '❌ Произошла ошибка при создании кода привязки. Попробуйте позже.');
    }
});

// Кнопки бота
bot.on('callback_query', async (q) => {
    const chatId = q.message.chat.id;
    const data = q.data;

    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [chatId]);
        const user = userCheck.rows[0];

        if (!user) {
            await bot.answerCallbackQuery(q.id, { text: 'Пользователь не найден в системе.' });
            return;
        }

        const userId = user.id;

        if (data.startsWith('att_yes_')) {
            const groupId = data.split('_')[2];
            await pool.query("UPDATE attendance SET status = 'confirmed', updated_at = NOW() WHERE student_id = $1 AND group_id = $2", [userId, groupId]);
            await bot.editMessageText(`✅ Вы подтвердили свое участие в занятии. Приятного урока!`, { chat_id: chatId, message_id: q.message.message_id });
            await sendAttendanceStatusToTeacher(groupId);
        }

        if (data.startsWith('att_no_')) {
            const groupId = data.split('_')[2];
            await bot.editMessageText(`🥺 Очень жаль. Укажите, пожалуйста, причину пропуска занятия:`, {
                chat_id: chatId,
                message_id: q.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🤒 Заболел(а)', callback_data: `reason_sick_${groupId}` }],
                        [{ text: '📚 Занят(а) в школе / ВУЗе', callback_data: `reason_school_${groupId}` }],
                        [{ text: '🤷 Другая причина', callback_data: `reason_other_${groupId}` }]
                    ]
                }
            });
        }

        if (data.startsWith('reason_')) {
            const parts = data.split('_');
            const reasonType = parts[1];
            const groupId = parts[2];
            
            let readableReason = 'Другая причина';
            if (reasonType === 'sick') readableReason = 'Заболел(а)';
            if (reasonType === 'school') readableReason = 'Занят(а) в школе';

            await pool.query("UPDATE attendance SET status = 'absent', reason = $1, updated_at = NOW() WHERE student_id = $2 AND group_id = $3", [readableReason, userId, groupId]);
            await bot.editMessageText(`👌 Причина принята (${readableReason}). Преподаватель уведомлен.`, { chat_id: chatId, message_id: q.message.message_id });
            await sendAttendanceStatusToTeacher(groupId);
        }

        if (data.startsWith('role_')) {
            const role = data.split('_')[1];
            await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
            bot.sendMessage(chatId, 'Статус сохранен! Главное меню:', getMainMenu(user?.lives || 4));
        }

        if (data === 'site_login') {
            const token = Math.floor(100000 + Math.random() * 900000).toString(); 
            await pool.query('UPDATE users SET site_token = $1 WHERE id = $2', [token, userId]);
            bot.sendMessage(chatId, `🔐 Ваш одноразовый код для входа на сайт: *${token}*\n\nВведите его на главной странице сайта.`, { parse_mode: 'Markdown' });
        }

        if (data === 'get_link') {
            const groupRes = await pool.query('SELECT static_link FROM groups WHERE id = $1', [user.group_id]);
            const link = groupRes.rows[0]?.static_link || 'Ссылка пока не назначена';
            bot.sendMessage(chatId, `🎥 Ваша постоянная ссылка на занятия:\n${link}`);
        }

        if (data === 'check_lives') {
            bot.sendMessage(chatId, `У вас осталось жизней: ${user?.lives || 4} из 4.\nСтарайтесь сдавать домашние задания вовремя!`);
        }
    } catch (err) {
        console.error('Ошибка при обработке кнопки:', err);
    }

    try {
        await bot.answerCallbackQuery(q.id);
    } catch (err) {
        console.error('⚠️ Не удалось ответить на callback-запрос (скорее всего он устарел)');
    }
});

// MIDDLEWARE JWT ДЛЯ ЗАЩИТЫ API
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ error: 'Доступ запрещен. Нет токена.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Недействительный токен.' });
        req.user = user; 
        next();
    });
};

// ВХОД ПО ТГ-КОДУ
app.post('/api/login', async (req, res) => {
    const { token } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE site_token = $1', [token]);
        if (result.rows.length > 0) {
            const user = result.rows[0];

            await pool.query('UPDATE users SET site_token = NULL WHERE id = $1', [user.id]);
            
            const authToken = jwt.sign(
                { id: user.id, role: user.role }, 
                JWT_SECRET, 
                { expiresIn: '7d' }
            );

            res.json({ success: true, user: user, token: authToken });
        } else {
            res.status(401).json({ error: 'Неверный или устаревший код' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// РЕГИСТРАЦИЯ ПО EMAIL
app.post('/api/register', async (req, res) => {
    const { email, password, first_name, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, first_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, role, lives',
            [email, hashedPassword, first_name, role || 'none']
        );
        const user = result.rows[0];
        
        const authToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ success: true, user: user, token: authToken });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Пользователь с таким Email уже существует' });
        }
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// ВХОД ПО EMAIL
app.post('/api/login/email', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        
        const user = result.rows[0];
        if (!user.password_hash) {
            return res.status(401).json({ error: 'Этот аккаунт зарегистрирован через Telegram. Используйте вход по коду.' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        const authToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ success: true, user: user, token: authToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера при авторизации' });
    }
});

// СБРОС ПАРОЛЯ
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.json({ success: true, message: 'Если Email существует, мы отправили письмо.' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const expireTime = Date.now() + 3600000; 

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_exp = $2 WHERE email = $3',
            [resetToken, expireTime, email]
        );

        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: '"QUDEMA" <tvoy.email@gmail.com>',
            to: email,
            subject: 'Сброс пароля QUDEMA',
            text: `Для сброса пароля перейдите по ссылке (действительна 1 час): ${resetLink}`,
            html: `<p>Для сброса пароля перейдите по ссылке (действительна 1 час):</p><a href="${resetLink}">${resetLink}</a>`
        });

        res.json({ success: true, message: 'Ссылка для сброса отправлена на почту.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при отправке письма' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await pool.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_exp > $2', 
            [token, Date.now()]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Токен недействителен или просрочен' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_exp = NULL WHERE id = $2',
            [hashedPassword, user.rows[0].id]
        );

        res.json({ success: true, message: 'Пароль успешно изменен!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при сбросе пароля' });
    }
});

// ПРИВЯЗКА TELEGRAM
app.post('/api/link-telegram', authenticateToken, async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id;

    try {
        const codeCheck = await pool.query('SELECT telegram_id FROM auth_codes WHERE code = $1', [code]);
        
        if (codeCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Неверный или устаревший код' });
        }

        const telegramId = codeCheck.rows[0].telegram_id;

        const existingUser = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [telegramId]);
        if (existingUser.rows.length > 0 && existingUser.rows[0].id !== userId) {
            return res.status(400).json({ error: 'Этот Telegram уже привязан к другому аккаунту' });
        }

        await pool.query('UPDATE users SET telegram_id = $1 WHERE id = $2', [telegramId, userId]);
        await pool.query('DELETE FROM auth_codes WHERE code = $1', [code]);

        res.json({ success: true, message: 'Telegram успешно привязан!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// УВЕДОМЛЕНИЕ ПРЕПОДАВАТЕЛЯ ПО ПОСЕЩАЕМОСТИ
async function sendAttendanceStatusToTeacher(groupId) {
    try {
        const groupRes = await pool.query('SELECT teacher_id, name FROM groups WHERE id = $1', [groupId]);
        if (groupRes.rows.length === 0) return;
        const { teacher_id, name: groupName } = groupRes.rows[0];
        
        const teacherRes = await pool.query('SELECT telegram_id FROM users WHERE id = $1', [teacher_id]);
        if (teacherRes.rows.length === 0 || !teacherRes.rows[0].telegram_id) return;
        const teacherTgId = teacherRes.rows[0].telegram_id;

        const statsRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
                COUNT(*) FILTER (WHERE status = 'absent') as absent,
                COUNT(*) FILTER (WHERE status = 'pending') as pending
            FROM attendance WHERE group_id = $1
        `, [groupId]);
        
        const { total, confirmed, absent, pending } = statsRes.rows[0];

        if (parseInt(pending) === 0) {
            if (parseInt(absent) === 0) {
                await bot.sendMessage(teacherTgId, `🎉 *Все пришли!* Вся группа *${groupName}* (${confirmed} из ${total} учеников) подтвердила участие в занятии!`, { parse_mode: 'Markdown' });
            } else {
                await bot.sendMessage(teacherTgId, `📊 *Опрос завершен для группы ${groupName}!*\n\n🟢 Придут: *${confirmed}*\n🔴 Пропустят: *${absent}*\n\nСписок пропусков и причины доступны в личном кабинете на сайте.`, { parse_mode: 'Markdown' });
            }
        } else {
            await bot.sendMessage(teacherTgId, `⚡ *Обновление расписания (${groupName}):*\nПодтвердилось: *${confirmed}* из *${total}* учеников.\nОсталось дождаться: ${pending}.`, { parse_mode: 'Markdown' });
        }
    } catch (err) {
        console.error('Ошибка отправки уведомления преподавателю:', err);
    }
}

// ОПРОС ПОСЕЩАЕМОСТИ
app.post('/api/teacher/start-attendance', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Доступ запрещен' });
    const { groupId } = req.body;

    try {
        await pool.query('DELETE FROM attendance WHERE group_id = $1', [groupId]);

        const students = await pool.query("SELECT id, telegram_id, first_name FROM users WHERE group_id = $1 AND role = 'student'", [groupId]);

        if (students.rows.length === 0) {
            return res.status(400).json({ error: 'В этой группе пока нет учеников.' });
        }

        for (const student of students.rows) {
            await pool.query(
                'INSERT INTO attendance (group_id, student_id, status) VALUES ($1, $2, \'pending\') ON CONFLICT DO NOTHING',
                [groupId, student.id]
            );

            if (!student.telegram_id) continue;

            try {
                await bot.sendMessage(student.telegram_id, `🗓 *Подтверждение занятия!*\n\n${student.first_name}, преподаватель просит подтвердить ваше присутствие на следующем занятии по расписанию.`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '✅ Я приду', callback_data: `att_yes_${groupId}` },
                                { text: '❌ Не смогу', callback_data: `att_no_${groupId}` }
                            ]
                        ]
                    }
                });
            } catch (bErr) {
                console.log(`Не удалось отправить опрос пользователю ${student.telegram_id}`);
            }
        }

        res.json({ success: true, message: 'Опрос успешно запущен!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера при запуске опроса' });
    }
});

// ПОЛУЧЕНИЕ СТАТУСА ПОСЕЩАЕМОСТИ ДЛЯ САЙТА
app.get('/api/student/attendance-status', authenticateToken, async (req, res) => {
    const studentId = req.user.id;
    try {
        const result = await pool.query('SELECT * FROM attendance WHERE student_id = $1 AND status = \'pending\'', [studentId]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ОТВЕТ СТУДЕНТА ЧЕРЕЗ САЙТ
app.post('/api/student/submit-attendance', authenticateToken, async (req, res) => {
    const studentId = req.user.id;
    const { groupId, status, reason } = req.body;
    try {
        await pool.query(
            'UPDATE attendance SET status = $1, reason = $2, updated_at = NOW() WHERE student_id = $3 AND group_id = $4',
            [status, reason || null, studentId, groupId]
        );
        await sendAttendanceStatusToTeacher(groupId);
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка подтверждения посещаемости:', err);
        res.status(500).json({ error: 'Ошибка сохранения ответа' });
    }
});

// РОДИТЕЛЬСКИЙ КАБИНЕТ
app.get('/api/parent/dashboard', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') return res.status(403).json({ error: 'Доступ только для родителей' });

    try {
        const parentRes = await pool.query('SELECT child_id FROM parent_child WHERE parent_id = $1', [req.user.id]);
        const childId = parentRes.rows[0]?.child_id;

        if (!childId) {
            return res.status(400).json({ error: 'К вашему аккаунту еще не привязан ученик.' });
        }

        const childRes = await pool.query(`
            SELECT u.first_name, u.lives, g.static_link as class_link 
            FROM users u
            LEFT JOIN groups g ON u.group_id = g.id
            WHERE u.id = $1
        `, [childId]);
        
        const child = childRes.rows[0];

        const hwRes = await pool.query(`
            SELECT h.id, h.title, h.deadline, s.status
            FROM homeworks h
            LEFT JOIN submissions s ON h.id = s.homework_id AND s.student_id = $1
            WHERE h.group_id = (SELECT group_id FROM users WHERE id = $1)
            ORDER BY h.id DESC
        `, [childId]);

        res.json({ child, homeworks: hwRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера при загрузке данных родителя' });
    }
});

// СПИСОК СТУДЕНТОВ УЧИТЕЛЯ
app.get('/api/students', authenticateToken, async (req, res) => {
    const teacherId = req.user.id;
    try {
        const studentsRes = await pool.query(
            `SELECT u.id, u.username, u.first_name, u.telegram_id, u.lives, u.group_id, g.name as group_name, g.static_link 
             FROM users u 
             LEFT JOIN groups g ON u.group_id = g.id 
             WHERE u.role = 'student' AND g.teacher_id = $1`,
            [teacherId]
        );
        const students = studentsRes.rows;

        for (let student of students) {
            const hwRes = await pool.query(`
                SELECT h.id as homework_id, h.title, s.status, s.submission_link, s.submission_file_url as student_file
                FROM homeworks h
                LEFT JOIN submissions s ON h.id = s.homework_id AND s.student_id = $1
                WHERE h.created_by = $2
                ORDER BY h.id DESC
            `, [student.id, teacherId]);
            student.homeworks = hwRes.rows;
        }

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ПОЛУЧЕНИЕ ГРУПП
app.get('/api/teacher/groups', authenticateToken, async (req, res) => {
    try {
        const groupsRes = await pool.query('SELECT * FROM groups WHERE teacher_id = $1', [req.user.id]);
        res.json(groupsRes.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при получении групп' });
    }
});

// ИЗМЕНЕНИЕ ЖИЗНЕЙ
app.put('/api/students/:id/lives', authenticateToken, async (req, res) => {

    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Нет доступа. Только преподаватель может изменять количество жизней.' });
    }

    const { id } = req.params; 
    const { lives } = req.body;

    try {
        const updateRes = await pool.query(
            'UPDATE users SET lives = $1 WHERE id = $2 RETURNING telegram_id, first_name',
            [lives, id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const student = updateRes.rows[0];

        if (student.telegram_id) {
            const heartEmojis = '❤️'.repeat(lives) || '💀 (0)';
            try {
                await bot.sendMessage(
                    student.telegram_id, 
                    `📢 Преподаватель изменил количество твоих жизней!\nТеперь у тебя: ${heartEmojis}`
                );
            } catch (err) {
                console.error('Ошибка отправки уведомления ботом:', err.message);
            }
        }

        res.json({ success: true, lives });
    } catch (err) {
        console.error('Ошибка обновления жизней:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ОБНОВЛЕНИЕ ССЫЛКИ НА УРОК
app.post('/api/update-class-link', authenticateToken, async (req, res) => {
    const { link, groupId } = req.body;
    try {
        await pool.query("UPDATE groups SET static_link = $1 WHERE id = $2 AND teacher_id = $3", 
            [link, groupId, req.user.id]);
        res.json({ success: true, message: 'Ссылка на занятие обновлена для группы!' });
    } catch (err) {
        console.error('Ошибка обновления ссылки:', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении ссылки' });
    }
});

// СОЗДАНИЕ ДЗ УЧИТЕЛЕМ
app.post('/api/homeworks/create', authenticateToken, upload.single('file'), async (req, res) => {
    const { groupId, title, description, deadline } = req.body;
    const teacherId = req.user.id; 
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await pool.query(
            'INSERT INTO homeworks (created_by, group_id, title, description, file_url, deadline) VALUES ($1, $2, $3, $4, $5, $6)',
            [teacherId, groupId, title, description, fileUrl, deadline || null]
        );

        const studentsRes = await pool.query(
            "SELECT id, telegram_id FROM users WHERE role = 'student' AND group_id = $1", 
            [groupId]
        );
        
        for (const student of studentsRes.rows) {
            if (!student.telegram_id) continue;
            try {
                await bot.sendMessage(
                    student.telegram_id, 
                    `📚 *Новое задание:*\n${title}\n\nЗайдите в личный кабинет, чтобы посмотреть детали и сдать работу.`,
                    { parse_mode: 'Markdown' }
                );
            } catch (botErr) {
                console.log(`Не удалось отправить ТГ-уведомление ученику с ID: ${student.id}`);
            }
        }

        res.json({ success: true, message: 'Задание создано и отправлено ученикам группы!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка создания задания' });
    }
});

// СПИСОК ЗАДАЧ УЧЕНИКА ДЛЯ САЙТА
app.get('/api/student/homeworks', authenticateToken, async (req, res) => {
    const studentId = req.user.id; 
    try {
        const userRes = await pool.query('SELECT group_id FROM users WHERE id = $1', [studentId]);
        if (userRes.rows.length === 0 || !userRes.rows[0].group_id) {
            return res.json([]); 
        }
        const groupId = userRes.rows[0].group_id;

        const hwRes = await pool.query(`
            SELECT h.id as homework_id, h.title, h.description, h.file_url as teacher_file, h.deadline,
                   s.status, s.submission_link, s.submission_file_url as student_file, s.feedback
            FROM homeworks h
            LEFT JOIN submissions s ON h.id = s.homework_id AND s.student_id = $1
            WHERE h.group_id = $2
            ORDER BY h.id DESC
        `, [studentId, groupId]);

        res.json(hwRes.rows);
    } catch (err) {
        console.error('Ошибка при получении заданий студента:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// СДАЧА РЕШЕНИЯ УЧЕНИКОМ
app.post('/api/submissions/submit', authenticateToken, upload.single('file'), async (req, res) => {
    const { homeworkId, link } = req.body; 
    const studentId = req.user.id; 
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await pool.query(`
            INSERT INTO submissions (homework_id, student_id, submission_link, submission_file_url, status)
            VALUES ($1, $2, $3, $4, 'submitted')
            ON CONFLICT (homework_id, student_id) 
            DO UPDATE SET submission_link = EXCLUDED.submission_link, 
                          submission_file_url = EXCLUDED.submission_file_url, 
                          status = 'submitted',
                          updated_at = CURRENT_TIMESTAMP
        `, [homeworkId, studentId, link || null, fileUrl]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка отправки решения' });
    }
});

// ПРОВЕРКА ДЗ УЧИТЕЛЕМ + СПИСАНИЕ ЖИЗНИ ПРИ ОТКЛОНЕНИИ
app.post('/api/homework/review', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Доступ запрещен' });
    const { studentId, homeworkId, status, feedback } = req.body; 

    try {
        await pool.query(
            "UPDATE submissions SET status = $1, feedback = $2, updated_at = CURRENT_TIMESTAMP WHERE student_id = $3 AND homework_id = $4",
            [status, feedback || null, studentId, homeworkId]
        );

        let livesRemaining = 4;
        
        if (status === 'rejected') {
            const lifeRes = await pool.query(
                "UPDATE users SET lives = GREATEST(lives - 1, 0) WHERE id = $1 RETURNING lives",
                [studentId]
            );
            if (lifeRes.rows.length > 0) {
                livesRemaining = lifeRes.rows[0].lives;
            }
        }

        const studentRes = await pool.query("SELECT telegram_id, first_name FROM users WHERE id = $1", [studentId]);
        const student = studentRes.rows[0];

        if (student && student.telegram_id) {
            let messageText = status === 'checked'
                ? '🎉 Ваше домашнее задание успешно проверено и принято! ✅'
                : `⚠️ Ваше домашнее задание было отклонено. ❌\nУ вас списана 1 жизнь. Осталось жизней: ❤️ ${livesRemaining}`;
                
            if (feedback) {
                messageText += `\n\n💬 Комментарий преподавателя:\n_${feedback}_`;
            }

            try {
                await bot.sendMessage(student.telegram_id, messageText, { parse_mode: 'Markdown' });
            } catch (botErr) {
                console.error('Не удалось отправить сообщение в Telegram:', botErr.message);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера при проверке домашки' });
    }
});

if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });
}

module.exports = { app, pool };