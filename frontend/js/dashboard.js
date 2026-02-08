import { projects } from './api.js';
import { showToast } from './app.js';

export async function renderDashboard(container) {
    container.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h1>Dashboard</h1>
                <p class="text-muted">Manage your projects and tasks</p>
            </div>
            <button id="create-project-btn" class="btn btn-primary">
                <i class="fas fa-plus"></i> New Project
            </button>
        </div>

        <div id="projects-list" class="projects-grid">
            <div class="text-center" style="grid-column: 1/-1; padding: 3rem;">
                <i class="fas fa-spinner fa-spin fa-2x text-muted"></i>
            </div>
        </div>

        <!-- Create Project Modal -->
        <div id="create-project-modal" class="modal-overlay">
            <div class="modal">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2>Create New Project</h2>
                    <button id="close-modal-btn" class="btn-text"><i class="fas fa-times"></i></button>
                </div>
                <form id="create-project-form">
                    <div class="form-group">
                        <label class="form-label" for="project-name">Project Name</label>
                        <input type="text" id="project-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="project-desc">Description</label>
                        <textarea id="project-desc" class="form-input" rows="3"></textarea>
                    </div>
                    <div class="form-group" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
                        <button type="button" id="cancel-modal-btn" class="btn">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Project</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupModalHandlers();
    await loadProjects();
}

async function loadProjects() {
    const listContainer = document.getElementById('projects-list');

    try {
        const data = await projects.getAll();
        const projectList = data.projects;

        if (projectList.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: 4rem; background: var(--surface); border-radius: var(--radius);">
                    <i class="fas fa-folder-open fa-3x text-muted" style="margin-bottom: 1rem;"></i>
                    <h3>No projects yet</h3>
                    <p class="text-muted">Get started by creating your first project.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = projectList.map(project => `
            <div class="project-card" onclick="window.location.hash = '/project/${project._id}'">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <span class="fas fa-chevron-right text-muted"></span>
                </div>
                <p class="project-desc">${project.description || 'No description provided.'}</p>
                <div class="project-meta">
                    <span><i class="fas fa-users"></i> ${project.members.length} members</span>
                    <span><i class="fas fa-clock"></i> ${new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        listContainer.innerHTML = `
            <div class="text-danger text-center" style="grid-column: 1/-1;">
                Failed to load projects: ${error.message}
            </div>
        `;
    }
}

function setupModalHandlers() {
    const modal = document.getElementById('create-project-modal');
    const openBtn = document.getElementById('create-project-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const form = document.getElementById('create-project-form');

    const open = () => modal.classList.add('active');
    const close = () => {
        modal.classList.remove('active');
        form.reset();
    };

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('project-name').value;
        const description = document.getElementById('project-desc').value;

        try {
            await projects.create({ name, description });
            showToast('Project created successfully');
            close();
            loadProjects();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
}
