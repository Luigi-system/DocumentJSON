
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WidgetType, WidgetInstance, PageData, PageProperties, WidgetStyle } from '../types';
import { 
    TitleIcon, SubtitleIcon, TextIcon, StyledParagraphIcon, ListIcon, IndexIcon, 
    ImageIcon, TableIcon, QrCodeIcon, RectangleIcon, CircleIcon, TriangleIcon, ArrowIcon,
    ArrowUturnLeftIcon, CheckboxIcon, PlusIcon, LinkIcon, MinusIcon, UploadIcon, TrashIcon,
    ViewColumnsIcon,
    // Fix: Added missing icon imports
    CogIcon,
    DocumentIcon,
    WaterDropIcon,
    DocumentIconOutline
} from './icons';
import {
    ColorPicker, NumberInput, Select, Slider, TextInput, ToggleButton, AlignmentButtons,
    Label, Section, TwoColumnGrid, ToggleSwitch, InfoTooltip, CollapsibleSection
} from './PropertyControls';
import { getBindableProperties } from './WidgetComponent';
import { JsonTreeView } from './JsonTreeView';


const WIDGET_CATEGORIES: { title: string; widgets: { type: WidgetType; icon: React.FC<{className?: string}>, defaultProps: Partial<WidgetInstance>}[] }[] = [
    {
        title: 'Tipografía',
        widgets: [
            { type: 'Title', icon: TitleIcon, defaultProps: { width: 400, height: 60, x: 50, y: 50, props: { content: 'Título Principal' }, style: { fontSize: 36, fontWeight: 'bold', color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
            { type: 'Subtitle', icon: SubtitleIcon, defaultProps: { width: 350, height: 50, x: 50, y: 50, props: { content: 'Subtítulo de Sección' }, style: { fontSize: 24, fontWeight: 'bold', color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
            { type: 'Text', icon: TextIcon, defaultProps: { width: 350, height: 100, x: 50, y: 50, props: { content: 'Lorem ipsum dolor sit amet...' }, style: { fontSize: 16, color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
            { type: 'Styled Paragraph', icon: StyledParagraphIcon, defaultProps: { width: 400, height: 120, x: 50, y: 50, props: { content: 'Este es un párrafo con más opciones de estilo.' }, style: { fontSize: 16, color: '#333333', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
            { type: 'List', icon: ListIcon, defaultProps: { width: 350, height: 100, x: 50, y: 50, props: { content: [['Primer elemento', []], ['Segundo elemento', [['Sub-elemento 2.1', []], ['Sub-elemento 2.2', []]]]] }, style: { fontSize: 16, color: '#000000', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
            { type: 'Index', icon: IndexIcon, defaultProps: { width: 300, height: 50, x: 50, y: 50, props: { content: 'Índice' }, style: { fontSize: 20, fontWeight: 'bold', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
        ]
    },
    {
        title: 'Medios y Datos',
        widgets: [
            { type: 'Image', icon: ImageIcon, defaultProps: { width: 200, height: 150, x: 50, y: 50, props: { src: '', srcType: 'url' }, style: { objectFit: 'cover', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
            { type: 'Table', icon: TableIcon, defaultProps: { width: 400, height: 150, x: 50, y: 50, props: { tableMode: 'static', tableData: [['Cabecera 1', 'Cabecera 2'], ['Dato 1', 'Dato 2']], repeatHeader: true }, style: { color: '#000000', margin: 0, borderWidth: 1, borderStyle: 'solid', borderColor: '#d1d5db', borderRadius: 0, opacity: 1 } } },
            { type: 'QR Code', icon: QrCodeIcon, defaultProps: { width: 100, height: 100, x: 50, y: 50, props: { data: 'https://gemini.google.com' }, style: { margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
            { type: 'Checkbox', icon: CheckboxIcon, defaultProps: { width: 150, height: 24, x: 50, y: 50, props: { label: 'Mi Casilla', checked: false }, style: { color: '#000000', fontSize: 16, margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 } } },
        ]
    },
    {
        title: 'Formas',
        widgets: [
            { type: 'Rectangle', icon: RectangleIcon, defaultProps: { width: 120, height: 80, x: 50, y: 50, style: { backgroundColor: '#d1d5db', borderColor: '#6b7280', borderWidth: 1, borderStyle: 'solid', borderRadius: 0, opacity: 1, margin: 0 } } },
            { type: 'Circle', icon: CircleIcon, defaultProps: { width: 80, height: 80, x: 50, y: 50, style: { backgroundColor: '#d1d5db', borderColor: '#6b7280', borderWidth: 1, borderStyle: 'solid', borderRadius: 9999, opacity: 1, margin: 0 } } },
            { type: 'Triangle', icon: TriangleIcon, defaultProps: { width: 90, height: 80, x: 50, y: 50, style: { backgroundColor: '#d1d5db', borderColor: 'transparent', borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1, margin: 0 } } },
            { type: 'Arrow', icon: ArrowIcon, defaultProps: { width: 120, height: 40, x: 50, y: 50, style: { backgroundColor: '#d1d5db', borderColor: '#6b7280', borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1, margin: 0 } } },
        ]
    }
]

const Widget: React.FC<{ type: WidgetType; icon: React.FC<{className?: string}>; defaultProps: Partial<WidgetInstance> }> = ({ type, icon: Icon, defaultProps }) => {
    const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('application/json', JSON.stringify({ type, ...defaultProps }));
    };
    
    return (
        <div draggable onDragStart={onDragStart} className="flex flex-col items-center p-2 bg-tertiary rounded-md border border-main cursor-grab active:cursor-grabbing hover:bg-opacity-70 transition-colors">
            <Icon className="h-7 w-7 text-subtle mb-1" />
            <span className="text-xs font-semibold text-main text-center">{type}</span>
        </div>
    )
};

const ListItemInput: React.FC<{
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

const ListItemEditor: React.FC<{
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

    const addItem = (index: number) => { // Adds after index
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
                        <button title="Añadir sub-elemento" onMouseDown={(e) => e.stopPropagation()} onClick={() => addSubItem(index)} className="p-1 hover:bg-tertiary rounded"><PlusIcon className="h-4 w-4 text-green-500"/></button>
                        <button title="Añadir elemento debajo" onMouseDown={(e) => e.stopPropagation()} onClick={() => addItem(index)} className="p-1 hover:bg-tertiary rounded"><PlusIcon className="h-4 w-4 text-blue-500"/></button>
                        <button title="Eliminar elemento" onMouseDown={(e) => e.stopPropagation()} onClick={() => removeItem(index)} className="p-1 hover:bg-tertiary rounded"><TrashIcon className="h-4 w-4 text-red-500"/></button>
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

interface PropertyEditorProps {
    widget: WidgetInstance;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
    jsonData: string;
    onOpenAiTextModal: (widgetId: string) => void;
}

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
        } catch (e) { /* ignore json parsing error */ }
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


// New reusable components for properties:

interface LayoutPropertiesProps {
    widget: WidgetInstance;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
}

const LayoutProperties: React.FC<LayoutPropertiesProps> = ({ widget, onUpdateWidget }) => {
    const handleWidgetPropChange = (propName: keyof WidgetInstance, value: any) => {
        onUpdateWidget(widget.id, { [propName]: value });
    };
    const handleStyleChange = (styleName: keyof WidgetStyle, value: any) => {
        onUpdateWidget(widget.id, { style: { ...widget.style, [styleName]: value } });
    };

    return (
        <Section title="Posición y Tamaño">
            <TwoColumnGrid>
                <NumberInput label="X" value={widget.x} onChange={(v) => handleWidgetPropChange('x', v)} tooltip="La posición horizontal (izquierda) del widget." />
                <NumberInput label="Y" value={widget.y} onChange={(v) => handleWidgetPropChange('y', v)} tooltip="La posición vertical (superior) del widget." />
            </TwoColumnGrid>
            <TwoColumnGrid>
                <NumberInput label="Ancho" value={widget.width} onChange={(v) => handleWidgetPropChange('width', v)} tooltip="El ancho del widget en píxeles." />
                <NumberInput label="Alto" value={widget.height} onChange={(v) => handleWidgetPropChange('height', v)} tooltip="El alto del widget en píxeles. Algunos widgets de texto ajustan su altura automáticamente." />
            </TwoColumnGrid>
            <Label tooltip="Los márgenes añaden espacio fuera del borde del widget.">Márgenes (px)</Label>
            <TwoColumnGrid>
                <NumberInput label="Arriba" value={widget.style.marginTop ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginTop', v)} />
                <NumberInput label="Derecha" value={widget.style.marginRight ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginRight', v)} />
                <NumberInput label="Abajo" value={widget.style.marginBottom ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginBottom', v)} />
                <NumberInput label="Izquierda" value={widget.style.marginLeft ?? widget.style.margin ?? 0} onChange={(v) => handleStyleChange('marginLeft', v)} />
            </TwoColumnGrid>
            <NumberInput label="Todos" value={widget.style.margin ?? 0} onChange={(v) => {
                handleStyleChange('margin', v);
                handleStyleChange('marginTop', v);
                handleStyleChange('marginBottom', v);
                handleStyleChange('marginLeft', v);
                handleStyleChange('marginRight', v);
            }} tooltip="Establece todos los márgenes a un mismo valor." />
        </Section>
    );
}

interface BorderAndBackgroundPropertiesProps {
    widget: WidgetInstance;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
    showBackground?: boolean;
    showBorder?: boolean;
    showOpacity?: boolean;
    showBorderRadius?: boolean;
    customPrefix?: 'props.headerStyle' | 'props.evenRowStyle' | 'props.oddRowStyle'; // For table sub-styles
}

const BorderAndBackgroundProperties: React.FC<BorderAndBackgroundPropertiesProps> = ({
    widget, onUpdateWidget, showBackground = true, showBorder = true, showOpacity = true, showBorderRadius = true, customPrefix
}) => {
    const currentStyle = customPrefix ? (getNestedValue(widget, customPrefix) || {}) : widget.style;

    const handleStyleChange = (styleName: keyof WidgetStyle, value: any) => {
        if (customPrefix) {
            const currentPropStyle = getNestedValue(widget, customPrefix) || {};
            onUpdateWidget(widget.id, { props: { ...widget.props, [customPrefix.split('.')[1]]: { ...currentPropStyle, [styleName]: value } } });
        } else {
            onUpdateWidget(widget.id, { style: { ...widget.style, [styleName]: value } });
        }
    };

    return (
        <Section title="Fondo y Borde">
            {showBackground && (
                <ColorPicker label="Color de Fondo" value={currentStyle.backgroundColor || 'transparent'} onChange={(v) => handleStyleChange('backgroundColor', v)} />
            )}
            {showBorder && (
                <>
                    <TwoColumnGrid>
                        <ColorPicker label="Color de Borde" value={currentStyle.borderColor || '#000000'} onChange={(v) => handleStyleChange('borderColor', v)} />
                        <Select
                            label="Estilo de Borde"
                            value={currentStyle.borderStyle || 'solid'}
                            onChange={(v) => handleStyleChange('borderStyle', v as WidgetStyle['borderStyle'])}
                            options={[
                                { value: 'none', label: 'Ninguno' },
                                { value: 'solid', label: 'Sólido' },
                                { value: 'dashed', label: 'Discontinuo' },
                                { value: 'dotted', label: 'Punteado' },
                                { value: 'double', label: 'Doble' },
                            ]}
                        />
                    </TwoColumnGrid>
                    <NumberInput label="Ancho de Borde" value={currentStyle.borderWidth || 0} onChange={(v) => handleStyleChange('borderWidth', v)} />
                </>
            )}
            {showBorderRadius && (
                <NumberInput label="Redondez de Esquina" value={currentStyle.borderRadius || 0} onChange={(v) => handleStyleChange('borderRadius', v)} tooltip="Define el radio de las esquinas del widget para redondearlas." />
            )}
            {showOpacity && (
                <Slider label="Opacidad" min={0} max={1} step={0.05} value={currentStyle.opacity ?? 1} onChange={(v) => handleStyleChange('opacity', v)} />
            )}
        </Section>
    );
};


const PropertyEditor: React.FC<PropertyEditorProps> = ({ widget, onUpdateWidget, jsonData, onOpenAiTextModal }) => {
    const [bindingProperty, setBindingProperty] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePropChange = (propName: string, value: any) => {
        onUpdateWidget(widget.id, { props: { ...widget.props, [propName]: value } });
    };

    const handleStyleChange = (styleName: keyof WidgetInstance['style'], value: any) => {
        onUpdateWidget(widget.id, { style: { ...widget.style, [styleName]: value } });
    };

    const handleHeaderStyleChange = (styleName: keyof WidgetInstance['style'], value: any) => {
        onUpdateWidget(widget.id, { props: { ...widget.props, headerStyle: { ...widget.props.headerStyle, [styleName]: value } } });
    };

    const handleEvenRowStyleChange = (styleName: keyof WidgetInstance['style'], value: any) => {
        onUpdateWidget(widget.id, { props: { ...widget.props, evenRowStyle: { ...widget.props.evenRowStyle, [styleName]: value } } });
    };

    const handleOddRowStyleChange = (styleName: keyof WidgetInstance['style'], value: any) => {
        onUpdateWidget(widget.id, { props: { ...widget.props, oddRowStyle: { ...widget.props.oddRowStyle, [styleName]: value } } });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target?.result as string;
                handlePropChange('src', base64String);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const TextProperties = () => (
      <>
        <Section title="Contenido">
            <TextInput 
                label="Texto" 
                value={typeof widget.props.content === 'string' ? widget.props.content : ''} 
                onChange={(v) => handlePropChange('content', v)} 
                isTextarea 
                onLabelAction={() => onOpenAiTextModal(widget.id)}
            />
            <TextInput label="Hipervínculo" value={widget.props.link || ''} onChange={(v) => handlePropChange('link', v)} tooltip="Enlaza este texto a una URL externa. Asegúrate de incluir https://." />
        </Section>
        <Section title="Tipografía">
            <TwoColumnGrid>
                <NumberInput label="Tamaño" value={widget.style.fontSize || 16} onChange={(v) => handleStyleChange('fontSize', v)} />
                <ColorPicker label="Color" value={widget.style.color || '#000000'} onChange={(v) => handleStyleChange('color', v)} />
            </TwoColumnGrid>
            <Select
                label="Fuente"
                value={widget.style.fontFamily || 'sans-serif'}
                onChange={(v) => handleStyleChange('fontFamily', v)}
                options={[
                    { value: 'sans-serif', label: 'Sans Serif' }, { value: 'serif', label: 'Serif' }, { value: 'monospace', label: 'Monospace' }
                ]}
            />
            <div className="flex items-center space-x-2 mt-2">
                <ToggleButton label="Negrita" value={widget.style.fontWeight === 'bold'} onChange={(v) => handleStyleChange('fontWeight', v ? 'bold' : 'normal')} />
                <ToggleButton label="Cursiva" value={widget.style.fontStyle === 'italic'} onChange={(v) => handleStyleChange('fontStyle', v ? 'italic' : 'normal')} />
            </div>
             <AlignmentButtons value={widget.style.textAlign || 'left'} onChange={(v) => handleStyleChange('textAlign', v)} />
        </Section>
      </>
    );

    const DataBindingSection = () => {
        const bindable = getBindableProperties(widget.type);
        if (bindable.length === 0) return null;

        const parsedJson = useMemo(() => {
            try { return JSON.parse(jsonData); } catch { return {}; }
        }, [jsonData]);

        return (
            <Section title="Vinculación de Datos" tooltip="La vinculación de datos conecta las propiedades del widget (como el contenido del texto o la fuente de la imagen) a los campos de tus datos JSON. Cuando el JSON cambia, el widget se actualiza automáticamente.">
                {bindable.map(prop => (
                    <div key={prop.property} className="relative">
                        <Label>{prop.label}</Label>
                        <div className="flex items-center space-x-2">
                            <p className="flex-grow p-2 text-xs font-mono bg-panel border border-main rounded-md text-subtle truncate">
                                {widget.bindings?.[prop.property] || 'No vinculado'}
                            </p>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setBindingProperty(p => p === prop.property ? null : prop.property)}
                                className="p-2 bg-panel border border-main rounded-md hover:bg-tertiary"
                                title="Vincular dato"
                            >
                                <LinkIcon className="h-4 w-4 text-indigo-500" />
                            </button>
                        </div>
                        {bindingProperty === prop.property && (
                            <div 
                                className="absolute right-0 mt-1 w-64 bg-secondary border border-main rounded-md shadow-lg z-20 max-h-60 overflow-y-auto p-2"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <JsonTreeView
                                    data={parsedJson}
                                    onSelect={(path) => {
                                        onUpdateWidget(widget.id, { 
                                            bindings: { ...(widget.bindings || {}), [prop.property]: path } 
                                        });
                                        setBindingProperty(null);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </Section>
        );
    };
    
    return (
        <>
            <CollapsibleSection title="Posición y Tamaño" icon={ViewColumnsIcon}>
                <LayoutProperties widget={widget} onUpdateWidget={onUpdateWidget} />
            </CollapsibleSection>
            {['Title', 'Subtitle', 'Text', 'Styled Paragraph', 'Index'].includes(widget.type) && (
                <CollapsibleSection title="Contenido y Tipografía" icon={TextIcon}>
                    <TextProperties />
                </CollapsibleSection>
            )}
            {widget.type === 'List' && (
                <>
                    <CollapsibleSection title="Elementos de la Lista" icon={ListIcon}>
                        <ListItemEditor items={(widget.props.content || []) as [string, any[]][]} onChange={(newItems) => handlePropChange('content', newItems)} path={[]} />
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={() => handlePropChange('content', [...((widget.props.content || []) as [string, any[]][]), ['Nuevo Elemento', []]])} className="mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
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
            )}
            {widget.type === 'Image' && (
                <>
                <CollapsibleSection title="Fuente de la Imagen" icon={ImageIcon}>
                    <Select
                        label="Tipo de Fuente"
                        tooltip="Elige si la imagen se carga desde una URL pública o desde datos Base64 incrustados."
                        value={widget.props.srcType || 'url'}
                        onChange={(v) => handlePropChange('srcType', v)}
                        options={[{value: 'url', label: 'URL'}, {value: 'base64', label: 'Base64'}]}
                    />
                    {widget.props.srcType === 'base64' ? (
                        <div>
                             <Label>Datos Base64</Label>
                             <textarea onMouseDown={(e) => e.stopPropagation()} value={widget.props.src || ''} readOnly className="w-full h-16 p-2 text-xs font-mono border border-main rounded-md bg-panel text-main resize-none" />
                             <button onMouseDown={(e) => e.stopPropagation()} onClick={() => fileInputRef.current?.click()} className="mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                                 <UploadIcon className="h-4 w-4" />
                                 <span>Subir Imagen</span>
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>
                    ) : (
                        <TextInput label="URL de la Imagen" value={widget.props.src || ''} onChange={(v) => handlePropChange('src', v)} isTextarea />
                    )}
                </CollapsibleSection>
                <CollapsibleSection title="Apariencia de la Imagen" icon={ImageIcon}>
                     <Select
                        label="Ajuste"
                        tooltip="'Cubrir' llena el área cortando la imagen, 'Contener' muestra la imagen completa ajustándola, 'Rellenar' estira la imagen para llenar el área."
                        value={widget.style.objectFit || 'cover'}
                        onChange={(v) => handleStyleChange('objectFit', v)}
                        options={[{value: 'cover', label: 'Cubrir'}, {value: 'contain', label: 'Contener'}, {value: 'fill', label: 'Rellenar'}]}
                    />
                </CollapsibleSection>
                </>
            )}
            {widget.type === 'QR Code' && (
                <CollapsibleSection title="Datos del Código QR" icon={QrCodeIcon}>
                    <TextInput label="Datos del Código QR" value={widget.props.data || ''} onChange={(v) => handlePropChange('data', v)} />
                </CollapsibleSection>
            )}
            {widget.type === 'Checkbox' && (
                <>
                 <CollapsibleSection title="Propiedades del Checkbox" icon={CheckboxIcon}>
                    <TextInput label="Etiqueta" value={widget.props.label || ''} onChange={(v) => handlePropChange('label', v)} />
                    <ToggleSwitch label="Marcado" checked={widget.props.checked || false} onChange={(v) => handlePropChange('checked', v)} />
                </CollapsibleSection>
                <CollapsibleSection title="Estilo de Etiqueta del Checkbox" icon={TextIcon}>
                    <TwoColumnGrid>
                        <NumberInput label="Tamaño de Fuente" value={widget.style.fontSize || 16} onChange={v => handleStyleChange('fontSize', v)} />
                        <ColorPicker label="Color" value={widget.style.color || '#000000'} onChange={v => handleStyleChange('color', v)} />
                    </TwoColumnGrid>
                </CollapsibleSection>
                </>
            )}
            {widget.type === 'Table' && (
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

                    <BorderAndBackgroundProperties widget={widget} onUpdateWidget={onUpdateWidget} showBorderRadius={false} customPrefix="props.headerStyle" />
                    <BorderAndBackgroundProperties widget={widget} onUpdateWidget={onUpdateWidget} showBorderRadius={false} customPrefix="props.oddRowStyle" />
                    <BorderAndBackgroundProperties widget={widget} onUpdateWidget={onUpdateWidget} showBorderRadius={false} customPrefix="props.evenRowStyle" />
                </>
            )}
            
            {/* General appearance properties for all widgets, except Table which has specific styling. */}
            { !['Table', 'Image'].includes(widget.type) && (
                <CollapsibleSection title="Fondo y Borde" icon={RectangleIcon}>
                    <BorderAndBackgroundProperties widget={widget} onUpdateWidget={onUpdateWidget} showBackground={true} showBorder={true} showOpacity={true} showBorderRadius={true} /> 
                </CollapsibleSection>
            )}
            { widget.type === 'Image' && (
                <CollapsibleSection title="Borde de la Imagen" icon={RectangleIcon}>
                    <BorderAndBackgroundProperties widget={widget} onUpdateWidget={onUpdateWidget} showBackground={false} showBorder={true} showOpacity={true} showBorderRadius={true} /> 
                </CollapsibleSection>
            )}

            <CollapsibleSection title="Vinculación de Datos" icon={LinkIcon}>
                <DataBindingSection />
            </CollapsibleSection>
        </>
    );
}

const PagePropertiesPanel: React.FC<{
    pageProperties: PageProperties,
    onUpdate: (newProps: Partial<PageProperties>) => void,
    onApplyToAll: () => void,
}> = ({ pageProperties, onUpdate, onApplyToAll }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePropChange = (prop: keyof PageProperties, value: any) => {
        onUpdate({ [prop]: value });
    };

    const handleWatermarkChange = (prop: keyof PageProperties['watermark'], value: any) => {
        onUpdate({ watermark: { ...pageProperties.watermark, [prop]: value } });
    };

    const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target?.result as string;
                handleWatermarkChange('src', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-main">Propiedades de la Página</h2>
            <CollapsibleSection title="Diseño" icon={DocumentIcon}>
                <Select
                    label="Orientación"
                    tooltip="Establece la orientación de la página a vertical (retrato) u horizontal (paisaje)."
                    value={pageProperties.orientation}
                    onChange={(v) => handlePropChange('orientation', v)}
                    options={[{ value: 'Portrait', label: 'Vertical (8.5 x 11)' }, { value: 'Landscape', label: 'Horizontal (11 x 8.5)' }]}
                />
                 <ColorPicker label="Color de Fondo" value={pageProperties.backgroundColor} onChange={(v) => handlePropChange('backgroundColor', v)} />
            </CollapsibleSection>
            <CollapsibleSection title="Marca de Agua" icon={WaterDropIcon}>
                <ToggleSwitch label="Activar Marca de Agua" checked={pageProperties.watermark.enabled} onChange={(v) => handleWatermarkChange('enabled', v)} />
                {pageProperties.watermark.enabled && (
                    <div className="space-y-3 pt-2">
                        <Select
                            label="Tipo"
                            value={pageProperties.watermark.type || 'Text'}
                            onChange={(v) => handleWatermarkChange('type', v)}
                            options={[{ value: 'Text', label: 'Texto' }, { value: 'Image', label: 'Imagen' }]}
                        />
                        {pageProperties.watermark.type === 'Image' ? (
                             <div>
                                <TextInput label="URL de la imagen o Base64" value={pageProperties.watermark.src || ''} onChange={(v) => handleWatermarkChange('src', v)} isTextarea />
                                <button onMouseDown={(e) => e.stopPropagation()} onClick={() => fileInputRef.current?.click()} className="mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                                    <UploadIcon className="h-4 w-4" />
                                    <span>Subir Imagen</span>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleWatermarkImageUpload} accept="image/*" className="hidden" />
                            </div>
                        ) : (
                             <>
                                <TextInput label="Texto" value={pageProperties.watermark.text} onChange={(v) => handleWatermarkChange('text', v)} />
                                <TwoColumnGrid>
                                    <NumberInput label="Tamaño de Fuente" value={pageProperties.watermark.fontSize} onChange={(v) => handleWatermarkChange('fontSize', v)} />
                                    <ColorPicker label="Color" value={pageProperties.watermark.color} onChange={(v) => handleWatermarkChange('color', v)} />
                                </TwoColumnGrid>
                             </>
                        )}
                       
                        <Slider label="Opacidad" min={0} max={1} step={0.05} value={pageProperties.watermark.opacity} onChange={(v) => handleWatermarkChange('opacity', v)} />
                        <Slider label="Ángulo" min={-90} max={90} step={5} value={pageProperties.watermark.angle} onChange={(v) => handleWatermarkChange('angle', v)} />
                    </div>
                )}
            </CollapsibleSection>
            <CollapsibleSection title="Encabezado y Pie de Página" icon={DocumentIconOutline}>
                <ToggleSwitch label="Activar Encabezado" checked={pageProperties.header.enabled} onChange={(v) => onUpdate({ header: { ...pageProperties.header, enabled: v }})} />
                 {pageProperties.header.enabled && (
                    <TextInput label="Texto del Encabezado" value={pageProperties.header.text} onChange={(v) => onUpdate({ header: { ...pageProperties.header, text: v }})} />
                )}
                 <ToggleSwitch label="Activar Número de Página" checked={pageProperties.pagination.enabled} onChange={(v) => onUpdate({ pagination: { enabled: v }})} tooltip="Activa para mostrar automáticamente el número de página en el pie de página." />
            </CollapsibleSection>
            <div>
                 <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={onApplyToAll}
                    className="w-full px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 border border-indigo-200 rounded-md hover:bg-indigo-200"
                 >
                    Aplicar a Todas las Páginas
                 </button>
            </div>
        </div>
    );
};

const WidgetList: React.FC = () => (
    <div className="space-y-4"> {/* Added a wrapper div for consistent spacing */}
        {WIDGET_CATEGORIES.map(category => (
            <CollapsibleSection key={category.title} title={category.title} icon={category.widgets[0].icon}>
              <div className="grid grid-cols-2 gap-2">
                  {category.widgets.map(widget => (
                      <Widget key={widget.type} type={widget.type} icon={widget.icon} defaultProps={widget.defaultProps} />
                  ))}
              </div>
            </CollapsibleSection>
        ))}
    </div>
);

interface WidgetsProps {
    mode: 'widgets' | 'widgetProperties' | 'pageProperties';
    selectedWidget: WidgetInstance | null;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
    onShowWidgetList: () => void;
    pages: PageData[];
    activePageIndex: number;
    onUpdatePageProperties: (pageIndex: number, newProps: Partial<PageProperties>) => void;
    onApplyPropertiesToAllPages: (properties: PageProperties) => void;
    jsonData: string;
    style?: React.CSSProperties;
    onOpenAiTextModal: (widgetId: string) => void;
}

const Widgets: React.FC<WidgetsProps> = (props) => {
    const { mode, selectedWidget, onUpdateWidget, onShowWidgetList, pages, activePageIndex, onUpdatePageProperties, onApplyPropertiesToAllPages, jsonData, style, onOpenAiTextModal } = props;
    const activePage = pages[activePageIndex];

    const renderContent = () => {
        switch (mode) {
            case 'widgetProperties':
                if (selectedWidget) {
                    return (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-bold text-main">Propiedades de {selectedWidget.type}</h2>
                                <button onClick={onShowWidgetList} className="p-1 rounded-full hover:bg-tertiary text-subtle" title="Volver a Widgets">
                                    <ArrowUturnLeftIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <PropertyEditor 
                                    widget={selectedWidget} 
                                    onUpdateWidget={onUpdateWidget} 
                                    jsonData={jsonData} 
                                    onOpenAiTextModal={onOpenAiTextModal}
                                />
                            </div>
                        </div>
                    );
                }
                return <WidgetList />; 
            case 'pageProperties':
                if (activePage) {
                    return (
                        <PagePropertiesPanel 
                            pageProperties={activePage.properties}
                            onUpdate={(newProps) => onUpdatePageProperties(activePageIndex, newProps)}
                            onApplyToAll={() => onApplyPropertiesToAllPages(activePage.properties)}
                        />
                    );
                }
                 return <WidgetList />; 
            case 'widgets':
            default:
                return <WidgetList />;
        }
    };

    return (
        <aside style={style} className="bg-panel border-l border-main p-4 flex-shrink-0 flex flex-col space-y-6 overflow-y-auto">
            {renderContent()}
        </aside>
    );
};

export default Widgets;
