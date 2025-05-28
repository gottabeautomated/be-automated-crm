import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit2, Trash2, GripVertical } from 'lucide-react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import { PipelineStage } from '@/types/pipelineTypes';
import {
  getPipelineStages,
  savePipelineStage,
  deletePipelineStage,
  saveAllPipelineStages,
  initializeDefaultPipelineStages
} from '@/services/firebase/pipelineService';

// Typ für die DnD Items
const ItemTypes = {
  STAGE: 'stage',
};

interface DraggableStageRowProps {
  stage: PipelineStage;
  index: number;
  moveStage: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (stage: PipelineStage) => void;
  onDelete: (stageId: string) => void;
}

const DraggableStageRow: React.FC<DraggableStageRowProps> = ({ stage, index, moveStage, onEdit, onDelete }) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STAGE,
    hover(item: any, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveStage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.STAGE,
    item: { id: stage.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // drag und drop werden mit dem Ref der TableRow verbunden.
  // preview wird ebenfalls auf die TableRow gesetzt, um die gesamte Zeile als Vorschau zu ziehen.
  drag(drop(ref));

  return (
    <TableRow 
      ref={ref} // Ref für Drag & Drop und Preview hier setzen
      key={stage.id} 
      data-id={stage.id} 
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
    >
      <TableCell className="cursor-move text-muted-foreground hover:text-foreground"> {/* Kein separates Ref hier nötig */}
         <GripVertical className="h-5 w-5" />
      </TableCell>
      <TableCell className="font-medium">{stage.name}</TableCell>
      <TableCell className="text-right">{stage.probability !== undefined ? `${stage.probability}%` : 'N/A'}</TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          <div style={{ backgroundColor: stage.color }} className="w-6 h-6 rounded-full border" title={stage.color}></div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => onEdit(stage)} title="Bearbeiten">
          <Edit2 className="h-4 w-4" />
        </Button>
        {(stage.id !== 'won' && stage.id !== 'lost') && (
          <Button variant="ghost" size="icon" onClick={() => onDelete(stage.id)} title="Löschen" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

interface EditStageModalProps {
  stage: PipelineStage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stage: PipelineStage) => void;
  existingStageIds: string[];
}

const EditStageModal: React.FC<EditStageModalProps> = ({ stage, isOpen, onClose, onSave, existingStageIds }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [probability, setProbability] = useState<number | string>('');
  const [color, setColor] = useState('#3B82F6');
  const [idError, setIdError] = useState('');

  const isNewStage = !stage;

  useEffect(() => {
    if (stage) {
      setId(stage.id);
      setName(stage.name);
      setProbability(stage.probability !== undefined ? stage.probability : '');
      setColor(stage.color || '#3B82F6');
      setIdError('');
    } else {
      // Reset für neue Stage
      setId('');
      setName('');
      setProbability('');
      setColor('#3B82F6');
      setIdError('');
    }
  }, [stage, isOpen]);

  const handleSave = () => {
    if (!id.trim() && isNewStage) {
        setIdError('Die ID darf nicht leer sein.');
        return;
    }
    if (isNewStage && existingStageIds.includes(id.trim())) {
        setIdError('Diese ID existiert bereits. Bitte wählen Sie eine eindeutige ID.');
        return;
    }
    if (!name.trim()) {
        toast.error('Der Name der Stage darf nicht leer sein.');
        return;
    }
    const probNumber = probability === '' ? undefined : Number(probability);
    if (probNumber !== undefined && (isNaN(probNumber) || probNumber < 0 || probNumber > 100)) {
        toast.error('Die Wahrscheinlichkeit muss eine Zahl zwischen 0 und 100 sein oder leer bleiben.');
        return;
    }

    onSave({
      id: id.trim(),
      name: name.trim(),
      probability: probNumber,
      color,
      order: stage?.order ?? 0 // Order wird außerhalb des Modals verwaltet
    });
    onClose();
  };
  
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value.toLowerCase().replace(/\s+/g, '-'); // Kleinbuchstaben, ersetzt Leerzeichen durch Bindestriche
    setId(newId);
    if (idError && (!isNewStage || !existingStageIds.includes(newId.trim()))) {
        setIdError('');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isNewStage ? 'Neue Stage hinzufügen' : 'Stage bearbeiten'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isNewStage && (
            <div>
              <Label htmlFor="stageId">Stage ID (eindeutig, keine Leerzeichen)</Label>
              <Input id="stageId" value={id} onChange={handleIdChange} placeholder="z.b. 'qualifiziert'" />
              {idError && <p className="text-sm text-red-600 mt-1">{idError}</p>}
              <p className="text-xs text-muted-foreground mt-1">Wird automatisch in Kleinbuchstaben und mit Bindestrichen formatiert.</p>
            </div>
          )}
          <div>
            <Label htmlFor="stageName">Name der Stage</Label>
            <Input id="stageName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Angezeigter Name" />
          </div>
          <div>
            <Label htmlFor="stageProbability">Wahrscheinlichkeit (%)</Label>
            <Input id="stageProbability" type="number" min="0" max="100" value={probability} onChange={(e) => setProbability(e.target.value)} placeholder="0-100 (optional)" />
          </div>
          <div>
            <Label htmlFor="stageColor">Farbe</Label>
            <div className="flex items-center space-x-2">
                <Input id="stageColor" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-10 p-1"/>
                <Input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#RRGGBB" className="flex-grow"/>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={handleSave}>{isNewStage ? 'Hinzufügen' : 'Speichern'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PipelineSettingsTab: React.FC = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStages = async () => {
      setIsLoading(true);
      try {
        await initializeDefaultPipelineStages(); 
        const fetchedStages = await getPipelineStages();
        setStages(fetchedStages.sort((a,b) => a.order - b.order)); // Sicherstellen, dass sie sortiert sind
      } catch (error) {
        console.error("Fehler beim Laden der Pipeline-Stages: ", error);
        toast.error('Fehler beim Laden der Pipeline-Stages.');
        setStages([]); 
      }
      setIsLoading(false);
    };
    fetchStages();
  }, []);

  const moveStage = (dragIndex: number, hoverIndex: number) => {
    setStages((prevStages) => {
      const newStages = [...prevStages];
      const [draggedItem] = newStages.splice(dragIndex, 1);
      newStages.splice(hoverIndex, 0, draggedItem);
      // Aktualisiere die 'order' Property für alle Stages
      return newStages.map((stage, index) => ({ ...stage, order: index }));
    });
  };

  const handleSaveStage = async (stageToSave: PipelineStage) => {
    const isNew = !stages.find(s => s.id === stageToSave.id);
    let newOrder = stageToSave.order;

    if (isNew) {
      const maxOrder = stages.reduce((max, s) => Math.max(max, s.order), -1);
      newOrder = maxOrder + 1;
    }

    const stageWithCorrectOrder = { ...stageToSave, order: newOrder };

    try {
      await savePipelineStage(stageWithCorrectOrder); // Speichert die einzelne Stage
      setStages(prevStages => {
        let updatedStages;
        if (isNew) {
          updatedStages = [...prevStages, stageWithCorrectOrder];
        } else {
          updatedStages = prevStages.map(s => s.id === stageWithCorrectOrder.id ? stageWithCorrectOrder : s);
        }
        // Nach dem Hinzufügen oder Bearbeiten die gesamte Liste neu sortieren und 'order' aktualisieren
        return updatedStages.sort((a,b) => a.order - b.order).map((s, idx) => ({ ...s, order: idx }));
      });
      toast.success(`Stage '${stageToSave.name}' erfolgreich ${isNew ? 'hinzugefügt' : 'aktualisiert'}.`);
      setEditingStage(null);
      // Optional: Nach dem Speichern einer einzelnen Stage die gesamte Liste in Firestore synchronisieren,
      // um Konsistenz sicherzustellen, falls die Order-Logik komplexer wird oder Fehler auftreten.
      // await handleSaveChangesGeneral(); // Überdenken, ob das hier nötig ist oder nur nach D&D
    } catch (error) {
      console.error("Fehler beim Speichern der Stage: ", error);
      toast.error("Fehler beim Speichern der Stage.");
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      await deletePipelineStage(stageId);
      const remainingStages = stages.filter(s => s.id !== stageId);
      // Aktualisiere die 'order' Property für die verbleibenden Stages
      const updatedStages = remainingStages.map((s, index) => ({...s, order: index}));
      await saveAllPipelineStages(updatedStages); // Speichere alle (neu geordneten) Stages
      setStages(updatedStages.sort((a,b) => a.order - b.order));
      toast.success(`Stage erfolgreich gelöscht.`);
    } catch (error) {
      console.error("Fehler beim Löschen der Stage: ", error);
      toast.error("Fehler beim Löschen der Stage.");
    }
  };
  
  const handleOpenModal = (stage: PipelineStage | null = null) => {
    setEditingStage(stage);
    setIsModalOpen(true);
  };

  const handleSaveChangesGeneral = async () => {
    try {
      // Stelle sicher, dass die 'order' Property aktuell ist, bevor gespeichert wird
      const correctlyOrderedStages = stages.map((stage, index) => ({ ...stage, order: index }));
      await saveAllPipelineStages(correctlyOrderedStages); 
      setStages(correctlyOrderedStages); // Update lokalen State mit korrekter Order
      toast.success('Pipeline-Einstellungen erfolgreich in Firestore gespeichert!');
    } catch (error) {
      console.error("Fehler beim Speichern der Pipeline-Einstellungen: ", error);
      toast.error('Fehler beim Speichern der Pipeline-Einstellungen.');
    }
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pipeline Konfiguration</CardTitle>
                <CardDescription>
                    Passen Sie die Phasen Ihrer Verkaufspipeline an, definieren Sie Wahrscheinlichkeiten und Farben.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
                <p>Lade Pipeline-Stages...</p> 
            </CardContent>
        </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Konfiguration</CardTitle>
          <CardDescription>
            Passen Sie die Phasen Ihrer Verkaufspipeline an, definieren Sie Wahrscheinlichkeiten und Farben.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pipeline Stages</h3>
            <Button onClick={() => handleOpenModal(null)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Neue Stage
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead> 
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Wahrscheinlichkeit</TableHead>
                  <TableHead className="text-center">Farbe</TableHead>
                  <TableHead className="text-right w-32">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((stage, index) => (
                  <DraggableStageRow
                    key={stage.id}
                    index={index}
                    stage={stage}
                    moveStage={moveStage}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteStage}
                  />
                ))}
                {stages.length === 0 && !isLoading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Noch keine Pipeline-Stages definiert. Fügen Sie die erste Stage hinzu!
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Passen Sie die Reihenfolge der Stages per Drag & Drop an. Klicken Sie auf "Pipeline-Einstellungen speichern", um die neue Reihenfolge zu persistieren.
          </p>

          <div className="pt-6 text-right">
            <Button onClick={handleSaveChangesGeneral}>Pipeline-Einstellungen speichern</Button>
          </div>
        </CardContent>

        <EditStageModal 
            stage={editingStage}
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingStage(null); }}
            onSave={handleSaveStage}
            existingStageIds={stages.map(s => s.id).filter(id => id !== editingStage?.id)}
        />
      </Card>
    </DndProvider>
  );
};

export default PipelineSettingsTab; 