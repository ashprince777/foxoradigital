import React, { useEffect, useState } from 'react';
import api from '../api/axios';
// Link removed as we open modal on click now
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, User } from 'lucide-react';
import ProjectModal from '../components/ProjectModal';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    clientId: string;
    client: { name: string };
    manager: { name: string } | null;
    creator?: { name: string };
    dueDate?: string;
    startDate?: string;
    priority?: string;
    billingType?: string;
    budget?: number;
}

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Columns configuration
    const columns = {
        PLANNING: { title: 'Planning', color: 'bg-blue-50', headerColor: 'border-blue-200' },
        ACTIVE: { title: 'Active', color: 'bg-green-50', headerColor: 'border-green-200' },
        ON_HOLD: { title: 'Requests / On Hold', color: 'bg-yellow-50', headerColor: 'border-yellow-200' },
        COMPLETED: { title: 'Completed', color: 'bg-purple-50', headerColor: 'border-purple-200' },
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleProjectSaved = () => {
        fetchProjects();
    };

    const handleNewProject = () => {
        setSelectedProject(null);
        setIsModalOpen(true);
    };

    const handleEditProject = (project: Project) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;

        // Optimistically update UI
        const updatedProjects = projects.map((p) =>
            p.id === draggableId ? { ...p, status: newStatus } : p
        );
        setProjects(updatedProjects);

        try {
            await api.put(`/projects/${draggableId}`, { status: newStatus });
        } catch (error) {
            console.error('Failed to update project status', error);
            fetchProjects(); // Revert on failure
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading projects...</div>;

    const getProjectsByStatus = (status: string) => {
        return projects.filter((p) => p.status === status);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-display">Projects</h1>
                    <p className="mt-1 text-gray-500">Manage your projects and workflows</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleNewProject}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 flex items-center transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Project
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-6 h-full min-w-[1000px] pb-4">
                        {Object.entries(columns).map(([status, config]) => {
                            const columnProjects = getProjectsByStatus(status);
                            return (
                                <div
                                    key={status}
                                    className="flex flex-col w-80 flex-shrink-0 rounded-xl bg-transparent"
                                >
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-bold text-gray-700">{config.title}</h3>
                                            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                {columnProjects.length}
                                            </span>
                                        </div>
                                    </div>

                                    <Droppable droppableId={status}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 ${config.color} bg-opacity-30 rounded-xl p-4 transition-colors overflow-y-auto custom-scrollbar ${snapshot.isDraggingOver ? 'bg-gray-50 ring-2 ring-indigo-50/50' : ''
                                                    }`}
                                            >
                                                <div className="space-y-4">
                                                    {columnProjects.map((project, index) => (
                                                        <Draggable
                                                            key={project.id}
                                                            draggableId={project.id}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{ ...provided.draggableProps.style }}
                                                                    onClick={() => handleEditProject(project)}
                                                                    className={`bg-white p-4 rounded-lg shadow-card border border-transparent hover:shadow-soft cursor-pointer transition-all group ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 z-50' : ''
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <h4 className="font-bold text-gray-900 leading-snug hover:text-indigo-600 transition-colors">
                                                                            {project.name.startsWith('[REQUEST]') ? (
                                                                                <>
                                                                                    <span className="block text-[10px] text-amber-600 font-extrabold uppercase tracking-wider mb-1">
                                                                                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 animate-pulse"></span>
                                                                                        New Request
                                                                                    </span>
                                                                                    {project.name.replace('[REQUEST]', '').trim()}
                                                                                </>
                                                                            ) : project.name}
                                                                        </h4>
                                                                    </div>

                                                                    {project.description && (
                                                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                                                            {project.description}
                                                                        </p>
                                                                    )}

                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center text-xs text-gray-500">
                                                                            <User className="h-3 w-3 mr-1.5 text-gray-400" />
                                                                            <span className="truncate">{project.client.name}</span>
                                                                        </div>

                                                                        <div className="flex items-center text-xs text-gray-500">
                                                                            <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
                                                                            {project.startDate && project.dueDate ? (
                                                                                <span>{format(new Date(project.startDate), 'M/d/yyyy')} - {format(new Date(project.dueDate), 'M/d/yyyy')}</span>
                                                                            ) : project.dueDate ? (
                                                                                <span>Due {format(new Date(project.dueDate), 'M/d/yyyy')}</span>
                                                                            ) : (
                                                                                <span>No dates set</span>
                                                                            )}
                                                                        </div>
                                                                        {project.creator && (
                                                                            <div className="flex items-center text-xs text-gray-500">
                                                                                <User className="h-3 w-3 mr-1.5 text-gray-400" />
                                                                                <span className="truncate">Created by: {project.creator.name}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>


                                                                    <div className="mt-4 flex items-center justify-between">
                                                                        {/* Mock Budget & Priority for visual parity with screenshot */}
                                                                        <span className="text-sm font-bold text-gray-900">{project.budget ? `$${project.budget.toLocaleString()}` : '$0.00'}</span>
                                                                        <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-md ${project.priority === 'URGENT' ? 'bg-red-50 text-red-700' :
                                                                            project.priority === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                                                                                project.priority === 'LOW' ? 'bg-green-50 text-green-700' :
                                                                                    'bg-indigo-50 text-indigo-700'
                                                                            }`}>
                                                                            {project.priority || 'Medium'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            </div>
                                        )
                                        }
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </div >
            </DragDropContext >

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectSaved={handleProjectSaved}
                projectToEdit={selectedProject}
            />
        </div >
    );
};

export default Projects;
