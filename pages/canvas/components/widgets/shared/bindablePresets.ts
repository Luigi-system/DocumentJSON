import { BindableProperty } from '../types';

export const TYPOGRAPHY_BINDABLE: BindableProperty[] = [
    { property: 'props.content', label: 'Contenido' },
    { property: 'style.color', label: 'Color' },
    { property: 'style.fontSize', label: 'Tamaño de Fuente' },
    { property: 'props.link', label: 'Hipervínculo' },
];

export const APPEARANCE_BINDABLE: BindableProperty[] = [
    { property: 'style.backgroundColor', label: 'Color de Relleno' },
    { property: 'style.borderColor', label: 'Color de Trazo' },
    { property: 'style.borderWidth', label: 'Ancho de Trazo' },
    { property: 'style.opacity', label: 'Opacidad' },
];

export const TEXT_WIDGET_BINDABLE: BindableProperty[] = [
    ...TYPOGRAPHY_BINDABLE,
    ...APPEARANCE_BINDABLE,
];
