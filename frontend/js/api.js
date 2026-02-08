const API_BASE = 'http://localhost:3000/api';

export async function request(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

export const auth = {
    login: (email, password) => request('/auth/login', 'POST', { email, password }),
    register: (name, email, password) => request('/auth/register', 'POST', { name, email, password }),
    getProfile: () => request('/auth/profile')
};

export const projects = {
    getAll: () => request('/projects'),
    getOne: (id) => request(`/projects/${id}`),
    create: (data) => request('/projects', 'POST', data),
    update: (id, data) => request(`/projects/${id}`, 'PATCH', data),
    delete: (id) => request(`/projects/${id}`, 'DELETE'),
    invite: (id, email) => request(`/projects/${id}/invite`, 'POST', { email }),
    removeMember: (id, memberId) => request(`/projects/${id}/members/${memberId}`, 'DELETE')
};

export const issues = {
    getByProject: (projectId) => request(`/issues/project/${projectId}`),
    create: (projectId, data) => request(`/issues/project/${projectId}`, 'POST', data),
    update: (id, data) => request(`/issues/${id}`, 'PATCH', data),
    delete: (id) => request(`/issues/${id}`, 'DELETE'),
    addComment: (id, content) => request(`/issues/${id}/comments`, 'POST', { content }),
    getComments: (id) => request(`/issues/${id}/comments`)
};
