import React from 'react';
import { CogIcon, PlusIcon, MinusIcon, TableIcon, ViewColumnsIcon } from '@/shared/icons';
import {
    CollapsibleSection, TwoColumnGrid, ToggleSwitch,
} from '../PropertyControls';
import ColumnManager from './shared/ColumnManager';
import { BorderAndBackgroundPropertyPanel } from './shared/PropertyPanels';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const TablePropertyPanel: WidgetDefinition['PropertyPanel'] = ({ widget, onUpdateWidget, jsonData, handlePropChange }) => (
    <>
        <CollapsibleSection title="Modo de Tabla" icon={TableIcon}>
            <div className="flex bg-editor-canvas rounded-md p-1">
                <button onMouseDown={(e) => e.stopPropagation()} onClick={() => handlePropChange('tableMode', 'static')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${widget.props.tableMode === 'static' ? 'text-indigo-700 bg-panel shadow-sm' : 'text-subtle hover:bg-opacity-50'}`}>Estático</button>
                <button onMouseDown={(e) => e.stopPropagation()} onClick={() => handlePropChange('tableMode', 'dynamic')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${widget.props.tableMode === 'dynamic' ? 'text-indigo-700 bg-panel shadow-sm' : 'text-subtle hover:bg-opacity-50'}`}>Dinámico</button>
            </div>
        </CollapsibleSection>

        {widget.props.tableMode === 'static' ? (
            <CollapsibleSection title="Editar Tabla Estática" icon={TableIcon}>
                <p className="text-xs text-subtle mb-3 italic">Haz doble clic en una celda en el lienzo para editar su contenido.</p>
                <TwoColumnGrid>
                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => {
                        const colCount = (widget.props.tableData as string[][])?.[0]?.length || 2;
                        handlePropChange('tableData', [...((widget.props.tableData || []) as string[][]), Array(colCount).fill('...')]);
                    }} className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"><PlusIcon className="h-4 w-4" /><span>Fila</span></button>
                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => {
                        if (((widget.props.tableData || []) as string[][]).length > 1) handlePropChange('tableData', ((widget.props.tableData || []) as string[][]).slice(0, -1));
                    }} className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"><MinusIcon className="h-4 w-4" /><span>Fila</span></button>
                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => {
                        handlePropChange('tableData', ((widget.props.tableData || []) as string[][]).map(row => [...row, '...']));
                    }} className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"><PlusIcon className="h-4 w-4" /><span>Columna</span></button>
                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => {
                        if (((widget.props.tableData || []) as string[][])?.[0]?.length > 1) handlePropChange('tableData', ((widget.props.tableData || []) as string[][]).map(row => row.slice(0, -1)));
                    }} className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"><MinusIcon className="h-4 w-4" /><span>Columna</span></button>
                </TwoColumnGrid>
            </CollapsibleSection>
        ) : (
            <>
                <CollapsibleSection title="Configuración de Columnas" icon={ViewColumnsIcon}>
                    <ColumnManager widget={widget} jsonData={jsonData} onUpdateWidget={onUpdateWidget} />
                </CollapsibleSection>
                <CollapsibleSection title="Comportamiento Dinámico" icon={CogIcon}>
                    <ToggleSwitch label="Repetir Encabezado en cada Página" checked={widget.props.repeatHeader ?? true} onChange={v => handlePropChange('repeatHeader', v)} tooltip="Si una tabla dinámica se divide en varias páginas, esta opción repetirá la fila del encabezado al principio de cada nueva página." />
                </CollapsibleSection>
            </>
        )}

        <BorderAndBackgroundPropertyPanel widget={widget} onUpdateWidget={onUpdateWidget} showBorderRadius={false} customPrefix="props.headerStyle" />
        <BorderAndBackgroundPropertyPanel widget={widget} onUpdateWidget={onUpdateWidget} showBorderRadius={false} customPrefix="props.oddRowStyle" />
        <BorderAndBackgroundPropertyPanel widget={widget} onUpdateWidget={onUpdateWidget} showBorderRadius={false} customPrefix="props.evenRowStyle" />
    </>
);

export const widgetTablaDefinition: WidgetDefinition = {
    type: 'Table',
    icon: TableIcon,
    defaultProps: {
        width: 400, height: 150, x: 50, y: 50,
        props: { tableMode: 'static', tableData: [['Cabecera 1', 'Cabecera 2'], ['Dato 1', 'Dato 2']], repeatHeader: true },
        style: { color: '#000000', margin: 0, borderWidth: 1, borderStyle: 'solid', borderColor: '#d1d5db', borderRadius: 0, opacity: 1 },
    },
    bindableProperties: [{ property: 'props.tableData', label: 'Datos de Tabla' }],
    PropertyPanel: TablePropertyPanel,
    appearanceMode: 'none',
};

const WidgetTabla: React.FC = () => <WidgetPaletteItem definition={widgetTablaDefinition} />;

export default WidgetTabla;
