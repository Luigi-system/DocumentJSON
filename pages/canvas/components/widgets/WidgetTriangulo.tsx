import React from 'react';
import { TriangleIcon } from '@/shared/icons';
import { APPEARANCE_BINDABLE } from './shared/bindablePresets';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const EmptyPropertyPanel: WidgetDefinition['PropertyPanel'] = () => null;

export const widgetTrianguloDefinition: WidgetDefinition = {
    type: 'Triangle',
    icon: TriangleIcon,
    defaultProps: {
        width: 90, height: 80, x: 50, y: 50,
        style: { backgroundColor: '#d1d5db', borderColor: 'transparent', borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1, margin: 0 },
    },
    bindableProperties: APPEARANCE_BINDABLE,
    PropertyPanel: EmptyPropertyPanel,
    appearanceMode: 'default',
};

const WidgetTriangulo: React.FC = () => <WidgetPaletteItem definition={widgetTrianguloDefinition} />;

export default WidgetTriangulo;
