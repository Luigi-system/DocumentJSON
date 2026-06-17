import React from 'react';
import { CheckboxIcon, TextIcon } from '@/shared/icons';
import {
    TextInput, ColorPicker, NumberInput, CollapsibleSection, TwoColumnGrid, ToggleSwitch,
} from '../PropertyControls';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const CheckboxPropertyPanel: WidgetDefinition['PropertyPanel'] = ({ widget, handlePropChange, handleStyleChange }) => (
    <>
        <CollapsibleSection title="Propiedades del Checkbox" icon={CheckboxIcon}>
            <TextInput label="Etiqueta" value={widget.props.label || ''} onChange={(v) => handlePropChange('label', v)} />
            <ToggleSwitch label="Marcado" checked={widget.props.checked || false} onChange={(v) => handlePropChange('checked', v)} />
        </CollapsibleSection>
        <CollapsibleSection title="Estilo de Etiqueta del Checkbox" icon={TextIcon}>
            <TwoColumnGrid>
                <NumberInput label="Tamaño de Fuente" value={widget.style.fontSize || 16} onChange={v => handleStyleChange('fontSize', v)} />
                <ColorPicker label="Color" value={widget.style.color || '#000000'} onChange={v => handleStyleChange('color', v)} />
            </TwoColumnGrid>
        </CollapsibleSection>
    </>
);

export const widgetCheckboxDefinition: WidgetDefinition = {
    type: 'Checkbox',
    icon: CheckboxIcon,
    defaultProps: {
        width: 150, height: 24, x: 50, y: 50,
        props: { label: 'Mi Casilla', checked: false },
        style: { color: '#000000', fontSize: 16, margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
    },
    bindableProperties: [
        { property: 'props.label', label: 'Etiqueta' },
        { property: 'props.checked', label: 'Estado Marcado' },
    ],
    PropertyPanel: CheckboxPropertyPanel,
    appearanceMode: 'default',
};

const WidgetCheckbox: React.FC = () => <WidgetPaletteItem definition={widgetCheckboxDefinition} />;

export default WidgetCheckbox;
