import * as API from './api.js';
import * as Auth from './auth.js';
import * as Dashboard from './dashboard.js';
import * as Project from './project.js';

// Application State
const state = {
    user: null,
    currentPath: '/',
    params: {}
};

// Router
const routes = {
    '/': { view: renderHome, auth: false },
    '/login': { view: Auth.renderLogin, auth: false },
    '/register': { view: Auth.renderRegister, auth: false },
    '/dashboard': { view: Dashboard.renderDashboard, auth: true },
    '/project/:id': { view: Project.renderProject, auth: true }
};

async function router() {
    const hash = window.location.hash.slice(1) || '/';

    // Parse params (e.g., /project/123)
    let matchedRoute = null;
    let params = {};

    // Check exact match
    if (routes[hash]) {
        matchedRoute = routes[hash];
    } else {
        // Check dynamic match
        for (const route in routes) {
            if (route.includes(':')) {
                const routeParts = route.split('/');
                const hashParts = hash.split('/');

                if (routeParts.length === hashParts.length) {
                    let match = true;
                    const tempParams = {};

                    for (let i = 0; i < routeParts.length; i++) {
                        if (routeParts[i].startsWith(':')) {
                            tempParams[routeParts[i].slice(1)] = hashParts[i];
                        } else if (routeParts[i] !== hashParts[i]) {
                            match = false;
                            break;
                        }
                    }

                    if (match) {
                        matchedRoute = routes[route];
                        params = tempParams;
                        break;
                    }
                }
            }
        }
    }

    if (!matchedRoute) {
        window.location.hash = '/';
        return;
    }

    state.params = params;

    // Auth Check
    const token = localStorage.getItem('token');
    if (matchedRoute.auth && !token) {
        window.location.hash = '/login';
        return;
    }

    if (!matchedRoute.auth && token && (hash === '/login' || hash === '/register')) {
        window.location.hash = '/dashboard';
        return;
    }

    // Update UI
    updateNavbar(token);

    // Render View
    const mainContent = document.getElementById('main-content');
    if (matchedRoute.view) {
        await matchedRoute.view(mainContent, params);
    }
}

// Redirect root to likely destination
function renderHome() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.hash = '/dashboard';
    } else {
        window.location.hash = '/login';
    }
}

function updateNavbar(token) {
    const navbar = document.getElementById('navbar');
    const userNameDisplay = document.getElementById('user-name');

    if (token) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        navbar.style.display = 'flex';
        userNameDisplay.textContent = user.name || 'User';
    } else {
        navbar.style.display = 'none';
    }
}

// Global Event Listeners
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Logout Handler
document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.logout();
});

// Toast Notification
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
