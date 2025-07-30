
// Chart Data Utilities for Trading Interface

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  values: number[];
  timestamps: number[];
  color: string;
}

export class ChartDataGenerator {
  generateCandlestickData(
    symbol: string, 
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    count: number = 100
  ): CandlestickData[] {
    const data: CandlestickData[] = [];
    
    // Base prices for different symbols
    const basePrices = {
      'BTC/USDT': 43250,
      'ETH/USDT': 2650,
      'SEI/USDT': 0.487,
      'TOKEN0/TOKEN1': 1.543,
      'TOKEN0/TOKEN2': 2.1,
      'TOKEN1/TOKEN2': 1.35
    };
    
    let currentPrice = basePrices[symbol as keyof typeof basePrices] || 100;
    const intervalMs = this.getIntervalMs(interval);
    const volatility = this.getVolatility(symbol);
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = Date.now() - (i * intervalMs);
      const open = currentPrice;
      
      // Generate realistic price movement
      const trend = (Math.random() - 0.5) * volatility;
      const intrabarVolatility = volatility * 0.5;
      
      const close = open * (1 + trend);
      const high = Math.max(open, close) * (1 + Math.random() * intrabarVolatility);
      const low = Math.min(open, close) * (1 - Math.random() * intrabarVolatility);
      
      // Generate volume (higher volume during larger price movements)
      const priceChange = Math.abs(close - open) / open;
      const baseVolume = this.getBaseVolume(symbol);
      const volume = baseVolume * (1 + priceChange * 5) * (0.5 + Math.random());
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    return data;
  }

  generateTechnicalIndicators(data: CandlestickData[]): {
    sma20: TechnicalIndicator;
    sma50: TechnicalIndicator;
    rsi: TechnicalIndicator;
    bollinger: {
      upper: TechnicalIndicator;
      middle: TechnicalIndicator;
      lower: TechnicalIndicator;
    };
  } {
    const closes = data.map(d => d.close);
    const timestamps = data.map(d => d.timestamp);
    
    return {
      sma20: {
        name: 'SMA 20',
        values: this.calculateSMA(closes, 20),
        timestamps,
        color: '#8B5CF6'
      },
      sma50: {
        name: 'SMA 50',
        values: this.calculateSMA(closes, 50),
        timestamps,
        color: '#06B6D4'
      },
      rsi: {
        name: 'RSI',
        values: this.calculateRSI(closes, 14),
        timestamps,
        color: '#F59E0B'
      },
      bollinger: this.calculateBollingerBands(closes, timestamps, 20, 2)
    };
  }

  private getIntervalMs(interval: string): number {
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return intervals[interval as keyof typeof intervals] || intervals['1h'];
  }

  private getVolatility(symbol: string): number {
    const volatilities = {
      'BTC/USDT': 0.03,
      'ETH/USDT': 0.04,
      'SEI/USDT': 0.06,
      'TOKEN0/TOKEN1': 0.05,
      'TOKEN0/TOKEN2': 0.07,
      'TOKEN1/TOKEN2': 0.06
    };
    return volatilities[symbol as keyof typeof volatilities] || 0.05;
  }

  private getBaseVolume(symbol: string): number {
    const volumes = {
      'BTC/USDT': 10000,
      'ETH/USDT': 8000,
      'SEI/USDT': 5000,
      'TOKEN0/TOKEN1': 3000,
      'TOKEN0/TOKEN2': 2000,
      'TOKEN1/TOKEN2': 1500
    };
    return volumes[symbol as keyof typeof volumes] || 1000;
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    
    return sma;
  }

  private calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate RSI
    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        rsi.push(NaN);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
    
    // Add NaN for the first price (no change to calculate)
    return [NaN, ...rsi];
  }

  private calculateBollingerBands(
    prices: number[], 
    timestamps: number[], 
    period: number = 20, 
    stdDev: number = 2
  ) {
    const sma = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        upper.push(mean + (standardDeviation * stdDev));
        lower.push(mean - (standardDeviation * stdDev));
      }
    }
    
    return {
      upper: {
        name: 'Bollinger Upper',
        values: upper,
        timestamps,
        color: '#EF4444'
      },
      middle: {
        name: 'Bollinger Middle',
        values: sma,
        timestamps,
        color: '#6B7280'
      },
      lower: {
        name: 'Bollinger Lower',
        values: lower,
        timestamps,
        color: '#10B981'
      }
    };
  }
}

// Chart rendering utilities
export class ChartRenderer {
  static generateSVGPath(data: { x: number; y: number }[]): string {
    if (data.length === 0) return '';
    
    const commands = data.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    });
    
    return commands.join(' ');
  }

  static normalizeData(
    values: number[], 
    width: number, 
    height: number, 
    padding: { top: number; bottom: number } = { top: 10, bottom: 10 }
  ): { x: number; y: number }[] {
    const validValues = values.filter(v => !isNaN(v));
    if (validValues.length === 0) return [];
    
    const minValue = Math.min(...validValues);
    const maxValue = Math.max(...validValues);
    const range = maxValue - minValue;
    const availableHeight = height - padding.top - padding.bottom;
    
    return values.map((value, index) => ({
      x: (index / (values.length - 1)) * width,
      y: isNaN(value) 
        ? NaN 
        : padding.top + ((maxValue - value) / range) * availableHeight
    })).filter(point => !isNaN(point.y));
  }

  static formatPrice(price: number, decimals: number = 6): string {
    if (price >= 1000) {
      return price.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else if (price >= 1) {
      return price.toFixed(3);
    } else {
      return price.toFixed(decimals);
    }
  }

  static formatVolume(volume: number): string {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(1) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(1) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(1) + 'K';
    } else {
      return volume.toFixed(0);
    }
  }

  static getColorForChange(change: number): string {
    if (change > 0) return '#10B981'; // Green
    if (change < 0) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  }
}

// Export instances
export const chartDataGenerator = new ChartDataGenerator();
export const chartRenderer = ChartRenderer;
