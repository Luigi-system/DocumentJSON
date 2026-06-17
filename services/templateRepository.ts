import { Template } from '@/types';
import { templates as PREDEFINED_TEMPLATES } from '@/templates';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { loadLocalTemplates, saveLocalTemplates } from './localTemplateStore';

export type TemplateSource = 'supabase' | 'local' | 'predefined';

function formatDbTemplates(dbTemplates: Record<string, unknown>[]): Template[] {
    return dbTemplates.map(t => ({
        ...t,
        jsonData: t.jsonData ? JSON.stringify(t.jsonData, null, 2) : '{}',
    })) as Template[];
}

function getLocalFallback(): { templates: Template[]; source: TemplateSource } {
    const local = loadLocalTemplates();
    if (local?.length) {
        return { templates: local, source: 'local' };
    }
    return { templates: PREDEFINED_TEMPLATES, source: 'predefined' };
}

export async function loadTemplates(): Promise<{ templates: Template[]; source: TemplateSource }> {
    if (!isSupabaseConfigured || !supabase) {
        console.info('Supabase no configurado. Usando plantillas locales.');
        return getLocalFallback();
    }

    try {
        const { data: dbTemplates, error } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbTemplates && dbTemplates.length > 0) {
            return { templates: formatDbTemplates(dbTemplates), source: 'supabase' };
        }

        const templatesToSeed = PREDEFINED_TEMPLATES.map(t => ({
            ...t,
            jsonData: JSON.parse(t.jsonData),
        }));

        const { error: insertError } = await supabase.from('templates').insert(templatesToSeed);
        if (insertError) throw insertError;

        return { templates: PREDEFINED_TEMPLATES, source: 'supabase' };
    } catch (error) {
        console.warn('No se pudo conectar con Supabase. Usando almacenamiento local.', error);
        return getLocalFallback();
    }
}

export function shouldPersistLocally(source: TemplateSource): boolean {
    return source !== 'supabase';
}

export function persistTemplates(templates: Template[], source: TemplateSource): void {
    if (shouldPersistLocally(source)) {
        saveLocalTemplates(templates);
    }
}

export async function createTemplate(template: Template, source: TemplateSource): Promise<string | null> {
    if (shouldPersistLocally(source) || !supabase) return null;

    const { error } = await supabase
        .from('templates')
        .insert([{ ...template, jsonData: JSON.parse(template.jsonData) }]);

    return error ? error.message : null;
}

export async function updateTemplate(template: Template, source: TemplateSource): Promise<string | null> {
    if (shouldPersistLocally(source) || !supabase) return null;

    const { error } = await supabase
        .from('templates')
        .update({
            name: template.name,
            pages: template.pages,
            status: template.status,
            jsonData: JSON.parse(template.jsonData),
        })
        .eq('id', template.id);

    return error ? error.message : null;
}

export async function renameTemplate(id: string, newName: string, source: TemplateSource): Promise<string | null> {
    if (shouldPersistLocally(source) || !supabase) return null;

    const { error } = await supabase.from('templates').update({ name: newName }).eq('id', id);
    return error ? error.message : null;
}

export async function duplicateTemplate(template: Template, source: TemplateSource): Promise<string | null> {
    if (shouldPersistLocally(source) || !supabase) return null;

    const { error } = await supabase
        .from('templates')
        .insert([{ ...template, jsonData: JSON.parse(template.jsonData) }]);

    return error ? error.message : null;
}

export async function setTemplateStatus(
    id: string,
    status: 'active' | 'archived',
    source: TemplateSource
): Promise<string | null> {
    if (shouldPersistLocally(source) || !supabase) return null;

    const { error } = await supabase.from('templates').update({ status }).eq('id', id);
    return error ? error.message : null;
}

export async function deleteTemplate(id: string, source: TemplateSource): Promise<string | null> {
    if (shouldPersistLocally(source) || !supabase) return null;

    const { error } = await supabase.from('templates').delete().eq('id', id);
    return error ? error.message : null;
}
