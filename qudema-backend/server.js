require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
}
const FRONTEND_URL = (
    process.env.FRONTEND_URL ||
    'http://localhost:5173'
).replace(/\/$/, '');
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
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;
if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !MAIL_FROM) {
    console.warn('⚠️ SMTP credentials are not fully configured. Password reset emails may fail.');
}

// express
const app = express();
app.use(cors({
    origin: FRONTEND_URL,
    credentials: false
}));
app.use(express.json({ limit: '1mb' }));

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
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

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

bot.on('polling_error', (error) => {
    console.error('❌ TELEGRAM POLLING ERROR:', error.message);
});

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

        if (data.startsWith('att_yes_') || data.startsWith('att_no_')) {
            const [, action, rawSessionId] = data.split('_');
            const sessionId = Number(rawSessionId);

            if (!Number.isInteger(sessionId) || sessionId <= 0) {
                await bot.answerCallbackQuery(q.id, { text: 'Некорректный опрос.' });
                return;
            }

            const attendanceRes = await pool.query(`
                SELECT
                    a.id,
                    a.group_id,
                    a.status,
                    s.status AS session_status
                FROM attendance a
                JOIN attendance_sessions s ON s.id = a.session_id
                WHERE a.session_id = $1
                AND a.student_id = $2
            `, [sessionId, userId]);

            if (attendanceRes.rows.length === 0) {
                await bot.answerCallbackQuery(q.id, { text: 'Опрос для вас не найден.' });
                return;
            }

            const attendance = attendanceRes.rows[0];

            if (attendance.session_status !== 'active') {
                await bot.answerCallbackQuery(q.id, { text: 'Этот опрос уже закрыт.' });
                return;
            }

            if (attendance.status !== 'pending') {
                await bot.answerCallbackQuery(q.id, { text: 'Ваш ответ уже сохранен.' });
                return;
            }

            if (action === 'yes') {
                await pool.query(`
                    UPDATE attendance
                    SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1 AND status = 'pending'
                `, [attendance.id]);

                await bot.answerCallbackQuery(q.id, { text: 'Ответ сохранен.' });
                await bot.editMessageText(
                    '✅ Вы подтвердили свое участие в занятии. Приятного урока!',
                    { chat_id: chatId, message_id: q.message.message_id }
                );

                await sendAttendanceStatusToTeacher(sessionId);
            } else {
                await bot.answerCallbackQuery(q.id, { text: 'Выберите причину пропуска.' });
                await bot.editMessageText(
                    '🥺 Очень жаль. Укажите, пожалуйста, причину пропуска занятия:',
                    {
                        chat_id: chatId,
                        message_id: q.message.message_id,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🤒 Заболел(а)', callback_data: `reason_sick_${sessionId}` }],
                                [{ text: '📚 Занят(а) в школе / ВУЗе', callback_data: `reason_school_${sessionId}` }],
                                [{ text: '🤷 Другая причина', callback_data: `reason_other_${sessionId}` }]
                            ]
                        }
                    }
                );
            }
        }

        if (data.startsWith('reason_')) {
            const [, reasonType, rawSessionId] = data.split('_');
            const sessionId = Number(rawSessionId);

            if (!Number.isInteger(sessionId) || sessionId <= 0) {
                await bot.answerCallbackQuery(q.id, { text: 'Некорректный опрос.' });
                return;
            }

            let readableReason = 'Другая причина';
            if (reasonType === 'sick') readableReason = 'Заболел(а)';
            if (reasonType === 'school') readableReason = 'Занят(а) в школе / ВУЗе';

            const attendanceRes = await pool.query(`
                SELECT a.id, a.group_id, a.status, s.status AS session_status
                FROM attendance a
                JOIN attendance_sessions s ON s.id = a.session_id
                WHERE a.session_id = $1
                AND a.student_id = $2
            `, [sessionId, userId]);

            if (attendanceRes.rows.length === 0) {
                await bot.answerCallbackQuery(q.id, { text: 'Опрос для вас не найден.' });
                return;
            }

            const attendance = attendanceRes.rows[0];

            if (attendance.session_status !== 'active' || attendance.status !== 'pending') {
                await bot.answerCallbackQuery(q.id, { text: 'Этот опрос уже закрыт.' });
                return;
            }

            await pool.query(`
                UPDATE attendance
                SET status = 'absent', reason = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND status = 'pending'
            `, [readableReason, attendance.id]);

            await bot.answerCallbackQuery(q.id, { text: 'Причина сохранена.' });
            await bot.editMessageText(
                `👌 Причина принята (${readableReason}). Преподаватель уведомлен.`,
                { chat_id: chatId, message_id: q.message.message_id }
            );

            await sendAttendanceStatusToTeacher(sessionId);
        }


        if (data.startsWith('role_')) {
            const selectedRole = data.split('_')[1];
            const allowedRoles = ['student', 'parent', 'adult'];

            if (user.role !== 'none') {
                await bot.answerCallbackQuery(q.id, { text: 'Статус уже выбран.' });
                return;
            }

            if (!allowedRoles.includes(selectedRole)) {
                await bot.answerCallbackQuery(q.id, { text: 'Некорректный статус.' });
                return;
            }

            await pool.query(
                "UPDATE users SET role = $1 WHERE id = $2 AND role = 'none'",
                [selectedRole, userId]
            );

            bot.sendMessage(chatId, 'Статус сохранен! Главное меню:', getMainMenu(user?.lives ?? 4));
        }

        if (data === 'site_login') {
            const token = Math.floor(100000 + Math.random() * 900000).toString(); 
            await pool.query('UPDATE users SET site_token = $1 WHERE id = $2', [token, userId]);
            bot.sendMessage(chatId, `🔐 Ваш одноразовый код для входа на сайт: *${token}*\n\nВведите его на главной странице сайта.`, { parse_mode: 'Markdown' });
        }

        if (data === 'get_link') {
            const groupsRes = await pool.query(`
                SELECT DISTINCT
                    g.id,
                    g.name,
                    g.static_link
                FROM student_groups sg
                JOIN groups g
                ON g.id = sg.group_id
                WHERE sg.student_id = $1

                UNION

                SELECT
                    g.id,
                    g.name,
                    g.static_link
                FROM users u
                JOIN groups g
                ON g.id = u.group_id
                WHERE u.id = $1
                AND u.group_id IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM student_groups sg2
                    WHERE sg2.student_id = u.id
                )

                ORDER BY name
            `, [userId]);

            if (groupsRes.rows.length === 0) {
                await bot.sendMessage(
                    chatId,
                    '📚 Вам пока не назначена ни одна группа.'
                );
                return;
            }

            const keyboard = groupsRes.rows.map(group => [
                {
                    text: `🎓 ${group.name}`,
                    callback_data: `group_link_${group.id}`
                }
            ]);

            await bot.sendMessage(
                chatId,
                '🎥 Выберите группу, для которой нужна ссылка на занятие:',
                {
                    reply_markup: {
                        inline_keyboard: keyboard
                    }
                }
            );
        }

        if (data.startsWith('group_link_')) {
            const rawGroupId = data.replace('group_link_', '');
            const groupId = Number(rawGroupId);

            if (!Number.isInteger(groupId) || groupId <= 0) {
                await bot.answerCallbackQuery(
                    q.id,
                    { text: 'Некорректная группа.' }
                );
                return;
            }

            // Проверяем, состоит ли пользователь в выбранной группе.
            // student_groups — основной источник.
            // users.group_id — fallback для старых аккаунтов.
            const accessRes = await pool.query(`
                SELECT
                    g.id,
                    g.name,
                    g.static_link
                FROM groups g
                WHERE g.id = $1
                AND (
                    EXISTS (
                        SELECT 1
                        FROM student_groups sg
                        WHERE sg.student_id = $2
                            AND sg.group_id = g.id
                    )

                    OR

                    (
                        NOT EXISTS (
                            SELECT 1
                            FROM student_groups sg2
                            WHERE sg2.student_id = $2
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM users u
                            WHERE u.id = $2
                                AND u.group_id = g.id
                        )
                    )
                )
                LIMIT 1
            `, [groupId, userId]);

            if (accessRes.rows.length === 0) {
                await bot.answerCallbackQuery(
                    q.id,
                    { text: 'У вас нет доступа к этой группе.' }
                );
                return;
            }

            const group = accessRes.rows[0];

            if (!group.static_link) {
                await bot.sendMessage(
                    chatId,
                    `🎓 Группа: ${group.name}\n\nСсылка на занятие пока не назначена.`
                );
                return;
            }

            await bot.sendMessage(
                chatId,
                `🎓 Группа: *${group.name}*\n\n🎥 Ссылка на занятие:\n${group.static_link}`,
                {
                    parse_mode: 'Markdown'
                }
            );
        }

        if (data === 'check_lives') {
            bot.sendMessage(chatId, `У вас осталось жизней: ${user?.lives ?? 4} из 4.\nСтарайтесь сдавать домашние задания вовремя!`);
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
        const result = await pool.query('SELECT id, email, first_name, role, lives, telegram_id, username FROM users WHERE site_token = $1', [token]);
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
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof first_name === 'string' ? first_name.trim() : '';
    const allowedRoles = ['student', 'parent', 'adult'];
    const safeRole = allowedRoles.includes(role) ? role : 'student';

    if (!normalizedEmail || !normalizedName || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Проверьте Email, имя и пароль (минимум 6 символов).' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, first_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, role, lives, telegram_id, username',
            [normalizedEmail, hashedPassword, normalizedName, safeRole]
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
        const result = await pool.query('SELECT id, email, first_name, role, lives, telegram_id, username, password_hash FROM users WHERE email = $1', [email]);
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

        const resetLink =
            `${FRONTEND_URL}/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: `"QUDEMA" <${MAIL_FROM}>`,
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

    if (typeof token !== 'string' || !token || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'Некорректный токен или пароль. Пароль — минимум 6 символов.' });
    }

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
        const codeCheck = await pool.query(`
            SELECT telegram_id
            FROM auth_codes
            WHERE code = $1
              AND created_at >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
            LIMIT 1
        `, [code]);
        
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
async function sendAttendanceStatusToTeacher(sessionId) {
    try {
        const sessionRes = await pool.query(`
            SELECT
                s.id,
                s.group_id,
                s.status AS session_status,
                g.teacher_id,
                g.name AS group_name
            FROM attendance_sessions s
            JOIN groups g ON g.id = s.group_id
            WHERE s.id = $1
        `, [sessionId]);

        if (sessionRes.rows.length === 0) return;

        const session = sessionRes.rows[0];
        if (!session.teacher_id) return;

        const teacherRes = await pool.query(
            'SELECT telegram_id FROM users WHERE id = $1',
            [session.teacher_id]
        );

        if (teacherRes.rows.length === 0 || !teacherRes.rows[0].telegram_id) return;

        const statsRes = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
                COUNT(*) FILTER (WHERE status = 'absent') AS absent,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending
            FROM attendance
            WHERE session_id = $1
        `, [sessionId]);

        const { total, confirmed, absent, pending } = statsRes.rows[0];
        const pendingCount = Number(pending);

        if (pendingCount === 0) {
            // Закрываем сессию атомарно. Если её уже закрыл другой запрос,
            // повторное финальное уведомление преподавателю не отправляем.
            const closeRes = await pool.query(`
                UPDATE attendance_sessions
                SET status = 'closed', closed_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND status = 'active'
                RETURNING id
            `, [sessionId]);

            if (closeRes.rows.length === 0) return;

            if (Number(absent) === 0) {
                await bot.sendMessage(
                    teacherRes.rows[0].telegram_id,
                    `🎉 *Все пришли!* Группа *${session.group_name}* (${confirmed} из ${total} учеников) подтвердила участие в занятии!`,
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.sendMessage(
                    teacherRes.rows[0].telegram_id,
                    `📊 *Опрос завершен для группы ${session.group_name}!*\n\n🟢 Придут: *${confirmed}*\n🔴 Пропустят: *${absent}*\n\nСписок пропусков и причины доступны в личном кабинете на сайте.`,
                    { parse_mode: 'Markdown' }
                );
            }
        } else {
            await bot.sendMessage(
                teacherRes.rows[0].telegram_id,
                `⚡ *Обновление посещаемости (${session.group_name}):*\nПодтвердилось: *${confirmed}* из *${total}* учеников.\nОсталось дождаться: ${pendingCount}.`,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (err) {
        console.error('Ошибка отправки уведомления преподавателю:', err);
    }
}

// ОПРОС ПОСЕЩАЕМОСТИ
app.post('/api/teacher/start-attendance', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const groupId = Number(req.body.groupId);

    if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({ error: 'Некорректный groupId' });
    }

    const client = await pool.connect();

    try {
        const groupRes = await client.query(`
            SELECT id, name
            FROM groups
            WHERE id = $1 AND teacher_id = $2
        `, [groupId, req.user.id]);

        if (groupRes.rows.length === 0) {
            return res.status(403).json({ error: 'Вы не являетесь преподавателем этой группы' });
        }

        const studentsRes = await client.query(`
            SELECT DISTINCT u.id, u.telegram_id, u.first_name
            FROM student_groups sg
            JOIN users u ON u.id = sg.student_id
            WHERE sg.group_id = $1
              AND u.role = 'student'
            ORDER BY u.first_name, u.id
        `, [groupId]);

        if (studentsRes.rows.length === 0) {
            return res.status(400).json({ error: 'В этой группе пока нет учеников.' });
        }

        const activeSessionRes = await client.query(`
            SELECT id
            FROM attendance_sessions
            WHERE group_id = $1
            AND status = 'active'
            LIMIT 1
        `, [groupId]);

        if (activeSessionRes.rows.length > 0) {
            return res.status(409).json({
                error: 'Для этой группы уже запущен активный опрос.'
            });
        }

        await client.query('BEGIN');

        const sessionRes = await client.query(`
            INSERT INTO attendance_sessions (group_id, started_by, status)
            VALUES ($1, $2, 'active')
            RETURNING id, group_id, created_at
        `, [groupId, req.user.id]);

        const session = sessionRes.rows[0];

        for (const student of studentsRes.rows) {
            await client.query(`
                INSERT INTO attendance (group_id, student_id, session_id, status)
                VALUES ($1, $2, $3, 'pending')
                ON CONFLICT DO NOTHING
            `, [groupId, student.id, session.id]);
        }

        await client.query('COMMIT');

        for (const student of studentsRes.rows) {
            if (!student.telegram_id) continue;

            try {
                await bot.sendMessage(
                    student.telegram_id,
                    `🗓 *Подтверждение занятия!*\n\n${student.first_name}, преподаватель просит подтвердить ваше присутствие на занятии.`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '✅ Я приду', callback_data: `att_yes_${session.id}` },
                                { text: '❌ Не смогу', callback_data: `att_no_${session.id}` }
                            ]]
                        }
                    }
                );
            } catch (botErr) {
                console.log(`Не удалось отправить опрос пользователю ${student.telegram_id}`);
            }
        }

        res.json({
            success: true,
            sessionId: Number(session.id),
            message: `Опрос успешно запущен для группы «${groupRes.rows[0].name}»!`
        });
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {
            // rollback мог быть не нужен, если ошибка произошла до BEGIN
        }

        console.error(err);

        if (err.code === '23505') {
            return res.status(409).json({
                error: 'Для этой группы уже запущен активный опрос.'
            });
        }

        res.status(500).json({ error: 'Ошибка сервера при запуске опроса' });
    } finally {
        client.release();
    }
});

