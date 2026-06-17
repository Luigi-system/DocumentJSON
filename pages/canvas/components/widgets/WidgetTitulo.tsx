import React from 'react';
import { TitleIcon } from '@/shared/icons';
import WidgetPaletteItem from './WidgetPaletteItem';
import { createTextWidgetDefinition } from './shared/createTextWidgetDefinition';

export const widgetTituloDefinition = createTextWidgetDefinition('Title', TitleIcon, {
    width: 400, height: 60, x: 50, y: 50,
    props: { content: 'Titulo Principal' },
    style: { fontSize: 36, fontWeight: 'bold', color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
});

const WidgetTitulo: React.FC = () => <WidgetPaletteItem definition={widgetTituloDefinition} />;

export default WidgetTitulo;
