import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useParams} from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

// Глобальный перехватчик токенов JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('qudema_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ЛЕНДИНГ
function LandingPage({ user }) {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="landing-container">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '80px' }}
      >
        <h2 style={{ margin: 0, fontSize: '40px', letterSpacing: '6px', fontWeight: '1000' }} className="text-gradient">
          QUDEMA
        </h2>
        {user ? (
          <Link to="/dashboard"><button className="btn btn-success" style={{ padding: '10px 25px', fontSize: '15px' }}>Кабинет: {user.first_name} 🎓</button></Link>
        ) : (
          <Link to="/login"><button className="btn btn-primary">Личный кабинет 🔑</button></Link>
        )}
      </motion.header>

      <motion.section 
        variants={fadeInUp} initial="hidden" animate="visible"
        style={{ marginBottom: '100px', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '80px', marginBottom: '20px', lineHeight: '1.2', fontWeight: '800', color: '#fff' }}>
          Образовательный центр <br/><span className="text-gradient">нового поколения</span>
        </h1>
        <p style={{ fontSize: '20px', color: '#8b949e', maxWidth: '750px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Лицензированные программы обучения для школьников и взрослых. Профессиональный подход, сильные наставники и прозрачный контроль успеваемости.
        </p>
        
        {user ? (
          <Link to="/dashboard"><button className="btn btn-success">Перейти к занятиям 🚀</button></Link>
        ) : (
          <Link to="/login"><button className="btn btn-success">Войти в систему 🚀</button></Link>
        )}
      </motion.section>

      <motion.section 
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
        style={{ marginBottom: '100px' }}
      >
        <h2 style={{ fontSize: '32px', marginBottom: '40px', color: '#fff', textAlign: 'center' }}>Наши программы обучения</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          
          <div className="glass-card">
            <span className="badge badge-blue">ШКОЛЬНИКАМ 7-11 КЛАССОВ</span>
            <h3 style={{ marginTop: '20px', color: '#fff', fontSize: '22px' }}>Подготовка к ОГЭ / ЕГЭ и IT-старт</h3>
            <p style={{ color: '#8b949e', fontSize: '16px', lineHeight: '1.5' }}>
              Гарантированное достижение результата. Готовим к экзаменам по информатике, математике и физике. Обучаем веб-разработке и созданию игр.
            </p>
          </div>

          <div className="glass-card">
            <span className="badge badge-yellow">ВЗРОСЛЫМ (18+)</span>
            <h3 style={{ marginTop: '20px', color: '#fff', fontSize: '22px' }}>Профессиональная переподготовка</h3>
            <p style={{ color: '#8b949e', fontSize: '16px', lineHeight: '1.5' }}>
              Курсы дополнительного профессионального образования и повышения квалификации. Освоение новой профессии с нуля с выдачей официального диплома.
            </p>
          </div>

        </div>
      </motion.section>

      <motion.section 
        variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
        className="glass-card" 
        style={{ marginBottom: '80px', borderColor: 'rgba(35, 134, 54, 0.4)', background: 'rgba(35, 134, 54, 0.05)' }}
      >
        <h2 style={{ color: '#3fb950', fontSize: '30px', marginTop: 0, marginBottom: '20px' }}>
          👨‍👩‍👦 Информация для родителей: Гарантия результата
        </h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#c9d1d9' }}>
          Ключевой фактор успеха — регулярность. Мы внедрили <strong>Систему жизней ❤️</strong>, которая позволяет родителям видеть вовлеченность ребенка без постоянных расспросов.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '30px' }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#d29922', fontSize: '18px' }}>❤️ 4 Жизни на полугодие</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#8b949e', lineHeight: '1.5' }}>Списываются за систематические прогулы или несданные вовремя ДЗ.</p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#58a6ff', fontSize: '18px' }}>📱 Telegram-контроль</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#8b949e', lineHeight: '1.5' }}>Автоматические уведомления при изменении жизней или сдаче ДЗ.</p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#3fb950', fontSize: '18px' }}>🎓 Гарантия договора</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#8b949e', lineHeight: '1.5' }}>Сохранение жизней = юридическая гарантия сдачи экзамена.</p>
          </div>
        </div>
      </motion.section>

      <motion.footer 
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }} viewport={{ once: true }}
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '30px 0', color: '#8b949e', textAlign: 'center' }}
      >
        <p style={{ margin: '0 0 10px 0' }}>📍 Лицензированный образовательный центр QUDEMA</p>
        <p style={{ margin: '0 0 10px 0' }}>📞 Техническая поддержка: <strong style={{ color: '#fff' }}>info@qudema.com</strong></p>
        <p style={{ margin: 0 }}>© 2026 QUDEMA. Все права защищены.</p>
      </motion.footer>
    </div>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    try {
      const response = await axios.post(
        '/api/forgot-password',
        { email }
      );

      setMessage(
        response.data.message ||
        'Если аккаунт существует, письмо отправлено.'
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Ошибка отправки запроса'
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        maxWidth: '450px',
        margin: '60px auto',
        padding: '20px'
      }}
    >
      <div className="glass-card">
        <h1 style={{ color: '#fff' }}>
          Восстановление пароля
        </h1>

        <p
          style={{
            color: '#8b949e',
            lineHeight: '1.5'
          }}
        >
          Введите Email аккаунта. Если он существует,
          мы отправим ссылку для восстановления.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '20px'
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Email"
            className="premium-input"
            required
          />

          <button
            type="submit"
            className="btn btn-primary"
          >
            Отправить ссылку
          </button>
        </form>

        {message && (
          <p
            style={{
              color: '#3fb950',
              marginTop: '15px'
            }}
          >
            {message}
          </p>
        )}

        {error && (
          <p
            style={{
              color: '#ff7b72',
              marginTop: '15px'
            }}
          >
            {error}
          </p>
        )}

        <Link
          to="/login"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            color: '#58a6ff'
          }}
        >
          ← Вернуться ко входу
        </Link>
      </div>
    </motion.div>
  );
}


