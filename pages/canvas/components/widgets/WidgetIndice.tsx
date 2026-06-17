import React from 'react';
import { IndexIcon } from '@/shared/icons';
import WidgetPaletteItem from './WidgetPaletteItem';
import { createTextWidgetDefinition } from './shared/createTextWidgetDefinition';

export const widgetIndiceDefinition = createTextWidgetDefinition('Index', IndexIcon, {
    width: 300, height: 50, x: 50, y: 50,
    props: { content: 'Indice' },
    style: { fontSize: 20, fontWeight: 'bold', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
});

const WidgetIndice: React.FC = () => <WidgetPaletteItem definition={widgetIndiceDefinition} />;

export default WidgetIndice;
