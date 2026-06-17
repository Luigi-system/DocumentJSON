import React from 'react';
import { TextIcon } from '@/shared/icons';
import WidgetPaletteItem from './WidgetPaletteItem';
import { createTextWidgetDefinition } from './shared/createTextWidgetDefinition';

export const widgetTextoDefinition = createTextWidgetDefinition('Text', TextIcon, {
    width: 350, height: 100, x: 50, y: 50,
    props: { content: 'Lorem ipsum dolor sit amet...' },
    style: { fontSize: 16, color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
});

const WidgetTexto: React.FC = () => <WidgetPaletteItem definition={widgetTextoDefinition} />;

export default WidgetTexto;
