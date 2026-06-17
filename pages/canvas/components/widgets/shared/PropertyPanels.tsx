import React from 'react';
import { WidgetInstance, WidgetStyle } from '@/types';
import {
    ColorPicker, NumberInput, Select, Slider, Label, Section, TwoColumnGrid,
} from '../../PropertyControls';

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

interface BorderAndBackgroundPropertyPanelProps {
    widget: WidgetInstance;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
    showBackground?: boolean;
    showBorder?: boolean;
    showOpacity?: boolean;
    showBorderRadius?: boolean;
    customPrefix?: 'props.headerStyle' | 'props.evenRowStyle' | 'props.oddRowStyle';
}

export const BorderAndBackgroundPropertyPanel: React.FC<BorderAndBackgroundPropertyPanelProps> = ({
    widget, onUpdateWidget, showBackground = true, showBorder = true, showOpacity = true, showBorderRadius = true, customPrefix,
}) => {
    const currentStyle = customPrefix ? (getNestedValue(widget, customPrefix) || {}) : widget.style;

    const handleStyleChange = (styleName: keyof WidgetStyle, value: any) => {
        if (customPrefix) {
            const currentPropStyle = getNestedValue(widget, customPrefix) || {};
            onUpdateWidget(widget.id, { props: { ...widget.props, [customPrefix.split('.')[1]]: { ...currentPropStyle, [styleName]: value } } });
        } else {
            onUpdateWidget(widget.id, { style: { ...widget.style, [styleName]: value } });
        }
    };

    return (
        <Section title="Fondo y Borde">
            {showBackground && (
                <ColorPicker label="Color de Fondo" value={currentStyle.backgroundColor || 'transparent'} onChange={(v) => handleStyleChange('backgroundColor', v)} />
            )}
            {showBorder && (
                <>
                    <TwoColumnGrid>
                        <ColorPicker label="Color de Borde" value={currentStyle.borderColor || '#000000'} onChange={(v) => handleStyleChange('borderColor', v)} />
                        <Select
                            label="Estilo de Borde"
                            value={currentStyle.borderStyle || 'solid'}
                            onChange={(v) => handleStyleChange('borderStyle', v as WidgetStyle['borderStyle'])}
                            options={[
                                { value: 'none', label: 'Ninguno' },
                                { value: 'solid', label: 'Sólido' },
                                { value: 'dashed', label: 'Discontinuo' },
                                { value: 'dotted', label: 'Punteado' },
                                { value: 'double', label: 'Doble' },
                            ]}
                        />
                    </TwoColumnGrid>
                    <NumberInput label="Ancho de Borde" value={currentStyle.borderWidth || 0} onChange={(v) => handleStyleChange('borderWidth', v)} />
                </>
            )}
            {showBorderRadius && (
                <NumberInput label="Redondez de Esquina" value={currentStyle.borderRadius || 0} onChange={(v) => handleStyleChange('borderRadius', v)} tooltip="Define el radio de las esquinas del widget para redondearlas." />
            )}
            {showOpacity && (
                <Slider label="Opacidad" min={0} max={1} step={0.05} value={currentStyle.opacity ?? 1} onChange={(v) => handleStyleChange('opacity', v)} />
            )}
        </Section>
    );
};

interface LayoutPropertyPanelProps {
    widget: WidgetInstance;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
}

export const LayoutPropertyPanel: React.FC<LayoutPropertyPanelProps> = ({ widget, onUpdateWidget }) => {
    const handleWidgetPropChange = (propName: keyof WidgetInstance, value: any) => {
        onUpdateWidget(widget.id, { [propName]: value });
    };
    const handleStyleChange = (styleName: keyof WidgetStyle, value: any) => {
        onUpdateWidget(widget.id, { style: { ...widget.style, [styleName]: value } });
    };

    return (
        <Section title="Posición y Tamaño">
            <TwoColumnGrid>
                <NumberInput label="X" value={widget.x} onChange={(v) => handleWidgetPropChange('x', v)} tooltip="La posición horizontal (izquierda) del widget." />
                <NumberInput label="Y" value={widget.y} onChange={(v) => handleWidgetPropChange('y', v)} tooltip="La posición vertical (superior) del widget." />
            </TwoColumnGrid>
            <TwoColumnGrid>
                <NumberInput label="Ancho" value={widget.width} onChange={(v) => handleWidgetPropChange('width', v)} tooltip="El ancho del widget en píxeles." />
                <NumberInput label="Alto" value={widget.height} onChange={(v) => handleWidgetPropChange('height', v)} tooltip="El alto del widget en píxeles. Algunos widgets de texto ajustan su altura automáticamente." />
            </TwoColumnGrid>
            <Label tooltip="Los márgenes añaden espacio fuera del borde del widget.">Márgenes (px)</Label>
            <TwoColumnGrid>
                <NumberInput label="Arriba" value={widget.style.marginTop ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginTop', v)} />
                <NumberInput label="Derecha" value={widget.style.marginRight ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginRight', v)} />
                <NumberInput label="Abajo" value={widget.style.marginBottom ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginBottom', v)} />
                <NumberInput label="Izquierda" value={widget.style.marginLeft ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginLeft', v)} />
            </TwoColumnGrid>
            <NumberInput label="Todos" value={widget.style.margin ?? 0} onChange={(v) => {
                handleStyleChange('margin', v);
                handleStyleChange('marginTop', v);
                handleStyleChange('marginBottom', v);
                handleStyleChange('marginLeft', v);
                handleStyleChange('marginRight', v);
            }} tooltip="Establece todos los márgenes a un mismo valor." />
        </Section>
    );
};
