
import React, { useState, useMemo, useRef } from 'react';
import { WidgetInstance, PageData, PageProperties } from '@/types';
import {
    ArrowUturnLeftIcon, LinkIcon, UploadIcon,
    ViewColumnsIcon, DocumentIcon, WaterDropIcon, DocumentIconOutline, RectangleIcon,
} from '@/shared/icons';
import {
    ColorPicker, NumberInput, Select, Slider, TextInput,
    Label, Section, TwoColumnGrid, ToggleSwitch, CollapsibleSection,
} from './PropertyControls';
import { JsonTreeView } from './JsonTreeView';
import { WIDGET_CATEGORIES, getWidgetDefinition, getBindableProperties } from './widgets/index';
import { BorderAndBackgroundPropertyPanel, LayoutPropertyPanel } from './widgets/shared/PropertyPanels';

interface PropertyEditorProps {
    widget: WidgetInstance;
    onUpdateWidget: (id: string, newProps: Partial<WidgetInstance>) => void;
    jsonData: string;
    onOpenAiTextModal: (widgetId: string) => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ widget, onUpdateWidget, jsonData, onOpenAiTextModal }) => {
    const [bindingProperty, setBindingProperty] = useState<string | null>(null);
    const definition = getWidgetDefinition(widget.type);

    const handlePropChange = (propName: string, value: any) => {
        onUpdateWidget(widget.id, { props: { ...widget.props, [propName]: value } });
    };

    const handleStyleChange = (styleName: keyof WidgetInstance['style'], value: any) => {
        onUpdateWidget(widget.id, { style: { ...widget.style, [styleName]: value } });
    };

    const panelProps = {
        widget,
        onUpdateWidget,
        jsonData,
        onOpenAiTextModal,
        handlePropChange,
        handleStyleChange,
    };

    const appearanceMode = definition?.appearanceMode ?? 'default';

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
                                            bindings: { ...(widget.bindings || {}), [prop.property]: path },
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
                <LayoutPropertyPanel widget={widget} onUpdateWidget={onUpdateWidget} />
            </CollapsibleSection>

            {definition && <definition.PropertyPanel {...panelProps} />}

            {appearanceMode === 'default' && (
                <CollapsibleSection title="Fondo y Borde" icon={RectangleIcon}>
                    <BorderAndBackgroundPropertyPanel widget={widget} onUpdateWidget={onUpdateWidget} />
                </CollapsibleSection>
            )}
            {appearanceMode === 'borderOnly' && (
                <CollapsibleSection title="Borde de la Imagen" icon={RectangleIcon}>
                    <BorderAndBackgroundPropertyPanel widget={widget} onUpdateWidget={onUpdateWidget} showBackground={false} />
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
            <CollapsibleSection key={category.title} title={category.title} icon={category.icon}>
              <div className="grid grid-cols-2 gap-2">
                  {category.widgets.map(WidgetPaletteComponent => (
                      <WidgetPaletteComponent key={WidgetPaletteComponent.name} />
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