// ПОЛУЧЕНИЕ РЕЗУЛЬТАТОВ ПЕРЕКЛИЧКИ
app.get('/api/teacher/attendance/:sessionId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            error: 'Доступ только для преподавателя'
        });
    }

    const sessionId = Number(req.params.sessionId);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        return res.status(400).json({
            error: 'Некорректный sessionId'
        });
    }

    try {
        const sessionRes = await pool.query(`
            SELECT
                s.id,
                s.group_id,
                s.started_by,
                s.status,
                s.created_at,
                s.closed_at,
                g.name AS group_name
            FROM attendance_sessions s
            JOIN groups g
              ON g.id = s.group_id
            WHERE s.id = $1
              AND g.teacher_id = $2
            LIMIT 1
        `, [sessionId, req.user.id]);

        if (sessionRes.rows.length === 0) {
            return res.status(404).json({
                error: 'Опрос не найден или не принадлежит вам'
            });
        }

        const studentsRes = await pool.query(`
            SELECT
                a.student_id,
                u.first_name,
                u.username,
                a.status,
                a.reason,
                a.updated_at
            FROM attendance a
            JOIN users u
              ON u.id = a.student_id
            WHERE a.session_id = $1
            ORDER BY u.first_name, u.id
        `, [sessionId]);

        const statsRes = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (
                    WHERE status = 'confirmed'
                ) AS confirmed,
                COUNT(*) FILTER (
                    WHERE status = 'absent'
                ) AS absent,
                COUNT(*) FILTER (
                    WHERE status = 'pending'
                ) AS pending
            FROM attendance
            WHERE session_id = $1
        `, [sessionId]);

        res.json({
            session: sessionRes.rows[0],
            stats: statsRes.rows[0],
            students: studentsRes.rows
        });

    } catch (err) {
        console.error(
            'Ошибка получения результатов посещаемости:',
            err
        );

        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});


// ПРИНУДИТЕЛЬНОЕ ЗАКРЫТИЕ ПЕРЕКЛИЧКИ
app.post('/api/teacher/attendance/:sessionId/close', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            error: 'Доступ только для преподавателя'
        });
    }

    const sessionId = Number(req.params.sessionId);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        return res.status(400).json({
            error: 'Некорректный sessionId'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const sessionRes = await client.query(`
            SELECT
                s.id,
                s.group_id,
                g.name AS group_name
            FROM attendance_sessions s
            JOIN groups g
              ON g.id = s.group_id
            WHERE s.id = $1
              AND g.teacher_id = $2
              AND s.status = 'active'
            LIMIT 1
        `, [sessionId, req.user.id]);

        if (sessionRes.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Активный опрос не найден'
            });
        }

        // Все ученики, которые не ответили, считаются пропустившими
        await client.query(`
            UPDATE attendance
            SET
                status = 'absent',
                reason = COALESCE(reason, 'Не подтвердил(а) присутствие'),
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = $1
              AND status = 'pending'
        `, [sessionId]);

        await client.query(`
            UPDATE attendance_sessions
            SET
                status = 'closed',
                closed_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND status = 'active'
        `, [sessionId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Опрос закрыт.',
            groupName: sessionRes.rows[0].group_name
        });

    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {}

        console.error(
            'Ошибка закрытия посещаемости:',
            err
        );

        res.status(500).json({
            error: 'Ошибка сервера при закрытии опроса'
        });
    } finally {
        client.release();
    }
});

// ПОЛУЧЕНИЕ СТАТУСА ПОСЕЩАЕМОСТИ ДЛЯ САЙТА
app.get('/api/student/attendance-status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для учеников' });
    }

    try {
        const result = await pool.query(`
            SELECT
                a.id,
                a.session_id,
                a.group_id,
                g.name AS group_name,
                a.status,
                a.reason,
                s.created_at AS session_created_at
            FROM attendance a
            JOIN attendance_sessions s ON s.id = a.session_id
            JOIN groups g ON g.id = a.group_id
            WHERE a.student_id = $1
              AND a.status = 'pending'
              AND s.status = 'active'
            ORDER BY s.created_at DESC, a.id DESC
            LIMIT 1
        `, [req.user.id]);

        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ОТВЕТ СТУДЕНТА ЧЕРЕЗ САЙТ
app.post('/api/student/submit-attendance', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для учеников' });
    }

    const studentId = req.user.id;
    const status = req.body.status;
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';

    if (!['confirmed', 'absent'].includes(status)) {
        return res.status(400).json({ error: 'Некорректный статус посещаемости' });
    }

    const sessionIdFromBody = Number(req.body.sessionId);
    let sessionId = Number.isInteger(sessionIdFromBody) && sessionIdFromBody > 0
        ? sessionIdFromBody
        : null;

    try {
        // Временная обратная совместимость: если старый frontend прислал groupId,
        // берём последнюю активную pending-сессию этой группы.
        if (!sessionId) {
            const groupId = Number(req.body.groupId);
            if (!Number.isInteger(groupId) || groupId <= 0) {
                return res.status(400).json({ error: 'Не указан sessionId' });
            }

            const fallbackRes = await pool.query(`
                SELECT a.session_id
                FROM attendance a
                JOIN attendance_sessions s ON s.id = a.session_id
                JOIN student_groups sg
                  ON sg.student_id = a.student_id
                 AND sg.group_id = a.group_id
                WHERE a.student_id = $1
                  AND a.group_id = $2
                  AND a.status = 'pending'
                  AND s.status = 'active'
                ORDER BY s.created_at DESC
                LIMIT 1
            `, [studentId, groupId]);

            sessionId = fallbackRes.rows[0]?.session_id ? Number(fallbackRes.rows[0].session_id) : null;
        }

        if (!sessionId) {
            return res.status(404).json({ error: 'Активный опрос не найден' });
        }

        const attendanceRes = await pool.query(`
            SELECT a.id, a.group_id, a.status, s.status AS session_status
            FROM attendance a
            JOIN attendance_sessions s ON s.id = a.session_id
            JOIN student_groups sg
              ON sg.student_id = a.student_id
             AND sg.group_id = a.group_id
            WHERE a.session_id = $1
              AND a.student_id = $2
        `, [sessionId, studentId]);

        if (attendanceRes.rows.length === 0) {
            return res.status(404).json({ error: 'Опрос не найден или ученик не состоит в этой группе' });
        }

        const attendance = attendanceRes.rows[0];

        if (attendance.session_status !== 'active') {
            return res.status(409).json({ error: 'Опрос уже закрыт' });
        }

        if (attendance.status !== 'pending') {
            return res.status(409).json({ error: 'Ответ по этому опросу уже сохранен' });
        }

        const updateRes = await pool.query(`
            UPDATE attendance
            SET status = $1,
                reason = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
              AND status = 'pending'
            RETURNING id, group_id, session_id, status, reason
        `, [status, reason || null, attendance.id]);

        if (updateRes.rows.length === 0) {
            return res.status(409).json({ error: 'Ответ уже был сохранен другим запросом' });
        }

        await sendAttendanceStatusToTeacher(sessionId);

        res.json({ success: true, attendance: updateRes.rows[0] });
    } catch (err) {
        console.error('Ошибка подтверждения посещаемости:', err);
        res.status(500).json({ error: 'Ошибка сохранения ответа' });
    }
});

//все активные опросы ученика
app.get('/api/student/attendance-status/all', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для учеников' });
    }

    try {
        const result = await pool.query(`
            SELECT
                a.id,
                a.session_id,
                a.group_id,
                g.name AS group_name,
                a.status,
                a.reason,
                s.created_at AS session_created_at
            FROM attendance a
            JOIN attendance_sessions s ON s.id = a.session_id
            JOIN groups g ON g.id = a.group_id
            JOIN student_groups sg
              ON sg.student_id = a.student_id
             AND sg.group_id = a.group_id
            WHERE a.student_id = $1
              AND a.status = 'pending'
              AND s.status = 'active'
            ORDER BY s.created_at DESC, a.id DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// РОДИТЕЛЬСКИЙ КАБИНЕТ
app.get('/api/parent/dashboard', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
        return res.status(403).json({
            error: 'Доступ только для родителей'
        });
    }

    try {
        // Сейчас parent_child хранит привязку одного ребенка.
        // Архитектуру самой связи пока не меняем.
        const parentRes = await pool.query(
            'SELECT child_id FROM parent_child WHERE parent_id = $1 LIMIT 1',
            [req.user.id]
        );

        const childId = parentRes.rows[0]?.child_id;

        if (!childId) {
            return res.status(400).json({
                error: 'К вашему аккаунту еще не привязан ученик.'
            });
        }

        // Информация о ребенке
        const childRes = await pool.query(`
            SELECT
                u.id,
                u.first_name,
                u.lives,
                u.telegram_id
            FROM users u
            WHERE u.id = $1
              AND u.role = 'student'
        `, [childId]);

        if (childRes.rows.length === 0) {
            return res.status(404).json({
                error: 'Ученик не найден.'
            });
        }

        const child = childRes.rows[0];

        // Все группы ребенка.
        // student_groups — основной источник.
        // users.group_id остается fallback для старых аккаунтов.
        const groupsRes = await pool.query(`
            SELECT
                g.id,
                g.name,
                g.static_link,
                g.teacher_id,
                t.first_name AS teacher_name
            FROM student_groups sg
            JOIN groups g
              ON g.id = sg.group_id
            LEFT JOIN users t
              ON t.id = g.teacher_id
            WHERE sg.student_id = $1

            UNION

            SELECT
                g.id,
                g.name,
                g.static_link,
                g.teacher_id,
                t.first_name AS teacher_name
            FROM users u
            JOIN groups g
              ON g.id = u.group_id
            LEFT JOIN users t
              ON t.id = g.teacher_id
            WHERE u.id = $1
              AND u.group_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM student_groups sg2
                  WHERE sg2.student_id = u.id
              )

            ORDER BY name
        `, [childId]);

        const groups = groupsRes.rows;

        // Домашние задания только из групп ребенка
        const homeworksRes = await pool.query(`
            SELECT
                h.id,
                h.title,
                h.description,
                h.deadline,
                h.file_url,
                h.group_id,
                g.name AS group_name,
                s.status,
                s.feedback,
                s.submission_link,
                s.submission_file_url
            FROM homeworks h
            JOIN groups g
              ON g.id = h.group_id
            LEFT JOIN submissions s
              ON s.homework_id = h.id
             AND s.student_id = $1
            WHERE EXISTS (
                SELECT 1
                FROM student_groups sg
                WHERE sg.student_id = $1
                  AND sg.group_id = h.group_id
            )
            OR (
                NOT EXISTS (
                    SELECT 1
                    FROM student_groups sg2
                    WHERE sg2.student_id = $1
                )
                AND h.group_id = (
                    SELECT group_id
                    FROM users
                    WHERE id = $1
                )
            )
            ORDER BY h.id DESC
        `, [childId]);

        // История посещаемости ребенка
        const attendanceRes = await pool.query(`
            SELECT
                a.id,
                a.session_id,
                a.group_id,
                g.name AS group_name,
                a.status,
                a.reason,
                s.status AS session_status,
                s.created_at AS session_created_at,
                s.closed_at AS session_closed_at
            FROM attendance a
            JOIN groups g
              ON g.id = a.group_id
            JOIN attendance_sessions s
              ON s.id = a.session_id
            WHERE a.student_id = $1
            ORDER BY s.created_at DESC, a.id DESC
            LIMIT 30
        `, [childId]);

        res.json({
            child,
            groups,
            homeworks: homeworksRes.rows,
            attendance: attendanceRes.rows
        });

    } catch (err) {
        console.error('Ошибка при загрузке данных родителя:', err);

        res.status(500).json({
            error: 'Ошибка сервера при загрузке данных родителя'
        });
    }
});

