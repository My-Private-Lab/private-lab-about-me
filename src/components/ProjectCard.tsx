import { Link } from 'react-router-dom';
import type { ProjectItem } from '../data/projects';
import { useLang } from '../i18n';
import { ArrowRightIcon, ExternalLinkIcon } from '../icons';

export function ProjectCard({ id, title: brand, logo, href, linkLabel, internal }: ProjectItem) {
  const { t } = useLang();
  const texts = t.data[id];
  const title = 'title' in texts ? texts.title : (brand ?? id);

  return (
    <article className="project">
      {logo && <img className="project-logo" src={logo} alt={t.logoAlt(title)} loading="lazy" />}

      <div className="project-body">
        <h2>{title}</h2>

        {internal ? (
          <Link to={href} className="project-link">
            <ArrowRightIcon />
            {linkLabel}
          </Link>
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer" className="project-link">
            <ExternalLinkIcon />
            {linkLabel}
          </a>
        )}

        <p>{texts.description}</p>
      </div>
    </article>
  );
}
