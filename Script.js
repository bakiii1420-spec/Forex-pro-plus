// ============================================
// FX PULSE PRO - FOREX TRADING PLATFORM
// ============================================

// Currency Pairs Configuration
const pairs = [
  { symbol: 'EUR/USD', base: 'EUR', quote: 'USD', flags: '🇪🇺🇺🇸', name: 'Euro vs US Dollar', type: 'Major', price: 1.0850, spread: 1.1, vol: 0.00045 },
  { symbol: 'GBP/USD', base: 'GBP', quote: 'USD', flags: '🇬🇧🇺🇸', name: 'Pound vs US Dollar', type: 'Major', price: 1.2650, spread: 1.4, vol: 0.00055 },
  { symbol: 'USD/JPY', base: 'USD', quote: 'JPY', flags: '🇺🇸🇯🇵', name: 'US Dollar vs Yen', type: 'Major', price: 150.35, spread: 1.2, vol: 0.08 },
  { symbol: 'USD/CHF', base: 'USD', quote: 'CHF', flags: '🇺🇸🇨🇭', name: 'US Dollar vs Franc', type: 'Major', price: 0.8812, spread: 1.3, vol: 0.00040 },
  { symbol: 'AUD/USD', base: 'AUD', quote: 'USD', flags: '🇦🇺🇺🇸', name: 'Aussie vs US Dollar', type: 'Major', price: 0.6550, spread: 1.5, vol: 0.00050 },
  { symbol: 'USD/CAD', base: 'USD', quote: 'CAD', flags: '🇺🇸🇨🇦', name: 'US Dollar vs Loonie', type: 'Major', price: 1.3550, spread: 1.4, vol: 0.00045 },
  { symbol: 'NZD/USD', base: 'NZD', quote: 'USD', flags: '🇳🇿🇺🇸', name: 'Kiwi vs US Dollar', type: 'Major', price: 0.6100, spread: 1.8, vol: 0.00055 },
  { symbol: 'EUR/GBP', base: 'EUR', quote: 'GBP', flags: '🇪🇺🇬🇧', name: 'Euro vs Pound', type: 'Cross', price: 0.8580, spread: 1.5, vol: 0.00035 },
  { symbol: 'EUR/JPY', base: 'EUR', quote: 'JPY', flags: '🇪🇺🇯🇵', name: 'Euro vs Yen', type: 'Cross', price: 163.10, spread: 1.8, vol: 0.09 },
  { symbol: 'GBP/JPY', base: 'GBP', quote: 'JPY', flags: '🇬🇧🇯🇵', name: 'Pound vs Yen', type: 'Cross', price: 190.20, spread: 2.2, vol: 0.12 },
  { symbol: 'AUD/JPY', base: 'AUD', quote: 'JPY', flags: '🇦🇺🇯🇵', name: 'Aussie vs Yen', type: 'Cross', price: 98.50, spread: 2.0, vol: 0.07 },
  { symbol: 'EUR/CHF', base: 'EUR', quote: 'CHF', flags: '🇪🇺🇨🇭', name: 'Euro vs Franc', type: 'Cross', price: 0.9560, spread: 1.6, vol: 0.00038 }
];

// ============================================
// APPLICATION STATE
// ============================================
const state = {
  selectedPair: 0,
  direction: 'buy',
  positions: [],
  alerts: [],
  balance: 100000,
  equity: 100000,
  openPnl: 0,
  marginUsed: 0,
  tickSpeed: 1000,
  chartStyle: 'candle',
  indicators: { ma: false, ema: false, bb: false, rsi: true },
  priceHistory: {},
  candles: {}
};

