const grid = document.getElementById('feedGrid');
const searchInput = document.getElementById('searchInput');
const chips = Array.from(document.querySelectorAll('.chip'));
const statusEl = document.getElementById('status');
const toast = document.getElementById('toast');
const refreshBtn = document.getElementById('refreshBtn');
const cardTemplate = document.getElementById('cardTemplate');

let feedItems = [];
let activeCategory = 'All';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderFeeds() {
  const query = searchInput.value.toLowerCase();
  grid.innerHTML = '';

  const filtered = feedItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const text = `${item.title} ${item.source}`.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    return matchesCategory && matchesQuery;
  });

  if (!filtered.length) {
    grid.innerHTML = '<p class="empty">No stories found. Try another keyword or category.</p>';
    return;
  }

  filtered.forEach((item) => {
    const card = cardTemplate.content.cloneNode(true);
    card.querySelector('.badge').textContent = item.category;
    card.querySelector('time').textContent = formatDate(item.published);
    card.querySelector('h2').textContent = item.title;
    card.querySelector('.card__summary').textContent = item.summary || 'No summary available yet.';
    card.querySelector('.source').textContent = item.source;
    const link = card.querySelector('.cta');
    link.href = item.link;
    link.textContent = 'Open story';
    grid.appendChild(card);
  });
}

async function fetchFeeds(showNotification = false) {
  statusEl.textContent = 'Updating feeds...';
  try {
    const response = await fetch('/api/feeds');
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    feedItems = data.items || [];
    renderFeeds();
    const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'just now';
    statusEl.textContent = `Updated ${lastUpdated}`;
    if (showNotification) showToast('Feeds refreshed');
  } catch (error) {
    statusEl.textContent = 'Could not load feeds. Please try again.';
    showToast('We could not reach the feed service.');
  }
}

function setupFilters() {
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category;
      renderFeeds();
    });
  });
}

searchInput.addEventListener('input', () => {
  renderFeeds();
});

refreshBtn.addEventListener('click', () => fetchFeeds(true));

setupFilters();
fetchFeeds();
