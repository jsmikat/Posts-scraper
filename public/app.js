const API_URL = 'http://localhost:3000/api/crawl';

const state = {
  keywords: [],
  isSearching: false,
};

const elements = {
  keywordInput: document.getElementById('keywordInput'),
  addKeywordBtn: document.getElementById('addKeywordBtn'),
  keywordsList: document.getElementById('keywordsList'),
  searchBtn: document.getElementById('searchBtn'),
  resultsSection: document.getElementById('resultsSection'),
  postsContainer: document.getElementById('postsContainer'),
  errorMessage: document.getElementById('errorMessage'),
  resultsTitle: document.getElementById('resultsTitle'),
  stats: document.getElementById('stats'),
};

function addKeyword() {
  const keyword = elements.keywordInput.value.trim();

  if (!keyword) return;

  if (state.keywords.includes(keyword.toLowerCase())) {
    showError('Keyword already added');
    return;
  }

  if (state.keywords.length >= 20) {
    showError('Maximum 20 keywords allowed');
    return;
  }

  state.keywords.push(keyword.toLowerCase());
  renderKeywords();
  elements.keywordInput.value = '';
  updateSearchButton();
  hideError();
}

function removeKeyword(keyword) {
  state.keywords = state.keywords.filter((k) => k !== keyword);
  renderKeywords();
  updateSearchButton();
}

function renderKeywords() {
  if (state.keywords.length === 0) {
    elements.keywordsList.innerHTML =
      '<p style="color: var(--text-muted); font-size: 0.875rem;">No keywords added yet</p>';
    return;
  }

  elements.keywordsList.innerHTML = state.keywords
    .map(
      (keyword) => `
    <div class="keyword-tag">
      <span>${escapeHtml(keyword)}</span>
      <span class="keyword-remove" onclick="removeKeyword('${escapeHtml(keyword)}')">&times;</span>
    </div>
  `
    )
    .join('');
}

function updateSearchButton() {
  elements.searchBtn.disabled = state.keywords.length === 0 || state.isSearching;
}

async function searchPosts() {
  if (state.keywords.length === 0 || state.isSearching) return;

  state.isSearching = true;
  updateSearchButton();
  showLoading();
  hideError();
  elements.resultsSection.style.display = 'none';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords: state.keywords }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch posts');
    }

    displayResults(data);
  } catch (error) {
    showError(error.message || 'Failed to fetch posts. Please try again.');
  } finally {
    state.isSearching = false;
    updateSearchButton();
    hideLoading();
  }
}

function displayResults(data) {
  elements.resultsSection.style.display = 'block';

  const totalPosts = data.summary.totalPosts;
  const platforms = data.summary.platformsQueried.join(', ');

  elements.resultsTitle.textContent = `Found ${totalPosts} Posts`;
  elements.stats.textContent = `Searched across ${platforms}`;

  const platformErrors = data.results.filter((r) => r.error);
  if (platformErrors.length > 0) {
    const errorMessages = platformErrors.map((r) => `${r.platform}: ${r.error}`).join(' | ');
    showError(`Some platforms failed: ${errorMessages}`);
  }

  if (totalPosts === 0) {
    elements.postsContainer.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>No posts found for the given keywords</p>
      </div>
    `;
    return;
  }

  const allPosts = [];
  data.results.forEach((result) => {
    result.posts.forEach((post) => {
      allPosts.push({ ...post, platform: result.platform });
    });
  });

  allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  elements.postsContainer.innerHTML = allPosts.map((post) => createPostCard(post)).join('');
}

function createPostCard(post) {
  const platformName = post.platform.charAt(0).toUpperCase() + post.platform.slice(1);
  const platformClass = post.platform.toLowerCase();
  const displayName = platformClass === 'twitter' ? 'X' : platformName;

  const title = post.title || post.content.substring(0, 100) + '...';
  const engagement = post.engagement || {};

  return `
    <div class="post-card ${platformClass}">
      <div class="platform-badge ${platformClass}">${displayName}</div>
      
      <h3 class="post-title">${escapeHtml(title)}</h3>
      
      ${post.content ? `<p class="post-content">${escapeHtml(post.content)}</p>` : ''}
      
      <div class="post-meta">
        <div class="post-author">
          <strong>${escapeHtml(post.author)}</strong>
        </div>
        <div class="post-date">${formatDate(post.createdAt)}</div>
      </div>
      
      <div class="post-engagement">
        ${
          engagement.likes !== undefined
            ? `
          <div class="engagement-item">
            <span class="engagement-label">Likes</span>
            <span class="engagement-value">${formatNumber(engagement.likes)}</span>
          </div>
        `
            : ''
        }
        ${
          engagement.comments !== undefined
            ? `
          <div class="engagement-item">
            <span class="engagement-label">Comments</span>
            <span class="engagement-value">${formatNumber(engagement.comments)}</span>
          </div>
        `
            : ''
        }
        ${
          engagement.shares !== undefined && engagement.shares > 0
            ? `
          <div class="engagement-item">
            <span class="engagement-label">Shares</span>
            <span class="engagement-value">${formatNumber(engagement.shares)}</span>
          </div>
        `
            : ''
        }
        ${
          engagement.views !== undefined && engagement.views > 0
            ? `
          <div class="engagement-item">
            <span class="engagement-label">Views</span>
            <span class="engagement-value">${formatNumber(engagement.views)}</span>
          </div>
        `
            : ''
        }
      </div>
      
      <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" class="post-link">
        View Original
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  `;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  elements.searchBtn.querySelector('.btn-text').style.display = 'none';
  elements.searchBtn.querySelector('.btn-loader').style.display = 'inline-flex';
}

function hideLoading() {
  elements.searchBtn.querySelector('.btn-text').style.display = 'inline';
  elements.searchBtn.querySelector('.btn-loader').style.display = 'none';
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';
  setTimeout(hideError, 10000);
}

function hideError() {
  elements.errorMessage.style.display = 'none';
}

elements.keywordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addKeyword();
  }
});

elements.addKeywordBtn.addEventListener('click', addKeyword);
elements.searchBtn.addEventListener('click', searchPosts);

renderKeywords();
updateSearchButton();
