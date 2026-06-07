// DOM Elements
const searchForm = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const profileContainer = document.getElementById('profile-container');
const battleModeBtn = document.getElementById('battle-mode-btn');
const singleSearchSection = document.getElementById('single-search-section');
const battleSearchSection = document.getElementById('battle-search-section');
const battleForm = document.getElementById('battle-form');
const username1Input = document.getElementById('username1-input');
const username2Input = document.getElementById('username2-input');
const battleLoadingIndicator = document.getElementById('battle-loading-indicator');
const battleErrorMessage = document.getElementById('battle-error-message');
const battleContainer = document.getElementById('battle-container');
const themeToggle = document.getElementById('theme-toggle');
const subtitleSearchBtn = document.getElementById('subtitle-search-btn');
const subtitleBattleBtn = document.getElementById('subtitle-battle-btn');

// Utility function: Format ISO date to human-readable string
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

// Utility function: Calculate total stars from repos array
function calculateTotalStars(repos) {
    return repos.reduce((total, repo) => total + repo.stargazers_count, 0);
}

// Phase 1 & 2: Single user search and display
async function searchUser(username) {
    // Show loading, hide other elements
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    profileContainer.classList.add('hidden');

    try {
        // First API call: Get user profile
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        
        if (!userResponse.ok) {
            if (userResponse.status === 404) {
                throw new Error('User not found');
            }
            throw new Error('Something went wrong');
        }

        const userData = await userResponse.json();

        // Second API call: Get user repos using repos_url from first response
        const reposResponse = await fetch(userData.repos_url);
        const reposData = await reposResponse.json();

        // Sort repos by updated_at and get top 5 latest
        const topRepos = reposData
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5);

        // Render profile
        renderProfile(userData, topRepos);

    } catch (error) {
        // Handle errors, especially 404
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        console.error('Error fetching user:', error);
    }
}

function renderProfile(user, repos) {
    // Store the data for later restoration
    lastSearchedUser = user;
    lastSearchedRepos = repos;
    
    loadingIndicator.classList.add('hidden');
    profileContainer.classList.remove('hidden');

    profileContainer.innerHTML = `
        <div class="profile-card">
            <img src="${user.avatar_url}" alt="${user.login}" class="profile-avatar">
            <div class="profile-info">
                <h2>${user.name || user.login}</h2>
                <p><strong>Username:</strong> @${user.login}</p>
                <p><strong>Bio:</strong> ${user.bio || 'No bio available'}</p>
                <p><strong>Joined:</strong> ${formatDate(user.created_at)}</p>
                <p><strong>Portfolio:</strong> <a href="${user.html_url}" target="_blank" rel="noopener noreferrer">${user.html_url}</a></p>
            </div>
        </div>
        <div class="repos-section">
            <h3>Top 5 Latest Repositories</h3>
            <div class="repos-list">
                ${repos.map(repo => `
                    <div class="repo-item">
                        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                        <p style="margin-top: 0.5rem; font-size: 0.9rem;">${repo.description || 'No description'}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Phase 3: Battle Mode
async function battleUsers(username1, username2) {
    battleLoadingIndicator.classList.remove('hidden');
    battleErrorMessage.classList.add('hidden');
    battleContainer.classList.add('hidden');

    try {
        // Use Promise.all to fetch both users and repos concurrently
        const [user1Data, user2Data] = await Promise.all([
            fetchUserDataWithRepos(username1),
            fetchUserDataWithRepos(username2)
        ]);

        // Calculate total stars for both users
        const user1Stars = calculateTotalStars(user1Data.repos);
        const user2Stars = calculateTotalStars(user2Data.repos);

        // Render battle results
        renderBattle(user1Data, user2Data, user1Stars, user2Stars);

    } catch (error) {
        battleLoadingIndicator.classList.add('hidden');
        battleErrorMessage.classList.remove('hidden');
        console.error('Error in battle mode:', error);
    }
}

// Helper function to fetch user and repos together
async function fetchUserDataWithRepos(username) {
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) {
        throw new Error(`User ${username} not found`);
    }
    const user = await userResponse.json();
    const reposResponse = await fetch(user.repos_url);
    const repos = await reposResponse.json();
    return { user, repos };
}

