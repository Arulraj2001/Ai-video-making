import React, { useState } from "react";
import { useRouter } from "../../router/Router";
import { useApp } from "../../context/AppContext";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button, IconButton } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Search, Plus, Trash2, Calendar, Sliders, ArrowRight, Film } from "lucide-react";

export const ProjectsListPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    projects,
    activeProject,
    projectsLoading,
    projectsError,
    selectProject,
    deleteProject,
    refreshProjects,
    setIsCreateModalOpen,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenStudio = (id: string) => {
    selectProject(id);
    navigate(`/app/studio/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteProject(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        title="All Projects"
        subtitle={`Managing ${projects.length} video production workspace${projects.length === 1 ? "" : "s"}.`}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Project
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftElement={<Search size={15} />}
        />
      </div>

      {/* Projects Grid */}
      {projectsLoading ? (
        <Card variant="default" className="p-12 text-center text-xs text-[var(--color-text-muted)]">
          Loading your projects...
        </Card>
      ) : projectsError ? (
        <Card variant="default" className="p-12 text-center">
          <p className="text-sm text-[var(--color-error)]">{projectsError}</p>
          <button
            onClick={() => refreshProjects()}
            className="app-action-link mt-3"
          >
            Try again
          </button>
        </Card>
      ) : filteredProjects.length === 0 ? (
        searchTerm ? (
          <Card variant="default" className="p-12 text-center text-xs text-[var(--color-text-muted)]">
            No projects match your search query.
          </Card>
        ) : (
          <Card variant="default" className="p-12 sm:p-16 text-center border-dashed border-2 border-[var(--border)] bg-[var(--surface-alt)]/50 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/5 border border-[#FF6B00]/30 flex items-center justify-center mx-auto mb-5 text-[#FF6B00]">
              <Film size={28} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">
              You haven't created a video yet
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 leading-relaxed">
              Upload a voiceover or generate narration to start your first scene-based video.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={15} />}
              rightIcon={<ArrowRight size={15} />}
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 font-semibold shadow-lg"
            >
              Create Your First Video →
            </Button>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const isActive = activeProject?.id === project.id;
            const sceneCount = project.scenes?.length || 0;
            const formattedDate = new Date(project.updated_at).toLocaleDateString();

            return (
              <Card
                key={project.id}
                variant="project"
                className="flex flex-col justify-between p-5 group relative"
                onClick={() => handleOpenStudio(project.id)}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={isActive ? "primary" : "default"}>
                      {project.canvas_settings?.aspect_ratio || "16:9"}
                    </Badge>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={13} className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]" />}
                      aria-label="Delete project"
                      onClick={(e) => handleDelete(e, project.id, project.name)}
                      title="Delete project"
                    />
                  </div>

                  <h3 className="text-sm font-bold text-[var(--color-text)] font-display group-hover:text-[var(--color-primary)] transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                    {project.description || "Video project storyboard and timeline"}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Sliders size={12} /> {sceneCount} scenes
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <Calendar size={12} /> {formattedDate}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
