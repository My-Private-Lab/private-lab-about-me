import { usePageMeta } from '../hooks/usePageMeta';
import { BackLink } from '../components/BackLink';
import { ProjectCard } from '../components/ProjectCard';
import { utils } from '../data/projects';

export default function Utils() {
  usePageMeta({ title: 'Utils — Igor Savin' });

  return (
    <main className="card card-projects">
      <h1>
        <BackLink to="/" label="Back to Home" />
        Utils
      </h1>
      <p className="description">Useful utils designed for personal and team use</p>

      {utils.map((util) => (
        <ProjectCard key={util.title} {...util} />
      ))}
    </main>
  );
}