function renderBattle(user1Data, user2Data, user1Stars, user2Stars) {
    // Store the data for later restoration
    lastBattleData = {
        user1Data,
        user2Data,
        user1Stars,
        user2Stars
    };
    
    battleLoadingIndicator.classList.add('hidden');
    battleContainer.classList.remove('hidden');

    let user1Status, user2Status;
    if (user1Stars > user2Stars) {
        user1Status = 'winner';
        user2Status = 'loser';
    } else if (user2Stars > user1Stars) {
        user1Status = 'loser';
        user2Status = 'winner';
    } else {
        user1Status = 'draw';
        user2Status = 'draw';
    }

    battleContainer.innerHTML = `
        <div class="battle-results">
            <div class="battle-card ${user1Status}">
                <div class="status-badge">
                    ${user1Status === 'winner' ? '🏆 Winner!' : user1Status === 'loser' ? '😢 Loser' : '🤝 Draw'}
                </div>
                <img src="${user1Data.user.avatar_url}" alt="${user1Data.user.login}" class="battle-avatar">
                <h2>${user1Data.user.name || user1Data.user.login}</h2>
                <p>@${user1Data.user.login}</p>
                <div class="star-count">⭐ ${user1Stars} Stars</div>
            </div>
            <div class="battle-card ${user2Status}">
                <div class="status-badge">
                    ${user2Status === 'winner' ? '🏆 Winner!' : user2Status === 'loser' ? '😢 Loser' : '🤝 Draw'}
                </div>
                <img src="${user2Data.user.avatar_url}" alt="${user2Data.user.login}" class="battle-avatar">
                <h2>${user2Data.user.name || user2Data.user.login}</h2>
                <p>@${user2Data.user.login}</p>
                <div class="star-count">⭐ ${user2Stars} Stars</div>
            </div>
        </div>
    `;
}

// State variables to store last data
let lastSearchedUser = null;
let lastSearchedRepos = null;
let lastBattleData = null;
let isBattleMode = false; // Declare only once here

// Theme Toggle Logic
let isDarkMode = false;

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
});

// Helper function to toggle modes
function switchToSingleSearchMode() {
    isBattleMode = false;
    battleModeBtn.classList.remove('active');
    subtitleSearchBtn.classList.add('active');
    subtitleBattleBtn.classList.remove('active');
    singleSearchSection.classList.remove('hidden');
    battleSearchSection.classList.add('hidden');
    // Restore last searched data if available
    if (lastSearchedUser && lastSearchedRepos) {
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.add('hidden');
        renderProfile(lastSearchedUser, lastSearchedRepos);
    }
}

function switchToBattleMode() {
    isBattleMode = true;
    battleModeBtn.classList.add('active');
    subtitleBattleBtn.classList.add('active');
    subtitleSearchBtn.classList.remove('active');
    battleSearchSection.classList.remove('hidden');
    singleSearchSection.classList.add('hidden');
    // Restore last battle data if available
    if (lastBattleData) {
        battleLoadingIndicator.classList.add('hidden');
        battleErrorMessage.classList.add('hidden');
        renderBattle(lastBattleData.user1Data, lastBattleData.user2Data, lastBattleData.user1Stars, lastBattleData.user2Stars);
    }
}

battleModeBtn.addEventListener('click', () => {
    if (isBattleMode) {
        switchToSingleSearchMode();
    } else {
        switchToBattleMode();
    }
});

// Subtitle buttons click listeners
subtitleSearchBtn.addEventListener('click', () => {
    switchToSingleSearchMode();
});

subtitleBattleBtn.addEventListener('click', () => {
    switchToBattleMode();
});

// Event Listeners
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username) {
        searchUser(username);
    }
});

battleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username1 = username1Input.value.trim();
    const username2 = username2Input.value.trim();
    if (username1 && username2) {
        battleUsers(username1, username2);
    }
});

// Initialize on page load
subtitleSearchBtn.classList.add('active');
