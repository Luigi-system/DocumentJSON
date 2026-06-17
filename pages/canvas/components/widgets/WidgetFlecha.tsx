import React from 'react';
import { ArrowIcon } from '@/shared/icons';
import { APPEARANCE_BINDABLE } from './shared/bindablePresets';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const EmptyPropertyPanel: WidgetDefinition['PropertyPanel'] = () => null;

export const widgetFlechaDefinition: WidgetDefinition = {
    type: 'Arrow',
    icon: ArrowIcon,
    defaultProps: {
        width: 120, height: 40, x: 50, y: 50,
        style: { backgroundColor: '#d1d5db', borderColor: '#6b7280', borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1, margin: 0 },
    },
    bindableProperties: APPEARANCE_BINDABLE,
    PropertyPanel: EmptyPropertyPanel,
    appearanceMode: 'default',
};

const WidgetFlecha: React.FC = () => <WidgetPaletteItem definition={widgetFlechaDefinition} />;

export default WidgetFlecha;
