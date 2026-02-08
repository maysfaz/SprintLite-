import { auth } from './api.js';
import { showToast } from './app.js';

export function renderLogin(container) {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <i class="fas fa-layer-group"></i>
                    <h2>Welcome Back</h2>
                    <p class="text-muted">Sign in to your account</p>
                </div>
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label" for="email">Email Address</label>
                        <input type="email" id="email" class="form-input" placeholder="name@company.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Sign In</button>
                    <p class="mt-4 text-center text-muted">
                        Don't have an account? <a href="#/register">Sign up</a>
                    </p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const data = await auth.login(email, password);
            handleAuthSuccess(data);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

export function renderRegister(container) {
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <i class="fas fa-user-plus"></i>
                    <h2>Create Account</h2>
                    <p class="text-muted">Start managing your projects today</p>
                </div>
                <form id="register-form">
                    <div class="form-group">
                        <label class="form-label" for="name">Full Name</label>
                        <input type="text" id="name" class="form-input" placeholder="John Doe" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="email">Email Address</label>
                        <input type="email" id="email" class="form-input" placeholder="name@company.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Create Account</button>
                    <p class="mt-4 text-center text-muted">
                        Already have an account? <a href="#/login">Sign in</a>
                    </p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const data = await auth.register(name, email, password);
            handleAuthSuccess(data);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

function handleAuthSuccess(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showToast(`Welcome, ${data.user.name}!`);
    setTimeout(() => {
        window.location.hash = '/dashboard';
        window.location.reload(); // Force reload to update navbar state
    }, 1000);
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '/login';
    window.location.reload();
}