// ============================================
// INITIALIZE PRICE DATA
// ============================================
function initializePriceData() {
  pairs.forEach((pair, idx) => {
    const history = [];
    const candles = [];
    let price = pair.price;

    for (let i = 0; i < 100; i++) {
      const change = (Math.random() - 0.5) * pair.vol * 2;
      price += change;
      history.push({ time: Date.now() - (100 - i) * 1000, price });

      if (i % 5 === 0) {
        const o = price;
        const h = price + Math.random() * pair.vol;
        const l = price - Math.random() * pair.vol;
        const c = price + (Math.random() - 0.5) * pair.vol;
        candles.push({ time: Date.now() - (100 - i) * 1000, o, h, l, c });
      }
    }

    state.priceHistory[idx] = history;
    state.candles[idx] = candles;
    pairs[idx].openPrice = history[0].price;
    pairs[idx].dayHigh = Math.max(...history.map(h => h.price));
    pairs[idx].dayLow = Math.min(...history.map(h => h.price));
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatPrice(price, symbol) {
  if (symbol.includes('JPY')) return price.toFixed(3);
  return price.toFixed(5);
}

function formatPct(curr, open) {
  const pct = ((curr - open) / open) * 100;
  return pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
}

function formatMoney(val) {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPipMultiplier(symbol) {
  return symbol.includes('JPY') ? 0.01 : 0.0001;
}

// ============================================
// TECHNICAL INDICATORS
// ============================================
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;

  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i].price - prices[i - 1].price;
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMA(prices, period = 20) {
  if (prices.length < period) return [];
  const ma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b.price, 0);
    ma.push({ time: prices[i].time, value: sum / period });
  }
  return ma;
}

function calculateEMA(prices, period = 50) {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const ema = [{ time: prices[period - 1].time, value: prices.slice(0, period).reduce((a, b) => a + b.price, 0) / period }];

  for (let i = period; i < prices.length; i++) {
    const value = prices[i].price * k + ema[ema.length - 1].value * (1 - k);
    ema.push({ time: prices[i].time, value });
  }
  return ema;
}

function calculateBollingerBands(prices, period = 20) {
  const ma = calculateMA(prices, period);
  if (ma.length === 0) return { upper: [], lower: [], middle: ma };

  const upper = [], lower = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1).map(h => h.price);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period);
    upper.push({ value: mean + std * 2 });
    lower.push({ value: mean - std * 2 });
  }

  return { upper, lower, middle: ma };
}

