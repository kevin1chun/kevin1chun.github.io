// Use environment variable for WebSocket URL, fallback to same-host for local dev
const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;
const socket = new WebSocket(wsUrl);

const listeners = {
    analysis_history: [],
    new_analysis_point: [],
    pending_candle: [],
    pending_metrics: [],
    server_default_date: [],
    error: [],
    open: [],
    close: []
};

// Cache the latest payload per type so late subscribers can immediately receive
const latestByType = {};

socket.onopen = () => {
    console.log("WebSocket connection established");
    listeners.open.forEach(cb => cb());
};

socket.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);
        if (!message || !message.type) return;
        
        // Debug logging for analysis_history messages
        if (message.type === 'analysis_history') {
            console.log("WebSocket received analysis_history:", message.data ? message.data.length : 0, "items");
        }
        
        const list = listeners[message.type];
        if (!list) return;
        const payload = Object.prototype.hasOwnProperty.call(message, 'data') ? message.data : message;
        latestByType[message.type] = payload;
        list.forEach(cb => cb(payload));
    } catch (error) {
        console.error("Error parsing WebSocket message:", error);
    }
};

socket.onclose = () => {
    console.log("WebSocket connection closed. Attempting to reconnect in 5s...");
    setTimeout(() => {
        window.location.reload();
    }, 5000);
};

export const websocketService = {
    on(event, callback) {
        if (listeners[event]) {
            listeners[event].push(callback);
            if (Object.prototype.hasOwnProperty.call(latestByType, event)) {
                try { callback(latestByType[event]); } catch (e) { /* noop */ }
            }
        }
    },
    off(event, callback) {
        if (listeners[event]) {
            const index = listeners[event].indexOf(callback);
            if (index > -1) {
                listeners[event].splice(index, 1);
            }
        }
    },
    selectDate({ date, ticker, interval }) {
        const msg = { type: 'select_date', date };
        if (ticker) msg.ticker = ticker;
        if (interval) msg.interval = interval;
        try {
            socket.send(JSON.stringify(msg));
        } catch (e) {
            console.error('Failed to send select_date:', e);
        }
    }
};
