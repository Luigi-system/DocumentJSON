import React from 'react';
import { WidgetInstance, WidgetStyle, WidgetType } from '@/types';

export interface BindableProperty {
    property: string;
    label: string;
}

export interface WidgetPropertyPanelProps {
    widget: WidgetInstance;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
    jsonData: string;
    onOpenAiTextModal: (widgetId: string) => void;
    handlePropChange: (propName: string, value: any) => void;
    handleStyleChange: (styleName: keyof WidgetStyle, value: any) => void;
}

/** Cómo renderizar la sección genérica de apariencia después del panel del widget */
export type WidgetAppearanceMode = 'default' | 'borderOnly' | 'none';

export interface WidgetDefinition {
    type: WidgetType;
    icon: React.FC<{ className?: string }>;
    defaultProps: Partial<WidgetInstance>;
    bindableProperties: BindableProperty[];
    PropertyPanel: React.FC<WidgetPropertyPanelProps>;
    appearanceMode?: WidgetAppearanceMode;
}
