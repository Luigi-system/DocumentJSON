import React from 'react';
import { ListIcon, PlusIcon, TextIcon } from '@/shared/icons';
import {
    ColorPicker, NumberInput, CollapsibleSection, TwoColumnGrid,
} from '../PropertyControls';
import { ListItemEditor } from './shared/ListItemEditor';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const ListPropertyPanel: WidgetDefinition['PropertyPanel'] = ({ widget, handlePropChange, handleStyleChange }) => (
    <>
        <CollapsibleSection title="Elementos de la Lista" icon={ListIcon}>
            <ListItemEditor
                items={(widget.props.content || []) as [string, any[]][]}
                onChange={(newItems) => handlePropChange('content', newItems)}
                path={[]}
            />
            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handlePropChange('content', [...((widget.props.content || []) as [string, any[]][]), ['Nuevo Elemento', []]])}
                className="mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"
            >
                <PlusIcon className="h-4 w-4" />
                <span>Añadir Elemento Principal</span>
            </button>
        </CollapsibleSection>
        <CollapsibleSection title="Tipografía" icon={TextIcon}>
            <TwoColumnGrid>
                <NumberInput label="Tamaño" value={widget.style.fontSize || 16} onChange={(v) => handleStyleChange('fontSize', v)} />
                <ColorPicker label="Color" value={widget.style.color || '#000000'} onChange={(v) => handleStyleChange('color', v)} />
            </TwoColumnGrid>
        </CollapsibleSection>
    </>
);

export const widgetListaDefinition: WidgetDefinition = {
    type: 'List',
    icon: ListIcon,
    defaultProps: {
        width: 350, height: 100, x: 50, y: 50,
        props: { content: [['Primer elemento', []], ['Segundo elemento', [['Sub-elemento 2.1', []], ['Sub-elemento 2.2', []]]]] },
        style: { fontSize: 16, color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
    },
    bindableProperties: [{ property: 'props.content', label: 'Elementos de la Lista' }],
    PropertyPanel: ListPropertyPanel,
    appearanceMode: 'default',
};

const WidgetLista: React.FC = () => <WidgetPaletteItem definition={widgetListaDefinition} />;

export default WidgetLista;