// СПИСОК СТУДЕНТОВ УЧИТЕЛЯ
app.get('/api/students', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ только для преподавателя' });
    }

    const teacherId = req.user.id;

    try {
        // Получаем эффективные группы ученика.
        // Основной источник — student_groups.
        // users.group_id используется только для старых аккаунтов,
        // у которых еще нет ни одной записи в student_groups.
        const studentsRes = await pool.query(`
            WITH effective_memberships AS (
                SELECT
                    sg.student_id,
                    sg.group_id
                FROM student_groups sg
                JOIN groups g ON g.id = sg.group_id
                WHERE g.teacher_id = $1

                UNION

                SELECT
                    u.id AS student_id,
                    u.group_id
                FROM users u
                JOIN groups g ON g.id = u.group_id
                WHERE u.role = 'student'
                  AND u.group_id IS NOT NULL
                  AND g.teacher_id = $1
                  AND NOT EXISTS (
                      SELECT 1
                      FROM student_groups sg
                      WHERE sg.student_id = u.id
                  )
            )
            SELECT
                u.id,
                u.username,
                u.first_name,
                u.telegram_id,
                u.lives,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', g.id,
                            'name', g.name,
                            'static_link', g.static_link
                        )
                        ORDER BY g.id
                    ) FILTER (WHERE g.id IS NOT NULL),
                    '[]'::json
                ) AS groups,

                COALESCE(
                    string_agg(g.name, ', ' ORDER BY g.name),
                    ''
                ) AS group_name

            FROM effective_memberships em
            JOIN users u ON u.id = em.student_id
            JOIN groups g ON g.id = em.group_id

            WHERE u.role = 'student'

            GROUP BY
                u.id,
                u.username,
                u.first_name,
                u.telegram_id,
                u.lives

            ORDER BY u.first_name, u.id
        `, [teacherId]);

        const students = studentsRes.rows;

        // Для каждого ученика показываем только ДЗ,
        // созданные этим преподавателем и относящиеся
        // к группам, в которых состоит ученик.
        for (const student of students) {
            const hwRes = await pool.query(`
                SELECT
                    h.id AS homework_id,
                    h.title,
                    s.status,
                    s.submission_link,
                    s.submission_file_url AS student_file
                FROM homeworks h

                LEFT JOIN submissions s
                    ON h.id = s.homework_id
                   AND s.student_id = $1

                WHERE h.created_by = $2
                  AND (
                      EXISTS (
                          SELECT 1
                          FROM student_groups sg
                          WHERE sg.student_id = $1
                            AND sg.group_id = h.group_id
                      )

                      OR

                      (
                          NOT EXISTS (
                              SELECT 1
                              FROM student_groups sg2
                              WHERE sg2.student_id = $1
                          )
                          AND h.group_id = (
                              SELECT group_id
                              FROM users
                              WHERE id = $1
                          )
                      )
                  )

                ORDER BY h.id DESC
            `, [student.id, teacherId]);

            student.homeworks = hwRes.rows;
        }

        res.json(students);

    } catch (err) {
        console.error('Ошибка при получении списка студентов:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ГРУППЫ ПРЕПОДАВАТЕЛЯ
app.get('/api/teacher/groups', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ только для преподавателя' });
    }

    try {
        const groupsRes = await pool.query(`
            SELECT id, name, static_link, teacher_id, created_at
            FROM groups
            WHERE teacher_id = $1
            ORDER BY name, id
        `, [req.user.id]);

        res.json(groupsRes.rows);
    } catch (err) {
        console.error('Ошибка при получении групп преподавателя:', err);
        res.status(500).json({ error: 'Ошибка при получении групп' });
    }
});

