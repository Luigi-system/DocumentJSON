import React from 'react';
import { StyledParagraphIcon } from '@/shared/icons';
import WidgetPaletteItem from './WidgetPaletteItem';
import { createTextWidgetDefinition } from './shared/createTextWidgetDefinition';

export const widgetParrafoEstilizadoDefinition = createTextWidgetDefinition('Styled Paragraph', StyledParagraphIcon, {
    width: 400, height: 120, x: 50, y: 50,
    props: { content: 'Este es un parrafo con mas opciones de estilo.' },
    style: { fontSize: 16, color: '#333333', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
});

const WidgetParrafoEstilizado: React.FC = () => <WidgetPaletteItem definition={widgetParrafoEstilizadoDefinition} />;

export default WidgetParrafoEstilizado;
