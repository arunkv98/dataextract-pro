export function renderStats(): string {
  const stats = [
    { value: '10K+', label: 'Policies Active', color: '#3b82f6' },
    { value: '99.9%', label: 'Uptime', color: '#22c55e' },
    { value: '24/7', label: 'Support', color: '#f59e0b' },
    { value: '50M+', label: 'Claims Processed', color: '#8b5cf6' }
  ];

  return `
    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          ${stats.map(stat => `
            <div class="stat-item">
              <span class="stat-value" style="color: ${stat.color}">${stat.value}</span>
              <span class="stat-label">${stat.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
