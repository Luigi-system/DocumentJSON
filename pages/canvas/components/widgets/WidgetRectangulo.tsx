import React from 'react';
import { RectangleIcon } from '@/shared/icons';
import { APPEARANCE_BINDABLE } from './shared/bindablePresets';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const EmptyPropertyPanel: WidgetDefinition['PropertyPanel'] = () => null;

export const widgetRectanguloDefinition: WidgetDefinition = {
    type: 'Rectangle',
    icon: RectangleIcon,
    defaultProps: {
        width: 120, height: 80, x: 50, y: 50,
        style: { backgroundColor: '#d1d5db', borderColor: '#6b7280', borderWidth: 1, borderStyle: 'solid', borderRadius: 0, opacity: 1, margin: 0 },
    },
    bindableProperties: APPEARANCE_BINDABLE,
    PropertyPanel: EmptyPropertyPanel,
    appearanceMode: 'default',
};

const WidgetRectangulo: React.FC = () => <WidgetPaletteItem definition={widgetRectanguloDefinition} />;

export default WidgetRectangulo;
