

import React, { useState, useMemo, useEffect } from 'react';
import { LinkIcon, CopyIcon, TrashIcon, BookOpenIcon, CogIcon, InformationCircleIcon, CodeBracketIcon, MakeIcon, N8nIcon, UploadIcon, ChevronDownIcon, ChevronRightIcon, ViewColumnsIcon } from './icons';
import { JsonTreeView } from './JsonTreeView';
import { PageData, ProjectDocumentation, DocGenConfig, Template, WidgetInstance } from '../types';
import { DocumentationTreeView } from './DocumentationTreeView';
// Re-using this is not ideal as it resolves variables. Let's create a new one.
import { CollapsibleSection } from './PropertyControls'; // Import CollapsibleSection from PropertyControls

interface SidebarProps {
    jsonData: string;
    onOpenJsonModal: () => void;
    pages: PageData[];
    activePageIndex: number;
    selectedWidgetId: string | null;
    onSelectWidget: (widgetId: string | null) => void;
    onDeleteWidget: (widgetId: string) => void;
    onReorderWidgets: (pageIndex: number, startIndex: number, endIndex: number) => void;
    widgetBindings?: string[]; 
    style?: React.CSSProperties;
    documentation: ProjectDocumentation | null;
    onShowDocDetail: (title: string, code: string, explanation: string, config: DocGenConfig) => void;
    webhookUrl: string;
    setWebhookUrl: (url: string) => void;
    activeTemplate: Template | null;
}