// ДОСТУПНЫЕ УЧЕНИКИ ДЛЯ ДОБАВЛЕНИЯ В ГРУППУ
app.get('/api/teacher/groups/:groupId/available-students', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            error: 'Доступ только для преподавателя'
        });
    }

    const groupId = Number(req.params.groupId);

    if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({
            error: 'Некорректная группа'
        });
    }

    try {
        // Проверяем, принадлежит ли группа преподавателю
        const groupAccess = await pool.query(
            'SELECT id, name FROM groups WHERE id = $1 AND teacher_id = $2',
            [groupId, req.user.id]
        );

        if (groupAccess.rowCount === 0) {
            return res.status(404).json({
                error: 'Группа не найдена или не принадлежит вам'
            });
        }

        // Все ученики, которые еще не состоят в этой группе
        const studentsRes = await pool.query(`
            SELECT
                u.id,
                u.first_name,
                u.username,
                u.telegram_id
            FROM users u
            WHERE u.role = 'student'
              AND NOT EXISTS (
                  SELECT 1
                  FROM student_groups sg
                  WHERE sg.student_id = u.id
                    AND sg.group_id = $1
              )
            ORDER BY u.first_name, u.id
        `, [groupId]);

        res.json(studentsRes.rows);

    } catch (err) {
        console.error('Ошибка получения доступных учеников:', err);

        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});


