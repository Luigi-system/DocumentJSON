import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@/shared/icons';

export const ListItemInput: React.FC<{
    initialValue: string;
    onCommit: (newValue: string) => void;
}> = ({ initialValue, onCommit }) => {
    const [localValue, setLocalValue] = useState(initialValue);

    useEffect(() => {
        setLocalValue(initialValue);
    }, [initialValue]);

    const handleBlur = () => {
        if (localValue !== initialValue) {
            onCommit(localValue);
        }
    };

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

export const ListItemEditor: React.FC<{
    items: [string, any[]][];
    onChange: (newItems: [string, any[]][]) => void;
    path: number[];
}> = ({ items, onChange, path }) => {
    const handleItemChange = (index: number, newText: string) => {
        const newItems = JSON.parse(JSON.stringify(items));
        newItems[index][0] = newText;
        onChange(newItems);
    };

    const handleSubItemsChange = (index: number, newSubItems: [string, any[]][]) => {
        const newItems = JSON.parse(JSON.stringify(items));
        newItems[index][1] = newSubItems;
        onChange(newItems);
    };

    const addItem = (index: number) => {
        const newItems = JSON.parse(JSON.stringify(items));
        newItems.splice(index + 1, 0, ['Nuevo Elemento', []]);
        onChange(newItems);
    };

    const addSubItem = (index: number) => {
        const newItems = JSON.parse(JSON.stringify(items));
        const subItems = newItems[index][1] || [];
        subItems.push(['Nuevo Sub-elemento', []]);
        newItems[index][1] = subItems;
        onChange(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = JSON.parse(JSON.stringify(items));
        newItems.splice(index, 1);
        onChange(newItems);
    };

    return (
        <div className="space-y-2">
            {items.map(([text, subItems], index) => (
                <div key={`${path.join('-')}-${index}`}>
                    <div className="flex items-center space-x-1">
                        <ListItemInput
                            initialValue={text}
                            onCommit={(newText) => handleItemChange(index, newText)}
                        />
                        <button title="Añadir sub-elemento" onMouseDown={(e) => e.stopPropagation()} onClick={() => addSubItem(index)} className="p-1 hover:bg-tertiary rounded"><PlusIcon className="h-4 w-4 text-green-500" /></button>
                        <button title="Añadir elemento debajo" onMouseDown={(e) => e.stopPropagation()} onClick={() => addItem(index)} className="p-1 hover:bg-tertiary rounded"><PlusIcon className="h-4 w-4 text-blue-500" /></button>
                        <button title="Eliminar elemento" onMouseDown={(e) => e.stopPropagation()} onClick={() => removeItem(index)} className="p-1 hover:bg-tertiary rounded"><TrashIcon className="h-4 w-4 text-red-500" /></button>
                    </div>
                    {subItems && subItems.length > 0 && (
                        <div className="ml-4 pl-2 border-l border-main mt-1">
                            <ListItemEditor
                                items={subItems}
                                onChange={(newSubItems) => handleSubItemsChange(index, newSubItems)}
                                path={[...path, index]}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
