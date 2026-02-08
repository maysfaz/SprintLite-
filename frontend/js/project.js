import { projects, issues } from './api.js';
import { showToast } from './app.js';

let currentProject = null;

export async function renderProject(container, params) {
    const projectId = params.id;

    container.innerHTML = `
        <div id="project-loading" class="text-center" style="padding: 3rem;">
            <i class="fas fa-spinner fa-spin fa-2x text-muted"></i>
        </div>
        <div id="project-content" style="display: none;">
            <div class="dashboard-header">
                <div>
                    <h1 id="project-title">Loading...</h1>
                    <p id="project-description" class="text-muted">...</p>
                </div>
                <div>
                   <button id="create-issue-btn" class="btn btn-primary">
                        <i class="fas fa-plus"></i> New Issue
                    </button>
                    <!-- Future: Add Invite Member Button -->
                </div>
            </div>

            <div class="kanban-board">
                <div class="kanban-column" id="col-todo">
                    <div class="column-header">
                        <span class="column-title">To Do</span>
                        <span class="count-badge" id="count-todo">0</span>
                    </div>
                    <div class="column-content" id="list-todo"></div>
                </div>
                <div class="kanban-column" id="col-inprogress">
                    <div class="column-header">
                        <span class="column-title">In Progress</span>
                        <span class="count-badge" id="count-inprogress">0</span>
                    </div>
                    <div class="column-content" id="list-inprogress"></div>
                </div>
                <div class="kanban-column" id="col-done">
                    <div class="column-header">
                        <span class="column-title">Done</span>
                        <span class="count-badge" id="count-done">0</span>
                    </div>
                    <div class="column-content" id="list-done"></div>
                </div>
            </div>
        </div>

        <!-- Create Issue Modal -->
        <div id="create-issue-modal" class="modal-overlay">
            <div class="modal">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2>Create New Issue</h2>
                    <button id="close-issue-modal" class="btn-text"><i class="fas fa-times"></i></button>
                </div>
                <form id="create-issue-form">
                    <div class="form-group">
                        <label class="form-label" for="issue-title">Title</label>
                        <input type="text" id="issue-title" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="issue-desc">Description</label>
                        <textarea id="issue-desc" class="form-input" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="issue-priority">Priority</label>
                        <select id="issue-priority" class="form-input">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                     <div class="form-group">
                        <label class="form-label" for="issue-type">Type</label>
                        <select id="issue-type" class="form-input">
                            <option value="task" selected>Task</option>
                            <option value="bug">Bug</option>
                            <option value="story">Story</option>
                            <option value="epic">Epic</option>
                        </select>
                    </div>
                    <div class="form-group" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
                        <button type="button" id="cancel-issue-modal" class="btn">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Issue</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    try {
        const projectData = await projects.getOne(projectId);
        currentProject = projectData.project;

        document.getElementById('project-title').textContent = currentProject.name;
        document.getElementById('project-description').textContent = currentProject.description;

        document.getElementById('project-loading').style.display = 'none';
        document.getElementById('project-content').style.display = 'block';

        setupIssueModalHandlers(projectId);
        await loadIssues(projectId);
        setupDragAndDrop(projectId);

    } catch (error) {
        showToast(error.message, 'error');
        window.location.hash = '/dashboard';
    }
}

async function loadIssues(projectId) {
    try {
        const data = await issues.getByProject(projectId);
        const allIssues = data.issues;

        const columns = {
            'backlog': document.getElementById('list-todo'),
            'todo': document.getElementById('list-todo'),
            'in-progress': document.getElementById('list-inprogress'),
            'done': document.getElementById('list-done')
        };

        const counts = {
            'todo': 0,
            'in-progress': 0,
            'done': 0
        };

        // Clear columns
        Object.values(columns).forEach(col => col.innerHTML = '');

        allIssues.forEach(issue => {
            const status = issue.status || 'backlog';
            if (columns[status]) {
                // Count backlog and todo together
                if (status === 'backlog' || status === 'todo') {
                    counts['todo']++;
                } else {
                    counts[status]++;
                }
                const card = createIssueCard(issue);
                columns[status].appendChild(card);
            }
        });

        // Update counts
        document.getElementById('count-todo').textContent = counts['todo'];
        document.getElementById('count-inprogress').textContent = counts['in-progress'];
        document.getElementById('count-done').textContent = counts['done'];

    } catch (error) {
        showToast('Failed to load issues', 'error');
    }
}

function createIssueCard(issue) {
    const card = document.createElement('div');
    card.className = `issue-card priority-${issue.priority.toLowerCase()}`;
    card.draggable = true;
    card.dataset.issueId = issue._id;
    card.dataset.currentStatus = issue.status;

    card.innerHTML = `
        <div class="issue-title">${issue.title}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted);">
            <span class="badge type-${issue.type.toLowerCase()}">${issue.type}</span>
            <span>${issue.assignedTo ? (issue.assignedTo.name || 'Assigned') : 'Unassigned'}</span>
        </div>
    `;

    // Drag start
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', card.innerHTML);
        e.dataTransfer.setData('issueId', issue._id);
        e.dataTransfer.setData('currentStatus', issue.status);
        card.classList.add('dragging');
    });

    // Drag end
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    return card;
}

function getNextStatus(current) {
    if (!current || current === 'backlog' || current === 'todo') return 'in-progress';
    if (current === 'in-progress') return 'done';
    return null; // Already done
}

function setupDragAndDrop(projectId) {
    const dropZones = [
        { element: document.getElementById('list-todo'), status: 'todo', name: 'To Do' },
        { element: document.getElementById('list-inprogress'), status: 'in-progress', name: 'In Progress' },
        { element: document.getElementById('list-done'), status: 'done', name: 'Done' }
    ];

    dropZones.forEach(zone => {
        // Prevent default to allow drop
        zone.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.element.classList.add('drag-over');
        });

        zone.element.addEventListener('dragleave', () => {
            zone.element.classList.remove('drag-over');
        });

        zone.element.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.element.classList.remove('drag-over');

            const issueId = e.dataTransfer.getData('issueId');
            const currentStatus = e.dataTransfer.getData('currentStatus');

            // Don't update if dropped in same column
            if (currentStatus === zone.status || (currentStatus === 'backlog' && zone.status === 'todo')) {
                return;
            }

            try {
                await issues.update(issueId, { status: zone.status });
                await loadIssues(projectId);
                showToast(`Moved to ${zone.name}`);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    });
}

function setupIssueModalHandlers(projectId) {
    const modal = document.getElementById('create-issue-modal');
    const openBtn = document.getElementById('create-issue-btn');
    const closeBtn = document.getElementById('close-issue-modal');
    const cancelBtn = document.getElementById('cancel-issue-modal');
    const form = document.getElementById('create-issue-form');

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
        const title = document.getElementById('issue-title').value;
        const description = document.getElementById('issue-desc').value;
        const priority = document.getElementById('issue-priority').value;
        const type = document.getElementById('issue-type').value;

        try {
            await issues.create(projectId, {
                title,
                description,
                priority,
                type,
                storyPoints: 1 // Default for now
            });
            showToast('Issue created successfully');
            close();
            loadIssues(projectId);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
}
