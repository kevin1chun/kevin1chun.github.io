import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import PropTypes from 'prop-types';

// Helper function to format large numbers into a compact string (e.g., 1,234,567 -> "1.2M")
function formatMillions(value) {
    if (value === null || value === undefined) return 'N/A';
    if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
    }
    // For values less than 1 million, use locale-specific formatting (e.g., 123,456 -> "123.5K")
    if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString();
}

// Calculate dark pool circle size based on dollar volume
function calculateDarkPoolCircleSize(darkPoolSum) {
    const sumInMillions = darkPoolSum / 100 / 1000000; // Convert cents to millions
    
    // Defined size points: 10M=2px, 25M=3px, 100M=4px, 500M=6px, 750M=7px, 1B=8px, 1.5B=9px, 2B=10px
    const sizePoints = [
        { value: 10, size: 2 },
        { value: 25, size: 3 },
        { value: 100, size: 4 },
        { value: 500, size: 6 },
        { value: 750, size: 7 },
        { value: 1000, size: 8 },
        { value: 1500, size: 9 },
        { value: 2000, size: 10 }
    ];
    
    // Find the appropriate size bracket
    for (let i = 0; i < sizePoints.length - 1; i++) {
        if (sumInMillions <= sizePoints[i].value) {
            return sizePoints[i].size;
        }
        if (sumInMillions >= sizePoints[i].value && sumInMillions <= sizePoints[i + 1].value) {
            // Linear interpolation between points
            const ratio = (sumInMillions - sizePoints[i].value) / (sizePoints[i + 1].value - sizePoints[i].value);
            return Math.round(sizePoints[i].size + (sizePoints[i + 1].size - sizePoints[i].size) * ratio);
        }
    }
    
    // Return max size if above all points
    return sizePoints[sizePoints.length - 1].size;
}

