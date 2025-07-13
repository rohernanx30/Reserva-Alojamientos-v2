import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react';
import { getReservations } from '../../services/BookingsService';
import { getAccommodations } from '../../services/AccommodationsService';
import Modal from '../Common/Modal';
import ReservationForm from '../Reservations/ReservationForm';
import { Reservation, Accommodation } from '../../types';
// Importaciones de FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';


const ReservationCalendar: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAccommodation, setSelectedAccommodation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchGuest, setSearchGuest] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(true); // estado para mostrar/ocultar filtros
  const calendarRef = useRef<FullCalendar | null>(null); // referencia para fullcalendar
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    getReservations().then(setReservations);
    getAccommodations().then(setAccommodations);
  }, []);

  useEffect(() => {
  Promise.all([
    getReservations().then(setReservations),
    getAccommodations().then(setAccommodations)
  ]).finally(() => setIsLoadingData(false));
}, []);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const calendarEvents = useMemo(() => {
    return reservations
      .filter(reservation => {
        const matchesAccommodation = selectedAccommodation === 'all' || reservation.accommodationId === selectedAccommodation;
        const matchesStatus = selectedStatus === 'all' || reservation.status.toLowerCase() === selectedStatus.toLowerCase();
        const matchesGuest = !searchGuest || reservation.guestName.toLowerCase().includes(searchGuest.toLowerCase());
        return matchesAccommodation && matchesStatus && matchesGuest;
      })
      .map(reservation => ({
        id: reservation.id.toString(),
        title: `${reservation.guestName} - ${reservation.accommodationName}`,
        start: reservation.checkIn,
        end: new Date(new Date(reservation.checkOut).getTime() + 24 * 60 * 60 * 1000), // Añadimos un día para incluir el checkout, esto se debe a que FullCalendar considera el `end` como exclusivo
        allDay: true,
        extendedProps: {
          status: reservation.status, 
        },
        classNames: [`event-${reservation.status.toLowerCase()}`],
      }));
  }, [reservations, selectedAccommodation, selectedStatus, searchGuest]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

const navigateMonth = (direction: 'prev' | 'next') => {
  if (calendarRef.current) {
    const calendarApi = calendarRef.current.getApi();
    if (direction === 'prev') {
      calendarApi.prev();
    } else {
      calendarApi.next();
    }
    setCurrentDate(calendarApi.getDate());
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)} 
            className="px-4 py-2 rounded-md flex items-center space-x-2 transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reservación</span>
          </button>
        </div>
      </div>

        {showFilters && ( 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alojamiento</label>
              <select
                value={selectedAccommodation}
                onChange={(e) => setSelectedAccommodation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los alojamientos</option>
                {accommodations.map((accommodation) => (
                  <option key={accommodation.id} value={accommodation.id}>
                    {accommodation.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="PENDING">Pendiente</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar huésped</label>
              <input
                type="text"
                value={searchGuest}
                onChange={(e) => setSearchGuest(e.target.value)}
                placeholder="Nombre del huésped..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <FullCalendar
          ref={calendarRef} 
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth" 
          events={calendarEvents} 
          locale={esLocale} 
          headerToolbar={{
            left: '', 
            center: '', 
            right: '', 
          }}
          datesSet={(dateInfo) => {
            setCurrentDate(dateInfo.view.calendar.getDate());
          }}
          eventContent={(arg) => {
            const status = arg.event.extendedProps.status;
            const statusClass = getStatusColor(status.toUpperCase()); 
            return (
              <div className={`p-1 rounded text-xs truncate cursor-pointer ${statusClass}`} title={arg.event.title}>
                <div className="font-medium truncate">{arg.event.title.split(' - ')[0]}</div>
                <div className="truncate">{arg.event.title.split(' - ')[1]}</div>
              </div>
            );
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-sm text-gray-700">Confirmada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-sm text-gray-700">Pendiente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-sm text-gray-700">Cancelada</span>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Nueva Reservación"
        size="lg"
      >
         <ReservationForm onClose={() => setIsFormModalOpen(false)} onCreated={() => {
          setIsFormModalOpen(false);
          getReservations().then(setReservations); 
        }} />
      </Modal>
    </div>
  );
};

export default ReservationCalendar;