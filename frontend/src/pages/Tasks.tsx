import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import CreateTaskModal from '../components/CreateTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import { format } from 'date-fns';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Client {
    id: string;
    name: string;
}

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    project?: { name: string };
    client?: { name: string };
    clientId?: string;
    assignee?: { name: string };
    creator?: { name: string };
    dueDate?: string;
    scheduledDate?: string;
    updatedAt: string;
}

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scheduleTask, setScheduleTask] = useState<Task | null>(null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        }
    };

    const handleTaskCreated = () => {
        fetchTasks();
    };

    const handleTaskUpdated = () => {
        fetchTasks();
        setIsEditModalOpen(false);
        setEditingTaskId(null);
    };

    const handleEditClick = (taskId: string) => {
        setEditingTaskId(taskId);
        setIsEditModalOpen(true);
    };

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const task = tasks.find(t => t.id === draggableId);
        if (!task) return;

        // Prevent moving tasks out of 'Completed' if they are scheduled
        if (source.droppableId === 'DONE' && task.scheduledDate && destination.droppableId !== 'DONE') {
            alert("Scheduled tasks cannot be moved from Completed status.");
            return;
        }

        const newStatus = destination.droppableId;

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t.id === draggableId ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        try {
            await api.put(`/tasks/${draggableId}`, { status: newStatus });
        } catch (error) {
            console.error('Failed to update task status', error);
            fetchTasks(); // Revert on failure
        }
    };

    const handleSchedule = (task: Task) => {
        setScheduleTask(task);
    };

    const handleScheduleConfirm = async (date: Date) => {
        if (!scheduleTask) return;

        try {
            await api.put(`/tasks/${scheduleTask.id}`, {
                scheduledDate: date.toISOString()
            });
            setScheduleTask(null);
            fetchTasks();
        } catch (error) {
            console.error('Failed to schedule task', error);
        }
    };

    const columns = {
        'TODO': { title: 'To Do', className: 'border-t-4 border-indigo-500' },
        'IN_PROGRESS': { title: 'In Progress', className: 'border-t-4 border-blue-500' },
        'REVIEW': { title: 'Review', className: 'border-t-4 border-yellow-500' },
        'DONE': { title: 'Completed', className: 'border-t-4 border-green-500' }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'MEDIUM': return 'bg-blue-100 text-blue-800';
            case 'LOW': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) return <div>Loading tasks...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage and track your tasks</p>
                </div>
                <div className="flex items-center space-x-4">
                    <select
                        className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        <option value="">All Clients</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
                    >
                        + New Task
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-12rem)] overflow-x-auto">
                    {Object.entries(columns).map(([columnId, column]) => (
                        <div key={columnId} className="flex flex-col h-full bg-gray-50 rounded-lg p-4">
                            <div className={`flex items-center justify-between mb-4`}>
                                <h3 className="font-medium text-gray-900">{column.title}</h3>
                                <span className="bg-white text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full border border-gray-200">
                                    {tasks.filter(t => t.status === columnId).length}
                                </span>
                            </div>

                            <Droppable droppableId={columnId}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 overflow-y-auto min-h-[100px] ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                                            }`}
                                    >
                                        {tasks
                                            .filter(task => task.status === columnId)
                                            .filter(task => !selectedClientId || task.clientId === selectedClientId)
                                            .sort((a, b) => {
                                                if (columnId === 'DONE') {
                                                    // Newest completed tasks on top
                                                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                                                }
                                                return 0; // Default order for other columns
                                            })
                                            .map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow cursor-pointer ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-indigo-500 ring-opacity-20 z-50' : ''
                                                                }`}
                                                            onClick={() => handleEditClick(task.id)}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
                                                                <button className="text-gray-400 hover:text-gray-600">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M12 3v18" />
                                                                    </svg>
                                                                </button>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                <span className="text-xs text-gray-500">{task.client?.name || task.project?.name}</span>
                                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded ${getPriorityColor(task.priority)}`}>
                                                                    {task.priority || 'MEDIUM'}
                                                                </span>
                                                            </div>
                                                            {task.creator && (
                                                                <div className="text-xs text-gray-400 mb-2">
                                                                    Created by: {task.creator.name}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center text-xs text-gray-500 mb-4">
                                                                <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 012 2V7a2 2 0 01-2-2H5a2 2 0 01-2 2v12a2 2 0 012 2z" />
                                                                </svg>
                                                                Due: {task.dueDate ? format(new Date(task.dueDate), 'MM/dd/yyyy') : 'No date'}
                                                            </div>

                                                            {columnId === 'DONE' && (
                                                                <div className="mt-3 flex space-x-2" onClick={(e) => e.stopPropagation()}>
                                                                    {task.scheduledDate ? (
                                                                        <button
                                                                            onClick={() => handleSchedule(task)}
                                                                            className="flex-1 bg-amber-500 text-white text-xs px-3 py-2 rounded font-medium hover:bg-amber-600 transition-colors flex items-center justify-center"
                                                                        >
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 012 2V7a2 2 0 01-2-2H5a2 2 0 01-2 2v12a2 2 0 012 2z" />
                                                                            </svg>
                                                                            Reschedule
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleSchedule(task)}
                                                                            className="flex-1 bg-green-600 text-white text-xs px-3 py-2 rounded font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                                                                        >
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 012 2V7a2 2 0 01-2-2H5a2 2 0 01-2 2v12a2 2 0 012 2z" />
                                                                            </svg>
                                                                            Schedule for Posting
                                                                        </button>
                                                                    )}
                                                                    <button className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={handleTaskCreated}
            />

            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                taskId={editingTaskId}
                onTaskUpdated={handleTaskUpdated}
            />

            {scheduleTask && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Task</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Select a date to schedule "{scheduleTask.title}" for posting.
                        </p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const date = formData.get('scheduledDate') as string;
                            if (date) {
                                handleScheduleConfirm(new Date(date));
                            }
                        }}>
                            <input
                                type="datetime-local"
                                name="scheduledDate"
                                required
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-4 p-2 border"
                            />
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setScheduleTask(null)}
                                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