const ElphieChart = forwardRef(({ analysisHistory, pendingCandle, onCrosshairMove }, ref) => {
    // Refs to hold the chart container, chart instance, and series instances
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const candlestickSeriesRef = useRef();
    const sweepAtBidSeriesRef = useRef();
    const sweepAtAskSeriesRef = useRef();
    const sweepUnknownSeriesRef = useRef();
    const darkPoolSmallSeriesRef = useRef();
    const darkPoolMediumSeriesRef = useRef();
    const darkPoolLargeSeriesRef = useRef();
    const darkPoolXLargeSeriesRef = useRef();
    const legendRef = useRef();
    const isHistoryLoaded = useRef(false);

    // Expose the chart instance to the parent component via ref
    useImperativeHandle(ref, () => ({
        chart: chartRef.current,
        series: {
            candlestick: candlestickSeriesRef.current,
            sweepAtBid: sweepAtBidSeriesRef.current,
            sweepAtAsk: sweepAtAskSeriesRef.current,
            sweepUnknown: sweepUnknownSeriesRef.current,
            darkPoolSmall: darkPoolSmallSeriesRef.current,
            darkPoolMedium: darkPoolMediumSeriesRef.current,
            darkPoolLarge: darkPoolLargeSeriesRef.current,
            darkPoolXLarge: darkPoolXLargeSeriesRef.current,
        },
    }));

    // Effect for chart initialization (runs only once on mount)
    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            layout: {
                background: { color: '#222' },
                textColor: '#DDD',
            },
            grid: {
                vertLines: { color: '#444' },
                horzLines: { color: '#444' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
                borderColor: '#444',
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            panes: [
                { height: 70 }, // Main pane for candlesticks
                { height: 30 }, // Bottom pane for volume histograms
            ],
        });

        chartRef.current = chart;

        // --- Price Pane (Candlesticks) ---
        candlestickSeriesRef.current = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
        }, 0); // Assign to pane 0

        // --- Volume Pane (Histograms) ---
        // Sweeps at bid = selling pressure (BRIGHT RED)
        sweepAtBidSeriesRef.current = chart.addSeries(HistogramSeries, {
            color: '#ff1744', // Bright red for selling pressure
            priceFormat: { type: 'volume' },
            base: 0, // Start from zero for individual bars
        }, 1); // Assign to pane 1

        // Sweeps at ask = buying pressure (BRIGHT GREEN)  
        sweepAtAskSeriesRef.current = chart.addSeries(HistogramSeries, {
            color: '#00e676', // Bright green for buying pressure
            priceFormat: { type: 'volume' },
            base: 0, // Start from zero for individual bars
        }, 1); // Assign to pane 1

        // Unknown sweeps - neutral (YELLOW/ORANGE)
        sweepUnknownSeriesRef.current = chart.addSeries(HistogramSeries, {
            color: '#ffa726', // Orange/yellow for unknown - more distinct than white
            priceFormat: { type: 'volume' },
            base: 0, // Start from zero for individual bars
        }, 1); // Assign to pane 1

        // --- Dark Pool Series (Multiple sizes) ---
        // Small: 10M-100M (3px)
        darkPoolSmallSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(153, 102, 255, 0.5)',
            lineWidth: 0,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 3,
            crosshairMarkerBorderColor: 'rgba(153, 102, 255, 0.8)',
            crosshairMarkerBackgroundColor: 'rgba(153, 102, 255, 0.3)',
            lastValueVisible: false,
            priceLineVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 3, // Small circles
        }, 0);

        // Medium: 100M-500M (5px)
        darkPoolMediumSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(153, 102, 255, 0.6)',
            lineWidth: 0,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            crosshairMarkerBorderColor: 'rgba(153, 102, 255, 0.8)',
            crosshairMarkerBackgroundColor: 'rgba(153, 102, 255, 0.3)',
            lastValueVisible: false,
            priceLineVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 5, // Medium circles
        }, 0);

        // Large: 500M-1B (7px)
        darkPoolLargeSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(153, 102, 255, 0.7)',
            lineWidth: 0,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 7,
            crosshairMarkerBorderColor: 'rgba(153, 102, 255, 0.8)',
            crosshairMarkerBackgroundColor: 'rgba(153, 102, 255, 0.3)',
            lastValueVisible: false,
            priceLineVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 7, // Large circles
        }, 0);

        // XLarge: 1B+ (9px)
        darkPoolXLargeSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(153, 102, 255, 0.8)',
            lineWidth: 0,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 9,
            crosshairMarkerBorderColor: 'rgba(153, 102, 255, 0.9)',
            crosshairMarkerBackgroundColor: 'rgba(153, 102, 255, 0.4)',
            lastValueVisible: false,
            priceLineVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 9, // XLarge circles
        }, 0);

        // --- Legend Creation ---
        const legend = document.createElement('div');
        legend.style = `
            position: absolute;
            left: 12px;
            top: 12px;
            z-index: 100;
            font-size: 14px;
            font-family: sans-serif;
            line-height: 1.5;
            font-weight: 300;
            color: #DDD;
            background-color: rgba(34, 34, 34, 0.7);
            padding: 8px;
            border-radius: 4px;
            pointer-events: none;
        `;
        chartContainerRef.current.appendChild(legend);
        legendRef.current = legend;

        // Cleanup function to remove the chart instance when the component unmounts
        return () => {
            chart.remove();
            isHistoryLoaded.current = false;
        };
    }, []); // This effect runs only once

    // Dedicated effect for crosshair subscription to avoid stale closures
    useEffect(() => {
        if (!chartRef.current) return;

        const crosshairMoveHandler = param => {
            if (!param.time || !legendRef.current) {
                legendRef.current.innerHTML = '';
                if (onCrosshairMove) onCrosshairMove(null);
                return;
            }

            const originalPoint = analysisHistory.find(p => p.candle.periodStart / 1000 === param.time);

            if (onCrosshairMove) {
                onCrosshairMove(originalPoint || null);
            }

            if (originalPoint) {
                const ohlc = `O: ${(originalPoint.candle.open / 100).toFixed(2)} H: ${(originalPoint.candle.high / 100).toFixed(2)} L: ${(originalPoint.candle.low / 100).toFixed(2)} C: ${(originalPoint.candle.close / 100).toFixed(2)}`;
                const sweepMetrics = `
                    <span style="color: #ff1744;">Bid: ${formatMillions(originalPoint.sweepAtBid)}</span> | 
                    <span style="color: #00e676;">Ask: ${formatMillions(originalPoint.sweepAtAsk)}</span> | 
                    <span style="color: #ffa726;">Unk: ${formatMillions(originalPoint.sweepUnknown)}</span>
                `;

                // Updated logic to calculate and display Dark Pool Dollar Volume
                let darkPoolInfo = '';
                if (originalPoint.darkPoolVWAP && originalPoint.darkPoolSum) {
                    const dpVwap = originalPoint.darkPoolVWAP / 100; // Convert from cents to dollars
                    const dpVolume = originalPoint.darkPoolSum / 100; // Convert from cents to dollars
                    const largestTxn = originalPoint.largestDarkPoolTxn / 100; // Convert from cents to dollars
                    darkPoolInfo = `<div>DP VWAP: $${dpVwap.toFixed(2)} | $ Vol: ${formatMillions(dpVolume)} | Largest: ${formatMillions(largestTxn)}</div>`;
                }

                legendRef.current.innerHTML = `
                    <div>${ohlc}</div>
                    <div>${sweepMetrics}</div>
                    ${darkPoolInfo}
                `;
            } else {
                legendRef.current.innerHTML = '';
            }
        };

        chartRef.current.subscribeCrosshairMove(crosshairMoveHandler);

        return () => chartRef.current.unsubscribeCrosshairMove(crosshairMoveHandler);

    }, [analysisHistory, onCrosshairMove]);


    // Effect for handling data updates
    useEffect(() => {
        if (!analysisHistory || analysisHistory.length === 0) {
            console.log("ElphieChart: No analysis history, resetting flag");
            isHistoryLoaded.current = false; // Reset if history is cleared or empty
            return;
        }

        if (!candlestickSeriesRef.current || !sweepAtBidSeriesRef.current || 
            !darkPoolSmallSeriesRef.current || !darkPoolMediumSeriesRef.current ||
            !darkPoolLargeSeriesRef.current || !darkPoolXLargeSeriesRef.current) {
            console.log("ElphieChart: Chart series not ready, skipping data update");
            return;
        }

        // Sort and deduplicate candlestick data efficiently, filtering out invalid candles
        const candleMap = new Map();
        analysisHistory.forEach(point => {
            const time = point.candle.periodStart / 1000;
            // Filter out candles with zero or invalid values
            if (!candleMap.has(time) && point.candle.open > 0 && point.candle.high > 0 && 
                point.candle.low > 0 && point.candle.close > 0) {
                candleMap.set(time, {
                    time,
                    open: point.candle.open / 100,
                    high: point.candle.high / 100,
                    low: point.candle.low / 100,
                    close: point.candle.close / 100,
                });
            }
        });
        const formattedCandles = Array.from(candleMap.values()).sort((a, b) => a.time - b.time);

        const formatHistogramData = (point, value) => ({
            time: point.candle.periodStart / 1000,
            value: value,
        });

        // Individual sweep data - efficiently deduplicated
        const sweepBidMap = new Map();
        const sweepAskMap = new Map();
        const sweepUnknownMap = new Map();
        
        analysisHistory.forEach(p => {
            const time = p.candle.periodStart / 1000;
            if (!sweepBidMap.has(time)) {
                sweepBidMap.set(time, formatHistogramData(p, p.sweepAtBid));
                sweepAskMap.set(time, formatHistogramData(p, p.sweepAtAsk));
                sweepUnknownMap.set(time, formatHistogramData(p, p.sweepUnknown));
            }
        });
        
        const sweepAtBidData = Array.from(sweepBidMap.values()).sort((a, b) => a.time - b.time);
        const sweepAtAskData = Array.from(sweepAskMap.values()).sort((a, b) => a.time - b.time);
        const sweepUnknownData = Array.from(sweepUnknownMap.values()).sort((a, b) => a.time - b.time);

        // Dark pool data with sized markers based on volume
        const darkPoolData = analysisHistory
            .filter(p => p.darkPoolSum > 0 && p.darkPoolVWAP > 0)
            .map(p => ({
                time: p.candle.periodStart / 1000,
                value: p.darkPoolVWAP / 100, // Convert cents to dollars
            }));

        if (!isHistoryLoaded.current && analysisHistory.length > 0) {
            console.log("ElphieChart: Loading initial history data", formattedCandles.length, "candles");
            candlestickSeriesRef.current.setData(formattedCandles);
            // Set individual sweep data for clear visibility
            sweepAtBidSeriesRef.current.setData(sweepAtBidData);
            sweepAtAskSeriesRef.current.setData(sweepAtAskData);
            sweepUnknownSeriesRef.current.setData(sweepUnknownData);
            // Set dark pool data with individual circle sizing
            if (darkPoolData.length > 0) {
                // Since lightweight-charts doesn't support per-point sizing,
                // we'll create multiple series for different size ranges
                const darkPoolBySize = {
                    small: [],   // 10M-100M (3px)
                    medium: [],  // 100M-500M (5px)  
                    large: [],   // 500M-1B (7px)
                    xlarge: []   // 1B+ (9px)
                };
                
                analysisHistory
                    .filter(p => p.darkPoolSum > 0 && p.darkPoolVWAP > 0)
                    .forEach(p => {
                        const sumInMillions = p.darkPoolSum / 100 / 1000000;
                        const dataPoint = {
                            time: p.candle.periodStart / 1000,
                            value: p.darkPoolVWAP / 100,
                        };
                        
                        if (sumInMillions < 100) {
                            darkPoolBySize.small.push(dataPoint);
                        } else if (sumInMillions < 500) {
                            darkPoolBySize.medium.push(dataPoint);
                        } else if (sumInMillions < 1000) {
                            darkPoolBySize.large.push(dataPoint);
                        } else {
                            darkPoolBySize.xlarge.push(dataPoint);
                        }
                    });
                
                // Set data for each dark pool size category
                console.log("Dark pool sizes:", 
                    "small:", darkPoolBySize.small.length,
                    "medium:", darkPoolBySize.medium.length, 
                    "large:", darkPoolBySize.large.length,
                    "xlarge:", darkPoolBySize.xlarge.length);
                    
                // Efficiently sort and dedupe using Map
                const sortAndDedupe = (data) => {
                    const map = new Map();
                    data.forEach(item => {
                        if (!map.has(item.time)) {
                            map.set(item.time, item);
                        }
                    });
                    return Array.from(map.values()).sort((a, b) => a.time - b.time);
                };
                    
                if (darkPoolBySize.small.length > 0 && darkPoolSmallSeriesRef.current) {
                    darkPoolSmallSeriesRef.current.setData(sortAndDedupe(darkPoolBySize.small));
                }
                if (darkPoolBySize.medium.length > 0 && darkPoolMediumSeriesRef.current) {
                    darkPoolMediumSeriesRef.current.setData(sortAndDedupe(darkPoolBySize.medium));
                }
                if (darkPoolBySize.large.length > 0 && darkPoolLargeSeriesRef.current) {
                    darkPoolLargeSeriesRef.current.setData(sortAndDedupe(darkPoolBySize.large));
                }
                if (darkPoolBySize.xlarge.length > 0 && darkPoolXLargeSeriesRef.current) {
                    darkPoolXLargeSeriesRef.current.setData(sortAndDedupe(darkPoolBySize.xlarge));
                }
            }
            isHistoryLoaded.current = true;
            
            // Set visible range to show last 2 hours of data for better initial zoom
            if (formattedCandles.length > 0) {
                const lastTime = formattedCandles[formattedCandles.length - 1].time;
                const twoHoursAgo = lastTime - (2 * 60 * 60); // 2 hours in seconds
                const startIndex = Math.max(0, formattedCandles.length - 120); // Or last 120 candles
                const startTime = formattedCandles[startIndex].time;
                
                chartRef.current.timeScale().setVisibleRange({
                    from: Math.max(twoHoursAgo, startTime),
                    to: lastTime + (5 * 60) // Add 5 minutes buffer to the right
                });
            } else {
                chartRef.current.timeScale().fitContent();
            }
            
            console.log("ElphieChart: History data loaded successfully");
        } else if (analysisHistory.length > 0) {
            const latestPoint = analysisHistory[analysisHistory.length - 1];

            // Prevent race condition: If a newer pending candle is already on the chart,
            // don't try to update with an older completed candle.
            if (pendingCandle && pendingCandle.periodStart > latestPoint.candle.periodStart) {
                console.log("ElphieChart: Skipping update due to newer pending candle");
                return;
            }

            // Only update if the latest candle has valid price data
            if (latestPoint.candle.open > 0 && latestPoint.candle.high > 0 && 
                latestPoint.candle.low > 0 && latestPoint.candle.close > 0 && 
                formattedCandles.length > 0) {
                candlestickSeriesRef.current.update(formattedCandles[formattedCandles.length - 1]);
            }
            // Update individual sweep histograms
            sweepAtBidSeriesRef.current.update(formatHistogramData(latestPoint, latestPoint.sweepAtBid));
            sweepAtAskSeriesRef.current.update(formatHistogramData(latestPoint, latestPoint.sweepAtAsk));
            sweepUnknownSeriesRef.current.update(formatHistogramData(latestPoint, latestPoint.sweepUnknown));
            
            // Update dark pool if present - add to appropriate size category
            if (latestPoint.darkPoolSum > 0 && latestPoint.darkPoolVWAP > 0) {
                const sumInMillions = latestPoint.darkPoolSum / 100 / 1000000;
                const dataPoint = {
                    time: latestPoint.candle.periodStart / 1000,
                    value: latestPoint.darkPoolVWAP / 100,
                };
                
                if (sumInMillions < 100 && darkPoolSmallSeriesRef.current) {
                    darkPoolSmallSeriesRef.current.update(dataPoint);
                } else if (sumInMillions < 500 && darkPoolMediumSeriesRef.current) {
                    darkPoolMediumSeriesRef.current.update(dataPoint);
                } else if (sumInMillions < 1000 && darkPoolLargeSeriesRef.current) {
                    darkPoolLargeSeriesRef.current.update(dataPoint);
                } else if (darkPoolXLargeSeriesRef.current) {
                    darkPoolXLargeSeriesRef.current.update(dataPoint);
                }
            }
        }
    }, [analysisHistory, pendingCandle]);

    // Effect for handling window resize
    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect for handling pending candle updates
    useEffect(() => {
        if (pendingCandle && candlestickSeriesRef.current && 
            pendingCandle.open > 0 && pendingCandle.high > 0 && 
            pendingCandle.low > 0 && pendingCandle.close > 0) {
            const formattedCandle = {
                time: pendingCandle.periodStart / 1000,
                open: pendingCandle.open / 100,
                high: pendingCandle.high / 100,
                low: pendingCandle.low / 100,
                close: pendingCandle.close / 100,
            };
            candlestickSeriesRef.current.update(formattedCandle);
        }
    }, [pendingCandle]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
});

ElphieChart.displayName = 'ElphieChart';

ElphieChart.propTypes = {
    analysisHistory: PropTypes.array.isRequired,
    pendingCandle: PropTypes.object,
    onCrosshairMove: PropTypes.func,
};

export default ElphieChart;