const renderWidgetToTemplateHtml = (widget: WidgetInstance): string => {
    const { props, style, type, bindings } = widget;
    
    let styleString = `position: absolute; left: ${widget.x}px; top: ${widget.y}px; width: ${widget.width}px; height: ${widget.height}px; box-sizing: border-box;`;
    for (const key in style) {
        const cssKey = key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
        const value = style[key as keyof typeof style];
        if (typeof value === 'number' && ['fontSize', 'borderWidth', 'borderRadius', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(key)) {
            styleString += `${cssKey}: ${value}px; `;
        } else {
            styleString += `${cssKey}: ${value}; `;
        }
    }

    let content = '';
    if (bindings['props.content']) {
        content = `{{${bindings['props.content']}}}`;
    } else if (typeof props.content === 'string') {
        content = props.content;
    }

    switch (type) {
        case 'Title': return `<h1 style="${styleString}">${content}</h1>`;
        case 'Subtitle': return `<h2 style="${styleString}">${content}</h2>`;
        case 'Text':
        case 'Styled Paragraph': return `<p style="${styleString} white-space: pre-wrap;">${content}</p>`;
        case 'Image': 
            const src = bindings['props.src'] ? `{{${bindings['props.src']}}}` : props.src || '';
            return `<img src="${src}" style="${styleString}" />`;
        // Basic support for other types, can be expanded
        default: return `<div style="${styleString} border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #888;">${type}</div>`;
    }
};

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { 
    jsonData, onOpenJsonModal, pages, activePageIndex, selectedWidgetId, 
    onSelectWidget, onDeleteWidget, onReorderWidgets, widgetBindings, 
    style, documentation, onShowDocDetail, webhookUrl, setWebhookUrl, activeTemplate
  } = props;
  const [activeTab, setActiveTab] = useState('dataFields');
  const [guideTab, setGuideTab] = useState<'backend' | 'make' | 'n8n'>('backend');
  const [copySuccess, setCopySuccess] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localWebhookUrl, setLocalWebhookUrl] = useState(webhookUrl);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setLocalWebhookUrl(webhookUrl);
  }, [webhookUrl]);

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(jsonData);
    } catch (e: any) {
      return null;
    }
  }, [jsonData]);
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd();
      return;
    }
    onReorderWidgets(activePageIndex, draggedIndex, dropIndex);
    handleDragEnd();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  
  const handleSaveWebhook = () => {
    setWebhookUrl(localWebhookUrl);
    setSaveSuccess('¡URL guardada!');
    setTimeout(() => setSaveSuccess(''), 2000);
  };

  const exportTemplateAsHtml = () => {
    if (!activeTemplate) return;

    let bodyContent = '';
    activeTemplate.pages.forEach(page => {
        const isLandscape = page.properties.orientation === 'Landscape';
        const pageStyles = `width: ${isLandscape ? '1056px' : '816px'}; height: ${isLandscape ? '816px' : '1056px'}; background-color: ${page.properties.backgroundColor}; position: relative; overflow: hidden; margin: 20px auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);`;
        let pageContent = '';
        page.widgets.forEach(widget => {
            pageContent += renderWidgetToTemplateHtml(widget);
        });
        bodyContent += `<div style="${pageStyles}">${pageContent}</div>`;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${activeTemplate.name}</title>
        <style>
            body { font-family: sans-serif; background-color: #f0f0f0; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
      </html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTemplate.name.replace(/\s+/g, '_')}_template.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const activePageWidgets = pages[activePageIndex]?.widgets || [];
  const guideTabClass = (tabName: typeof guideTab) => `flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${guideTab === tabName ? 'border-indigo-500 text-main bg-tertiary' : 'border-transparent text-subtle hover:bg-tertiary'}`;

  return (
    <aside style={style} className="bg-panel border-r border-main flex flex-col flex-shrink-0">
      <div className="p-2 border-b border-main">
        <div className="flex bg-tertiary rounded-md p-1">
          <button onClick={() => setActiveTab('dataFields')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'dataFields' ? 'text-indigo-700 bg-panel shadow-sm' : 'text-subtle hover:bg-opacity-50'}`}>Campos</button>
          <button onClick={() => setActiveTab('layers')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'layers' ? 'text-indigo-700 bg-panel shadow-sm' : 'text-subtle hover:bg-opacity-50'}`}>Capas</button>
          {documentation && (
            <button onClick={() => setActiveTab('documentation')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'documentation' ? 'text-indigo-700 bg-panel shadow-sm' : 'text-subtle hover:bg-opacity-50'}`}>Docs</button>
          )}
          <button onClick={() => setActiveTab('connection')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'connection' ? 'text-indigo-700 bg-panel shadow-sm' : 'text-subtle hover:bg-opacity-50'}`}>Conexión</button>
        </div>
      </div>
      
      {activeTab === 'dataFields' && (
        <div className="p-4 flex-grow flex flex-col overflow-hidden">
             <button onClick={onOpenJsonModal} className="w-full mb-4 px-3 py-2 text-sm font-medium text-main bg-tertiary border border-main rounded-md hover:bg-opacity-70">
                Editar JSON...
            </button>
            <p className="text-xs text-subtle mb-2">
              Haz clic derecho en un widget en el lienzo para vincular un campo de datos.
            </p>
            <CollapsibleSection title="Campos de Datos" icon={LinkIcon}>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                {parsedData ? (
                    <JsonTreeView data={parsedData} isDraggable widgetBindings={widgetBindings} />
                ) : <p className="text-sm text-red-500 p-2 bg-red-500/10 rounded">Formato JSON inválido. Haz clic en el botón JSON para arreglarlo.</p>}
                </div>
            </CollapsibleSection>
        </div>
      )}

      {activeTab === 'layers' && (
        <div className="p-4 flex-grow flex flex-col overflow-y-auto">
            <CollapsibleSection title="Estructura del Documento" icon={ViewColumnsIcon}>
                <div className="space-y-1">
                    {activePageWidgets.length > 0 ? activePageWidgets.map((widget, index) => (
                        <div 
                            key={widget.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={handleDragEnd}
                            onClick={() => onSelectWidget(widget.id)}
                            className={`flex items-center justify-between p-2 rounded-md cursor-grab transition-all ${selectedWidgetId === widget.id ? 'bg-indigo-500/10' : 'hover:bg-tertiary'} ${draggedIndex === index ? 'opacity-40 ring-2 ring-indigo-500' : ''}`}
                        >
                           <span className={`text-sm font-medium truncate ${selectedWidgetId === widget.id ? 'text-indigo-700' : 'text-main'}`}>{widget.type}</span>
                           <button onClick={(e) => { e.stopPropagation(); onDeleteWidget(widget.id); }} className="p-1 rounded-full hover:bg-red-500/20 text-subtle hover:text-red-600">
                               <TrashIcon className="h-4 w-4" />
                           </button>
                        </div>
                    )) : <p className="text-sm text-subtle text-center p-4">No hay widgets en esta página.</p>}
                </div>
            </CollapsibleSection>
        </div>
      )}

      {activeTab === 'documentation' && documentation && (
        <div className="p-4 flex-grow flex flex-col overflow-y-auto">
            <CollapsibleSection title="Archivos del Proyecto" icon={BookOpenIcon}>
                 <p className="text-xs text-subtle mb-2">Haz clic en el ojo para ver el código y el análisis de la IA.</p>
                 <DocumentationTreeView documentation={documentation} onShowDetail={onShowDocDetail} />
            </CollapsibleSection>
        </div>
      )}

      {activeTab === 'connection' && (
          <div className="p-4 flex-grow flex flex-col space-y-6 overflow-y-auto">
              <CollapsibleSection title="Configuración del Webhook" icon={CogIcon}>
                  <p className="text-sm text-subtle mb-3">
                      Introduce la URL de tu servicio backend o de automatización (Make/n8n) que recibirá los datos.
                  </p>
                  <div className="flex items-center">
                      <input 
                          type="text" 
                          value={localWebhookUrl}
                          onChange={(e) => setLocalWebhookUrl(e.target.value)}
                          placeholder="https://tu-servicio.com/api/render"
                          className="flex-grow p-2 font-mono text-xs bg-tertiary border border-main rounded-l-md text-main focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                      />
                      <button onClick={handleSaveWebhook} className="px-3 py-2 bg-indigo-600 text-white rounded-r-md text-sm hover:bg-indigo-700">
                          Guardar
                      </button>
                  </div>
                  {saveSuccess && <p className="text-xs text-green-500 mt-1">{saveSuccess}</p>}
              </CollapsibleSection>

              <CollapsibleSection title="Guía de Implementación" icon={InformationCircleIcon}>
                  <div className="flex border-b border-main">
                        <button className={guideTabClass('backend')} onClick={() => setGuideTab('backend')}><CodeBracketIcon className="h-4 w-4"/><span>Backend Propio</span></button>
                        <button className={guideTabClass('make')} onClick={() => setGuideTab('make')}><MakeIcon className="h-4 w-4"/><span>Make.com</span></button>
                        <button className={guideTabClass('n8n')} onClick={() => setGuideTab('n8n')}><N8nIcon className="h-4 w-4"/><span>n8n</span></button>
                  </div>
                  <div className="p-4 bg-tertiary rounded-b-lg border border-t-0 border-main text-xs text-subtle prose prose-sm max-w-none">
                      {guideTab === 'backend' && (
                          <div className="space-y-2">
                              <p>Para usar esta plantilla en producción, necesitas un servicio backend que actúe como un "webhook".</p>
                              <ol className="list-decimal pl-5 space-y-1">
                                <li><strong>Crea un Backend:</strong> Necesitas tu propio servidor (ej. Node.js, Python, etc.) que pueda recibir peticiones HTTP.</li>
                                <li><strong>Define un Endpoint:</strong> En tu backend, crea una ruta (ej. `/api/render`). La URL completa de esta ruta (ej. `https://tu-app.com/api/render`) es lo que debes poner arriba.</li>
                                <li><strong>Procesa la Petición:</strong> Tu endpoint debe aceptar peticiones `POST` con un cuerpo JSON como el que se muestra abajo.</li>
                                <li><strong>Genera el PDF:</strong> Usando los datos (`data`) y el ID de la plantilla (`templateId`), tu backend debe tener acceso a la estructura de la plantilla (puedes guardarla en una base de datos), combinarla con los datos recibidos para generar un HTML, y luego usar una librería como Puppeteer o jsPDF para convertir ese HTML a un archivo PDF y devolverlo.</li>
                              </ol>
                          </div>
                      )}
                      {guideTab === 'make' && (
                           <div className="space-y-2">
                              <p>Automatiza la generación de tus documentos sin escribir código usando Make.com.</p>
                               <ol className="list-decimal pl-5 space-y-2">
                                  <li><strong>Crea un Webhook en Make:</strong> En un nuevo escenario, añade un trigger de "Webhooks" &gt; "Custom webhook". Haz clic en 'Add', nombra tu webhook y guárdalo. Copia la URL que te proporciona.</li>
                                  <li><strong>Configura y Prueba:</strong> Pega la URL en el campo de arriba y guarda. Luego, en Make, haz clic en "Redetermine data structure" y envía una petición de prueba usando el ejemplo de abajo para que Make aprenda el formato.</li>
                                  <li><strong className="text-indigo-400">Exporta tu Plantilla:</strong> Haz clic en el botón de abajo para descargar tu plantilla como un archivo HTML con placeholders.</li>
                                  <li><strong>Combina Datos y Plantilla:</strong> En Make, añade un módulo "Set variable" para guardar el contenido del HTML exportado. Luego, usa la función `replace()` de Make repetidamente para sustituir los placeholders `{"{{...}}"}` con los datos del webhook. (Ej: `replace(variables.plantillaHtml; {"'{{invoice.number}}'"}; 1.data.invoice.number)`)</li>
                                   <li><strong>Genera el PDF:</strong> Añade un módulo como "CloudConvert" o "Api2Pdf". En su acción "Convertir HTML a PDF", pasa el HTML resultante del paso anterior.</li>
                                   <li><strong>Finaliza:</strong> Añade un módulo "Webhook Response" para devolver el PDF, o guárdalo en Google Drive, envíalo por email, etc.</li>
                               </ol>
                           </div>
                      )}
                       {guideTab === 'n8n' && (
                           <div className="space-y-2">
                               <p>Crea workflows potentes y flexibles para generar tus documentos con n8n.</p>
                               <ol className="list-decimal pl-5 space-y-2">
                                   <li><strong>Crea un Webhook en n8n:</strong> En un nuevo workflow, añade un nodo "Webhook". Copia la "TEST URL".</li>
                                   <li><strong>Configura y Prueba:</strong> Pega la URL en la configuración de arriba y guárdala. Luego, haz clic en "Listen for Test Event" en n8n y envía una petición de prueba desde esta app para que n8n reciba la estructura de datos.</li>
                                   <li><strong className="text-indigo-400">Exporta tu Plantilla:</strong> Descarga tu plantilla como un archivo HTML con el botón de abajo.</li>
                                   <li><strong>Combina con un Nodo de Función:</strong> Añade un nodo "Function". Aquí combinaremos la plantilla y los datos. Pega el HTML exportado en el código y usa JavaScript para reemplazar los placeholders.</li>
                                   <li><strong>Usa este Código:</strong> Pega este fragmento en el nodo de Función:
                                       <pre className="text-xs font-mono bg-panel p-2 rounded my-1 whitespace-pre-wrap overflow-auto">
                                            <code className="block">{`const templateHtml = \`
... tu html exportado aquí ...
\`;

const data = items[0].json.body.data;

function resolveInlinedVariables(text, data) {
  return text.replace(/{{(.*?)}}/g, (match, path) => {
    const value = path.trim().split('.').reduce((a, p) => a && a[p], data);
    return value !== undefined ? String(value) : match;
  });
}

const finalHtml = resolveInlinedVariables(templateHtml, data);

return [{ json: { html: finalHtml } }];`}</code>
                                       </pre>
                                   </li>
                                   <li><strong>Genera el PDF:</strong> Añade un nodo "HTTP Request". Configúralo para hacer una petición `POST` a un servicio de generación de PDF (como Api2Pdf), enviando el `{"{{ $json.html }}"}` del nodo anterior.</li>
                               </ol>
                           </div>
                       )}
                  </div>
              </CollapsibleSection>

              <CollapsibleSection title="Otras Herramientas" icon={UploadIcon}>
                   <button onClick={exportTemplateAsHtml} className="w-full mb-4 px-3 py-2 text-sm font-medium text-main bg-tertiary border border-main rounded-md hover:bg-opacity-70 flex items-center justify-center space-x-2">
                       <UploadIcon className="h-4 w-4 -rotate-90"/>
                       <span>Exportar Plantilla como HTML</span>
                   </button>
                   <h3 className="text-base font-semibold text-main mb-2">Ejemplo de Petición</h3>
                   <div className="p-3 bg-tertiary border border-main rounded-md">
                       <pre className="text-xs font-mono text-main whitespace-pre-wrap overflow-auto max-h-60">
                           <code className="block text-green-400">POST {webhookUrl}</code>
                           <code className="block text-green-400">Content-Type: application/json</code>
                           <code className="block mt-2">{`{\n  "templateId": "${activeTemplate?.id || 'TU_ID_DE_PLANTILLA'}",\n  "data": ${JSON.stringify(parsedData || { "ejemplo": "dato" }, null, 2)}\n}`}</code>
                       </pre>
                   </div>
              </CollapsibleSection>
          </div>
      )}
    </aside>
  );
};

export default Sidebar;