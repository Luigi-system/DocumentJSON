import React from 'react';
import { DocumentIconOutline, ImageIcon, TitleIcon } from '@/shared/icons';
import { WidgetType } from '@/types';
import WidgetCheckbox from './WidgetCheckbox';
import WidgetCirculo from './WidgetCirculo';
import WidgetCodigoQr from './WidgetCodigoQr';
import WidgetFlecha from './WidgetFlecha';
import WidgetImagen from './WidgetImagen';
import WidgetIndice from './WidgetIndice';
import WidgetLista from './WidgetLista';
import WidgetParrafoEstilizado from './WidgetParrafoEstilizado';
import WidgetRectangulo from './WidgetRectangulo';
import WidgetSubtitulo from './WidgetSubtitulo';
import WidgetTabla from './WidgetTabla';
import WidgetTexto from './WidgetTexto';
import WidgetTitulo from './WidgetTitulo';
import WidgetTriangulo from './WidgetTriangulo';
import { widgetCheckboxDefinition } from './WidgetCheckbox';
import { widgetCirculoDefinition } from './WidgetCirculo';
import { widgetCodigoQrDefinition } from './WidgetCodigoQr';
import { widgetFlechaDefinition } from './WidgetFlecha';
import { widgetImagenDefinition } from './WidgetImagen';
import { widgetIndiceDefinition } from './WidgetIndice';
import { widgetListaDefinition } from './WidgetLista';
import { widgetParrafoEstilizadoDefinition } from './WidgetParrafoEstilizado';
import { widgetRectanguloDefinition } from './WidgetRectangulo';
import { widgetSubtituloDefinition } from './WidgetSubtitulo';
import { widgetTablaDefinition } from './WidgetTabla';
import { widgetTextoDefinition } from './WidgetTexto';
import { widgetTituloDefinition } from './WidgetTitulo';
import { widgetTrianguloDefinition } from './WidgetTriangulo';
import { BindableProperty, WidgetDefinition } from './types';

interface WidgetCategory {
    title: string;
    icon: React.FC<{ className?: string }>;
    widgets: React.FC[];
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
    widgetTituloDefinition,
    widgetSubtituloDefinition,
    widgetTextoDefinition,
    widgetParrafoEstilizadoDefinition,
    widgetListaDefinition,
    widgetIndiceDefinition,
    widgetImagenDefinition,
    widgetTablaDefinition,
    widgetCodigoQrDefinition,
    widgetCheckboxDefinition,
    widgetRectanguloDefinition,
    widgetCirculoDefinition,
    widgetTrianguloDefinition,
    widgetFlechaDefinition,
];

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = Object.fromEntries(
    WIDGET_DEFINITIONS.map(def => [def.type, def])
) as Record<WidgetType, WidgetDefinition>;

export function getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
    return WIDGET_REGISTRY[type];
}

export function getBindableProperties(type: WidgetType): BindableProperty[] {
    return WIDGET_REGISTRY[type]?.bindableProperties ?? [];
}

export const WIDGET_CATEGORIES: WidgetCategory[] = [
    {
        title: 'Tipografia',
        icon: TitleIcon,
        widgets: [WidgetTitulo, WidgetSubtitulo, WidgetTexto, WidgetParrafoEstilizado, WidgetLista, WidgetIndice],
    },
    {
        title: 'Medios y Datos',
        icon: ImageIcon,
        widgets: [WidgetImagen, WidgetTabla, WidgetCodigoQr, WidgetCheckbox],
    },
    {
        title: 'Formas',
        icon: DocumentIconOutline,
        widgets: [WidgetRectangulo, WidgetCirculo, WidgetTriangulo, WidgetFlecha],
    },
];
