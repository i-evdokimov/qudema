import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
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
        const res = await axios.post('http://localhost:5000/api/login', { token });
        if (res.data.success) handleAuthSuccess(res.data);
      } 
      else if (authMode === 'email_login') {
        const res = await axios.post('http://localhost:5000/api/login/email', { email, password });
        if (res.data.success) handleAuthSuccess(res.data);
      } 
      else if (authMode === 'email_register') {
        const res = await axios.post('http://localhost:5000/api/register', { 
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
        const response = await axios.get('http://localhost:5000/api/parent/dashboard');
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Ошибка загрузки данных');
      }
    };
    fetchParentData();
  }, []);

  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</div>;
  if (!data) return <div style={{ textAlign: 'center', marginTop: '20px', color: 'white' }}>Загрузка данных...</div>;

  const { child, homeworks } = data;

  return (
    <div className="student-dashboard">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel">
        <h2>📊 Успеваемость: {child.first_name}</h2>
        <p style={{ color: '#aaa', marginBottom: '20px' }}>Режим наблюдения</p>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: '0 0 10px 0' }}>Остаток жизней ребенка:</p>
            <div style={{ fontSize: '24px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} style={{ opacity: i < child.lives ? 1 : 0.3 }}>❤️</span>
              ))}
            </div>
          </div>
          
          <div className="glass-panel" style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: '0 0 10px 0' }}>Ссылка на занятие:</p>
            {child.class_link ? (
              <a href={child.class_link} target="_blank" rel="noreferrer" className="premium-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
                🔗 Перейти на урок
              </a>
            ) : (
              <p style={{ color: '#ff6b6b' }}>Ссылка пока не добавлена</p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ marginTop: '20px' }}>
        <h3>📝 Домашние задания</h3>
        {homeworks.length === 0 ? (
          <p style={{ color: '#aaa' }}>Заданий пока нет.</p>
        ) : (
          homeworks.map(hw => (
            <div key={hw.id} className="homework-card glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#6fb1fc' }}>{hw.title}</h4>
              <p style={{ margin: 0, fontSize: '14px', color: 
                hw.status === 'checked' ? '#4CAF50' : 
                hw.status === 'rejected' ? '#F44336' : 
                hw.status === 'submitted' ? '#FFC107' : '#aaa' 
              }}>
                Статус: {
                  hw.status === 'checked' ? '✅ Принято' :
                  hw.status === 'rejected' ? '❌ Отклонено' :
                  hw.status === 'submitted' ? '⏳ Ожидает проверки' : 'Не сдано'
                }
              </p>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
};

// ГЛАВНЫЙ РАБОЧИЙ СТОЛ (Ученик / Учитель / Родитель)
function DashboardPage({ user, setUser }) {
  const navigate = useNavigate();
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [absentReason, setAbsentReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [attMessage, setAttMessage] = useState('');
  const [students, setStudents] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [linkMessage, setLinkMessage] = useState('');
  const [studentHomeworks, setStudentHomeworks] = useState([]);
  const [activeSubmissions, setActiveSubmissions] = useState({});
  const [groups, setGroups] = useState([]);
  const [selectedGroupLink, setSelectedGroupLink] = useState('');
  const [selectedGroupHw, setSelectedGroupHw] = useState('');

  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDeadline, setHwDeadline] = useState('');
  const [hwTeacherFile, setHwTeacherFile] = useState(null);
  const [createHwMessage, setCreateHwMessage] = useState('');

  const [tgCode, setTgCode] = useState('');
  const [linkTgMessage, setLinkTgMessage] = useState('');

  const [reviewFeedback, setReviewFeedback] = useState({});
  const handleFeedbackChange = (hwId, value) => {
    setReviewFeedback(prev => ({ ...prev, [hwId]: value }));
  };

  const handleLinkTelegram = async () => {
    try {
        const token = localStorage.getItem('qudema_jwt');
        const res = await axios.post('http://localhost:5000/api/link-telegram', 
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
    
    // ✅ Добавляем проверку: если группа не выбрана (пустая строка), прерываем функцию
    if (!selectedGroupLink) {
      setAttMessage('❌ Ошибка: Группа не выбрана!');
      toast.error('Сначала создайте или выберите группу');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/teacher/start-attendance', { groupId: selectedGroupLink });
      setAttMessage('🚀 ' + res.data.message);
      toast.success('Опрос запущен!');
    } catch (err) {
      setAttMessage('❌ ' + (err.response?.data?.error || 'Ошибка запуска'));
    }
  };

  const handleSubmissionChange = (hwId, field, value) => {
      setActiveSubmissions(prev => ({
          ...prev,
          [hwId]: { ...prev[hwId], [field]: value }
      }));
  };

  // Загрузка опросов присутствия (по JWT)
  useEffect(() => {
    if (user && user.role === 'student') {
      axios.get('http://localhost:5000/api/student/attendance-status')
        .then(res => setActiveAttendance(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleStudentAttendance = async (status, reason = '') => {
    try {
      await axios.post('http://localhost:5000/api/student/submit-attendance', {
        groupId: activeAttendance.group_id,
        status,
        reason
      });
      toast.success('Ваш ответ сохранен!');
      setActiveAttendance(null); 
    } catch (err) {
      toast.error('Ошибка сохранения ответа');
    }
  };

  const currentSavedLink = students.length > 0 ? students[0].static_link : null;

  // Загрузка домашних заданий ученика (по JWT)
  useEffect(() => {
    if (user && user.role === 'student') {
        axios.get('http://localhost:5000/api/student/homeworks')
             .then(res => setStudentHomeworks(res.data))
             .catch(err => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchStudents = async () => {
    if (!user || user.role !== 'teacher') return;
    try {
      const response = await axios.get('http://localhost:5000/api/students'); 
      setStudents(response.data);
    } catch (err) {
      console.error('Ошибка при получении списка студентов:', err);
    }
  };

  const fetchGroups = async () => {
    if (!user || user.role !== 'teacher') return;
    try {
      const response = await axios.get('http://localhost:5000/api/teacher/groups');
      setGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroupLink(response.data[0].id);
        setSelectedGroupHw(response.data[0].id);
      }
    } catch (err) {
      console.error('Ошибка при получении групп:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, [user]);

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
      const response = await axios.put(`http://localhost:5000/api/students/${studentId}/lives`, { lives: newLives });

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
      await axios.post('http://localhost:5000/api/submissions/submit', formData);
      toast.success('Домашнее задание отправлено!');
      
      const res = await axios.get('http://localhost:5000/api/student/homeworks');
      setStudentHomeworks(res.data);
    } catch (err) {
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
      const res = await axios.post('http://localhost:5000/api/teacher/update-link', {
        groupId: selectedGroupLink,
        link: newLink
      });
      setLinkMessage('✅ ' + res.data.message);
      setCurrentSavedLink(newLink);
      toast.success('Ссылка успешно обновлена!');
    } catch (err) {
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
        await axios.post('http://localhost:5000/api/homeworks/create', formData);
        setCreateHwMessage('✅ Задание успешно создано и отправлено ученикам!');

        setHwTitle('');
        setHwDesc('');
        setHwDeadline('');
        setHwTeacherFile(null);
        
        fetchStudents(); 
    } catch (err) {
        setCreateHwMessage('❌ Ошибка при создании задания');
    }
  };

  // Проверка работы преподавателем (используется studentId вместо telegramId)
  const handleReviewHomework = async (studentId, homeworkId, status) => {
    const feedback = reviewFeedback[homeworkId] || '';
    try {
      await axios.post('http://localhost:5000/api/homework/review', { studentId, homeworkId, status, feedback });
      toast.success(status === 'checked' ? 'Работа принята!' : 'Работа отклонена!');
      
      setReviewFeedback(prev => ({ ...prev, [homeworkId]: '' }));
      fetchStudents(); 
    } catch (err) {
      toast.error('Ошибка при сохранении статуса');
    }
  };

  if (!user) return null;

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

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

        {/* Таблица группы */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>📋 Ваша группа</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Группа</th>
                  <th style={{ textAlign: 'center' }}>Жизни</th>
                  <th style={{ textAlign: 'center' }}>Управление</th>
                  <th>Домашнее задание</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>
                      <strong style={{ color: '#fff' }}>{student.first_name}</strong>
                      {student.username && <div style={{ fontSize: '12px', color: '#8b949e' }}>@{student.username}</div>}
                    </td>

                    <td>{student.group_name || 'Без группы'}</td>

                    <td style={{ textAlign: 'center', fontSize: '18px' }}>
                      {'❤️'.repeat(student.lives || 0)}{'🤍'.repeat(4 - (student.lives || 0))}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleUpdateLives(student.id, student.lives, 'increment')} 
                          className="btn btn-success" 
                          style={{ padding: '4px 8px', fontSize: '14px' }} 
                          disabled={student.lives >= 4}
                        >+</button>
                        <button 
                          onClick={() => handleUpdateLives(student.id, student.lives, 'decrement')} 
                          className="btn btn-danger" 
                          style={{ padding: '4px 8px', fontSize: '14px' }} 
                          disabled={student.lives <= 0}
                        >-</button>
                      </div>
                    </td>

                    <td style={{ minWidth: '250px', verticalAlign: 'top' }}>
                      {student.homeworks && student.homeworks.length > 0 ? (
                        <div className="custom-scrollbar" style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '10px' }}>
                          {student.homeworks.map(hw => (
                            <div key={hw.homework_id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>{hw.title}</strong>
                              
                              {!hw.status || hw.status === 'rejected' ? (
                                <span style={{ color: '#ff7b72', fontSize: '13px' }}>Не сдано / Отклонено ❌</span>
                              ) : hw.status === 'checked' ? (
                                <div>
                                  <span style={{ color: '#3fb950', fontWeight: 'bold', fontSize: '13px' }}>Проверено ✅</span> <br/>
                                  {(hw.submission_link || hw.student_file) && (
                                    <a href={hw.submission_link || `http://localhost:5000${hw.student_file}`} target="_blank" rel="noreferrer" style={{ color: '#8b949e', fontSize: '12px', textDecoration: 'none' }}>🔗 Открыть работу</a>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <a href={hw.submission_link || `http://localhost:5000${hw.student_file}`} target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none', fontSize: '13px' }}>🔗 Открыть решение</a>
                                  
                                  <input 
                                    type="text" 
                                    placeholder="Комментарий к работе..." 
                                    value={reviewFeedback[hw.homework_id] || ''}
                                    onChange={(e) => handleFeedbackChange(hw.homework_id, e.target.value)}
                                    className="premium-input"
                                    style={{ fontSize: '12px', padding: '6px' }}
                                  />
                                  
                                  <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => handleReviewHomework(student.id, hw.homework_id, 'checked')} className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }}>Принять</button>
                                    <button onClick={() => handleReviewHomework(student.id, hw.homework_id, 'rejected')} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }}>Отклонить</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#8b949e' }}>Нет заданий</span>
                      )}
                    </td>
                  </tr>
                ))}
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

      {activeAttendance && (
        <div className="glass-card" style={{ marginBottom: '30px', background: 'rgba(210, 153, 34, 0.1)', borderColor: '#d29922', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#d29922' }}>🗓 Подтверждение присутствия на занятии</h3>
          <p style={{ color: '#c9d1d9', fontSize: '15px' }}>Преподаватель ожидает вашего ответа. Вы придете на следующий урок?</p>
          
          {!showReasonInput ? (
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px' }}>
              <button onClick={() => handleStudentAttendance('confirmed')} className="btn btn-success" style={{ padding: '8px 25px' }}>✅ Да, я буду</button>
              <button onClick={() => setShowReasonInput(true)} className="btn btn-danger" style={{ padding: '8px 25px' }}>❌ Не смогу</button>
            </div>
          ) : (
            <div style={{ maxWidth: '400px', margin: '15px auto 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Укажите причину пропуска (например: заболел)..." 
                value={absentReason} 
                onChange={(e) => setAbsentReason(e.target.value)}
                className="premium-input"
                required
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleStudentAttendance('absent', absentReason)} className="btn btn-danger" style={{ flex: 1 }}>Отправить причину</button>
                <button onClick={() => setShowReasonInput(false)} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Назад</button>
              </div>
            </div>
          )}
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
                  {'❤️'.repeat(user.lives)}
                  {'🤍'.repeat(4 - user.lives)}
                </>
              ) : '❤️❤️❤️❤️'}
            </h3>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minWidth: '150px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#c9d1d9' }}>Онлайн-занятие:</p>
            {user.static_link ? (
              <a href={user.static_link} target="_blank" rel="noreferrer" className="btn btn-success" style={{ display: 'inline-block', padding: '6px 15px', textDecoration: 'none', fontSize: '14px' }}>
                🎥 Подключиться
              </a>
            ) : (
              <p style={{ margin: 0, color: '#ff7b72', fontSize: '14px', fontWeight: 'bold' }}>Ссылка не назначена</p>
            )}
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
                            <a href={`http://localhost:5000${hw.teacher_file}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginBottom: '15px', color: '#d29922', textDecoration: 'none', fontSize: '14px' }}>
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
        <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />
        <Route path="/dashboard" element={<DashboardPage user={user} setUser={setUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}