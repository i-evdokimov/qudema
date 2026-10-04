import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const agePrograms = [
  {
    age: 'До 14 лет',
    title: 'Общеобразовательные программы',
    text: 'Занятия для детей, которые помогают раскрывать интерес к знаниям, развивать самостоятельность и полезные навыки.',
  },
  {
    age: '14–16 лет',
    title: 'Развитие компетенций',
    text: 'Программы для подростков с акцентом на практические навыки, осознанный выбор направления и уверенное движение к целям.',
  },
  {
    age: '15–17 лет',
    title: 'Подготовка и профильное развитие',
    text: 'Профильные занятия и образовательные треки для школьников старших классов.',
  },
  {
    age: '17–18 лет',
    title: 'Переход к профессиональному пути',
    text: 'Программы для подготовки к дальнейшему обучению и развитию профессиональных компетенций.',
  },
];

const feedbackActions = [
  {
    id: 'question',
    title: 'Задать вопрос',
    text: 'Напишите нам — ответим по программам, обучению и организационным вопросам.',
    subject: 'Вопрос по программам QUDEMA',
  },
  {
    id: 'call',
    title: 'Заказать звонок',
    text: 'Оставьте контактные данные, чтобы мы могли связаться с вами.',
    subject: 'Заказ обратного звонка QUDEMA',
  },
  {
    id: 'review',
    title: 'Оставить отзыв',
    text: 'Поделитесь впечатлениями об обучении в центре.',
    subject: 'Отзыв о центре QUDEMA',
  },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function FeedbackModal({ action, onClose }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (event) => {
    event.preventDefault();

    const body = [
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      '',
      message,
    ].join('\n');

    window.location.href = `mailto:qudema@mail.ru?subject=${encodeURIComponent(action.subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="landing-modal-backdrop" onMouseDown={onClose}>
      <motion.div
        className="landing-modal"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="landing-modal-close" type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>

        <div className="landing-eyebrow">QUDEMA</div>
        <h3>{action.title}</h3>
        <p>{action.text}</p>

        {sent ? (
          <div className="landing-modal-success">
            Открылось почтовое приложение с подготовленным сообщением.
            <button type="button" className="landing-btn landing-btn-primary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="landing-form">
            <label>
              Имя
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Как к вам обращаться" />
            </label>
            <label>
              Контакт
              <input value={contact} onChange={(e) => setContact(e.target.value)} required placeholder="Телефон или Email" />
            </label>
            <label>
              {action.id === 'review' ? 'Ваш отзыв' : 'Сообщение'}
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder="Напишите сообщение" />
            </label>
            <button type="submit" className="landing-btn landing-btn-primary">
              Подготовить сообщение
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function LandingPage({ user }) {
  const [feedbackAction, setFeedbackAction] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigateToSection = (id) => {
    setMobileOpen(false);
    scrollToId(id);
  };

  return (
    <div className="official-landing">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <a className="landing-brand" href="#top" aria-label="QUDEMA">
            <span className="landing-brand-mark">Q</span>
            <span>
              <strong>КУДЕМА</strong>
              <small>Центр дополнительного образования</small>
            </span>
          </a>

          <button
            className="landing-mobile-toggle"
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Открыть меню"
          >
            {mobileOpen ? '×' : '☰'}
          </button>

          <nav className={`landing-nav ${mobileOpen ? 'is-open' : ''}`}>
            <button type="button" onClick={() => navigateToSection('about')}>О центре</button>
            <button type="button" onClick={() => navigateToSection('documents')}>Документы</button>
            <button type="button" onClick={() => navigateToSection('materials')}>Полезные материалы</button>
            <button type="button" onClick={() => navigateToSection('programs')}>Программы до 18 лет</button>
            <button type="button" onClick={() => navigateToSection('professional')}>Программы 18+</button>
            <button type="button" onClick={() => navigateToSection('feedback')}>Обратная связь</button>
          </nav>

          <div className="landing-header-actions">
            {user ? (
              <Link className="landing-btn landing-btn-outline" to="/dashboard">Личный кабинет</Link>
            ) : (
              <Link className="landing-btn landing-btn-primary" to="/login">Личный кабинет</Link>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-shell landing-hero-grid">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <div className="landing-kicker">Центр дополнительного образования и развития компетенций</div>
              <h1>
                Учиться с интересом.
                <span>Развиваться с уверенностью.</span>
              </h1>
              <p className="landing-hero-text">
                Современные образовательные программы для детей, подростков и взрослых — с понятной навигацией, практическим подходом и вниманием к каждому обучающемуся.
              </p>
              <div className="landing-hero-actions">
                <button className="landing-btn landing-btn-primary landing-btn-large" type="button" onClick={() => navigateToSection('programs')}>
                  Выбрать программу
                </button>
                <button className="landing-btn landing-btn-outline landing-btn-large" type="button" onClick={() => navigateToSection('about')}>
                  Узнать о центре
                </button>
              </div>
              <div className="landing-hero-note">
                <span>Новосибирск</span>
                <span>•</span>
                <span>Онлайн и современные форматы обучения</span>
              </div>
            </motion.div>

            <motion.div
              className="landing-hero-visual"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.08 }}
            >
              <div className="landing-orb landing-orb-one" />
              <div className="landing-orb landing-orb-two" />
              <div className="landing-visual-card landing-visual-main">
                <div className="landing-visual-topline">
                  <span>ОБРАЗОВАНИЕ</span>
                  <span>QUDEMA</span>
                </div>
                <div className="landing-visual-title">Траектория развития</div>
                <div className="landing-progress">
                  <span style={{ width: '74%' }} />
                </div>
                <div className="landing-visual-grid">
                  <div><strong>До 18</strong><span>Общеобразовательные программы</span></div>
                  <div><strong>18+</strong><span>Повышение квалификации и переподготовка</span></div>
                </div>
              </div>
              <div className="landing-floating-card landing-floating-top">01 · Интерес</div>
              <div className="landing-floating-card landing-floating-bottom">02 · Навык → 03 · Компетенция</div>
            </motion.div>
          </div>
        </section>

        <section className="landing-section landing-section-white">
          <div className="landing-shell landing-quick-grid">
            <div><span className="landing-stat-number">4</span><span className="landing-stat-label">возрастных трека<br />до 18 лет</span></div>
            <div><span className="landing-stat-number">18+</span><span className="landing-stat-label">программы<br />для взрослых</span></div>
            <div><span className="landing-stat-number">1</span><span className="landing-stat-label">центр<br />для разных этапов обучения</span></div>
            <div><span className="landing-stat-number">∞</span><span className="landing-stat-label">пространство<br />для развития компетенций</span></div>
          </div>
        </section>

        <section id="about" className="landing-section landing-about">
          <div className="landing-shell landing-two-col">
            <div>
              <div className="landing-eyebrow">О ЦЕНТРЕ</div>
              <h2>КУДЕМА — пространство, где обучение становится понятным маршрутом</h2>
            </div>
            <div className="landing-copy-stack">
              <p>
                Центр дополнительного образования и развития компетенций объединяет программы для школьников и взрослых в единой образовательной среде.
              </p>
              <p>
                Здесь можно выбрать направление по возрасту, познакомиться с документами и материалами, задать вопрос специалистам и перейти в личный кабинет обучающегося.
              </p>
              <div className="landing-check-grid">
                <div><span>01</span><strong>Понятные программы</strong></div>
                <div><span>02</span><strong>Практический подход</strong></div>
                <div><span>03</span><strong>Поддержка на пути обучения</strong></div>
                <div><span>04</span><strong>Единая цифровая среда</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section id="programs" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <div>
                <div className="landing-eyebrow">ДО 18 ЛЕТ</div>
                <h2>Общеобразовательные (общеразвивающие) программы</h2>
              </div>
              <p>Выберите возрастной трек, чтобы сориентироваться по подходящему формату обучения.</p>
            </div>

            <div className="landing-program-grid">
              {agePrograms.map((program, index) => (
                <motion.article
                  key={program.age}
                  className="landing-program-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                >
                  <div className="landing-program-number">0{index + 1}</div>
                  <div className="landing-age-pill">{program.age}</div>
                  <h3>{program.title}</h3>
                  <p>{program.text}</p>
                  <button type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>
                    Узнать подробнее <span>→</span>
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="professional" className="landing-section landing-professional">
          <div className="landing-shell landing-professional-inner">
            <div className="landing-professional-copy">
              <div className="landing-eyebrow">18+</div>
              <h2>Повышение квалификации и профессиональная переподготовка</h2>
              <p>
                Программы для взрослых, которые хотят систематизировать знания, развить профессиональные компетенции или освоить новое направление.
              </p>
              <button className="landing-btn landing-btn-light" type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>
                Получить консультацию
              </button>
            </div>
            <div className="landing-professional-list">
              <div><span>01</span><strong>Повышение квалификации</strong><p>Обновление и расширение профессиональных знаний.</p></div>
              <div><span>02</span><strong>Профессиональная переподготовка</strong><p>Освоение нового профессионального направления.</p></div>
              <div><span>03</span><strong>Индивидуальный образовательный маршрут</strong><p>Помощь с выбором подходящей программы.</p></div>
            </div>
          </div>
        </section>

        <section id="documents" className="landing-section landing-section-white">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <div>
                <div className="landing-eyebrow">ОФИЦИАЛЬНАЯ ИНФОРМАЦИЯ</div>
                <h2>Документы</h2>
              </div>
              <p>Раздел для нормативной и организационной информации центра.</p>
            </div>
            <div className="landing-info-grid">
              <article><span>01</span><h3>Документы центра</h3><p>Локальные документы и официальная информация.</p><button type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>Запросить документы →</button></article>
              <article><span>02</span><h3>Образовательные программы</h3><p>Описание программ и сведения об условиях обучения.</p><button type="button" onClick={() => navigateToSection('programs')}>Перейти к программам →</button></article>
              <article><span>03</span><h3>Вопросы по документам</h3><p>Поможем сориентироваться по нужной информации.</p><button type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>Задать вопрос →</button></article>
            </div>
          </div>
        </section>

        <section id="materials" className="landing-section landing-materials">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <div>
                <div className="landing-eyebrow">ДЛЯ ОБУЧЕНИЯ</div>
                <h2>Полезные материалы</h2>
              </div>
              <p>Раздел можно наполнить методическими материалами, памятками, рекомендациями и публикациями центра.</p>
            </div>
            <div className="landing-material-grid">
              <article><span>Материал 01</span><h3>Памятки для обучающихся</h3><p>Полезные рекомендации по организации учебного процесса.</p><a href="mailto:qudema@mail.ru?subject=Запрос%20полезных%20материалов">Запросить материал</a></article>
              <article><span>Материал 02</span><h3>Рекомендации для родителей</h3><p>Информация о поддержке ребёнка в образовательном процессе.</p><a href="mailto:qudema@mail.ru?subject=Материалы%20для%20родителей">Запросить материал</a></article>
              <article><span>Материал 03</span><h3>Публикации центра</h3><p>Новости, заметки и образовательные материалы QUDEMA.</p><a href="mailto:qudema@mail.ru?subject=Публикации%20QUDEMA">Узнать подробнее</a></article>
            </div>
          </div>
        </section>

        <section id="feedback" className="landing-section landing-feedback">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <div>
                <div className="landing-eyebrow">ОБРАТНАЯ СВЯЗЬ</div>
                <h2>Свяжитесь с центром</h2>
              </div>
              <p>Выберите удобный сценарий — вопрос, звонок или отзыв.</p>
            </div>
            <div className="landing-feedback-grid">
              {feedbackActions.map((action) => (
                <button key={action.id} className="landing-feedback-card" type="button" onClick={() => setFeedbackAction(action)}>
                  <span>{action.id === 'question' ? '01' : action.id === 'call' ? '02' : '03'}</span>
                  <h3>{action.title}</h3>
                  <p>{action.text}</p>
                  <strong>Открыть →</strong>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-cta">
          <div className="landing-shell landing-cta-inner">
            <div>
              <div className="landing-eyebrow">QUDEMA</div>
              <h2>Начните с выбора образовательного направления</h2>
              <p>Посмотрите программы или сразу свяжитесь с центром.</p>
            </div>
            <div className="landing-cta-actions">
              <button className="landing-btn landing-btn-primary landing-btn-large" type="button" onClick={() => navigateToSection('programs')}>Смотреть программы</button>
              <a className="landing-btn landing-btn-outline landing-btn-large" href="tel:+79139415441">Позвонить</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-brand landing-brand-footer">
                <span className="landing-brand-mark">Q</span>
                <span><strong>КУДЕМА</strong><small>Центр дополнительного образования</small></span>
              </div>
              <p>Центр дополнительного образования и развития компетенций.</p>
            </div>
            <div><h4>Навигация</h4><button type="button" onClick={() => navigateToSection('about')}>О центре</button><button type="button" onClick={() => navigateToSection('programs')}>Программы до 18 лет</button><button type="button" onClick={() => navigateToSection('professional')}>Программы 18+</button><button type="button" onClick={() => navigateToSection('feedback')}>Обратная связь</button></div>
            <div><h4>Контакты</h4><a href="tel:+79139415441">+7 (913) 941-54-41</a><a href="mailto:qudema@mail.ru">qudema@mail.ru</a><p>Кудряшова Евгения</p><p>630005, г. Новосибирск,<br />ул. Мичурина, 24</p></div>
            <div className="landing-social"><h4>Мы в сети</h4><a href="https://t.me/+RdmaxmRsNcM4OTEy" target="_blank" rel="noreferrer">Telegram</a><a href="https://vk.ru/qudema" target="_blank" rel="noreferrer">ВКонтакте</a><div className="landing-qr-row"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Fqudema.ru%2F" alt="QR-код официального сайта QUDEMA" /><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Ft.me%2F%2BRdmaxmRsNcM4OTEy" alt="QR-код Telegram QUDEMA" /></div></div>
          </div>
          <div className="landing-footer-bottom"><span>© 2026 КУДЕМА</span><span>Официальный сайт центра</span></div>
        </div>
      </footer>

      <AnimatePresence>
        {feedbackAction && <FeedbackModal action={feedbackAction} onClose={() => setFeedbackAction(null)} />}
      </AnimatePresence>
    </div>
  );
}
