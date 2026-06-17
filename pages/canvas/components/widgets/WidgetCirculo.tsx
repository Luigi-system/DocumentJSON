import React from 'react';
import { CircleIcon } from '@/shared/icons';
import { APPEARANCE_BINDABLE } from './shared/bindablePresets';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const EmptyPropertyPanel: WidgetDefinition['PropertyPanel'] = () => null;

export const widgetCirculoDefinition: WidgetDefinition = {
    type: 'Circle',
    icon: CircleIcon,
    defaultProps: {
        width: 80, height: 80, x: 50, y: 50,
        style: { backgroundColor: '#d1d5db', borderColor: '#6b7280', borderWidth: 1, borderStyle: 'solid', borderRadius: 9999, opacity: 1, margin: 0 },
    },
    bindableProperties: APPEARANCE_BINDABLE,
    PropertyPanel: EmptyPropertyPanel,
    appearanceMode: 'default',
};

const WidgetCirculo: React.FC = () => <WidgetPaletteItem definition={widgetCirculoDefinition} />;

export default WidgetCirculo;