function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (password.length < 6) {
      setError(
        'Пароль должен содержать минимум 6 символов.'
      );
      return;
    }

    if (password !== repeatPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      const response = await axios.post(
        '/api/reset-password',
        {
          token,
          newPassword: password
        }
      );

      setMessage(
        response.data.message ||
        'Пароль успешно изменён.'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1200);

    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Не удалось изменить пароль.'
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        maxWidth: '450px',
        margin: '60px auto',
        padding: '20px'
      }}
    >
      <div className="glass-card">
        <h1 style={{ color: '#fff' }}>
          Новый пароль
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '20px'
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Новый пароль"
            className="premium-input"
            required
          />

          <input
            type="password"
            value={repeatPassword}
            onChange={(e) =>
              setRepeatPassword(e.target.value)
            }
            placeholder="Повторите пароль"
            className="premium-input"
            required
          />

          <button
            type="submit"
            className="btn btn-success"
          >
            Изменить пароль
          </button>
        </form>

        {message && (
          <p
            style={{
              color: '#3fb950',
              marginTop: '15px'
            }}
          >
            {message}
          </p>
        )}

        {error && (
          <p
            style={{
              color: '#ff7b72',
              marginTop: '15px'
            }}
          >
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// АВТОРИЗАЦИЯ
function LoginPage({ user, setUser }) {
  const [authMode, setAuthMode] = useState('telegram'); 
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState('student'); 
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleAuthSuccess = (data) => {
    setUser(data.user);
    localStorage.setItem('qudema_user', JSON.stringify(data.user));
    localStorage.setItem('qudema_jwt', data.token);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (authMode === 'telegram') {
        const res = await axios.post('/api/login', { token });
        if (res.data.success) handleAuthSuccess(res.data);
      } 
      else if (authMode === 'email_login') {
        const res = await axios.post('/api/login/email', { email, password });
        if (res.data.success) handleAuthSuccess(res.data);
      } 
      else if (authMode === 'email_register') {
        const res = await axios.post('/api/register', { 
          email, password, first_name: firstName, role 
        });
        if (res.data.success) handleAuthSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Произошла ошибка');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '450px', margin: '60px auto', padding: '20px', textAlign: 'center' }}
    >
      <div className="glass-card">
        <h1 style={{ color: '#fff', marginBottom: '30px' }}><span className="text-gradient">QUDEMA</span></h1>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <button 
            className={`btn ${authMode === 'telegram' ? 'btn-primary' : ''}`}
            onClick={() => { setAuthMode('telegram'); setError(''); }}
            style={{ flex: 1, padding: '8px', fontSize: '12px', background: authMode !== 'telegram' ? 'rgba(255,255,255,0.1)' : '' }}
          >
            Бот (Код)
          </button>
          <button 
            className={`btn ${authMode === 'email_login' ? 'btn-primary' : ''}`}
            onClick={() => { setAuthMode('email_login'); setError(''); }}
            style={{ flex: 1, padding: '8px', fontSize: '12px', background: authMode !== 'email_login' ? 'rgba(255,255,255,0.1)' : '' }}
          >
            Вход Email
          </button>
          <button 
            className={`btn ${authMode === 'email_register' ? 'btn-primary' : ''}`}
            onClick={() => { setAuthMode('email_register'); setError(''); }}
            style={{ flex: 1, padding: '8px', fontSize: '12px', background: authMode !== 'email_register' ? 'rgba(255,255,255,0.1)' : '' }}
          >
            Создать аккаунт
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {authMode === 'telegram' && (
            <>
              <p style={{ color: '#8b949e', margin: 0, fontSize: '14px' }}>Получите код в telegram-боте @qudemabot</p>
              <input 
                type="text" placeholder="Введите 6-значный код" value={token}
                onChange={(e) => setToken(e.target.value)}
                className="premium-input" style={{ fontSize: '18px', textAlign: 'center', letterSpacing: '3px' }}
                maxLength={6} required
              />
            </>
          )}

          {(authMode === 'email_login' || authMode === 'email_register') && (
            <>
              {authMode === 'email_register' && (
                <>
                  <input 
                    type="text" placeholder="Ваше Имя" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="premium-input" required
                  />
                  <select 
                    value={role} onChange={(e) => setRole(e.target.value)} 
                    className="premium-input" required style={{ cursor: 'pointer' }}
                  >
                    <option value="student">👨‍🎓 Я ученик</option>
                    <option value="parent">👨‍👩‍👧 Я родитель</option>
                    <option value="adult">💼 Я взрослый (повышение квалификации)</option>
                  </select>
                </>
              )}
              <input 
                type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input" required
              />
              <input 
                type="password" placeholder="Пароль" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input" required
              />
            </>
          )}

          <button type="submit" className="btn btn-success" style={{ padding: '12px' }}>
            {authMode === 'telegram' ? 'Войти по коду' : authMode === 'email_login' ? 'Войти по Email' : 'Зарегистрироваться'}
          </button>
        </form>

        {error && <p style={{ color: '#ff7b72', marginTop: '15px', fontWeight: 'bold' }}>{error}</p>}
        
        <p style={{ marginTop: '25px' }}>
          <Link to="/" style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 'bold' }}>← Вернуться на главную</Link>
        </p>
      </div>

      {authMode === 'email_login' && (
        <div style={{ marginTop: '15px' }}>
          <Link
            to="/forgot-password"
            style={{
              color: '#58a6ff',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            Забыли пароль?
          </Link>
        </div>
      )}

    </motion.div>
  );
}

// ПАНЕЛЬ РОДИТЕЛЯ
const ParentDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const response = await axios.get('/api/parent/dashboard');
        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Ошибка загрузки данных'
        );
      }
    };

    fetchParentData();
  }, []);

  if (error) {
    return (
      <div
        style={{
          color: '#ff7b72',
          textAlign: 'center',
          marginTop: '20px'
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#fff'
        }}
      >
        Загрузка данных...
      </div>
    );
  }

  const {
    child,
    groups = [],
    homeworks = [],
    attendance = []
  } = data;

  const getAttendanceText = (status) => {
    if (status === 'confirmed') return '✅ Был';
    if (status === 'absent') return '❌ Отсутствовал';
    if (status === 'pending') return '⏳ Не ответил';
    return status || 'Неизвестно';
  };

  const getHomeworkStatus = (status) => {
    if (status === 'checked') return '✅ Принято';
    if (status === 'rejected') return '❌ Отклонено';
    if (status === 'submitted') return '⏳ На проверке';
    return 'Не сдано';
  };

  return (
    <div className="student-dashboard">

      {/* РЕБЕНОК */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
      >
        <h2 style={{ marginTop: 0 }}>
          📊 {child.first_name}
        </h2>

        <p style={{ color: '#8b949e', marginBottom: '20px' }}>
          Родительский кабинет
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              minWidth: '200px'
            }}
          >
            <p style={{ margin: '0 0 10px 0' }}>
              Остаток жизней
            </p>

            <div
              style={{
                fontSize: '24px',
                letterSpacing: '2px'
              }}
            >
              {'❤️'.repeat(
                Math.max(
                  0,
                  Math.min(4, Number(child.lives) || 0)
                )
              )}

              {'🤍'.repeat(
                4 -
                Math.max(
                  0,
                  Math.min(4, Number(child.lives) || 0)
                )
              )}
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              minWidth: '200px'
            }}
          >
            <p style={{ margin: '0 0 10px 0' }}>
              Групп
            </p>

            <strong
              style={{
                fontSize: '24px',
                color: '#58a6ff'
              }}
            >
              {groups.length}
            </strong>
          </div>
        </div>
      </motion.div>

      {/* ГРУППЫ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel"
        style={{ marginTop: '20px' }}
      >
        <h3 style={{ marginTop: 0 }}>
          🎓 Группы ребенка
        </h3>

        {groups.length === 0 ? (
          <p style={{ color: '#8b949e' }}>
            Ребенок пока не состоит ни в одной группе.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '15px'
            }}
          >
            {groups.map(group => (
              <div
                key={group.id}
                className="glass-panel"
                style={{
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    color: '#58a6ff'
                  }}
                >
                  {group.name}
                </h4>

                {group.teacher_name && (
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      color: '#8b949e',
                      fontSize: '13px'
                    }}
                  >
                    Преподаватель: {group.teacher_name}
                  </p>
                )}

                {group.static_link ? (
                  <a
                    href={group.static_link}
                    target="_blank"
                    rel="noreferrer"
                    className="premium-button"
                    style={{
                      display: 'inline-block',
                      textDecoration: 'none'
                    }}
                  >
                    🎥 Перейти на занятие
                  </a>
                ) : (
                  <span
                    style={{
                      color: '#8b949e',
                      fontSize: '13px'
                    }}
                  >
                    Ссылка на занятие не назначена
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ДОМАШНИЕ ЗАДАНИЯ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel"
        style={{ marginTop: '20px' }}
      >
        <h3 style={{ marginTop: 0 }}>
          📝 Домашние задания
        </h3>

        {homeworks.length === 0 ? (
          <p style={{ color: '#8b949e' }}>
            Актуальных заданий пока нет.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {homeworks.map(hw => (
              <div
                key={hw.id}
                className="homework-card glass-panel"
                style={{
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '15px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: '0 0 7px 0',
                        color: '#58a6ff'
                      }}
                    >
                      {hw.title}
                    </h4>

                    <p
                      style={{
                        margin: '0 0 7px 0',
                        color: '#d29922',
                        fontSize: '13px'
                      }}
                    >
                      📚 {hw.group_name}
                    </p>
                  </div>

                  <strong
                    style={{
                      color:
                        hw.status === 'checked'
                          ? '#3fb950'
                          : hw.status === 'rejected'
                          ? '#ff7b72'
                          : hw.status === 'submitted'
                          ? '#d29922'
                          : '#8b949e',
                      fontSize: '13px'
                    }}
                  >
                    {getHomeworkStatus(hw.status)}
                  </strong>
                </div>

                {hw.deadline && (
                  <p
                    style={{
                      margin: '8px 0',
                      color: '#8b949e',
                      fontSize: '13px'
                    }}
                  >
                    ⏰ Дедлайн:{' '}
                    {new Date(hw.deadline).toLocaleString('ru-RU')}
                  </p>
                )}

                {hw.feedback && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '8px'
                    }}
                  >
                    <div
                      style={{
                        color: '#8b949e',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}
                    >
                      Комментарий преподавателя
                    </div>

                    <div style={{ color: '#fff' }}>
                      {hw.feedback}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ПОСЕЩАЕМОСТЬ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel"
        style={{ marginTop: '20px' }}
      >
        <h3 style={{ marginTop: 0 }}>
          📅 Посещаемость
        </h3>

        {attendance.length === 0 ? (
          <p style={{ color: '#8b949e' }}>
            Истории посещаемости пока нет.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            {attendance.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border:
                    '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <strong style={{ color: '#fff' }}>
                    {item.group_name}
                  </strong>

                  <span
                    style={{
                      color:
                        item.status === 'confirmed'
                          ? '#3fb950'
                          : item.status === 'absent'
                          ? '#ff7b72'
                          : '#d29922'
                    }}
                  >
                    {getAttendanceText(item.status)}
                  </span>
                </div>

                <p
                  style={{
                    margin: '6px 0 0 0',
                    color: '#8b949e',
                    fontSize: '12px'
                  }}
                >
                  {item.session_created_at
                    ? new Date(
                        item.session_created_at
                      ).toLocaleString('ru-RU')
                    : 'Дата неизвестна'}
                </p>

                {item.reason && (
                  <p
                    style={{
                      margin: '5px 0 0 0',
                      color: '#c9d1d9',
                      fontSize: '13px'
                    }}
                  >
                    Причина: {item.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ГЛАВНЫЙ РАБОЧИЙ СТОЛ (Ученик / Учитель / Родитель)
function DashboardPage({ user, setUser }) {
  const navigate = useNavigate();
  const [activeAttendance, setActiveAttendance] = useState([]);
  const [absentReason, setAbsentReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(null);
  const [attMessage, setAttMessage] = useState('');
  const [students, setStudents] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [linkMessage, setLinkMessage] = useState('');
  const [studentHomeworks, setStudentHomeworks] = useState([]);
  const [activeSubmissions, setActiveSubmissions] = useState({});
  const [groups, setGroups] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [selectedGroupLink, setSelectedGroupLink] = useState('');
  const [selectedGroupHw, setSelectedGroupHw] = useState('');
  const [selectedTeacherGroup, setSelectedTeacherGroup] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [groupActionMessage, setGroupActionMessage] = useState('');
  const [teacherAttendance, setTeacherAttendance] = useState(null);

  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDeadline, setHwDeadline] = useState('');
  const [hwTeacherFile, setHwTeacherFile] = useState(null);
  const [createHwMessage, setCreateHwMessage] = useState('');

  const [tgCode, setTgCode] = useState('');
  const [linkTgMessage, setLinkTgMessage] = useState('');

  const [reviewFeedback, setReviewFeedback] = useState({});

  const getReviewFeedbackKey = (studentId, homeworkId) =>
    `${studentId}:${homeworkId}`;

  const handleFeedbackChange = (studentId, homeworkId, value) => {
    const key = getReviewFeedbackKey(studentId, homeworkId);
    setReviewFeedback(prev => ({ ...prev, [key]: value }));
  };

  const handleLinkTelegram = async () => {
    try {
        const token = localStorage.getItem('qudema_jwt');
        const res = await axios.post('/api/link-telegram', 
            { code: tgCode },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setLinkTgMessage('✅ ' + res.data.message);
        setTgCode('');
        
        const updatedUser = { ...user, telegram_id: 'linked' };
        setUser(updatedUser);
        localStorage.setItem('qudema_user', JSON.stringify(updatedUser));
    } catch (err) {
        setLinkTgMessage('❌ ' + (err.response?.data?.error || 'Ошибка привязки'));
    }
  };

  const handleStartAttendance = async () => {
    setAttMessage('');

    if (!selectedTeacherGroup) {
      setAttMessage('❌ Сначала выберите группу');
      toast.error('Сначала выберите группу');
      return;
    }

    try {
      const res = await axios.post('/api/teacher/start-attendance', {
        groupId: Number(selectedTeacherGroup)
      });

      setAttMessage('🚀 ' + res.data.message);
      setTeacherAttendance(null);

      await fetchTeacherAttendance(
        res.data.sessionId
      );

      toast.success('Опрос запущен!');
    } catch (err) {
      setAttMessage(
        '❌ ' +
        (err.response?.data?.error || 'Ошибка запуска')
      );
    }
  };

  const handleCloseAttendance = async () => {
    if (!teacherAttendance?.session?.id) return;

    try {
      const response = await axios.post(
        `/api/teacher/attendance/${teacherAttendance.session.id}/close`
      );

      toast.success('Перекличка закрыта');

      await fetchTeacherAttendance(
        teacherAttendance.session.id
      );

      setAttMessage(
        '✅ ' + response.data.message
      );

    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        'Ошибка закрытия переклички'
      );
    }
  };

  const fetchTeacherAttendance = async (sessionId) => {
    if (!sessionId) return;

    try {
      const response = await axios.get(
        `/api/teacher/attendance/${sessionId}`
      );

      setTeacherAttendance(response.data);
    } catch (err) {
      console.error(
        'Ошибка получения результатов переклички:',
        err
      );
    }
  };

  const handleStudentAttendance = async (sessionId, status, reason = '') => {
      try {
          await axios.post('/api/student/submit-attendance', {
              sessionId,
              status,
              reason
          });

          toast.success('Ваш ответ сохранен!');

          setActiveAttendance(prev =>
              prev.filter(attendance => attendance.session_id !== sessionId)
          );

      } catch (err) {
          toast.error(
              err.response?.data?.error || 'Ошибка сохранения ответа'
          );
      }
  };

  const currentSavedLink =
    groups.find(group => Number(group.id) === Number(selectedGroupLink))?.static_link || null;

  // Загрузка домашних заданий ученика (по JWT)
  useEffect(() => {
      if (!user || user.role !== 'student') return;

      const loadStudentData = async () => {
          try {
              const [groupsRes, homeworksRes, attendanceRes] = await Promise.all([
                  axios.get('/api/student/groups'),
                  axios.get('/api/student/homeworks'),
                  axios.get('/api/student/attendance-status/all')
              ]);

              setStudentGroups(groupsRes.data);
              setStudentHomeworks(homeworksRes.data);
              setActiveAttendance(attendanceRes.data);
          } catch (err) {
              console.error('Ошибка загрузки данных ученика:', err);
          }
      };

      loadStudentData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchStudents = useCallback(async () => {
    if (!user || user.role !== 'teacher') return;
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data);
    } catch (err) {
      console.error('Ошибка при получении списка студентов:', err);
    }
  }, [user]);

  const fetchAvailableStudents = useCallback(async (groupId) => {
    if (!groupId || !user || user.role !== 'teacher') return;

    try {
      const response = await axios.get(
        `/api/teacher/groups/${groupId}/available-students`
      );

      setAvailableStudents(response.data || []);

      if (response.data?.length > 0) {
        setSelectedStudentToAdd(response.data[0].id);
      } else {
        setSelectedStudentToAdd('');
      }
    } catch (err) {
      console.error(
        'Ошибка при получении доступных учеников:',
        err
      );

      setAvailableStudents([]);
      setSelectedStudentToAdd('');
    }
  }, [user]);

  const fetchGroups = useCallback(async () => {
    if (!user || user.role !== 'teacher') return;

    try {
      const response = await axios.get('/api/teacher/groups');
      const loadedGroups = response.data || [];

      setGroups(loadedGroups);

      if (loadedGroups.length > 0) {
        const firstGroupId = loadedGroups[0].id;

        setSelectedGroupLink(firstGroupId);
        setSelectedGroupHw(firstGroupId);
        setSelectedTeacherGroup(firstGroupId);
      }
    } catch (err) {
      console.error('Ошибка при получении групп:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, [fetchStudents, fetchGroups]);

  useEffect(() => {
    if (
      user &&
      user.role === 'teacher' &&
      selectedTeacherGroup
    ) {
      fetchAvailableStudents(selectedTeacherGroup);
    }
  }, [selectedTeacherGroup, user, fetchAvailableStudents]);

  const handleAddStudentToGroup = async () => {
    if (!selectedTeacherGroup) {
      toast.error('Сначала выберите группу');
      return;
    }

    if (!selectedStudentToAdd) {
      toast.error('Выберите ученика');
      return;
    }

    try {
      const response = await axios.post(
        `/api/teacher/groups/${selectedTeacherGroup}/students`,
        {
          studentId: Number(selectedStudentToAdd)
        }
      );

      setGroupActionMessage('✅ ' + response.data.message);
      toast.success('Ученик добавлен в группу');

      await fetchStudents();
      await fetchAvailableStudents(selectedTeacherGroup);

    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Ошибка добавления ученика';

      setGroupActionMessage('❌ ' + message);
      toast.error(message);
    }
  };

  const handleRemoveStudentFromGroup = async (studentId) => {
    if (!selectedTeacherGroup) return;

    const student = students.find(
      s => Number(s.id) === Number(studentId)
    );

    const confirmed = window.confirm(
      `Удалить ${student?.first_name || 'ученика'} из этой группы?`
    );

    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `/api/teacher/groups/${selectedTeacherGroup}/students/${studentId}`
      );

      setGroupActionMessage('✅ ' + response.data.message);
      toast.success('Ученик удалён из группы');

      await fetchStudents();
      await fetchAvailableStudents(selectedTeacherGroup);

    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Ошибка удаления ученика';

      setGroupActionMessage('❌ ' + message);
      toast.error(message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qudema_user');
    localStorage.removeItem('qudema_jwt'); 
    navigate('/'); 
  };

  const handleUpdateLives = async (studentId, currentLives, operation) => {
    let newLives = currentLives;
    if (operation === 'increment' && currentLives < 4) newLives += 1;
    if (operation === 'decrement' && currentLives > 0) newLives -= 1;

    try {
      const response = await axios.put(`/api/students/${studentId}/lives`, { lives: newLives });

      if (response.status === 200) {
        setStudents(prev =>
          prev.map(s => (s.id === studentId ? { ...s, lives: newLives } : s))
        );
        toast.success('Количество жизней обновлено!');
      } else {
        alert('Не удалось обновить жизни');
      }
    } catch (err) {
      console.error('Ошибка при изменении жизней:', err);
    }
  };

  const handleSubmissionChange = (homeworkId, field, value) => {
    setActiveSubmissions(prev => ({
      ...prev,
      [homeworkId]: {
        ...(prev[homeworkId] || {}),
        [field]: value
      }
    }));
  };

  // Сдача ДЗ учеником
  const handleSubmitSpecificHomework = async (e, homeworkId) => {
    e.preventDefault();
    const submissionData = activeSubmissions[homeworkId] || {};
    
    if (!submissionData.link && !submissionData.file) {
        toast.error('Прикрепите файл или вставьте ссылку!');
        return;
    }

    const formData = new FormData();
    formData.append('homeworkId', homeworkId);
    if (submissionData.link) formData.append('link', submissionData.link);
    if (submissionData.file) formData.append('file', submissionData.file);

    try {
      await axios.post('/api/submissions/submit', formData);
      toast.success('Домашнее задание отправлено!');
      
      const res = await axios.get('/api/student/homeworks');
      setStudentHomeworks(res.data);
    } catch {
      toast.error('Ошибка при отправке задания');
    }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    setLinkMessage('');

    // ✅ Добавляем проверку на пустую группу
    if (!selectedGroupLink) {
      setLinkMessage('❌ Ошибка: Группа не выбрана!');
      toast.error('Сначала создайте или выберите группу');
      return;
    }

    try {
      const res = await axios.post('/api/update-class-link', {
        groupId: selectedGroupLink,
        link: newLink
      });
      setLinkMessage('✅ ' + res.data.message);
      setGroups(prev =>
        prev.map(group =>
          Number(group.id) === Number(selectedGroupLink)
            ? { ...group, static_link: newLink }
            : group
        )
      );
      toast.success('Ссылка успешно обновлена!');
    } catch {
      setLinkMessage('❌ Ошибка при обновлении ссылки');
    }
  };

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    setCreateHwMessage('');

    const formData = new FormData();
    formData.append('groupId', selectedGroupHw);
    formData.append('title', hwTitle);
    formData.append('description', hwDesc);
    formData.append('deadline', hwDeadline);
    if (hwTeacherFile) formData.append('file', hwTeacherFile);

    try {
        await axios.post('/api/homeworks/create', formData);
        setCreateHwMessage('✅ Задание успешно создано и отправлено ученикам!');

        setHwTitle('');
        setHwDesc('');
        setHwDeadline('');
        setHwTeacherFile(null);
        
        fetchStudents(); 
    } catch {
        setCreateHwMessage('❌ Ошибка при создании задания');
    }
  };

  // Проверка работы преподавателем (используется studentId вместо telegramId)
  const handleReviewHomework = async (studentId, homeworkId, status) => {
    const feedbackKey = getReviewFeedbackKey(studentId, homeworkId);
    const feedback = reviewFeedback[feedbackKey] || '';
    try {
      await axios.post('/api/homework/review', { studentId, homeworkId, status, feedback });
      toast.success(status === 'checked' ? 'Работа принята!' : 'Работа отклонена!');
      
      setReviewFeedback(prev => ({ ...prev, [feedbackKey]: '' }));
      fetchStudents(); 
    } catch {
      toast.error('Ошибка при сохранении статуса');
    }
  };

  if (!user) return null;

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const getStudentGroups = (student) => {
    if (Array.isArray(student.groups) && student.groups.length > 0) {
      return student.groups;
    }

    // Совместимость со старыми данными
    if (student.group_id) {
      return [{ id: student.group_id }];
    }

    return [];
  };

  const getStudentsForGroup = (groupId) => {
    const normalizedGroupId = Number(groupId);

    if (!normalizedGroupId) {
      return [];
    }

    return students.filter(student =>
      getStudentGroups(student).some(
        group => Number(group.id) === normalizedGroupId
      )
    );
  };

  const selectedTeacherGroupData = groups.find(
    group => Number(group.id) === Number(selectedTeacherGroup)
  );

  const visibleStudents = getStudentsForGroup(selectedTeacherGroup);

  // АДМИНКА ПРЕПОДАВАТЕЛЯ
  if (user.role === 'teacher') {

    return (
      <motion.div variants={pageVariants} initial="hidden" animate="visible" style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <Link to="/" style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 'bold' }}>← На главную сайта</Link>
          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '14px' }}>🚪 Выйти</button>
        </div>

        <h1 style={{ color: '#fff', fontSize: '32px', marginBottom: '5px' }}>Рабочий стол <span className="text-gradient"></span></h1>
        <p style={{ color: '#8b949e', fontSize: '18px', marginBottom: '30px' }}>
          Преподаватель: <strong style={{ color: '#fff' }}>{user.first_name}</strong>
        </p>

        {/* Блок ссылки */}
        <div className="glass-card" style={{ marginBottom: '40px' }}>
          <h3 style={{ marginTop: 0, color: '#fff' }}>🎥 Ссылка на онлайн-занятие</h3>
          <form onSubmit={handleUpdateLink} style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <select 
              value={selectedGroupLink} 
              onChange={(e) => setSelectedGroupLink(e.target.value)}
              className="premium-input"
              style={{ flex: 0.5, cursor: 'pointer' }}
            >
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input 
              type="url" 
              placeholder="Вставьте ссылку на урок (Яндекс.Телемост, Zoom)..." 
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="premium-input"
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px' }}>Обновить ссылку</button>
          </form>

          {currentSavedLink && (
            <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span style={{ color: '#8b949e', fontSize: '14px' }}>Актуальная ссылка: </span>
              <a href={currentSavedLink} target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 'bold' }}>
                {currentSavedLink}
              </a>
            </div>
          )}

          {linkMessage && <p style={{ marginTop: '10px', color: '#3fb950', fontWeight: 'bold' }}>{linkMessage}</p>}
        </div> {/* ✅ ЗАКРЫВАЕМ БЛОК ССЫЛКИ ЗДЕСЬ */}

        {/* ✅ ТЕПЕРЬ ЭТО ОТДЕЛЬНЫЙ БЛОК */}
        <div className="glass-card" style={{ marginBottom: '40px', border: '1px solid rgba(210, 153, 34, 0.3)' }}>
          <h3 style={{ marginTop: 0, color: '#fff' }}>📢 Проверка присутствия на следующем уроке</h3>
          <p style={{ color: '#8b949e', fontSize: '14px' }}>
            Система отправит интерактивные кнопки всем ученикам выбранной группы в Telegram.
          </p>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '15px' }}>
            <button onClick={handleStartAttendance} className="btn btn-primary" style={{ background: '#d29922', borderColor: '#d29922' }}>
              ⚡ Запустить сбор подтверждений
            </button>
            {attMessage && <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{attMessage}</span>}
          </div>
        </div>

        {/* Блок ДЗ */}
        <div className="glass-card" style={{ marginBottom: '40px' }}>
          <h3 style={{ marginTop: 0, color: '#fff' }}>📝 Создать новое задание</h3>
          <form onSubmit={handleCreateHomework} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <select 
              value={selectedGroupHw} 
              onChange={(e) => setSelectedGroupHw(e.target.value)}
              className="premium-input"
              style={{ cursor: 'pointer' }}
            >
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="Название задания" 
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
              className="premium-input"
              required
            />

            <textarea 
              placeholder="Описание задания..." 
              value={hwDesc}
              onChange={(e) => setHwDesc(e.target.value)}
              className="premium-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 5px 0', color: '#c9d1d9', fontSize: '14px' }}>Срок сдачи (дедлайн):</p>
                <input 
                  type="datetime-local" 
                  value={hwDeadline}
                  onChange={(e) => setHwDeadline(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 5px 0', color: '#c9d1d9', fontSize: '14px' }}>Прикрепить файл (опционально):</p>
                <input 
                  type="file" 
                  onChange={(e) => setHwTeacherFile(e.target.files[0])}
                  style={{ color: '#8b949e', marginTop: '10px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-success" style={{ alignSelf: 'flex-start', padding: '10px 25px' }}>
              Опубликовать задание
            </button>
          </form>
          {createHwMessage && <p style={{ marginTop: '15px', color: '#3fb950', fontWeight: 'bold' }}>{createHwMessage}</p>}
        </div>

        {/* ГРУППЫ И УЧЕНИКИ */}
        <div
          className="glass-card"
          style={{
            padding: '0',
            overflow: 'hidden',
            marginBottom: '40px'
          }}
        >
          <div
            style={{
              padding: '20px 30px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <h3 style={{ margin: 0, color: '#fff' }}>
              🎓 Мои группы
            </h3>

            <p
              style={{
                margin: '8px 0 0 0',
                color: '#8b949e',
                fontSize: '14px'
              }}
            >
              Выберите группу, с которой сейчас работаете
            </p>
          </div>

          {/* КАРТОЧКИ ГРУПП */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              padding: '20px'
            }}
          >
            {groups.map(group => {
              const groupStudents = getStudentsForGroup(group.id);
              const isSelected =
                Number(selectedTeacherGroup) === Number(group.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setSelectedTeacherGroup(group.id);
                    setSelectedGroupLink(group.id);
                    setSelectedGroupHw(group.id);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(88, 166, 255, 0.12)'
                      : 'rgba(255,255,255,0.03)',
                    border: isSelected
                      ? '1px solid rgba(88, 166, 255, 0.7)'
                      : '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}
                  >
                    {group.name}
                  </div>

                  <div
                    style={{
                      color: isSelected
                        ? '#58a6ff'
                        : '#8b949e',
                      fontSize: '13px'
                    }}
                  >
                    👨‍🎓 {groupStudents.length}{' '}
                    {groupStudents.length === 1
                      ? 'ученик'
                      : groupStudents.length >= 2 &&
                        groupStudents.length <= 4
                      ? 'ученика'
                      : 'учеников'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ВЫБРАННАЯ ГРУППА */}
          {selectedTeacherGroupData && (
            <div
              style={{
                padding: '20px 30px',
                borderTop:
                  '1px solid rgba(255,255,255,0.08)',
                borderBottom:
                  '1px solid rgba(255,255,255,0.08)',
                background:
                  'rgba(88, 166, 255, 0.04)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: '0 0 5px 0',
                      color: '#fff'
                    }}
                  >
                    📋 {selectedTeacherGroupData.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: '#8b949e',
                      fontSize: '13px'
                    }}
                  >
                    Учеников:{' '}
                    <strong style={{ color: '#58a6ff' }}>
                      {visibleStudents.length}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartAttendance}
                  className="btn btn-primary"
                  style={{
                    background: '#d29922',
                    borderColor: '#d29922'
                  }}
                >
                  ⚡ Запустить посещаемость
                </button>
                
                {teacherAttendance && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop:
                        '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '15px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff' }}>
                          📊 {teacherAttendance.session.group_name}
                        </strong>

                        <div
                          style={{
                            marginTop: '6px',
                            color: '#8b949e',
                            fontSize: '13px'
                          }}
                        >
                          🟢 Пришли:{' '}
                          {teacherAttendance.stats.confirmed}
                          {'  '}
                          🔴 Пропустят:{' '}
                          {teacherAttendance.stats.absent}
                          {'  '}
                          🟡 Не ответили:{' '}
                          {teacherAttendance.stats.pending}
                        </div>
                      </div>

                      {teacherAttendance.session.status === 'active' && (
                        <button
                          type="button"
                          onClick={handleCloseAttendance}
                          className="btn btn-danger"
                        >
                          Завершить опрос
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '15px'
                      }}
                    >
                      {teacherAttendance.students.map(student => (
                        <div
                          key={student.student_id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background:
                              'rgba(255,255,255,0.025)'
                          }}
                        >
                          <span style={{ color: '#fff' }}>
                            {student.first_name}
                          </span>

                          <span
                            style={{
                              color:
                                student.status === 'confirmed'
                                  ? '#3fb950'
                                  : student.status === 'absent'
                                  ? '#ff7b72'
                                  : '#d29922'
                            }}
                          >
                            {student.status === 'confirmed'
                              ? '✅ Будет'
                              : student.status === 'absent'
                              ? `❌ ${student.reason || 'Нет'}`
                              : '⏳ Не ответил'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {attMessage && (
                <p
                  style={{
                    margin: '12px 0 0 0',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {attMessage}
                </p>
              )}
            </div>
          )}

          {/* УПРАВЛЕНИЕ СОСТАВОМ ГРУППЫ */}
          <div
            style={{
              padding: '18px 30px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.015)'
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                color: '#fff'
              }}
            >
              👥 Управление учениками
            </h4>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <select
                value={selectedStudentToAdd}
                onChange={(e) =>
                  setSelectedStudentToAdd(e.target.value)
                }
                className="premium-input"
                style={{
                  flex: 1,
                  minWidth: '220px'
                }}
              >
                {availableStudents.length === 0 ? (
                  <option value="">
                    Все ученики уже в этой группе
                  </option>
                ) : (
                  availableStudents.map(student => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.first_name}
                      {student.username
                        ? ` (@${student.username})`
                        : ''}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={handleAddStudentToGroup}
                className="btn btn-success"
                disabled={!selectedStudentToAdd}
              >
                + Добавить ученика
              </button>
            </div>

            {groupActionMessage && (
              <p
                style={{
                  margin: '10px 0 0 0',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                {groupActionMessage}
              </p>
            )}
          </div>

          {/* ТАБЛИЦА УЧЕНИКОВ */}
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th style={{ textAlign: 'center' }}>
                    Жизни
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    Управление
                  </th>
                  <th>
                    Домашнее задание
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: 'center',
                        padding: '30px',
                        color: '#8b949e'
                      }}
                    >
                      В этой группе пока нет учеников.
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map(student => (
                    <tr key={student.id}>
                      <td>
                        <strong
                          style={{ color: '#fff' }}
                        >
                          {student.first_name}
                        </strong>

                        {student.username && (
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#8b949e'
                            }}
                          >
                            @{student.username}
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          textAlign: 'center',
                          fontSize: '18px'
                        }}
                      >
                        {'❤️'.repeat(
                          Math.max(
                            0,
                            Math.min(
                              4,
                              Number(student.lives) || 0
                            )
                          )
                        )}

                        {'🤍'.repeat(
                          4 -
                          Math.max(
                            0,
                            Math.min(
                              4,
                              Number(student.lives) || 0
                            )
                          )
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '5px',
                            justifyContent: 'center'
                          }}
                        >
                          <button
                            onClick={() =>
                              handleUpdateLives(
                                student.id,
                                student.lives,
                                'increment'
                              )
                            }
                            className="btn btn-success"
                            style={{
                              padding: '4px 8px',
                              fontSize: '14px'
                            }}
                            disabled={student.lives >= 4}
                          >
                            +
                          </button>

                          <button
                            onClick={() =>
                              handleUpdateLives(
                                student.id,
                                student.lives,
                                'decrement'
                              )
                            }
                            className="btn btn-danger"
                            style={{
                              padding: '4px 8px',
                              fontSize: '14px'
                            }}
                            disabled={student.lives <= 0}
                          >
                            -
                          </button>

                          <button
                            onClick={() =>
                              handleRemoveStudentFromGroup(student.id)
                            }
                            className="btn btn-danger"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px'
                            }}
                            title="Удалить ученика из группы"
                          >
                            Убрать
                          </button>
                          </div>
                      </td>

                      <td
                        style={{
                          minWidth: '250px',
                          verticalAlign: 'top'
                        }}
                      >
                        {student.homeworks &&
                        student.homeworks.length > 0 ? (
                          <div
                            className="custom-scrollbar"
                            style={{
                              maxHeight: '220px',
                              overflowY: 'auto',
                              paddingRight: '10px'
                            }}
                          >
                            {student.homeworks.map(hw => (
                              <div
                                key={hw.homework_id}
                                style={{
                                  marginBottom: '12px',
                                  paddingBottom: '12px',
                                  borderBottom:
                                    '1px solid rgba(255,255,255,0.05)'
                                }}
                              >
                                <strong
                                  style={{
                                    color: '#fff',
                                    display: 'block',
                                    marginBottom: '5px'
                                  }}
                                >
                                  {hw.title}
                                </strong>

                                {!hw.status ||
                                hw.status === 'rejected' ? (
                                  <span
                                    style={{
                                      color: '#ff7b72',
                                      fontSize: '13px'
                                    }}
                                  >
                                    Не сдано / Отклонено ❌
                                  </span>
                                ) : hw.status === 'checked' ? (
                                  <div>
                                    <span
                                      style={{
                                        color: '#3fb950',
                                        fontWeight: 'bold',
                                        fontSize: '13px'
                                      }}
                                    >
                                      Проверено ✅
                                    </span>

                                    <br />

                                    {(hw.submission_link ||
                                      hw.student_file) && (
                                      <a
                                        href={
                                          hw.submission_link ||
                                          hw.student_file
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          color: '#8b949e',
                                          fontSize: '12px',
                                          textDecoration: 'none'
                                        }}
                                      >
                                        🔗 Открыть работу
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px'
                                    }}
                                  >
                                    {(hw.submission_link ||
                                      hw.student_file) && (
                                      <a
                                        href={
                                          hw.submission_link ||
                                          hw.student_file
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          color: '#58a6ff',
                                          textDecoration: 'none',
                                          fontSize: '13px'
                                        }}
                                      >
                                        🔗 Открыть решение
                                      </a>
                                    )}

                                    <input
                                      type="text"
                                      placeholder="Комментарий к работе..."
                                      value={
                                        reviewFeedback[
                                          getReviewFeedbackKey(
                                            student.id,
                                            hw.homework_id
                                          )
                                        ] || ''
                                      }
                                      onChange={e =>
                                        handleFeedbackChange(
                                          student.id,
                                          hw.homework_id,
                                          e.target.value
                                        )
                                      }
                                      className="premium-input"
                                      style={{
                                        fontSize: '12px',
                                        padding: '6px'
                                      }}
                                    />

                                    <div
                                      style={{
                                        display: 'flex',
                                        gap: '5px'
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          handleReviewHomework(
                                            student.id,
                                            hw.homework_id,
                                            'checked'
                                          )
                                        }
                                        className="btn btn-success"
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          flex: 1
                                        }}
                                      >
                                        Принять
                                      </button>

                                      <button
                                        onClick={() =>
                                          handleReviewHomework(
                                            student.id,
                                            hw.homework_id,
                                            'rejected'
                                          )
                                        }
                                        className="btn btn-danger"
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          flex: 1
                                        }}
                                      >
                                        Отклонить
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span
                            style={{ color: '#8b949e' }}
                          >
                            Нет заданий
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </motion.div>
    );
  }

  // ЛК РОДИТЕЛЯ
  if (user.role === 'parent') {
    return (
      <motion.div variants={pageVariants} initial="hidden" animate="visible" style={{ maxWidth: '700px', margin: '40px auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <Link to="/" style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 'bold' }}>← На главную сайта</Link>
          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '14px' }}>🚪 Выйти</button>
        </div>
        <ParentDashboard user={user} />
      </motion.div>
    );
  }

  // ЛК СТУДЕНТА
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" style={{ maxWidth: '700px', margin: '40px auto', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <Link to="/" style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 'bold' }}>← На главную сайта</Link>
        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '14px' }}>🚪 Выйти</button>
      </div>

      {activeAttendance.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            {activeAttendance.map(attendance => (
                <div
                    key={attendance.session_id}
                    className="glass-card"
                    style={{
                        background: 'rgba(210, 153, 34, 0.1)',
                        borderColor: '#d29922'
                    }}
                >
                    <h3 style={{ margin: '0 0 8px 0', color: '#d29922' }}>
                        🗓 Подтверждение присутствия
                    </h3>

                    <p style={{ margin: '0 0 5px 0', color: '#fff', fontWeight: 'bold' }}>
                        {attendance.group_name}
                    </p>

                    <p style={{ color: '#c9d1d9', fontSize: '14px' }}>
                        Преподаватель ожидает вашего ответа на это занятие.
                    </p>

                    {!(
                        showReasonInput === attendance.session_id
                    ) ? (
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                                marginTop: '15px'
                            }}
                        >
                            <button
                                onClick={() =>
                                    handleStudentAttendance(
                                        attendance.session_id,
                                        'confirmed'
                                    )
                                }
                                className="btn btn-success"
                            >
                                ✅ Я приду
                            </button>

                            <button
                                onClick={() =>
                                    setShowReasonInput(attendance.session_id)
                                }
                                className="btn btn-danger"
                            >
                                ❌ Не смогу
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                marginTop: '15px'
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Причина пропуска"
                                value={absentReason}
                                onChange={(e) =>
                                    setAbsentReason(e.target.value)
                                }
                                className="premium-input"
                            />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() =>
                                        handleStudentAttendance(
                                            attendance.session_id,
                                            'absent',
                                            absentReason
                                        )
                                    }
                                    className="btn btn-danger"
                                >
                                    Отправить
                                </button>

                                <button
                                    onClick={() => {
                                        setShowReasonInput(false);
                                        setAbsentReason('');
                                    }}
                                    className="btn"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff'
                                    }}
                                >
                                    Назад
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )}

      <div className="glass-card" style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#fff' }}>
          Привет, <span className="text-gradient">{user.first_name}</span>! 👋
        </h2>
        <p style={{ color: '#8b949e', fontSize: '16px', marginBottom: '25px' }}>Добро пожаловать в личный кабинет ученика</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minWidth: '150px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#c9d1d9' }}>Осталось жизней:</p>
            <h3 style={{ margin: 0, fontSize: '24px', letterSpacing: '3px' }}>
              {user.lives !== undefined ? (
                <>
                  {(() => {
                      const lives = Math.max(0, Math.min(4, Number(user.lives) || 0));
                      return (
                          <>
                              {'❤️'.repeat(lives)}
                              {'🤍'.repeat(4 - lives)}
                          </>
                      );
                  })()}
                </>
              ) : '❤️❤️❤️❤️'}
            </h3>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minWidth: '150px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#c9d1d9' }}>Онлайн-занятие:</p>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    textAlign: 'left'
                }}
            >
                {studentGroups.length === 0 ? (
                    <p
                        style={{
                            margin: 0,
                            color: '#ff7b72',
                            fontSize: '14px'
                        }}
                    >
                        Группы пока не назначены
                    </p>
                ) : (
                    studentGroups.map(group => (
                        <div
                            key={group.id}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <div
                                style={{
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    marginBottom: '6px'
                                }}
                            >
                                {group.name}
                            </div>

                            {group.static_link ? (
                                <a
                                    href={group.static_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-success"
                                    style={{
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        textDecoration: 'none',
                                        fontSize: '13px'
                                    }}
                                >
                                    🎥 Подключиться
                                </a>
                            ) : (
                                <span
                                    style={{
                                        color: '#8b949e',
                                        fontSize: '13px'
                                    }}
                                >
                                    Ссылка пока не назначена
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Привязка телеграма (показываем, если нет telegram_id) */}
      {!user.telegram_id && (
        <div className="glass-card" style={{ marginBottom: '30px', textAlign: 'center', border: '1px solid rgba(88, 166, 255, 0.3)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#58a6ff' }}>📱 Привязать Telegram-бота</h3>
          <p style={{ color: '#8b949e', fontSize: '14px', marginBottom: '20px' }}>
            Подключите нашего бота <strong>@qudemabot</strong>, чтобы получать уведомления о домашних заданиях и изменении жизней.
          </p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', maxWidth: '300px', margin: '0 auto' }}>
            <input 
              type="text" 
              value={tgCode} 
              onChange={(e) => setTgCode(e.target.value)} 
              placeholder="Код из бота" 
              maxLength={6}
              className="premium-input"
              style={{ textAlign: 'center', letterSpacing: '2px' }}
            />
            <button onClick={handleLinkTelegram} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              Привязать
            </button>
          </div>
          {linkTgMessage && <p style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold', color: linkTgMessage.includes('✅') ? '#3fb950' : '#ff7b72' }}>{linkTgMessage}</p>}
        </div>
      )}

      {/* Мои домашние задания */}
      <div className="glass-card">
        <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>📝 Мои задания</h3>
        
        {studentHomeworks.length === 0 ? (
            <p style={{ color: '#8b949e', textAlign: 'center' }}>Пока нет актуальных заданий.</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {studentHomeworks.map(hw => (
                    <div key={hw.homework_id} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#58a6ff', fontSize: '18px' }}>{hw.title}</h4>
                        <p style={{ margin: '0 0 15px 0', color: '#c9d1d9', fontSize: '14px', lineHeight: '1.5' }}>{hw.description}</p>
                        
                        {hw.teacher_file && (
                            <a href={`http://${hw.teacher_file}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginBottom: '15px', color: '#d29922', textDecoration: 'none', fontSize: '14px' }}>
                                📎 Скачать прикрепленный файл задания
                            </a>
                        )}

                        {(!hw.status || hw.status === 'rejected') && (
                            <form onSubmit={(e) => handleSubmitSpecificHomework(e, hw.homework_id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                {hw.status === 'rejected' && <p style={{ color: '#ff7b72', margin: 0, fontWeight: 'bold' }}>⚠️ Преподаватель отклонил работу. Нужно переделать!</p>}
                                <input 
                                    type="url" 
                                    placeholder="Ссылка на ваше решение (необязательно)" 
                                    onChange={(e) => handleSubmissionChange(hw.homework_id, 'link', e.target.value)}
                                    className="premium-input"
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input 
                                        type="file" 
                                        onChange={(e) => handleSubmissionChange(hw.homework_id, 'file', e.target.files[0])}
                                        style={{ color: '#8b949e' }}
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>Отправить</button>
                                </div>
                            </form>
                        )}

                        {hw.status === 'submitted' && (
                            <div style={{ padding: '10px', background: 'rgba(88, 166, 255, 0.1)', borderRadius: '6px', border: '1px solid rgba(88, 166, 255, 0.2)' }}>
                                <p style={{ fontSize: '14px', color: '#58a6ff', margin: 0 }}>⏳ Решение отправлено, ожидает проверки преподавателем</p>
                            </div>
                        )}

                        {hw.status === 'checked' && (
                            <div style={{ padding: '10px', background: 'rgba(63, 185, 80, 0.1)', borderRadius: '6px', border: '1px solid rgba(63, 185, 80, 0.2)' }}>
                                <p style={{ fontSize: '14px', color: '#3fb950', fontWeight: 'bold', margin: 0 }}>🎉 Задание успешно проверено!</p>
                            </div>
                        )}
                        
                        {hw.feedback && (
                          <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', borderLeft: '4px solid #d29922' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#8b949e', marginBottom: '5px' }}>Комментарий преподавателя:</p>
                            <p style={{ margin: 0, fontSize: '14px', color: '#e6edf3' }}>{hw.feedback}</p>
                          </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </motion.div>
  );
}

// ОСНОВНОЙ КОМПОНЕНТ С НАСТРОЙКОЙ РОУТОВ
export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('qudema_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <Router>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: { background: '#1c2128', color: '#c9d1d9', border: '1px solid rgba(255,255,255,0.1)' },
          success: { iconTheme: { primary: '#3fb950', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff7b72', secondary: '#fff' } },
        }} 
      />
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />

        <Route
          path="/login"
          element={
            <LoginPage
              user={user}
              setUser={setUser}
            />
          }
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPasswordPage />}
        />

        <Route
          path="/dashboard"
          element={
            <DashboardPage
              user={user}
              setUser={setUser}
            />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}