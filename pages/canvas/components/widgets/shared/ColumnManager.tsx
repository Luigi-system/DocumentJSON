import React, { useState, useEffect, useMemo } from 'react';
import { ViewColumnsIcon } from '@/shared/icons';
import { WidgetInstance } from '@/types';

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const HeaderInput: React.FC<{
    initialValue: string;
    onCommit: (newValue: string) => void;
}> = ({ initialValue, onCommit }) => {
    const [localValue, setLocalValue] = useState(initialValue);
    useEffect(() => { setLocalValue(initialValue); }, [initialValue]);
    const handleBlur = () => { if (localValue !== initialValue) onCommit(localValue); };
    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-grow p-1 text-sm border border-main rounded-md bg-panel text-main"
        />
    );
};

const ColumnManager: React.FC<{
    widget: WidgetInstance;
    jsonData: string;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
}> = ({ widget, jsonData, onUpdateWidget }) => {
    const dataKeys = useMemo(() => {
        const dataPath = widget.bindings['props.tableData'];
        if (!dataPath) return [];
        try {
            const data = getNestedValue(JSON.parse(jsonData), dataPath);
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                return Object.keys(data[0]);
            }
        } catch { /* ignore */ }
        return [];
    }, [jsonData, widget.bindings]);

    const orderedColumns = useMemo(() => {
        const currentOrder = widget.props.columnOrder;
        if (currentOrder && currentOrder.length > 0) {
            const newKeys = dataKeys.filter(k => !currentOrder.includes(k));
            const validOldKeys = currentOrder.filter(k => dataKeys.includes(k));
            return [...validOldKeys, ...newKeys];
        }
        return dataKeys;
    }, [dataKeys, widget.props.columnOrder]);

    useEffect(() => {
        if (dataKeys.length > 0) {
            const currentOrder = widget.props.columnOrder || [];
            const currentHeaders = widget.props.columnHeaders || {};
            let needsUpdate = false;

            if (currentOrder.length !== orderedColumns.length) {
                needsUpdate = true;
            }

            const newHeaders = { ...currentHeaders };
            dataKeys.forEach(key => {
                if (!newHeaders[key]) {
                    newHeaders[key] = key;
                    needsUpdate = true;
                }
            });

            if (needsUpdate) {
                onUpdateWidget(widget.id, { props: { ...widget.props, columnOrder: orderedColumns, columnHeaders: newHeaders } });
            }
        }
    }, [orderedColumns, dataKeys, widget.props, onUpdateWidget, widget.id]);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleHeaderChange = (key: string, newHeader: string) => {
        onUpdateWidget(widget.id, { props: { ...widget.props, columnHeaders: { ...widget.props.columnHeaders, [key]: newHeader } } });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }
        const newOrder = [...orderedColumns];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, removed);
        onUpdateWidget(widget.id, { props: { ...widget.props, columnOrder: newOrder } });
        setDraggedIndex(null);
    };

    if (dataKeys.length === 0) {
        return <p className="text-xs text-subtle">No se han detectado columnas. Vincula un array de objetos en "Vinculación de Datos" para empezar.</p>;
    }

    return (
        <div>
            <p className="text-xs text-subtle mb-2">Arrastra para reordenar las columnas. Edita el texto para cambiar el encabezado.</p>
            <div className="space-y-2">
                {orderedColumns.map((key, index) => (
                    <div
                        key={key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragOver={(e) => e.preventDefault()}
                        className={`flex items-center space-x-2 p-2 rounded-md bg-panel border border-main ${draggedIndex === index ? 'opacity-50' : ''}`}
                    >
                        <ViewColumnsIcon className="h-5 w-5 text-subtle cursor-grab" />
                        <span className="text-xs font-mono text-subtle truncate" title={key}>{key}</span>
                        <HeaderInput
                            initialValue={(widget.props.columnHeaders || {})[key] || key}
                            onCommit={(newHeader) => handleHeaderChange(key, newHeader)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ColumnManager;
