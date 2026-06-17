import React from 'react';
import { WidgetDefinition } from './types';

interface WidgetPaletteItemProps {
    definition: WidgetDefinition;
}

const WidgetPaletteItem: React.FC<WidgetPaletteItemProps> = ({ definition }) => {
    const { type, icon: Icon, defaultProps } = definition;

    const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('application/json', JSON.stringify({ type, ...defaultProps }));
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            className="flex flex-col items-center p-2 bg-tertiary rounded-md border border-main cursor-grab active:cursor-grabbing hover:bg-opacity-70 transition-colors"
        >
            <Icon className="h-7 w-7 text-subtle mb-1" />
            <span className="text-xs font-semibold text-main text-center">{type}</span>
        </div>
    );
};

export default WidgetPaletteItem;
