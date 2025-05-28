import React, { useEffect, useState } from 'react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { Task, subscribeToTasksService, updateTaskService, addTaskService, deleteTaskService } from '@/services/firebase/taskService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PlusCircle, Trash2, Edit2, Link2 } from 'lucide-react';
import TaskModal from './TaskModal';
import { Timestamp } from 'firebase/firestore';
import { Tooltip } from 'react-tooltip';
import { subscribeToDealsService } from '@/services/firebase/dealService';

const STATUS_COLUMNS = [
  { key: 'open', label: 'Offen' },
  { key: 'in_progress', label: 'In Bearbeitung' },
  { key: 'done', label: 'Erledigt' },
];

const TaskKanbanBoard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    setIsLoading(true);
    const unsubscribe = subscribeToTasksService(
      user.uid,
      (tasks) => {
        setTasks(tasks);
        setIsLoading(false);
      },
      (err) => {
        setError('Fehler beim Laden der Aufgaben.');
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribeDeals = subscribeToDealsService(
      user.uid,
      (deals) => setDeals(deals),
      (err) => console.error('Fehler beim Laden der Deals:', err)
    );
    return () => unsubscribeDeals();
  }, [user?.uid]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Task['status'];
    const task = tasks.find(t => t.id === draggableId);
    if (!task || task.status === newStatus) return;
    try {
      await updateTaskService(user!.uid, task.id, { status: newStatus });
    } catch (err) {
      setError('Fehler beim Verschieben der Aufgabe.');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!user?.uid) return;
    if (!window.confirm('Aufgabe wirklich löschen?')) return;
    try {
      await deleteTaskService(user.uid, taskId);
    } catch (err) {
      setError('Fehler beim Löschen der Aufgabe.');
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: Timestamp | null;
    status: 'open' | 'in_progress' | 'done';
    relatedDealId?: string;
    relatedContactId?: string;
  }) => {
    if (!user?.uid) return;
    try {
      const payload: Partial<Task> = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        relatedDealId: taskData.relatedDealId,
        relatedContactId: taskData.relatedContactId,
      };
      if (taskData.dueDate) {
        payload.dueDate = taskData.dueDate;
      }
      if (selectedTask) {
        await updateTaskService(user.uid, selectedTask.id, payload);
      } else {
        await addTaskService(user.uid, payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError('Fehler beim Speichern der Aufgabe.');
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sky-800">Aufgaben</h1>
        <button className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700" onClick={handleAddTask}>
          <PlusCircle className="mr-2 h-5 w-5" /> Aufgabe anlegen
        </button>
      </header>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUS_COLUMNS.map(col => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-white rounded-lg shadow p-4 min-h-[400px] ${snapshot.isDraggingOver ? 'bg-sky-50' : ''}`}
                >
                  <h2 className="text-lg font-semibold mb-4 text-sky-700">{col.label}</h2>
                  {tasks.filter(t => t.status === col.key).map((task, idx) => (
                    <Draggable draggableId={task.id} index={idx} key={task.id}>
                      {(providedDraggable, snapshotDraggable) => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          className={`mb-4 p-4 rounded border shadow-sm bg-slate-50 ${snapshotDraggable.isDragging ? 'ring-2 ring-sky-300' : ''}`}
                          data-tooltip-id={`task-tooltip-${task.id}`}
                          data-tooltip-html={`<div class='text-left'><div class='font-bold text-sky-800 mb-1'>${task.title}</div>${task.description ? `<div class='mb-1 text-xs text-slate-700'>${task.description}</div>` : ''}${task.dueDate ? `<div class='mb-1 text-xs text-slate-500'>Fällig: ${task.dueDate.toDate().toLocaleDateString('de-DE')} ${task.dueDate.toDate().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>` : ''}<div class='mb-1 text-xs'>Status: <span class='font-medium'>${task.status === 'open' ? 'Offen' : task.status === 'in_progress' ? 'In Bearbeitung' : 'Erledigt'}</span></div>${task.relatedDealId ? `<div class='mb-1 text-xs'>Deal: ${deals.find(d => d.id === task.relatedDealId)?.title || 'Unbekannt'}</div>` : ''}${task.relatedContactId ? `<div class='mb-1 text-xs'>Kontakt-ID: ${task.relatedContactId}</div>` : ''}</div>`}
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                            <button onClick={() => handleEditTask(task)} className="text-sky-600 hover:text-sky-800" title="Bearbeiten">
                              <Edit2 className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            {task.relatedDealId && <span title="Verknüpfter Deal"><Link2 className="h-4 w-4 text-emerald-600" /></span>}
                            {task.relatedContactId && <span title="Verknüpfter Kontakt"><Link2 className="h-4 w-4 text-amber-600" /></span>}
                            <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          {task.description && <div className="text-xs text-slate-600 mb-2">{task.description}</div>}
                          {task.dueDate && <div className="text-xs text-slate-500">Fällig: {task.dueDate.toDate().toLocaleDateString('de-DE')}</div>}
                          <Tooltip id={`task-tooltip-${task.id}`} place="top" className="max-w-xs" />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        initialData={selectedTask || undefined}
      />
    </div>
  );
};

export default TaskKanbanBoard; 