import React, { useEffect, useState, useMemo } from 'react';
import { PlusCircle, MoreVertical, Edit2, Trash2, DollarSign, Briefcase, Users, BarChart, CalendarDays, Tag, StickyNote, GripVertical, Filter, Search, Move } from 'lucide-react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { Deal, DealFormData } from '@/types/dealTypes';
import { PipelineStage as GlobalPipelineStage } from '@/types/pipelineTypes';
import { getPipelineStages } from '@/services/firebase/pipelineService';
import { 
  subscribeToDealsService, 
  deleteDealService, 
  updateDealStageService
} from '@/services/firebase/dealService';
import AddDealModal from './AddDealModal';
import DealCard from './DealCard';
import EditDealModal from './EditDealModal';
import DealDetailModal from './DealDetailModal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const DealsPage: React.FC = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineStages, setPipelineStages] = useState<GlobalPipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [selectedDealForEdit, setSelectedDealForEdit] = useState<Deal | null>(null);
  const [selectedDealForDetails, setSelectedDealForDetails] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDealDetailModalOpen, setIsDealDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchGlobalStages = async () => {
      try {
        const stages = await getPipelineStages();
        setPipelineStages(stages.sort((a, b) => a.order - b.order));
      } catch (err) {
        console.error("Fehler beim Laden der globalen Pipeline-Phasen:", err);
        setError("Fehler beim Laden der Pipeline-Konfiguration.");
        setPipelineStages([]);
      }
    };
    fetchGlobalStages();
  }, []);

  useEffect(() => {
    if (currentUser && pipelineStages.length > 0) {
      setIsLoading(true);
      const unsubscribe = subscribeToDealsService(
        currentUser.uid,
        (fetchedDeals) => {
          setDeals(fetchedDeals);
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error(err);
          setError("Fehler beim Laden der Deals.");
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else if (!authLoading) {
      setDeals([]);
      setIsLoading(false);
      if (pipelineStages.length === 0 && !error) {
      }
    }
  }, [currentUser, authLoading, pipelineStages, error]);

  const handleAddDealModalOpen = () => setIsAddDealModalOpen(true);
  const handleAddDealModalClose = () => setIsAddDealModalOpen(false);

  const handleEditDealModalOpen = (deal: Deal) => {
    setSelectedDealForEdit(deal);
    setIsEditDealModalOpen(true);
  };
  const handleEditDealModalClose = () => {
    setSelectedDealForEdit(null);
    setIsEditDealModalOpen(false);
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!currentUser) return;
    if (window.confirm("Sind Sie sicher, dass Sie diesen Deal löschen möchten?")) {
      try {
        await deleteDealService(currentUser.uid, dealId);
      } catch (err) {
        console.error("Error deleting deal:", err);
        setError("Fehler beim Löschen des Deals.");
      }
    }
  };

  const handleViewDetails = (deal: Deal) => {
    setSelectedDealForDetails(deal);
    setIsDealDetailModalOpen(true);
  };

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    if (!currentUser) return;
    try {
      await updateDealStageService(currentUser.uid, dealId, newStageId, pipelineStages);
    } catch (err) {
      console.error("Error moving deal:", err);
      setError("Fehler beim Verschieben des Deals.");
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStageId = destination.droppableId;
    
    if (!pipelineStages.find(stage => stage.id === newStageId)) {
        console.error("Invalid destination stage ID:", newStageId);
        return;
    }

    handleMoveDeal(draggableId, newStageId);
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [deals, searchTerm]);
  
  const getStageNameById = (stageId: string): string => {
    const stage = pipelineStages.find(s => s.id === stageId);
    return stage ? stage.name : "Unbekannte Phase";
  };

  const pipelineStats = useMemo(() => {
    const closedStageIds = pipelineStages.filter(s => s.name === 'Gewonnen' || s.name === 'Verloren').map(s => s.id);
    
    const activeDeals = filteredDeals.filter(d => !closedStageIds.includes(d.stageId));
    const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
    const dealsCount = activeDeals.length;
    const averageDealSize = dealsCount > 0 ? totalValue / dealsCount : 0;
    return {
      totalValue,
      dealsCount,
      averageDealSize
    };
  }, [filteredDeals, pipelineStages]);

  if (authLoading || (isLoading && deals.length === 0 && pipelineStages.length === 0) ) {
    return <div className="p-6 text-center text-sky-700">Lade Daten...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">{error}</div>;
  }
  
  if (pipelineStages.length === 0 && !error) {
    return <div className="p-6 text-center text-orange-500">Pipeline-Konfiguration wird geladen oder ist nicht vorhanden. Bitte überprüfen Sie die <a href="/settings" className="underline">Einstellungen</a>.</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen flex flex-col overflow-x-hidden min-w-0 max-w-6xl mx-auto">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <h1 className="text-3xl font-bold text-sky-800 mb-3 sm:mb-0">Deal Pipeline</h1>
            <button
            onClick={handleAddDealModalOpen}
            disabled={!currentUser || pipelineStages.length === 0} 
            className={`font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center w-full sm:w-auto justify-center ${currentUser && pipelineStages.length > 0 ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
            title={pipelineStages.length === 0 ? "Pipeline-Konfiguration nicht geladen" : "Neuen Deal erstellen"}
            >
            <PlusCircle size={20} className="mr-2" />
            Neuer Deal
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-lg shadow">
          <div className="text-center">
            <p className="text-sm text-slate-500">Gesamtwert Pipeline</p>
            <p className="text-2xl font-semibold text-emerald-600">{pipelineStats.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Aktive Deals</p>
            <p className="text-2xl font-semibold text-sky-600">{pipelineStats.dealsCount}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Ø Deal Größe</p>
            <p className="text-2xl font-semibold text-amber-600">{pipelineStats.averageDealSize.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-2 p-3 bg-white rounded-lg shadow items-center">
            <div className="relative flex-grow w-full md:w-auto">
                <input 
                    type="text"
                    placeholder="Deals suchen (Titel, Firma)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center w-full md:w-auto justify-center">
                 <Filter size={18} className="mr-2"/> Filter
            </button>
        </div>
      </header>

      {currentUser && pipelineStages.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="w-full pb-4">
            <div className="flex flex-col gap-4">
              {pipelineStages.map((stage) => (
                <Droppable key={stage.id} droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-slate-100 p-3 rounded-lg shadow-sm w-full ${snapshot.isDraggingOver ? 'bg-sky-100' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold text-slate-700" style={{ color: stage.color || 'inherit' }}>
                          {stage.name}
                        </h2>
                        <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                          {filteredDeals.filter(deal => deal.stageId === stage.id).length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[100px]">
                        {filteredDeals
                          .filter(deal => deal.stageId === stage.id)
                          .sort((a,b) => (a.updatedAt?.toMillis() || 0) - (b.updatedAt?.toMillis() || 0))
                          .map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(providedDraggable, snapshotDraggable) => (
                                <div
                                  ref={providedDraggable.innerRef}
                                  {...providedDraggable.draggableProps}
                                  {...providedDraggable.dragHandleProps}
                                  style={{
                                    ...providedDraggable.draggableProps.style,
                                    boxShadow: snapshotDraggable.isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
                                  }}
                                >
                                  <DealCard 
                                    deal={deal} 
                                    onViewDetails={() => handleViewDetails(deal)}
                                    onEdit={() => handleEditDealModalOpen(deal)}
                                    onDelete={() => handleDeleteDeal(deal.id)}
                                    stageColor={stage.color}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </DragDropContext>
      ) : (
         !isLoading && <div className="text-center p-6 text-slate-600">Keine Deals vorhanden oder Pipeline nicht geladen.</div>
      )}

      {isAddDealModalOpen && (
        <AddDealModal
          isOpen={isAddDealModalOpen}
          onClose={handleAddDealModalClose}
          userId={currentUser!.uid}
          pipelineStages={pipelineStages}
        />
      )}
       {isEditDealModalOpen && selectedDealForEdit && (
        <EditDealModal
          isOpen={isEditDealModalOpen}
          onClose={handleEditDealModalClose}
          deal={selectedDealForEdit}
          userId={currentUser!.uid}
          pipelineStages={pipelineStages}
        />
      )}
      {isDealDetailModalOpen && selectedDealForDetails && (
        <DealDetailModal
            isOpen={isDealDetailModalOpen}
            onClose={() => {
                setIsDealDetailModalOpen(false);
                setSelectedDealForDetails(null);
            }}
            deal={selectedDealForDetails}
            getStageNameById={getStageNameById}
            onEdit={() => {
                setIsDealDetailModalOpen(false);
                handleEditDealModalOpen(selectedDealForDetails);
            }}
            onDelete={() => {
                setIsDealDetailModalOpen(false);
                handleDeleteDeal(selectedDealForDetails.id);
                setSelectedDealForDetails(null);
            }}
        />
      )}
    </div>
  );
};

export default DealsPage; 