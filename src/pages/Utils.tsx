import { usePageMeta } from '../hooks/usePageMeta';
import { BackLink } from '../components/BackLink';
import { ProjectCard } from '../components/ProjectCard';
import { utils } from '../data/projects';
import { useLang } from '../i18n';

export default function Utils() {
  const { t } = useLang();
  usePageMeta({ title: t.pageTitle(t.utils.title) });

  return (
    <main className="card card-projects">
      <h1>
        <BackLink to="/" label={t.backToHome} />
        {t.utils.title}
      </h1>
      <p className="description">{t.utils.description}</p>

      {utils.map((util) => (
        <ProjectCard key={util.id} {...util} />
      ))}
    </main>
  );
}
