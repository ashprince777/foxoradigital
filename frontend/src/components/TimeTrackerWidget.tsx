import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../api/axios';

const TimeTrackerWidget: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [entryId, setEntryId] = useState<string | null>(null);
    const [description, setDescription] = useState('');

    const [isIdle, setIsIdle] = useState(false);
    const [isBillable, setIsBillable] = useState(true);
    const lastActivityRef = React.useRef(Date.now());
    const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
        // Check for active timer and Auto-Start if none
        const checkAndStartTimer = async () => {
            try {
                const response = await api.get('/time/current');
                if (response.data) {
                    // Resume existing timer
                    setEntryId(response.data.id);
                    const startTime = new Date(response.data.startTime).getTime();
                    setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
                    setIsActive(true);
                    setDescription(response.data.description || '');
                    setIsBillable(response.data.isBillable);
                } else {
                    // AUTO START (User Requirement)
                    try {
                        const startResponse = await api.post('/time/start', {
                            description: 'Auto-started session',
                            isBillable: true
                        });
                        setEntryId(startResponse.data.id);
                        setIsActive(true);
                        setDescription('Auto-started session');
                        // Do not auto-expand so it's not annoying, but it is running.
                    } catch (err) {
                        console.error('Failed to auto-start timer', err);
                    }
                }
            } catch (error) {
                console.error('Failed to check active timer', error);
            }
        };

        checkAndStartTimer();
    }, []);

    useEffect(() => {
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
            if (isIdle) setIsIdle(false);
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);

        const idleCheckInterval = setInterval(() => {
            if (isActive && Date.now() - lastActivityRef.current > IDLE_THRESHOLD) {
                setIsIdle(true);
            }
        }, 10000); // Check every 10 seconds

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            clearInterval(idleCheckInterval);
        };
    }, [isActive, isIdle]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = async () => {
        if (!description.trim()) {
            setIsExpanded(true);
            // Optionally focus input
            return;
        }
        try {
            const response = await api.post('/time/start', { description, isBillable });
            setEntryId(response.data.id);
            setIsActive(true);
            setIsExpanded(true);
            setIsIdle(false);
            lastActivityRef.current = Date.now();
        } catch (error) {
            console.error('Failed to start timer', error);
        }
    };

    const [accumulatedIdleTime, setAccumulatedIdleTime] = useState(0);

    // ... (rest of idle detection logic) ...

    useEffect(() => {
        let correctionInterval: NodeJS.Timeout;
        if (isIdle && isActive) {
            correctionInterval = setInterval(() => {
                setAccumulatedIdleTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(correctionInterval);
    }, [isIdle, isActive]);

    const handleStop = async () => {
        if (!entryId) return;
        try {
            await api.put(`/time/${entryId}/stop`, { idleDuration: accumulatedIdleTime });
            setIsActive(false);
            setEntryId(null);
            setElapsedTime(0);
            setDescription('');
            setIsIdle(false);
            setAccumulatedIdleTime(0);
        } catch (error) {
            console.error('Failed to stop timer', error);
        }
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-auto'}`}>
            {isIdle && isActive && (
                <div className="absolute bottom-full mb-4 right-0 w-80 bg-amber-50 border border-amber-200 p-4 rounded-lg shadow-lg animate-bounce">
                    <p className="text-amber-800 font-bold mb-1">Are you still working?</p>
                    <p className="text-amber-700 text-sm">You have been idle for over 5 minutes.</p>
                </div>
            )}
            <div className="bg-white shadow-card-hover rounded-xl border border-gray-100 overflow-hidden">
                {/* Header (Always Visible) */}
                <div
                    className="bg-gray-900 text-white p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center space-x-3">
                        <Clock className={`h-5 w-5 ${isActive ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
                        <span className="font-mono font-medium text-lg tracking-wider">
                            {formatTime(elapsedTime)}
                        </span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="p-4 bg-white animate-fade-in-up">
                        <input
                            type="text"
                            placeholder="What are you working on?"
                            className="w-full text-sm border-gray-200 rounded-lg mb-4 focus:ring-indigo-500 focus:border-indigo-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isActive}
                        />

                        <div className="flex items-center mb-4">
                            <input
                                id="billable-checkbox"
                                type="checkbox"
                                checked={isBillable}
                                onChange={(e) => setIsBillable(e.target.checked)}
                                disabled={isActive}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="billable-checkbox" className="ml-2 block text-sm text-gray-900">
                                Billable
                            </label>
                        </div>

                        <div className="flex justify-between items-center">
                            {!isActive ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleStart(); }}
                                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Play className="h-4 w-4 fill-current" />
                                    <span>Start Timer</span>
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleStop(); }}
                                    className="w-full flex items-center justify-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Square className="h-4 w-4 fill-current" />
                                    <span>Stop Timer</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeTrackerWidget;
