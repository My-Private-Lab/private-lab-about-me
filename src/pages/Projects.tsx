import { usePageMeta } from '../hooks/usePageMeta';
import { BackLink } from '../components/BackLink';
import { ProjectCard } from '../components/ProjectCard';
import { petProjects } from '../data/projects';

export default function Projects() {
  usePageMeta({ title: 'Pet-projects — Igor Savin' });

  return (
    <main className="card card-projects">
      <h1>
        <BackLink to="/" label="Back to Home" />
        Pet-projects
      </h1>
      <p className="description">
        In my free time, I enjoy working on side projects with my friends to explore new
        technologies and solve interesting problems. Here are a couple of projects I've been
        working on:
      </p>

      {petProjects.map((project) => (
        <ProjectCard key={project.title} {...project} />
      ))}
    </main>
  );
}
