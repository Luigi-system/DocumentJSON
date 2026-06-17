

import React, { useState, useMemo, useEffect } from 'react';
import { LinkIcon, CopyIcon, TrashIcon, BookOpenIcon, CogIcon, InformationCircleIcon, CodeBracketIcon, MakeIcon, N8nIcon, UploadIcon, ChevronDownIcon, ChevronRightIcon, ViewColumnsIcon } from '@/shared/icons';
import { JsonTreeView } from './JsonTreeView';
import { PageData, ProjectDocumentation, DocGenConfig, Template, WidgetInstance } from '@/types';
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
              Envía una petición POST a esta URL para poblar la plantilla.
            </p>
            <div className="flex items-center space-x-2">
              <div className="flex-grow p-2 font-mono text-xs bg-tertiary border border-main rounded-md text-main break-all">
                {activeTemplate ? `http://localhost:3001/api/webhook/${activeTemplate.id}` : 'Selecciona una plantilla'}
              </div>
              <button
                onClick={() => {
                  if (activeTemplate) {
                    navigator.clipboard.writeText(`http://localhost:3001/api/webhook/${activeTemplate.id}`);
                    setSaveSuccess('Copiado!');
                    setTimeout(() => setSaveSuccess(''), 2000);
                  }
                }}
                disabled={!activeTemplate}
                className="p-2 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            {saveSuccess && <p className="text-xs text-green-500 mt-1">{saveSuccess}</p>}
          </CollapsibleSection>

          <CollapsibleSection title="Otras Herramientas" icon={UploadIcon}>
            <button onClick={exportTemplateAsHtml} className="w-full mb-4 px-3 py-2 text-sm font-medium text-main bg-tertiary border border-main rounded-md hover:bg-opacity-70 flex items-center justify-center space-x-2">
              <UploadIcon className="h-4 w-4 -rotate-90" />
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