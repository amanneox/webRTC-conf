const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const headers = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${url}`, opts);
    if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        throw new Error(err || `Request failed: ${res.status}`);
    }
    return res.json();
}

export const api = {
    rooms: {
        list: () => request<any[]>('/rooms'),
        get: (id: string) => request<any>(`/rooms/${id}`),
        create: (name: string) => request<any>('/rooms', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ name }),
        }),
        remove: (id: string) => fetch(`${BASE}/rooms/${id}`, {
            method: 'DELETE',
            headers: headers(),
        }).then(r => r.ok),
        invite: (roomId: string, email: string) => request<any>(`/rooms/${roomId}/invite`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ email }),
        }),
    },
    auth: {
        login: (email: string, password: string) => request<any>('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        }),
        register: (name: string, email: string, password: string) => request<any>('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        }),
        me: () => request<any>('/auth/me', { headers: headers() }),
    },
};
