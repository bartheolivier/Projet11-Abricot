export default function ProjectDetails({ params }) {
  return (
    <div>
      <h1>Détails du projet {params.id}</h1>
      <p>Ici s'afficheront les tâches de ce projet spécifique.</p>
    </div>
  );
}