// ============================================
// WATCHLIST RENDERING
// ============================================
function renderWatchlist() {
  const watchlist = document.getElementById('watchlist');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filtered = pairs.filter(p => 
    p.symbol.toLowerCase().includes(search) || 
    p.name.toLowerCase().includes(search)
  );

  watchlist.innerHTML = filtered.map((pair, idx) => {
    const realIdx = pairs.indexOf(pair);
    const history = state.priceHistory[realIdx];
    const currentPrice = history[history.length - 1].price;
    const change = ((currentPrice - pair.openPrice) / pair.openPrice) * 100;
    const isActive = realIdx === state.selectedPair;

    return `
      <div class="watchlist-item ${isActive ? 'active' : ''}" data-idx="${realIdx}">
        <div class="pair-info">
          <span class="pair-flags">${pair.flags}</span>
          <div>
            <div class="pair-symbol">${pair.symbol}</div>
            <div class="pair-name">${pair.type}</div>
          </div>
        </div>
        <div class="pair-price">${formatPrice(currentPrice, pair.symbol)}</div>
        <div class="pair-change ${change >= 0 ? 'positive' : 'negative'}">
          ${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.watchlist-item').forEach(item => {
    item.addEventListener('click', () => {
      state.selectedPair = parseInt(item.dataset.idx);
      renderWatchlist();
      updateChartHeader();
      drawChart();
      updateTradePanel();
    });
  });
}

// ============================================
// CHART HEADER UPDATE
// ============================================
function updateChartHeader() {
  const pair = pairs[state.selectedPair];
  const history = state.priceHistory[state.selectedPair];
  const price = history[history.length - 1].price;
  const change = price - pair.openPrice;
  const changePct = (change / pair.openPrice) * 100;
  const spread = pair.spread * getPipMultiplier(pair.symbol);

  document.getElementById('chartFlags').textContent = pair.flags;
  document.getElementById('chartPairName').textContent = pair.symbol;
  document.getElementById('chartPairDesc').textContent = `${pair.name} • ${pair.type}`;
  document.getElementById('chartPrice').textContent = formatPrice(price, pair.symbol);

  const changeEl = document.getElementById('chartChange');
  changeEl.textContent = `${changePct >= 0 ? '▲' : '▼'} ${changePct >= 0 ? '+' : ''}${changePct.toFixed(3)}%`;
  changeEl.className = `chart-price-change ${changePct >= 0 ? 'positive' : 'negative'}`;

  document.getElementById('spreadValue').textContent = `${pair.spread.toFixed(1)} pips`;
  document.getElementById('bidPrice').textContent = formatPrice(price, pair.symbol);
  document.getElementById('askPrice').textContent = formatPrice(price + spread, pair.symbol);
  document.getElementById('dayRange').textContent = `${formatPrice(pair.dayLow, pair.symbol)} - ${formatPrice(pair.dayHigh, pair.symbol)}`;

  const rsi = calculateRSI(history);
  document.getElementById('rsiValue').textContent = rsi.toFixed(1);

  // OHLC Display
  const candles = state.candles[state.selectedPair];
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    document.getElementById('oOpen').textContent = formatPrice(last.o, pair.symbol);
    document.getElementById('oHigh').textContent = formatPrice(last.h, pair.symbol);
    document.getElementById('oLow').textContent = formatPrice(last.l, pair.symbol);
    document.getElementById('oClose').textContent = formatPrice(last.c, pair.symbol);
  }
}

// ============================================
// CHART DRAWING
// ============================================
function drawChart() {
  const mainChart = document.getElementById('mainChart');
  const rsiChart = document.getElementById('rsiChart');
  const ctx = mainChart.getContext('2d');
  const rsiCtx = rsiChart.getContext('2d');

  const rect = mainChart.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  mainChart.width = rect.width * dpr;
  mainChart.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height - 70;
  const padding = { top: 20, right: 70, bottom: 30, left: 10 };

  ctx.clearRect(0, 0, w, rect.height);

  const pair = pairs[state.selectedPair];
  const history = state.priceHistory[state.selectedPair];
  const candles = state.candles[state.selectedPair];

  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices) * 0.9999;
  const maxPrice = Math.max(...prices) * 1.0001;

  const toX = (i, arr) => padding.left + (i / (arr.length - 1)) * (w - padding.left - padding.right);
  const toY = (price) => padding.top + ((maxPrice - price) / (maxPrice - minPrice)) * h;

  // Draw Grid
  ctx.strokeStyle = 'rgba(42, 52, 68, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (i / 5) * h;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    const price = maxPrice - (i / 5) * (maxPrice - minPrice);
    ctx.fillStyle = '#5a6270';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatPrice(price, pair.symbol), w - padding.right + 5, y + 3);
  }

  // Draw Candlesticks or Line
  if (state.chartStyle === 'candle' && candles.length > 0) {
    const candleWidth = Math.max(4, (w - padding.left - padding.right) / candles.length - 2);

    candles.forEach((candle, i) => {
      const x = padding.left + (i / (candles.length - 1)) * (w - padding.left - padding.right);
      const isGreen = candle.c >= candle.o;

      ctx.strokeStyle = isGreen ? '#00d26a' : '#ff4757';
      ctx.fillStyle = isGreen ? '#00d26a' : '#ff4757';

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, toY(candle.h));
      ctx.lineTo(x, toY(candle.l));
      ctx.stroke();

      // Body
      const top = toY(Math.max(candle.o, candle.c));
      const bottom = toY(Math.min(candle.o, candle.c));
      ctx.fillRect(x - candleWidth / 2, top, candleWidth, Math.max(1, bottom - top));
    });
  } else {
    // Line Chart
    ctx.strokeStyle = '#00d26a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = toX(i, history);
      const y = toY(point.price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area Fill
    ctx.lineTo(toX(history.length - 1, history), h + padding.top);
    ctx.lineTo(toX(0, history), h + padding.top);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(0, 210, 106, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 210, 106, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Draw Moving Average
  if (state.indicators.ma) {
    const ma = calculateMA(history, 20);
    if (ma.length > 0) {
      ctx.strokeStyle = '#ffc107';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ma.forEach((point, i) => {
        const x = toX(i + 19, history);
        const y = toY(point.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  // Draw EMA
  if (state.indicators.ema) {
    const ema = calculateEMA(history, 50);
    if (ema.length > 0) {
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ema.forEach((point, i) => {
        const x = toX(i + 49, history);
        const y = toY(point.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  // Draw Bollinger Bands
  if (state.indicators.bb) {
    const bb = calculateBollingerBands(history, 20);
    if (bb.upper.length > 0) {
      ctx.strokeStyle = 'rgba(52, 152, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      bb.upper.forEach((p, i) => {
        const x = toX(i + 19, history);
        const y = toY(p.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.beginPath();
      bb.lower.forEach((p, i) => {
        const x = toX(i + 19, history);
        const y = toY(p.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw RSI Panel
  if (state.indicators.rsi) {
    const rsiRect = rsiChart.getBoundingClientRect();
    rsiChart.width = rsiRect.width * dpr;
    rsiChart.height = 60 * dpr;
    rsiCtx.scale(dpr, dpr);

    rsiCtx.clearRect(0, 0, rsiRect.width, 60);
    rsiCtx.fillStyle = 'rgba(15, 22, 41, 0.95)';
    rsiCtx.fillRect(0, 0, rsiRect.width, 60);

    // Overbought/Oversold lines
    rsiCtx.strokeStyle = 'rgba(255, 71, 87, 0.3)';
    rsiCtx.beginPath();
    rsiCtx.moveTo(padding.left, 12);
    rsiCtx.lineTo(rsiRect.width - padding.right, 12);
    rsiCtx.stroke();

    rsiCtx.strokeStyle = 'rgba(0, 210, 106, 0.3)';
    rsiCtx.beginPath();
    rsiCtx.moveTo(padding.left, 48);
    rsiCtx.lineTo(rsiRect.width - padding.right, 48);
    rsiCtx.stroke();

    // RSI Line
    const rsiValues = [];
    for (let i = 15; i < history.length; i++) {
      rsiValues.push(calculateRSI(history.slice(0, i + 1)));
    }

    if (rsiValues.length > 0) {
      rsiCtx.strokeStyle = '#3498ff';
      rsiCtx.lineWidth = 1.5;
      rsiCtx.beginPath();
      rsiValues.forEach((val, i) => {
        const x = padding.left + ((i + 15) / (history.length - 1)) * (rsiRect.width - padding.left - padding.right);
        const y = 60 - (val / 100) * 60;
        if (i === 0) rsiCtx.moveTo(x, y);
        else rsiCtx.lineTo(x, y);
      });
      rsiCtx.stroke();
    }

    rsiCtx.fillStyle = '#5a6270';
    rsiCtx.font = '9px sans-serif';
    rsiCtx.fillText('70', rsiRect.width - padding.right + 5, 14);
    rsiCtx.fillText('30', rsiRect.width - padding.right + 5, 50);
  }
}

// ============================================
// TRADE PANEL UPDATE
// ============================================
function updateTradePanel() {
  const pair = pairs[state.selectedPair];
  const history = state.priceHistory[state.selectedPair];
  const price = history[history.length - 1].price;
  const spread = pair.spread * getPipMultiplier(pair.symbol);

  document.getElementById('buyPrice').textContent = formatPrice(price + spread, pair.symbol);
  document.getElementById('sellPrice').textContent = formatPrice(price, pair.symbol);

  const lots = parseFloat(document.getElementById('lotInput').value) || 1;
  const leverage = parseInt(document.getElementById('leverageSelect').value) || 20;
  const notional = lots * 100000;
  const margin = notional / leverage;

  document.getElementById('lotValue').textContent = formatMoney(notional);
  document.getElementById('reqMargin').textContent = formatMoney(margin);
  document.getElementById('pipValue').textContent = formatMoney(lots * 10);
  document.getElementById('spreadCost').textContent = formatMoney(pair.spread * lots * 10);

  const sl = parseFloat(document.getElementById('slInput').value);
  const tp = parseFloat(document.getElementById('tpInput').value);
  const pipMult = getPipMultiplier(pair.symbol);

  if (sl && tp) {
    const riskPips = Math.abs(price - sl) / pipMult;
    const rewardPips = Math.abs(tp - price) / pipMult;
    document.getElementById('slPips').textContent = riskPips.toFixed(0) + ' pips';
    document.getElementById('tpPips').textContent = rewardPips.toFixed(0) + ' pips';
    document.getElementById('rrRatio').textContent = riskPips > 0 ? `1:${(rewardPips / riskPips).toFixed(1)}` : '—';
  } else {
    document.getElementById('slPips').textContent = '0 pips';
    document.getElementById('tpPips').textContent = '0 pips';
    document.getElementById('rrRatio').textContent = '—';
  }

  const submitBtn = document.getElementById('submitTrade');
  submitBtn.className = `submit-trade ${state.direction}`;
  submitBtn.innerHTML = state.direction === 'buy'
    ? '🟢 Place Buy Order'
    : '🔴 Place Sell Order';
}

// ============================================
// ACCOUNT UPDATE
// ============================================
function updateAccount() {
  let totalPnl = 0;

  state.positions.forEach(pos => {
    const history = state.priceHistory[pos.pairIdx];
    const currentPrice = history[history.length - 1].price;
    const pair = pairs[pos.pairIdx];
    const pipMult = getPipMultiplier(pair.symbol);
    const pips = pos.direction === 'buy'
      ? (currentPrice - pos.entryPrice) / pipMult
      : (pos.entryPrice - currentPrice) / pipMult;
    pos.pnl = pips * pos.lots * 10;
    totalPnl += pos.pnl;
  });

  state.openPnl = totalPnl;
  state.equity = state.balance + totalPnl;
  state.marginUsed = state.positions.reduce((sum, p) => sum + p.margin, 0);

  document.getElementById('accountBalance').textContent = formatMoney(state.balance);
  document.getElementById('equityValue').textContent = formatMoney(state.equity);
  document.getElementById('marginValue').textContent = formatMoney(state.marginUsed);
  document.getElementById('freeMargin').textContent = formatMoney(state.equity - state.marginUsed);

  const openPnlEl = document.getElementById('openPnl');
  openPnlEl.textContent = (totalPnl >= 0 ? '+' : '') + formatMoney(totalPnl);
  openPnlEl.className = totalPnl >= 0 ? 'positive' : 'negative';

  const changePct = ((state.equity - 100000) / 100000) * 100;
  const changeEl = document.getElementById('accountChange');
  changeEl.textContent = `${changePct >= 0 ? '▲' : '▼'} ${changePct >= 0 ? '+' : ''}${formatMoney(state.equity - 100000)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`;
  changeEl.className = `balance-change ${changePct >= 0 ? 'positive' : 'negative'}`;
}

// ============================================
// POSITIONS RENDERING
// ============================================
function renderPositions() {
  const container = document.getElementById('positionsList');

  if (state.positions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📊</div>
        <div class="title">No open positions</div>
        <div class="desc">Place a trade to see it here</div>
      </div>
    `;
    return;
  }

  container.innerHTML = state.positions.map((pos, idx) => {
    const pair = pairs[pos.pairIdx];
    const history = state.priceHistory[pos.pairIdx];
    const currentPrice = history[history.length - 1].price;

    return `
      <div class="position-card">
        <div class="position-header">
          <div class="position-pair">
            <span class="flags">${pair.flags}</span>
            <span class="symbol">${pair.symbol}</span>
          </div>
          <span class="position-dir ${pos.direction}">${pos.direction.toUpperCase()}</span>
        </div>
        <div class="position-details">
          <div class="position-detail">
            <span class="label">Entry</span>
            <span class="value">${formatPrice(pos.entryPrice, pair.symbol)}</span>
          </div>
          <div class="position-detail">
            <span class="label">Current</span>
            <span class="value">${formatPrice(currentPrice, pair.symbol)}</span>
          </div>
          <div class="position-detail">
            <span class="label">Lots</span>
            <span class="value">${pos.lots.toFixed(2)}</span>
          </div>
          <div class="position-detail">
            <span class="label">Margin</span>
            <span class="value">${formatMoney(pos.margin)}</span>
          </div>
        </div>
        <div class="position-pnl">
          <span class="pnl-value ${pos.pnl >= 0 ? 'positive' : 'negative'}">
            ${pos.pnl >= 0 ? '+' : ''}${formatMoney(pos.pnl)}
          </span>
          <button class="close-position" data-idx="${idx}">Close</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.close-position').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const pos = state.positions[idx];
      state.balance += pos.pnl;
      state.positions.splice(idx, 1);
      renderPositions();
      updateAccount();
      showToast('Position closed', pos.pnl >= 0 ? '✅' : '❌');
    });
  });
}

// ============================================
// ALERTS RENDERING
// ============================================
function renderAlerts() {
  const container = document.getElementById('alertsList');
  document.getElementById('alertCount').textContent = state.alerts.length;

  if (state.alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔔</div>
        <div class="title">No alerts</div>
        <div class="desc">Create price alerts</div>
      </div>
    `;
    return;
  }

  container.innerHTML = state.alerts.map((alert, idx) => {
    const pair = pairs[alert.pairIdx];
    return `
      <div class="alert-item">
        <div class="alert-info">
          <span class="alert-pair">${pair.symbol}</span>
          <span class="alert-condition">${alert.condition} ${formatPrice(alert.price, pair.symbol)}</span>
        </div>
        <button class="alert-delete" data-idx="${idx}">×</button>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.alert-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      state.alerts.splice(parseInt(btn.dataset.idx), 1);
      renderAlerts();
    });
  });
}

// ============================================
// CHECK ALERTS
// ============================================
function checkAlerts() {
  state.alerts = state.alerts.filter(alert => {
    const history = state.priceHistory[alert.pairIdx];
    const price = history[history.length - 1].price;
    const prevPrice = history[history.length - 2]?.price || price;

    let triggered = false;
    if (alert.condition === 'above' && price >= alert.price && prevPrice < alert.price) triggered = true;
    if (alert.condition === 'below' && price <= alert.price && prevPrice > alert.price) triggered = true;

    if (triggered) {
      showToast(`🔔 ${pairs[alert.pairIdx].symbol} ${alert.condition} ${formatPrice(alert.price, pairs[alert.pairIdx].symbol)}`, '🔔');
      return false;
    }
    return true;
  });
  renderAlerts();
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, icon = '✅') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  document.getElementById('toastIcon').textContent = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// MARKET CLOCK
// ============================================
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('marketClock').textContent = `${h}:${m}:${s} UTC`;

  const hour = now.getUTCHours();
  let session = '🌍 London';
  if (hour >= 0 && hour < 8) session = '🌏 Tokyo';
  else if (hour >= 13 && hour < 22) session = '🌎 New York';
  document.getElementById('sessionLabel').textContent = session;
}

// ============================================
// TICK SIMULATION
// ============================================
function tick() {
  pairs.forEach((pair, idx) => {
    const history = state.priceHistory[idx];
    const last = history[history.length - 1];
    const change = (Math.random() - 0.5) * pair.vol * 2;
    const newPrice = Math.max(pair.price * 0.9, Math.min(pair.price * 1.1, last.price + change));

    history.push({ time: Date.now(), price: newPrice });
    if (history.length > 200) history.shift();

    pair.dayHigh = Math.max(pair.dayHigh, newPrice);
    pair.dayLow = Math.min(pair.dayLow, newPrice);

    // Update candles
    const candles = state.candles[idx];
    const lastCandle = candles[candles.length - 1];
    if (Date.now() - lastCandle.time > 5000) {
      candles.push({ time: Date.now(), o: newPrice, h: newPrice, l: newPrice, c: newPrice });
      if (candles.length > 50) candles.shift();
    } else {
      lastCandle.h = Math.max(lastCandle.h, newPrice);
      lastCandle.l = Math.min(lastCandle.l, newPrice);
      lastCandle.c = newPrice;
    }
  });

  renderWatchlist();
  updateChartHeader();
  drawChart();
  updateTradePanel();
  updateAccount();
  checkAlerts();
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', renderWatchlist);

  // Buy/Sell Toggle
  document.getElementById('buyBtn').addEventListener('click', () => {
    state.direction = 'buy';
    document.getElementById('buyBtn').classList.add('active');
    document.getElementById('sellBtn').classList.remove('active');
    updateTradePanel();
  });

  document.getElementById('sellBtn').addEventListener('click', () => {
    state.direction = 'sell';
    document.getElementById('sellBtn').classList.add('active');
    document.getElementById('buyBtn').classList.remove('active');
    updateTradePanel();
  });

  // Quick Lots
  document.querySelectorAll('.quick-lot').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('lotInput').value = btn.dataset.lot;
      updateTradePanel();
    });
  });

  // Form Inputs
  document.getElementById('lotInput').addEventListener('input', updateTradePanel);
  document.getElementById('leverageSelect').addEventListener('change', updateTradePanel);
  document.getElementById('slInput').addEventListener('input', updateTradePanel);
  document.getElementById('tpInput').addEventListener('input', updateTradePanel);

  // Submit Trade
  document.getElementById('submitTrade').addEventListener('click', () => {
    const pair = pairs[state.selectedPair];
    const history = state.priceHistory[state.selectedPair];
    const price = history[history.length - 1].price;
    const spread = pair.spread * getPipMultiplier(pair.symbol);
    const entryPrice = state.direction === 'buy' ? price + spread : price;
    const lots = parseFloat(document.getElementById('lotInput').value) || 1;
    const leverage = parseInt(document.getElementById('leverageSelect').value) || 20;
    const margin = (lots * 100000) / leverage;

    if (margin > state.equity - state.marginUsed) {
      showToast('Insufficient margin', '❌');
      return;
    }

    state.positions.push({
      pairIdx: state.selectedPair,
      direction: state.direction,
      entryPrice,
      lots,
      margin,
      pnl: 0,
      time: new Date()
    });

    renderPositions();
    updateAccount();
    showToast(`${state.direction.toUpperCase()} ${lots} ${pair.symbol} @ ${formatPrice(entryPrice, pair.symbol)}`, '✅');
  });

  // Add Alert
  document.getElementById('addAlertBtn').addEventListener('click', () => {
    const price = parseFloat(document.getElementById('alertPrice').value);
    const condition = document.getElementById('alertCondition').value;

    if (!price) {
      showToast('Enter a price level', '❌');
      return;
    }

    state.alerts.push({ pairIdx: state.selectedPair, price, condition });
    document.getElementById('alertPrice').value = '';
    renderAlerts();
    showToast('Alert created', '🔔');
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + 'Pane').classList.add('active');
    });
  });

  // Timeframe Buttons
  document.querySelectorAll('.toolbar-btn[data-tf]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toolbar-btn[data-tf]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Chart Style Toggle
  document.getElementById('lineBtn').addEventListener('click', () => {
    state.chartStyle = 'line';
    document.getElementById('lineBtn').classList.add('active');
    document.getElementById('candleBtn').classList.remove('active');
    drawChart();
  });

  document.getElementById('candleBtn').addEventListener('click', () => {
    state.chartStyle = 'candle';
    document.getElementById('candleBtn').classList.add('active');
    document.getElementById('lineBtn').classList.remove('active');
    drawChart();
  });

  // Indicator Toggles
  ['ma', 'ema', 'bb', 'rsi'].forEach(ind => {
    document.getElementById(ind + 'Tag').addEventListener('click', () => {
      state.indicators[ind] = !state.indicators[ind];
      document.getElementById(ind + 'Tag').classList.toggle('active', state.indicators[ind]);
      drawChart();
    });
  });

  // Speed Toggle
  let tickSpeed = 1000;
  let tickInterval;
  document.getElementById('speedBtn').addEventListener('click', () => {
    if (tickSpeed === 1000) tickSpeed = 500;
    else if (tickSpeed === 500) tickSpeed = 250;
    else tickSpeed = 1000;

    document.getElementById('speedBtn').textContent = tickSpeed === 1000 ? '⚡ 1x' : tickSpeed === 500 ? '⚡ 2x' : '⚡ 4x';
    clearInterval(tickInterval);
    tickInterval = setInterval(tick, tickSpeed);
  });

  // Toast Close
  document.getElementById('toastClose').addEventListener('click', () => {
    document.getElementById('toast').classList.remove('show');
  });

  // Window Resize
  window.addEventListener('resize', drawChart);

  // Start Tick Engine
  tickInterval = setInterval(tick, tickSpeed);
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
  initializePriceData();
  renderWatchlist();
  updateChartHeader();
  drawChart();
  updateTradePanel();
  updateAccount();
  renderPositions();
  renderAlerts();
  updateClock();
  setupEventListeners();

  // Clock Update
  setInterval(updateClock, 1000);
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
