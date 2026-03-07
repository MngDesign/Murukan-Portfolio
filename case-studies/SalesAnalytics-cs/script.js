const revenue = [180, 220, 240, 258, 276, 308, 288, 322, 338, 362, 392, 418];
const target = [190, 225, 245, 265, 280, 300, 300, 318, 334, 354, 380, 405];

const products = {
  labels: ['Enterprise Suite', 'Professional', 'Basic', 'Add-ons', 'Consulting'],
  values: [900, 720, 590, 420, 280],
};

const funnel = {
  labels: ['Leads', 'Opportunities', 'Deals', 'Closed Sales'],
  values: [2450, 892, 342, 156],
};

const regions = {
  labels: ['North America', 'Europe', 'Asia Pacific', 'Latin America'],
  values: [1200, 800, 700, 400],
};

const opportunities = [
  ['Enterprise Renewal', 'North America', 'Negotiation', 'Sarah K.', '$280,000', '78%'],
  ['Retail Expansion', 'Europe', 'Discovery', 'David L.', '$155,000', '43%'],
  ['Cloud Migration', 'Asia Pacific', 'Closed Won', 'Priya M.', '$410,000', '100%'],
  ['Public Sector Deal', 'Latin America', 'Negotiation', 'Carlos R.', '$190,000', '61%'],
  ['Security Upsell', 'North America', 'Discovery', 'Aisha N.', '$220,000', '34%'],
];

function moneyK(v) {
  return `$${v}K`;
}

function buildRevenueChart() {
  new Chart(document.getElementById('revenueLineChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Actual Revenue',
          data: revenue,
          borderColor: '#2f78ff',
          backgroundColor: 'rgba(47,120,255,0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: 'Target',
          data: target,
          borderColor: '#8a52ff',
          borderDash: [5, 5],
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 8, padding: 12 },
        },
        datalabels: { display: false },
      },
      scales: {
        x: { grid: { color: '#f1f5fb' } },
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => moneyK(v) },
          grid: { color: '#e9eef7' },
        },
      },
    },
  });
}

function buildProductChart() {
  new Chart(document.getElementById('productBarChart'), {
    type: 'bar',
    data: {
      labels: products.labels,
      datasets: [
        {
          label: 'Revenue',
          data: products.values,
          borderRadius: 8,
          backgroundColor: ['#3f7ee8', '#7655dd', '#5f60d7', '#8c47de', '#6e3de2'],
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, datalabels: { display: false } },
      scales: {
        y: { grid: { display: false } },
        x: {
          beginAtZero: true,
          ticks: { callback: (v) => moneyK(v) },
          grid: { color: '#e9eef7' },
        },
      },
    },
  });
}

function buildFunnelChart() {
  new Chart(document.getElementById('funnelChart'), {
    type: 'bar',
    data: {
      labels: funnel.labels,
      datasets: [
        {
          data: funnel.values,
          borderRadius: 8,
          barThickness: 26,
          backgroundColor: ['#5d98ff', '#8a56ea', '#8c75ff', '#35b56d'],
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#253147',
          anchor: 'end',
          align: 'right',
          formatter: (value) => value.toLocaleString(),
          font: { weight: '600' },
        },
      },
      scales: {
        x: { display: false },
        y: { grid: { display: false } },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function buildRegionChart() {
  new Chart(document.getElementById('regionSalesChart'), {
    type: 'doughnut',
    data: {
      labels: regions.labels,
      datasets: [
        {
          data: regions.values,
          backgroundColor: ['#f15959', '#4f87ff', '#2ebf70', '#a678ff'],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        datalabels: { display: false },
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 8, padding: 12 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${moneyK(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

function renderTable() {
  const tbody = document.getElementById('salesTableBody');
  tbody.innerHTML = opportunities
    .map((row) => {
      const cls = row[2] === 'Closed Won' ? 'stage-closed' : row[2] === 'Negotiation' ? 'stage-negotiation' : 'stage-discovery';
      return `
        <tr>
          <td>${row[0]}</td>
          <td>${row[1]}</td>
          <td><span class="stage-pill ${cls}">${row[2]}</span></td>
          <td>${row[3]}</td>
          <td>${row[4]}</td>
          <td>${row[5]}</td>
        </tr>
      `;
    })
    .join('');
}

function getInsights() {
  const growthPct = ((revenue[revenue.length - 1] - revenue[0]) / revenue[0]) * 100;
  const closeRate = (funnel.values[funnel.values.length - 1] / funnel.values[0]) * 100;

  const worstGap = revenue
    .map((v, i) => ({ month: i, gap: v - target[i] }))
    .sort((a, b) => a.gap - b.gap)[0];

  const topRegionIdx = regions.values.indexOf(Math.max(...regions.values));
  const topProductIdx = products.values.indexOf(Math.max(...products.values));

  return [
    {
      level: 'risk',
      title: `North region revenue pressure this quarter`,
      body: `Largest miss vs target occurred around month ${worstGap.month + 1}. Consider campaign and pricing adjustments.`,
    },
    {
      level: 'good',
      title: `${regions.labels[topRegionIdx]} shows strongest trend`,
      body: `Regional share is highest here. Replicate this team's approach in lower-performing geographies.`,
    },
    {
      level: 'warn',
      title: `${products.labels[topProductIdx]} leads product performance`,
      body: `Use this SKU for bundled offers to raise ACV and improve mid-funnel conversion quality.`,
    },
    {
      level: 'good',
      title: `Revenue growth remains healthy (${growthPct.toFixed(1)}%)`,
      body: `Year-to-date momentum is positive with consistent monthly trend improvements and stable pipeline depth.`,
    },
    {
      level: 'warn',
      title: `Current lead-to-close conversion is ${closeRate.toFixed(1)}%`,
      body: `Focus coaching on opportunity qualification and proposal handling to improve close efficiency.`,
    },
  ];
}

function renderInsights() {
  const container = document.getElementById('insightsList');
  container.innerHTML = getInsights()
    .map(
      (insight) => `
        <article class="insight-card insight-${insight.level}">
          <h4>${insight.title}</h4>
          <p>${insight.body}</p>
        </article>
      `
    )
    .join('');
}

buildRevenueChart();
buildProductChart();
buildFunnelChart();
buildRegionChart();
renderTable();
renderInsights();
