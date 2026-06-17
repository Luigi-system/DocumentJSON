import React from 'react';
import { SubtitleIcon } from '@/shared/icons';
import WidgetPaletteItem from './WidgetPaletteItem';
import { createTextWidgetDefinition } from './shared/createTextWidgetDefinition';

export const widgetSubtituloDefinition = createTextWidgetDefinition('Subtitle', SubtitleIcon, {
    width: 350, height: 50, x: 50, y: 50,
    props: { content: 'Subtitulo de Seccion' },
    style: { fontSize: 24, fontWeight: 'bold', color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
});

const WidgetSubtitulo: React.FC = () => <WidgetPaletteItem definition={widgetSubtituloDefinition} />;

export default WidgetSubtitulo;
