import { useState, useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocketService';

export const useElphieWebSocket = () => {
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [pendingCandle, setPendingCandle] = useState(null);
    const [pendingMetrics, setPendingMetrics] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const handleServerDefaultDate = (info) => {
            const ymd = info?.date;
            if (!ymd) return;
            setSelectedDate(ymd);
            websocketService.selectDate({ date: ymd, ticker: info.ticker, interval: info.interval });
        };

        const handleAnalysisHistory = (history) => {
            console.log("useElphieWebSocket: Received analysis_history:", history ? history.length : 0, "items");
            setAnalysisHistory(history);
        };

        const handleNewAnalysisPoint = (point) => {
            // console.log("useElphieWebSocket: Received new_analysis_point:", point); // Removed verbose logging
            setAnalysisHistory(prevHistory => [...prevHistory, point]);
        };

        const handlePendingCandle = (candle) => {
            // console.log("useElphieWebSocket: Received pending_candle:", candle); // Removed verbose logging
            setPendingCandle(candle);
        };

        const handlePendingMetrics = (metrics) => {
            // console.log("useElphieWebSocket: Received pending_metrics:", metrics); // Removed verbose logging
            setPendingMetrics(metrics);
        };

        websocketService.on('server_default_date', handleServerDefaultDate);
        websocketService.on('analysis_history', handleAnalysisHistory);
        websocketService.on('new_analysis_point', handleNewAnalysisPoint);
        websocketService.on('pending_candle', handlePendingCandle);
        websocketService.on('pending_metrics', handlePendingMetrics);

        // Cleanup function to remove listeners on component unmount
        return () => {
            websocketService.off('server_default_date', handleServerDefaultDate);
            websocketService.off('analysis_history', handleAnalysisHistory);
            websocketService.off('new_analysis_point', handleNewAnalysisPoint);
            websocketService.off('pending_candle', handlePendingCandle);
            websocketService.off('pending_metrics', handlePendingMetrics);
        };
    }, []);

    const selectDate = useCallback((ymd, opts = {}) => {
        setSelectedDate(ymd);
        websocketService.selectDate({ date: ymd, ...opts });
        // Reset UI state while new data loads
        setAnalysisHistory([]);
        setPendingCandle(null);
        setPendingMetrics(null);
    }, []);

    return { analysisHistory, pendingCandle, pendingMetrics, selectedDate, selectDate };
};
