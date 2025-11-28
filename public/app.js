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
  const platform = post.platform.toLowerCase();

  switch (platform) {
    case 'reddit':
      return createRedditCard(post);
    case 'x':
    case 'twitter':
      return createXCard(post);
    case 'linkedin':
      return createLinkedInCard(post);
    default:
      return createGenericCard(post);
  }
}

function createRedditCard(post) {
  const engagement = post.engagement || {};
  const title = post.title || post.content.substring(0, 100);
  const votes = engagement.likes || 0;
  const comments = engagement.comments || 0;
  const timeAgo = formatDate(post.createdAt);

  return `
    <div class="post-card reddit">
      <div class="reddit-vote-section">
        <span class="reddit-stat-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 4L3 15h6v5h6v-5h6L12 4z"/>
          </svg>
        </span>
        <span class="reddit-vote-count">${formatNumber(votes)}</span>
      </div>
      <div class="reddit-content">
        <div class="reddit-meta-top">
          <span>${timeAgo}</span>
        </div>
        <h3 class="reddit-title">${escapeHtml(title)}</h3>
        ${post.content && post.content !== title ? `<p class="reddit-body">${escapeHtml(post.content)}</p>` : ''}
        <div class="reddit-stats">
          <span class="reddit-stat">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>
            </svg>
            ${formatNumber(comments)}
          </span>
        </div>
        <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" class="post-link-btn">
          View Post
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  `;
}

function createXCard(post) {
  const engagement = post.engagement || {};
  const timeAgo = formatDate(post.createdAt);
  const replies = engagement.comments || 0;
  const reposts = engagement.shares || 0;
  const likes = engagement.likes || 0;
  const views = engagement.views || 0;

  return `
    <div class="post-card x">
      <div class="x-header">
        <div class="x-time">${timeAgo}</div>
        <svg class="x-logo" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
      <div class="x-content">${escapeHtml(post.content)}</div>
      <div class="x-stats">
        <span class="x-stat">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          ${formatNumber(replies)}
        </span>
        <span class="x-stat">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 1l4 4-4 4"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <path d="M7 23l-4-4 4-4"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          ${formatNumber(reposts)}
        </span>
        <span class="x-stat">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          ${formatNumber(likes)}
        </span>
        <span class="x-stat">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          ${formatNumber(views)}
        </span>
      </div>
      <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" class="post-link-btn">
        View Post
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  `;
}

function createLinkedInCard(post) {
  const engagement = post.engagement || {};
  const timeAgo = formatDate(post.createdAt);
  const likes = engagement.likes || 0;
  const comments = engagement.comments || 0;
  const shares = engagement.shares || 0;

  return `
    <div class="post-card linkedin">
      <div class="linkedin-header">
        <div class="linkedin-time">
          <span>${timeAgo}</span>
          <span>•</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <svg class="linkedin-logo" viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </div>
      <div class="linkedin-content">${escapeHtml(post.content)}</div>
      <div class="linkedin-stats">
        <div class="linkedin-reactions">
          <div class="linkedin-reaction-icons">
            <span class="linkedin-reaction-icon like"></span>
            <span class="linkedin-reaction-icon celebrate"></span>
            <span class="linkedin-reaction-icon love"></span>
          </div>
          <span>${formatNumber(likes)}</span>
        </div>
        <span class="linkedin-stat-text">${formatNumber(comments)} comments • ${formatNumber(shares)} reposts</span>
      </div>
      <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" class="post-link-btn">
        View Post
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  `;
}

function createGenericCard(post) {
  const platformName = post.platform.charAt(0).toUpperCase() + post.platform.slice(1);
  const title = post.title || post.content.substring(0, 100) + '...';
  const engagement = post.engagement || {};

  return `
    <div class="post-card" style="border: 2px solid #6b7280; border-radius: 8px; padding: 16px;">
      <div style="font-weight: 600; margin-bottom: 8px;">${platformName}</div>
      <h3 style="font-size: 16px; margin-bottom: 8px;">${escapeHtml(title)}</h3>
      ${post.content ? `<p style="color: #666; font-size: 14px; margin-bottom: 12px;">${escapeHtml(post.content)}</p>` : ''}
      <div style="font-size: 12px; color: #888; margin-bottom: 12px;">
        <strong>${escapeHtml(post.author)}</strong> • ${formatDate(post.createdAt)}
      </div>
      <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: none; font-size: 14px;">View Original →</a>
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
