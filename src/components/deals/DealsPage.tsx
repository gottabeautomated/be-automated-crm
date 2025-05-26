import React, { useEffect, useState, useMemo } from 'react';
import { PlusCircle, MoreVertical, Edit2, Trash2, DollarSign, Briefcase, Users, BarChart, CalendarDays, Tag, StickyNote, GripVertical, Filter, Search, Move } from 'lucide-react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { Deal, DealFormData, PIPELINE_STAGES as DEAL_STAGES, PipelineStage } from '@/types/dealTypes';
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
// import DealDetailModal from './DealDetailModal'; // To be created

const DealsPage: React.FC = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: States for Modals: isAddModalOpen, isEditModalOpen, selectedDeal
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  
  // TODO: States for other modals (edit, details)
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false); // State für Edit Modal
  const [selectedDealForEdit, setSelectedDealForEdit] = useState<Deal | null>(null);
  const [selectedDealForDetails, setSelectedDealForDetails] = useState<Deal | null>(null);

  // TODO: States for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  // ... other filter states (dateRange, valueRange, tags)

  const [isDealDetailModalOpen, setIsDealDetailModalOpen] = useState(false); // State für Detail-Modal Sichtbarkeit

  useEffect(() => {
    if (currentUser) {
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
    } else if (!authLoading) { // Nur ausführen, wenn Authentifizierung abgeschlossen ist
      setDeals([]);
      setIsLoading(false);
    }
  }, [currentUser, authLoading]);

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
        // Subscription wird UI aktualisieren
      } catch (err) {
        console.error("Error deleting deal:", err);
        setError("Fehler beim Löschen des Deals.");
      }
    }
  };

  const handleViewDetails = (deal: Deal) => {
    setSelectedDealForDetails(deal);
    setIsDealDetailModalOpen(true); // Modal öffnen
    // console.log("View details:", deal);
  };

  const handleMoveDeal = async (dealId: string, newStage: Deal['stage']) => {
    if (!currentUser) return;
    try {
      await updateDealStageService(currentUser.uid, dealId, newStage);
      // Optimistic update (optional, da Firebase Listener aktualisiert)
      // setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? {...d, stage: newStage } : d));
    } catch (err) {
      console.error("Error moving deal:", err);
      setError("Fehler beim Verschieben des Deals.");
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Do nothing if dropped outside a droppable area
    if (!destination) {
      return;
    }

    // Do nothing if dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStage = destination.droppableId as PipelineStage;
    // It's good practice to ensure the newStage is actually a valid stage
    if (!DEAL_STAGES.includes(newStage)) {
        console.error("Invalid destination stage:", newStage);
        return;
    }

    handleMoveDeal(draggableId, newStage);
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchTerm.toLowerCase())
      // TODO: Add other filter logic here
    );
  }, [deals, searchTerm]);

  const pipelineStats = useMemo(() => {
    const activeDeals = filteredDeals.filter(d => d.stage !== 'Abgeschlossen' && d.stage !== 'Verloren');
    const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
    const dealsCount = activeDeals.length;
    const averageDealSize = dealsCount > 0 ? totalValue / dealsCount : 0;
    return {
      totalValue,
      dealsCount,
      averageDealSize
    };
  }, [filteredDeals]);

  if (isLoading || authLoading) { // authLoading ebenfalls berücksichtigen
    return <div className="p-6 text-center text-sky-700">Lade Deals...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen flex flex-col">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <h1 className="text-3xl font-bold text-sky-800 mb-3 sm:mb-0">Deal Pipeline</h1>
            <button
            onClick={handleAddDealModalOpen}
            disabled={!currentUser} // Button deaktivieren, wenn kein Benutzer angemeldet ist
            className={`font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center w-full sm:w-auto justify-center ${currentUser ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
            >
            <PlusCircle size={20} className="mr-2" />
            Neuer Deal
            </button>
        </div>

        {/* Stats Bar */}
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

        {/* Filter and Search Bar */}
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
                <Filter size={18} className="mr-1.5" /> Filter
            </button>
            {/* TODO: Add more filter inputs here (date range, value range, tags) */}
        </div>
      </header>

      {isAddDealModalOpen && currentUser && (
        <AddDealModal 
          isOpen={isAddDealModalOpen} 
          onClose={handleAddDealModalClose} 
          userId={currentUser.uid}
        />
      )}

      {isEditDealModalOpen && selectedDealForEdit && currentUser && (
        <EditDealModal
          isOpen={isEditDealModalOpen}
          onClose={handleEditDealModalClose}
          userId={currentUser.uid}
          dealToEdit={selectedDealForEdit}
          // onDealUpdated={() => console.log("Deal updated, refresh maybe?")}
        />
      )}

      {isDealDetailModalOpen && selectedDealForDetails && (
        <DealDetailModal
          isOpen={isDealDetailModalOpen}
          onClose={() => setIsDealDetailModalOpen(false)}
          deal={selectedDealForDetails}
        />
      )}

      {!currentUser && !authLoading && (
        <div className="text-center text-slate-500 py-10 flex-grow flex items-center justify-center">
          <p>Bitte melden Sie sich an, um Ihre Deals zu sehen.</p>
        </div>
      )}

      {currentUser && filteredDeals.length === 0 && !isLoading && (
         <div className="text-center text-slate-500 py-10 flex-grow flex items-center justify-center">
            <p>Noch keine Deals vorhanden oder Filterkriterien ergaben keine Treffer. Erstellen Sie Ihren ersten Deal!</p>
        </div>
      )}

      {currentUser && filteredDeals.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {DEAL_STAGES.map((stage) => (
              <div key={stage} className="bg-slate-100 p-3 rounded-lg shadow flex flex-col min-w-[280px]">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-sky-700 capitalize flex items-center">
                      {stage}
                    </h2>
                    <span className="text-sm font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {filteredDeals.filter(d => d.stage === stage).length}
                    </span>
                </div>
                <Droppable droppableId={stage} key={stage}> 
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-grow min-h-[250px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 space-y-2 ${snapshot.isDraggingOver ? 'bg-sky-100' : ''}`}
                    >
                      {filteredDeals
                        .filter(deal => deal.stage === stage)
                        .map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(providedDraggable, snapshotDraggable) => (
                              <DealCard 
                                  deal={deal} 
                                  index={index}
                                  onEdit={handleEditDealModalOpen}
                                  onDelete={handleDeleteDeal}
                                  onViewDetails={handleViewDetails}
                                  innerRef={providedDraggable.innerRef}
                                  draggableProps={providedDraggable.draggableProps}
                                  dragHandleProps={providedDraggable.dragHandleProps}
                              />
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                      {filteredDeals.filter(d => d.stage === stage).length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-sm text-slate-400 text-center pt-10">Keine Deals in dieser Phase.</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default DealsPage; 