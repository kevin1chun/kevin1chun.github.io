import React, { useRef, useEffect, useState } from 'react';
import { Box, createTheme, CssBaseline, ThemeProvider, Typography, Paper, Stack, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useElphieWebSocket } from './hooks/useElphieWebSocket';
import ElphieChart from './components/ElphieChart';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#131722',
            paper: '#1e222d',
        },
        text: {
            primary: '#d1d4dc',
        },
    },
});

function App() {
    const { analysisHistory, pendingCandle, selectedDate, selectDate } = useElphieWebSocket();
    const elphieChartRef = useRef();
    const [highlightedData, setHighlightedData] = useState(null);
    const [inputDate, setInputDate] = useState(selectedDate || '');
    const [dateValue, setDateValue] = useState(selectedDate ? dayjs(selectedDate) : null);

    useEffect(() => {
        if (selectedDate) {
            setInputDate(selectedDate);
            setDateValue(dayjs(selectedDate));
        }
    }, [selectedDate]);

    // Log analysisHistory whenever it changes
    useEffect(() => {
        console.log("App.jsx: analysisHistory updated:", analysisHistory ? analysisHistory.length : 0, "items");
    }, [analysisHistory]);

    const handleCrosshairMove = (data) => {
        setHighlightedData(data);
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #2a2e39' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="h6" sx={{ color: '#d1d4dc' }}>Elphie</Typography>
                            <DatePicker
                                label="Trading Session"
                                value={dateValue}
                                format="YYYY-MM-DD"
                                onChange={(newVal) => {
                                    setDateValue(newVal);
                                    const ymd = newVal ? newVal.format('YYYY-MM-DD') : '';
                                    setInputDate(ymd);
                                    // Auto-load data when date changes
                                    if (ymd) {
                                        selectDate(ymd);
                                    }
                                }}
                                slotProps={{ textField: { size: 'small' } }}
                            />
                            {selectedDate && (
                                <Typography variant="body2" sx={{ color: '#8b93a5' }}>
                                    Selected: {selectedDate}
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                <Box sx={{ flexGrow: 1 }}>
                    <ElphieChart ref={elphieChartRef} analysisHistory={analysisHistory} pendingCandle={pendingCandle} onCrosshairMove={handleCrosshairMove} />
                </Box>
                {highlightedData && (
                    <Paper sx={{ p: 2, m: 1, backgroundColor: '#1e222d', color: '#d1d4dc' }}>
                        <Typography variant="h6">Candle Details</Typography>
                        <Typography>Time: {new Date(highlightedData.candle.periodStart).toLocaleString()}</Typography>
                        <Typography>Open: ${(highlightedData.candle.open / 100).toFixed(2)}</Typography>
                        <Typography>High: ${(highlightedData.candle.high / 100).toFixed(2)}</Typography>
                        <Typography>Low: ${(highlightedData.candle.low / 100).toFixed(2)}</Typography>
                        <Typography>Close: ${(highlightedData.candle.close / 100).toFixed(2)}</Typography>
                        <Typography>Volume: {highlightedData.candle.volume}</Typography>
                        <Typography>Dark Pool Volume: ${(highlightedData.darkPoolSum / 100).toLocaleString()}</Typography>
                        <Typography>Dark Pool VWAP: ${(highlightedData.darkPoolVWAP / 100).toFixed(2)}</Typography>
                        <Typography>Sweep At Bid: {highlightedData.sweepAtBid}</Typography>
                        <Typography>Sweep At Ask: {highlightedData.sweepAtAsk}</Typography>
                        <Typography>Sweep Unknown: {highlightedData.sweepUnknown}</Typography>
                        <Typography>Sweep Ratio: {highlightedData.sweepRatio.toFixed(4)}</Typography>
                    </Paper>
                )}
                </Box>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
