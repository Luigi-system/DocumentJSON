
import React, { useState } from 'react';
import { WidgetBinding, WidgetInstance, Theme } from '../types';
import { JsonTreeView } from './JsonTreeView';

interface ContextMenuProps {
    x: number;
    y: number;
    type: 'widget' | 'page';
    jsonData: string;
    bindableProperties: { property: string, label: string }[];
    onBind: (binding: WidgetBinding) => void;
    onShowPageProperties: () => void;
    onShowWidgetProperties: () => void;
    onClose: () => void;
    copiedWidget: WidgetInstance | null;
    onCopyWidget: () => void;
    onPasteWidget: () => void;
    onDuplicateWidget: () => void;
    currentTheme: Theme;
}

const ContextMenu: React.FC<ContextMenuProps> = (props) => {
    const { x, y, type, jsonData, bindableProperties, onBind, onClose, onShowPageProperties, onShowWidgetProperties, copiedWidget, onCopyWidget, onPasteWidget, onDuplicateWidget, currentTheme } = props;
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

    const data = JSON.parse(jsonData || '{}');

    const handleBind = (property: string, dataPath: string) => {
        onBind({ property, dataPath });
        onClose();
    };
    
    const menuItemClass = "px-3 py-1 text-sm text-main hover:bg-tertiary cursor-pointer";

    if (type === 'page') {
        return (
            <div
                style={{ top: y, left: x }}
                className={`fixed bg-panel border border-main rounded-md shadow-lg z-50 flex ${currentTheme}`}
                onClick={(e) => e.stopPropagation()}
            >
                <ul className="py-1">
                    <li
                        onClick={onShowPageProperties}
                        className={`${menuItemClass} flex justify-between items-center`}
                    >
                       Propiedades de la Página
                    </li>
                </ul>
            </div>
        );
    }

    return (
        <div
            style={{ top: y, left: x }}
            className={`fixed bg-panel border border-main rounded-md shadow-lg z-50 flex ${currentTheme}`}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setActiveSubMenu(null)}
        >
            <ul className="py-1">
                 <li
                    onClick={onShowWidgetProperties}
                    className={menuItemClass}
                 >
                    Propiedades
                 </li>
                 <li className="px-3 my-1 border-t border-main"></li>
                 <li onClick={() => { onCopyWidget(); onClose(); }} className={menuItemClass}>Copiar</li>
                 {copiedWidget && (
                    <li onClick={() => { onPasteWidget(); onClose(); }} className={menuItemClass}>Pegar</li>
                 )}
                 <li onClick={() => { onDuplicateWidget(); onClose(); }} className={menuItemClass}>Duplicar</li>
                 <li className="px-3 my-1 border-t border-main"></li>
                 <li className="px-3 py-1 text-xs font-semibold text-subtle">Vincular Dato</li>
                {bindableProperties.length > 0 ? (
                    bindableProperties.map(({ property, label }) => (
                        <li
                            key={property}
                            onMouseEnter={() => setActiveSubMenu(property)}
                            className={`${menuItemClass} flex justify-between items-center`}
                        >
                            {label}
                            <span>&rsaquo;</span>
                        </li>
                    ))
                ) : (
                    <li className="px-3 py-1 text-sm text-subtle italic">No hay propiedades vinculables</li>
                )}
            </ul>
             {activeSubMenu && (
                 <div className="border-l border-main min-w-[150px]">
                    <div className="px-3 py-1 text-xs font-semibold text-subtle border-b border-main">Seleccionar Campo de Datos</div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        <JsonTreeView data={data} onSelect={(path) => handleBind(activeSubMenu, path)} />
                    </div>
                 </div>
             )}
        </div>
    );
};

export default ContextMenu;