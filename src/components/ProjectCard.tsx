import type { ProjectItem } from '../data/projects';
import { ExternalLinkIcon } from '../icons';

export function ProjectCard({ title, logo, href, linkLabel, description }: ProjectItem) {
  return (
    <article className="project">
      {logo && <img className="project-logo" src={logo} alt={`${title} logo`} loading="lazy" />}

      <div className="project-body">
        <h2>{title}</h2>

        <a href={href} target="_blank" rel="noopener noreferrer" className="project-link">
          <ExternalLinkIcon />
          {linkLabel}
        </a>

        <p>{description}</p>
      </div>
    </article>
  );
}
