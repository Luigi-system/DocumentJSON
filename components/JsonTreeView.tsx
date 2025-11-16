import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, TextFieldIcon, LinkIcon } from './icons';

interface JsonTreeViewProps {
    data: any;
    isDraggable?: boolean;
    onSelect?: (path: string) => void;
    widgetBindings?: string[]; // To highlight bound paths
    _path?: string; // Internal use for recursion
}

const JsonNode: React.FC<{
    name: string;
    value: any;
    path: string;
    isDraggable?: boolean;
    onSelect?: (path: string) => void;
    widgetBindings?: string[];
}> = ({ name, value, path, isDraggable, onSelect, widgetBindings }) => {
    const isObject = typeof value === 'object' && value !== null;
    const [isOpen, setIsOpen] = useState(path.split('.').length <= 1);
    const isBound = widgetBindings?.includes(path);

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isDraggable) return;
        event.dataTransfer.setData('text/plain', `{{${path}}}`);
        event.stopPropagation();
    };

    const handleNodeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isObject) {
            setIsOpen(!isOpen);
        } else if (onSelect) {
            onSelect(path);
        }
    };
    
    const handleBindClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect(path);
        }
    };

    const baseNodeClass = `flex items-center space-x-1 p-1 rounded-md text-sm font-mono transition-colors`;
    const interactiveClass = onSelect || isObject ? 'cursor-pointer hover:bg-tertiary' : '';
    const draggableClass = isDraggable ? 'cursor-grab' : '';
    const boundClass = isBound ? 'bg-green-100' : '';

    const nodeClass = `${baseNodeClass} ${interactiveClass} ${draggableClass} ${boundClass}`;

    if (!isObject) {
        return (
            <div draggable={isDraggable} onDragStart={handleDragStart} onClick={handleNodeClick} className={nodeClass}>
                {isDraggable && <TextFieldIcon className="h-4 w-4 text-subtle flex-shrink-0" />}
                <span className={`font-semibold ${isBound ? 'text-green-700' : 'text-indigo-500'}`}>{name}:</span>
                <span className={`truncate ${isBound ? 'text-green-800' : 'text-main'}`}>{JSON.stringify(value)}</span>
            </div>
        );
    }

    return (
        <div>
            <div className={nodeClass}
                 draggable={isDraggable} 
                 onDragStart={handleDragStart} 
                 onClick={handleNodeClick}
            >
                <div className="w-4 h-4 flex-shrink-0">{isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}</div>
                {isDraggable && <TextFieldIcon className="h-4 w-4 text-subtle flex-shrink-0" />}
                <span className={`font-semibold flex-grow ${isBound ? 'text-green-700' : 'text-main'}`}>{name}</span>
                {!isOpen && <span className="text-subtle text-xs mr-2">{Array.isArray(value) ? `[${value.length}]` : `{...}`}</span>}
                {onSelect && (
                    <button onClick={handleBindClick} className="p-0.5 rounded hover:bg-indigo-200 flex-shrink-0" title={`Bind ${path}`}>
                        <LinkIcon className="h-4 w-4 text-indigo-500" />
                    </button>
                )}
            </div>
            {isOpen && (
                <div className="ml-4 pl-2 border-l border-main">
                    {Object.entries(value).map(([key, childValue]) => (
                        <JsonNode 
                            key={key} 
                            name={key} 
                            value={childValue} 
                            path={`${path}.${key}`} 
                            isDraggable={isDraggable} 
                            onSelect={onSelect}
                            widgetBindings={widgetBindings}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data, isDraggable, onSelect, widgetBindings, _path = '' }) => {
    return (
        <div className="space-y-1">
            {Object.entries(data).map(([key, value]) => (
                <JsonNode
                    key={key}
                    name={key}
                    value={value}
                    path={_path ? `${_path}.${key}` : key}
                    isDraggable={isDraggable}
                    onSelect={onSelect}
                    widgetBindings={widgetBindings}
                />
            ))}
        </div>
    );
};