// ДОБАВЛЕНИЕ УЧЕНИКА В ГРУППУ
app.post('/api/teacher/groups/:groupId/students', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            error: 'Доступ только для преподавателя'
        });
    }

    const groupId = Number(req.params.groupId);
    const studentId = Number(req.body.studentId);

    if (
        !Number.isInteger(groupId) ||
        groupId <= 0 ||
        !Number.isInteger(studentId) ||
        studentId <= 0
    ) {
        return res.status(400).json({
            error: 'Некорректная группа или ученик'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Проверяем группу
        const groupRes = await client.query(`
            SELECT id, name
            FROM groups
            WHERE id = $1
              AND teacher_id = $2
        `, [groupId, req.user.id]);

        if (groupRes.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Группа не найдена или не принадлежит вам'
            });
        }

        // Проверяем ученика
        const studentRes = await client.query(`
            SELECT id, first_name
            FROM users
            WHERE id = $1
              AND role = 'student'
        `, [studentId]);

        if (studentRes.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Ученик не найден'
            });
        }

        // Основная новая связь
        await client.query(`
            INSERT INTO student_groups (
                student_id,
                group_id
            )
            VALUES ($1, $2)
            ON CONFLICT (student_id, group_id) DO NOTHING
        `, [studentId, groupId]);

        // Legacy-совместимость:
        // если у ученика вообще нет старой group_id,
        // заполняем её первой группой.
        await client.query(`
            UPDATE users
            SET group_id = $1
            WHERE id = $2
              AND group_id IS NULL
        `, [groupId, studentId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Ученик «${studentRes.rows[0].first_name}» добавлен в группу.`
        });

    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {}

        console.error('Ошибка добавления ученика в группу:', err);

        res.status(500).json({
            error: 'Ошибка сервера при добавлении ученика'
        });
    } finally {
        client.release();
    }
});


// УДАЛЕНИЕ УЧЕНИКА ИЗ ГРУППЫ
app.delete('/api/teacher/groups/:groupId/students/:studentId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            error: 'Доступ только для преподавателя'
        });
    }

    const groupId = Number(req.params.groupId);
    const studentId = Number(req.params.studentId);

    if (
        !Number.isInteger(groupId) ||
        groupId <= 0 ||
        !Number.isInteger(studentId) ||
        studentId <= 0
    ) {
        return res.status(400).json({
            error: 'Некорректная группа или ученик'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Проверяем, что группа принадлежит преподавателю
        const groupRes = await client.query(`
            SELECT id, name
            FROM groups
            WHERE id = $1
              AND teacher_id = $2
        `, [groupId, req.user.id]);

        if (groupRes.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Группа не найдена или не принадлежит вам'
            });
        }

        // Удаляем membership
        const deleteRes = await client.query(`
            DELETE FROM student_groups
            WHERE student_id = $1
              AND group_id = $2
            RETURNING student_id
        `, [studentId, groupId]);

        if (deleteRes.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Ученик не состоит в этой группе'
            });
        }

        // Legacy group_id:
        // если старое поле указывало на удаленную группу,
        // переключаем его на оставшуюся группу.
        await client.query(`
            UPDATE users u
            SET group_id = (
                SELECT sg.group_id
                FROM student_groups sg
                WHERE sg.student_id = u.id
                ORDER BY sg.joined_at ASC, sg.group_id ASC
                LIMIT 1
            )
            WHERE u.id = $1
              AND u.group_id = $2
        `, [studentId, groupId]);

        // Если групп больше нет, group_id станет NULL
        // благодаря отсутствию результата подзапроса.
        await client.query(`
            UPDATE users
            SET group_id = NULL
            WHERE id = $1
              AND NOT EXISTS (
                  SELECT 1
                  FROM student_groups sg
                  WHERE sg.student_id = $1
              )
              AND group_id = $2
        `, [studentId, groupId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Ученик удален из группы.'
        });

    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {}

        console.error('Ошибка удаления ученика из группы:', err);

        res.status(500).json({
            error: 'Ошибка сервера при удалении ученика'
        });
    } finally {
        client.release();
    }
});

// ИЗМЕНЕНИЕ ЖИЗНЕЙ
app.put('/api/students/:id/lives', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Нет доступа. Только преподаватель может изменять количество жизней.' });
    }

    const studentId = Number(req.params.id);
    const lives = Number(req.body.lives);
    if (!Number.isInteger(studentId) || studentId <= 0 || !Number.isInteger(lives) || lives < 0 || lives > 4) {
        return res.status(400).json({ error: 'Укажите корректного ученика и количество жизней от 0 до 4.' });
    }

    try {
        const accessRes = await pool.query(`
            SELECT 1
            FROM users u
            WHERE u.id = $1 AND u.role = 'student'
              AND (
                EXISTS (
                    SELECT 1 FROM student_groups sg
                    JOIN groups g ON g.id = sg.group_id
                    WHERE sg.student_id = u.id AND g.teacher_id = $2
                )
                OR EXISTS (
                    SELECT 1 FROM groups g
                    WHERE g.id = u.group_id AND g.teacher_id = $2
                )
              )
            LIMIT 1
        `, [studentId, req.user.id]);
        if (accessRes.rowCount === 0) {
            return res.status(404).json({ error: 'Ученик не найден в ваших группах.' });
        }

        const updateRes = await pool.query(
            "UPDATE users SET lives = $1 WHERE id = $2 AND role = 'student' RETURNING telegram_id, first_name",
            [lives, studentId]
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
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Доступ только для преподавателя.' });
    const groupId = Number(req.body.groupId);
    const link = typeof req.body.link === 'string' ? req.body.link.trim() : '';
    if (!Number.isInteger(groupId) || groupId <= 0) return res.status(400).json({ error: 'Некорректная группа.' });
    if (link) {
        try {
            const parsed = new URL(link);
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
        } catch {
            return res.status(400).json({ error: 'Введите корректную ссылку, начинающуюся с https:// или http://.' });
        }
    }
    try {
        const result = await pool.query(
            'UPDATE groups SET static_link = $1 WHERE id = $2 AND teacher_id = $3',
            [link || null, groupId, req.user.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Группа не найдена или не принадлежит вам.' });
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

    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Доступ только для преподавателя.' });
    const parsedGroupId = Number(groupId);
    if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0 || !String(title || '').trim()) {
        return res.status(400).json({ error: 'Укажите группу и название задания.' });
    }

    try {
        const ownedGroup = await pool.query(
            'SELECT 1 FROM groups WHERE id = $1 AND teacher_id = $2',
            [parsedGroupId, teacherId]
        );
        if (ownedGroup.rowCount === 0) return res.status(404).json({ error: 'Группа не найдена или не принадлежит вам.' });

        await pool.query(
            'INSERT INTO homeworks (created_by, group_id, title, description, file_url, deadline) VALUES ($1, $2, $3, $4, $5, $6)',
            [teacherId, parsedGroupId, String(title).trim(), description, fileUrl, deadline || null]
        );

        const studentsRes = await pool.query(`
            SELECT DISTINCT u.id, u.telegram_id
            FROM users u
            WHERE u.role = 'student'
              AND (
                u.group_id = $1
                OR EXISTS (
                    SELECT 1 FROM student_groups sg
                    WHERE sg.student_id = u.id AND sg.group_id = $1
                )
              )
        `, [parsedGroupId]);
        
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

// ГРУППЫ УЧЕНИКА
app.get('/api/student/groups', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для учеников' });
    }

    try {
        const result = await pool.query(`
            SELECT
                g.id,
                g.name,
                g.static_link,
                g.teacher_id
            FROM student_groups sg
            JOIN groups g ON g.id = sg.group_id
            WHERE sg.student_id = $1

            UNION

            SELECT
                g.id,
                g.name,
                g.static_link,
                g.teacher_id
            FROM users u
            JOIN groups g ON g.id = u.group_id
            WHERE u.id = $1
              AND u.group_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM student_groups sg
                  WHERE sg.student_id = u.id
              )

            ORDER BY name
        `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении групп ученика:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// СПИСОК ЗАДАЧ УЧЕНИКА ДЛЯ САЙТА
app.get('/api/student/homeworks', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для учеников' });
    }

    const studentId = req.user.id;

    try {
        const hwRes = await pool.query(`
            SELECT
                h.id AS homework_id,
                h.title,
                h.description,
                h.file_url AS teacher_file,
                h.deadline,
                h.group_id,
                g.name AS group_name,

                s.status,
                s.submission_link,
                s.submission_file_url AS student_file,
                s.feedback

            FROM homeworks h

            JOIN groups g
              ON g.id = h.group_id

            LEFT JOIN submissions s
              ON h.id = s.homework_id
             AND s.student_id = $1

            WHERE
                EXISTS (
                    SELECT 1
                    FROM student_groups sg
                    WHERE sg.student_id = $1
                      AND sg.group_id = h.group_id
                )

                OR

                (
                    NOT EXISTS (
                        SELECT 1
                        FROM student_groups sg2
                        WHERE sg2.student_id = $1
                    )
                    AND h.group_id = (
                        SELECT group_id
                        FROM users
                        WHERE id = $1
                    )
                )

            ORDER BY h.id DESC
        `, [studentId]);

        res.json(hwRes.rows);

    } catch (err) {
        console.error('Ошибка при получении заданий студента:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// СДАЧА РЕШЕНИЯ УЧЕНИКОМ
app.post('/api/submissions/submit', authenticateToken, upload.single('file'), async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для учеников' });
    }

    const homeworkId = Number(req.body.homeworkId);
    const link = typeof req.body.link === 'string' ? req.body.link.trim() : '';
    const studentId = req.user.id;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!Number.isInteger(homeworkId) || homeworkId <= 0) {
        return res.status(400).json({ error: 'Некорректное домашнее задание.' });
    }

    if (!link && !fileUrl) {
        return res.status(400).json({ error: 'Добавьте ссылку или файл.' });
    }

            const homeworkCheck = await pool.query(`
            SELECT h.id
            FROM homeworks h
            WHERE h.id = $1
              AND (
                  EXISTS (
                      SELECT 1
                      FROM student_groups sg
                      WHERE sg.student_id = $2
                        AND sg.group_id = h.group_id
                  )

                  OR

                  (
                      NOT EXISTS (
                          SELECT 1
                          FROM student_groups sg2
                          WHERE sg2.student_id = $2
                      )
                      AND h.group_id = (
                          SELECT group_id
                          FROM users
                          WHERE id = $2
                      )
                  )
              )
            LIMIT 1
        `, [homeworkId, studentId]);

        if (homeworkCheck.rowCount === 0) {
            return res.status(403).json({
                error: 'У вас нет доступа к этому домашнему заданию.'
            });
        }

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
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const studentId = Number(req.body.studentId);
    const homeworkId = Number(req.body.homeworkId);
    const status = req.body.status;
    const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';

    if (!Number.isInteger(studentId) || studentId <= 0 || !Number.isInteger(homeworkId) || homeworkId <= 0) {
        return res.status(400).json({ error: 'Некорректный ученик или домашнее задание.' });
    }

    if (!['checked', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Некорректный статус проверки.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const accessRes = await client.query(`
            SELECT
                s.status AS old_status,
                u.telegram_id,
                u.first_name,
                u.lives
            FROM submissions s
            JOIN homeworks h
              ON h.id = s.homework_id
            JOIN groups g
              ON g.id = h.group_id
            JOIN users u
              ON u.id = s.student_id
            WHERE s.homework_id = $1
              AND s.student_id = $2
              AND h.created_by = $3
              AND (
                  EXISTS (
                      SELECT 1
                      FROM student_groups sg
                      WHERE sg.student_id = $2
                        AND sg.group_id = h.group_id
                  )
                  OR (
                      NOT EXISTS (
                          SELECT 1
                          FROM student_groups sg2
                          WHERE sg2.student_id = $2
                      )
                      AND u.group_id = h.group_id
                  )
              )
            FOR UPDATE
            LIMIT 1
        `, [homeworkId, studentId, req.user.id]);

        if (accessRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Вы не можете проверять эту работу.' });
        }

        const submission = accessRes.rows[0];
        const previousStatus = submission.old_status;

        await client.query(`
            UPDATE submissions
            SET status = $1,
                feedback = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE homework_id = $3
              AND student_id = $4
        `, [status, feedback || null, homeworkId, studentId]);

        let livesRemaining = Number(submission.lives ?? 4);
        const shouldDeductLife = status === 'rejected' && previousStatus !== 'rejected';

        if (shouldDeductLife) {
            const lifeRes = await client.query(`
                UPDATE users
                SET lives = GREATEST(COALESCE(lives, 4) - 1, 0)
                WHERE id = $1
                RETURNING lives
            `, [studentId]);

            livesRemaining = Number(lifeRes.rows[0]?.lives ?? 0);
        }

        await client.query('COMMIT');

        if (submission.telegram_id) {
            let messageText = status === 'checked'
                ? '🎉 Ваше домашнее задание успешно проверено и принято! ✅'
                : shouldDeductLife
                    ? `⚠️ Ваше домашнее задание было отклонено. ❌\nУ вас списана 1 жизнь. Осталось жизней: ❤️ ${livesRemaining}`
                    : `⚠️ Ваша работа по-прежнему отклонена. ❌\nОсталось жизней: ❤️ ${livesRemaining}`;

            if (feedback) {
                messageText += `\n\n💬 Комментарий преподавателя:\n${feedback}`;
            }

            try {
                await bot.sendMessage(submission.telegram_id, messageText);
            } catch (botErr) {
                console.error('Не удалось отправить сообщение в Telegram:', botErr.message);
            }
        }

        res.json({
            success: true,
            status,
            lives: livesRemaining,
            lifeDeducted: shouldDeductLife
        });
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {}

        console.error('Ошибка при проверке домашней работы:', err);
        res.status(500).json({ error: 'Ошибка сервера при проверке домашки' });
    } finally {
        client.release();
    }
});

if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });
}

module.exports = { app, pool };