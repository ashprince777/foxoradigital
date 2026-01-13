import React, { useEffect, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api/axios';

const localizer = momentLocalizer(moment);

interface ContentItem {
    id: string;
    title: string;
    scheduledDate: string;
    type: string;
    status: string;
}

const Calendar: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const [contentResponse, tasksResponse] = await Promise.all([
                    api.get('/content'),
                    api.get('/tasks')
                ]);

                const contentEvents = contentResponse.data.map((item: ContentItem) => ({
                    id: `content-${item.id}`,
                    title: item.title,
                    start: new Date(item.scheduledDate),
                    end: new Date(item.scheduledDate),
                    allDay: true,
                    resource: { ...item, type: 'CONTENT' },
                }));

                const taskEvents = tasksResponse.data
                    .filter((task: any) => task.scheduledDate)
                    .map((task: any) => ({
                        id: `task-${task.id}`,
                        title: task.title, // Removed "Task:" prefix for cleaner list
                        start: new Date(task.scheduledDate),
                        end: new Date(task.scheduledDate),
                        allDay: true,
                        resource: { ...task, type: 'TASK' },
                        style: { backgroundColor: '#10B981', borderColor: '#059669' } // Green for tasks
                    }));

                setEvents([...contentEvents, ...taskEvents]);
            } catch (error) {
                console.error('Failed to fetch calendar events', error);
            }
        };
        fetchEvents();
    }, []);

    const handleSelectSlot = (slotInfo: { start: Date }) => {
        setSelectedDate(slotInfo.start);
    };

    const selectedEvents = events.filter(event =>
        selectedDate &&
        moment(event.start).isSame(selectedDate, 'day')
    );

    return (
        <div className="h-screen p-4 flex flex-col overflow-y-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Content Calendar</h1>
            <p className="text-gray-500 mb-6">Schedule and manage your content postings</p>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={(event) => setSelectedDate(event.start)}
                    onDrillDown={(date) => setSelectedDate(date)}
                    eventPropGetter={(event: any) => {
                        if (event.resource?.type === 'TASK') {
                            return {
                                style: {
                                    backgroundColor: '#10B981',
                                    borderColor: '#059669',
                                    color: 'white',
                                    borderRadius: '4px',
                                    display: 'block'
                                }
                            };
                        }
                        return {};
                    }}
                />
            </div>

            {selectedDate && (
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 012 2V7a2 2 0 01-2-2H5a2 2 0 01-2 2v12a2 2 0 012 2z" />
                        </svg>
                        <h2 className="text-lg font-bold text-gray-800">
                            {moment(selectedDate).format('dddd, MMMM D, YYYY')}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {selectedEvents.length === 0 ? (
                            <p className="text-gray-500 italic">No events scheduled for this day.</p>
                        ) : (
                            selectedEvents.map(event => (
                                <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-gray-900 mb-1">{event.title}</h3>
                                        <div className="text-sm text-gray-500 mb-2">
                                            {event.resource?.project?.name || event.resource?.client?.name || 'No Project'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {moment(event.start).format('h:mm A')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <div className="flex gap-2">
                                            {event.resource?.serviceType && (
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded font-medium">
                                                    {event.resource.serviceType}
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 text-xs rounded font-medium ${event.resource?.type === 'TASK' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {event.resource?.status || 'Scheduled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
