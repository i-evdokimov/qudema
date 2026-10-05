import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const siteSections = [
  { id: 'about', number: '01', title: 'О центре', text: 'Кто мы, как устроена образовательная среда и какие задачи решает КУДЕМА.' },
  { id: 'programs', number: '02', title: 'Программы до 18 лет', text: 'Общеобразовательные и общеразвивающие направления по возрастным трекам.' },
  { id: 'professional', number: '03', title: 'Программы 18+', text: 'Повышение квалификации и профессиональная переподготовка для взрослых.' },
  { id: 'documents', number: '04', title: 'Документы', text: 'Официальная и нормативная информация центра.' },
  { id: 'materials', number: '05', title: 'Полезные материалы', text: 'Памятки, рекомендации и материалы для обучающихся и родителей.' },
  { id: 'feedback', number: '06', title: 'Обратная связь', text: 'Вопрос, обратный звонок или отзыв — выберите удобный формат связи.' },
];

const agePrograms = [
  {
    age: 'До 14 лет',
    title: 'Общее развитие',
    text: 'Занятия для детей с акцентом на интерес к знаниям, самостоятельность и развитие полезных навыков.',
  },
  {
    age: '14–16 лет',
    title: 'Развитие компетенций',
    text: 'Практические образовательные треки, помощь в выборе направления и постепенное формирование самостоятельности.',
  },
  {
    age: '15–17 лет',
    title: 'Профильное развитие',
    text: 'Занятия для старших школьников, которым важно углубиться в выбранное направление и подготовиться к следующему этапу.',
  },
  {
    age: '17–18 лет',
    title: 'Переход к профессиональному пути',
    text: 'Подготовка к дальнейшему обучению, выбору профессии и развитию востребованных компетенций.',
  },
  {
    age: '18+',
    title: 'Профессиональное развитие',
    text: 'Повышение квалификации и профессиональная переподготовка для систематизации знаний и освоения нового направления.',
    adult: true,
  },
];

