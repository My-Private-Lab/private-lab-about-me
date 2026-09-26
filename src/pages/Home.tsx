import { Link } from 'react-router-dom';
import { useTypedRole } from '../hooks/useTypedRole';
import { usePageMeta } from '../hooks/usePageMeta';
import { useLang } from '../i18n';
import { EmailIcon, TelegramIcon, LinkedInIcon, GitHubIcon } from '../icons';

export default function Home() {
  const { t } = useLang();
  usePageMeta({ title: t.home.title, home: true });
  const role = useTypedRole();

  return (
    <main className="card">
      <img
        src="/avatar.png"
        alt={t.home.avatarAlt}
        className="avatar"
        width={120}
        height={120}
        fetchPriority="high"
      />
      <h1>
        <strong>Igor</strong> Savin
      </h1>

      <h2 className="role">
        <span className="prompt" aria-hidden="true">
          $
        </span>
        <span className="typed" id="role">
          {role}
        </span>
        <span className="cursor" aria-hidden="true">
          _
        </span>
      </h2>

      <p className="description">{t.home.description}</p>

      <nav className="social-links" aria-label={t.home.socialLinks}>
        <a href="mailto:costonied@gmail.com" className="icon" aria-label={t.home.email}>
          <EmailIcon />
        </a>
        <a
          href="https://telegram.me/IgorSavin"
          target="_blank"
          rel="noopener noreferrer"
          className="icon"
          aria-label="Telegram"
        >
          <TelegramIcon />
        </a>
        <a
          href="https://www.linkedin.com/in/igor-savin-75045a52/"
          target="_blank"
          rel="noopener noreferrer"
          className="icon"
          aria-label="LinkedIn"
        >
          <LinkedInIcon />
        </a>
        <a
          href="https://github.com/Costonied"
          target="_blank"
          rel="noopener noreferrer"
          className="icon"
          aria-label="GitHub"
        >
          <GitHubIcon />
        </a>
      </nav>

      <nav className="nav-links" aria-label={t.home.sections}>
        <Link to="/utils" className="projects-link">
          {t.utils.title}
        </Link>
        <span className="nav-sep" aria-hidden="true">
          /
        </span>
        <Link to="/projects" className="projects-link">
          {t.projects.title}
        </Link>
      </nav>
    </main>
  );
}
