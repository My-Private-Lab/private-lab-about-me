import { usePageMeta } from '../hooks/usePageMeta';
import { BackLink } from '../components/BackLink';
import { ProjectCard } from '../components/ProjectCard';
import { petProjects } from '../data/projects';
import { useLang } from '../i18n';

export default function Projects() {
  const { t } = useLang();
  usePageMeta({ title: t.pageTitle(t.projects.title) });

  return (
    <main className="card card-projects">
      <h1>
        <BackLink to="/" label={t.backToHome} />
        {t.projects.title}
      </h1>
      <p className="description">{t.projects.description}</p>

      {petProjects.map((project) => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </main>
  );
}
