import { Template } from '@/types';

const STORAGE_KEY = 'docugen-templates';

export function loadLocalTemplates(): Template[] | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        return JSON.parse(saved) as Template[];
    } catch {
        return null;
    }
}

export function saveLocalTemplates(templates: Template[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    // Sync to backend so Puppeteer can see it
    fetch('http://localhost:3001/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates)
    }).catch(err => console.error('Failed to sync templates to backend', err));
}