const feedbackActions = [
  {
    id: 'question',
    number: '01',
    title: 'Задать вопрос',
    text: 'Напишите нам — ответим по программам, обучению и организационным вопросам.',
    subject: 'Вопрос по программам QUDEMA',
    fieldLabel: 'Сообщение',
    placeholder: 'Что вы хотите узнать?',
  },
  {
    id: 'call',
    number: '02',
    title: 'Заказать звонок',
    text: 'Оставьте контактные данные, чтобы мы могли связаться с вами.',
    subject: 'Заказ обратного звонка QUDEMA',
    fieldLabel: 'Комментарий',
    placeholder: 'Когда удобно связаться?',
  },
  {
    id: 'review',
    number: '03',
    title: 'Оставить отзыв',
    text: 'Поделитесь впечатлениями об обучении в центре.',
    subject: 'Отзыв о центре QUDEMA',
    fieldLabel: 'Ваш отзыв',
    placeholder: 'Расскажите о вашем опыте.',
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
        className="landing-modal glass-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="landing-modal-close" type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>

        <div className="landing-overline">QUDEMA</div>
        <h3>{action.title}</h3>
        <p>{action.text}</p>

        {sent ? (
          <div className="landing-modal-success">
            <strong>Сообщение подготовлено.</strong>
            <span>Откроется почтовое приложение с заполненным обращением в КУДЕМА.</span>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="landing-form">
            <label>
              Имя
              <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Как к вам обращаться" />
            </label>
            <label>
              Контакт
              <input value={contact} onChange={(event) => setContact(event.target.value)} required placeholder="Телефон или Email" />
            </label>
            <label>
              {action.fieldLabel}
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={5} placeholder={action.placeholder} />
            </label>
            <button type="submit" className="btn btn-success landing-form-submit">
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

  const navigateToSection = (id) => scrollToId(id);

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-container landing-topbar-inner">
          <a className="landing-logo" href="#top" aria-label="КУДЕМА — официальный сайт">
            <span className="landing-logo-word">QUDEMA</span>
            <span className="landing-logo-subtitle">Центр дополнительного образования</span>
          </a>

          <Link to={user ? '/dashboard' : '/login'} className="btn btn-success landing-cabinet-button">
            {user ? `Кабинет: ${user.first_name || 'пользователь'} 🎓` : 'Личный кабинет 🔑'}
          </Link>
        </div>
      </header>

      <main id="top">
        <section className="landing-container landing-hero">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="landing-hero-copy"
          >
            <div className="landing-status"><span /> Официальный сайт КУДЕМА</div>
            <h1>Образовательный центр <span className="text-gradient">нового поколения</span></h1>
            <p className="landing-hero-text">
              Современные образовательные программы для детей, подростков и взрослых. Выбирайте направление, знакомьтесь с условиями обучения и оставайтесь на связи с центром через единую цифровую среду.
            </p>

            <div className="landing-hero-actions">
              <button type="button" className="btn btn-success" onClick={() => navigateToSection('programs')}>
                Смотреть программы 🚀
              </button>
              <button type="button" className="btn landing-secondary-button" onClick={() => navigateToSection('about')}>
                О центре
              </button>
            </div>
          </motion.div>

          <motion.div
            className="landing-hero-card glass-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <div className="landing-card-heading">
              <span className="badge badge-blue">QUDEMA</span>
              <span>2026</span>
            </div>
            <div className="landing-card-title">Один центр — разные образовательные маршруты</div>
            <div className="landing-route-list">
              <div><span>01</span><strong>До 18 лет</strong><em>Общеобразовательные программы</em></div>
              <div><span>02</span><strong>18+</strong><em>Повышение квалификации</em></div>
              <div><span>03</span><strong>Личный кабинет</strong><em>Занятия, ДЗ, посещаемость</em></div>
            </div>
          </motion.div>
        </section>

        <section className="landing-container landing-priority-row" aria-label="Основные направления">
          <div className="glass-card landing-priority-card">
            <span className="landing-card-number">01</span>
            <strong>Для детей и подростков</strong>
            <p>Возрастные программы до 18 лет.</p>
          </div>
          <div className="glass-card landing-priority-card">
            <span className="landing-card-number">02</span>
            <strong>Для взрослых</strong>
            <p>Повышение квалификации и переподготовка.</p>
          </div>
          <div className="glass-card landing-priority-card">
            <span className="landing-card-number">03</span>
            <strong>Цифровая среда</strong>
            <p>Личный кабинет и единая коммуникация с центром.</p>
          </div>
        </section>

        <section className="landing-container landing-site-map">
          <div className="landing-section-heading">
            <div>
              <div className="landing-overline">НАВИГАЦИЯ</div>
              <h2>Вся информация — по разделам</h2>
            </div>
            <p>На главной странице собраны основные сведения о КУДЕМА. Нужный раздел можно открыть сразу.</p>
          </div>

          <div className="landing-site-map-grid">
            {siteSections.map((section, index) => (
              <motion.button
                key={section.id}
                type="button"
                className="glass-card landing-site-card"
                onClick={() => navigateToSection(section.id)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <span>{section.number}</span>
                <strong>{section.title}</strong>
                <p>{section.text}</p>
                <em>Открыть раздел →</em>
              </motion.button>
            ))}
          </div>
        </section>

        <section id="about" className="landing-container landing-section-block">
          <div className="glass-card landing-about-card">
            <div className="landing-section-label">О ЦЕНТРЕ</div>
            <div className="landing-section-layout">
              <div>
                <h2>КУДЕМА — единая образовательная среда</h2>
                <p className="landing-lead">
                  Центр дополнительного образования и развития компетенций объединяет образовательные программы для детей, подростков и взрослых в одном понятном пространстве.
                </p>
              </div>
              <div className="landing-feature-grid">
                <div><span>01</span><strong>Понятная навигация</strong><p>Программы и официальная информация собраны по разделам.</p></div>
                <div><span>02</span><strong>Практический подход</strong><p>Обучение ориентировано на развитие знаний и компетенций.</p></div>
                <div><span>03</span><strong>Связь с центром</strong><p>Вопросы, звонки и отзывы доступны прямо с сайта.</p></div>
                <div><span>04</span><strong>Личный кабинет</strong><p>Для обучающихся доступна отдельная цифровая среда.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="programs" className="landing-container landing-section-block">
          <div className="landing-section-heading">
            <div>
              <div className="landing-overline">ДО 18 ЛЕТ</div>
              <h2>Общеобразовательные (общеразвивающие) программы</h2>
            </div>
            <p>Возрастные треки помогают быстро понять, какой формат обучения подходит на текущем этапе.</p>
          </div>

          <div className="landing-program-grid">
            {agePrograms.map((program, index) => (
              <motion.article
                key={program.age}
                className={`glass-card landing-program-card ${program.adult ? 'landing-program-card-adult' : ''}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <div className="landing-program-top">
                  <span className="landing-card-number">0{index + 1}</span>
                  <span className="landing-age-badge">{program.age}</span>
                </div>
                <h3>{program.title}</h3>
                <p>{program.text}</p>
                <button type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>Уточнить программу →</button>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="professional" className="landing-container landing-section-block">
          <div className="glass-card landing-professional-card">
            <div className="landing-professional-head">
              <div>
                <div className="landing-overline">18+</div>
                <h2>Повышение квалификации и профессиональная переподготовка</h2>
              </div>
              <button className="btn btn-primary" type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>
                Получить консультацию
              </button>
            </div>

            <div className="landing-adult-grid">
              <div><span>01</span><strong>Повышение квалификации</strong><p>Обновление и расширение профессиональных знаний.</p></div>
              <div><span>02</span><strong>Профессиональная переподготовка</strong><p>Освоение нового профессионального направления.</p></div>
              <div><span>03</span><strong>Индивидуальный маршрут</strong><p>Помощь в выборе подходящей программы обучения.</p></div>
            </div>
          </div>
        </section>

        <section id="documents" className="landing-container landing-section-block">
          <div className="landing-section-heading">
            <div>
              <div className="landing-overline">ОФИЦИАЛЬНАЯ ИНФОРМАЦИЯ</div>
              <h2>Документы</h2>
            </div>
            <p>Здесь размещается нормативная и организационная информация центра.</p>
          </div>

          <div className="landing-info-grid">
            <article className="glass-card">
              <span>01</span>
              <h3>Документы центра</h3>
              <p>Локальные документы и официальная информация КУДЕМА.</p>
              <button type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>Запросить документы →</button>
            </article>
            <article className="glass-card">
              <span>02</span>
              <h3>Образовательные программы</h3>
              <p>Описание программ и сведения об условиях обучения.</p>
              <button type="button" onClick={() => navigateToSection('programs')}>Перейти к программам →</button>
            </article>
            <article className="glass-card">
              <span>03</span>
              <h3>Вопросы по документам</h3>
              <p>Поможем сориентироваться, какая информация вам нужна.</p>
              <button type="button" onClick={() => setFeedbackAction(feedbackActions[0])}>Задать вопрос →</button>
            </article>
          </div>
        </section>

        <section id="materials" className="landing-container landing-section-block">
          <div className="landing-section-heading">
            <div>
              <div className="landing-overline">ДЛЯ ОБУЧЕНИЯ</div>
              <h2>Полезные материалы</h2>
            </div>
            <p>Памятки, рекомендации и материалы для обучающихся и родителей.</p>
          </div>

          <div className="landing-info-grid">
            <article className="glass-card">
              <span>Материал 01</span>
              <h3>Памятки для обучающихся</h3>
              <p>Полезные рекомендации по организации учебного процесса.</p>
              <a href="mailto:qudema@mail.ru?subject=Запрос полезных материалов">Запросить материал →</a>
            </article>
            <article className="glass-card">
              <span>Материал 02</span>
              <h3>Рекомендации для родителей</h3>
              <p>Информация о поддержке ребёнка в образовательном процессе.</p>
              <a href="mailto:qudema@mail.ru?subject=Материалы для родителей">Запросить материал →</a>
            </article>
            <article className="glass-card">
              <span>Материал 03</span>
              <h3>Публикации центра</h3>
              <p>Новости, заметки и образовательные материалы КУДЕМА.</p>
              <a href="mailto:qudema@mail.ru?subject=Публикации QUDEMA">Узнать подробнее →</a>
            </article>
          </div>
        </section>

        <section id="feedback" className="landing-container landing-section-block">
          <div className="landing-section-heading">
            <div>
              <div className="landing-overline">ОБРАТНАЯ СВЯЗЬ</div>
              <h2>Свяжитесь с центром</h2>
            </div>
            <p>Выберите удобный сценарий: вопрос, обратный звонок или отзыв.</p>
          </div>

          <div className="landing-feedback-grid">
            {feedbackActions.map((action) => (
              <button key={action.id} className="glass-card landing-feedback-card" type="button" onClick={() => setFeedbackAction(action)}>
                <span>{action.number}</span>
                <h3>{action.title}</h3>
                <p>{action.text}</p>
                <strong>Открыть →</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="landing-container landing-final-cta">
          <div className="glass-card landing-final-card">
            <div>
              <div className="landing-overline">QUDEMA</div>
              <h2>Начните с выбора направления</h2>
              <p>Посмотрите программы или свяжитесь с центром напрямую.</p>
            </div>
            <div className="landing-final-actions">
              <button className="btn btn-success" type="button" onClick={() => navigateToSection('programs')}>Смотреть программы</button>
              <a className="btn landing-secondary-button" href="tel:+79139415441">Позвонить</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <div className="landing-logo landing-logo-footer">
                <span className="landing-logo-word">QUDEMA</span>
                <span className="landing-logo-subtitle">Центр дополнительного образования</span>
              </div>
              <p>Центр дополнительного образования и развития компетенций.</p>
              <a href="https://qudema.ru/" target="_blank" rel="noreferrer">qudema.ru</a>
            </div>

            <div>
              <h4>Навигация</h4>
              {siteSections.map((section) => (
                <button key={section.id} type="button" onClick={() => navigateToSection(section.id)}>
                  {section.title}
                </button>
              ))}
            </div>

            <div>
              <h4>Контакты</h4>
              <a href="tel:+79139415441">+7 (913) 941-54-41</a>
              <a href="mailto:qudema@mail.ru">qudema@mail.ru</a>
              <p>Кудряшова Евгения</p>
              <p>630005, г. Новосибирск,<br />ул. Мичурина, 24</p>
            </div>

            <div className="landing-footer-social">
              <h4>Мы в сети</h4>
              <a href="https://t.me/+RdmaxmRsNcM4OTEy" target="_blank" rel="noreferrer">Telegram</a>
              <a href="https://vk.ru/qudema" target="_blank" rel="noreferrer">ВКонтакте</a>
              <div className="landing-qr-row">
                <a className="landing-qr" href="https://qudema.ru/" target="_blank" rel="noreferrer">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Fqudema.ru%2F" alt="QR-код официального сайта QUDEMA" />
                  <span>Сайт</span>
                </a>
                <a className="landing-qr" href="https://t.me/+RdmaxmRsNcM4OTEy" target="_blank" rel="noreferrer">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Ft.me%2F%2BRdmaxmRsNcM4OTEy" alt="QR-код Telegram QUDEMA" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <span>© 2026 КУДЕМА Официальный сайт центра</span>
            <a href="#top">Наверх ↑</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {feedbackAction && <FeedbackModal action={feedbackAction} onClose={() => setFeedbackAction(null)} />}
      </AnimatePresence>
    </div>
  );
}
