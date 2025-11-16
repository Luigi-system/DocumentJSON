import React, { useState } from 'react';
import { PdfIcon, ArrowUturnLeftIcon, MagicWandIcon, LeafIcon, WaterDropIcon, SunIcon, MoonIcon, SparklesIcon, SaveIcon, FolderPlusIcon } from './icons';
import { Theme, PageData, WidgetInstance } from '../types';
import { DEFAULT_PAGE_PROPERTIES } from '../constants';
import { renderWidgetToStaticHtml } from '../utils/renderHtml'; // Import from new utility file

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const resolveWidgetProps = (widget: WidgetInstance, jsonData: any): WidgetInstance => {
    const resolvedWidget = JSON.parse(JSON.stringify(widget)); 
    for (const key in widget.bindings) {
        const dataPath = widget.bindings[key];
        const value = getNestedValue(jsonData, dataPath);
        if (value !== undefined) {
            const propPath = key.split('.');
            let current = resolvedWidget;
            for (let i = 0; i < propPath.length - 1; i++) {
                current = current[propPath[i]] || (current[propPath[i]] = {});
            }
            current[propPath[propPath.length - 1]] = value;
        }
    }
    return resolvedWidget;
};


interface HeaderProps {
    pages: PageData[];
    jsonData: string;
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
    onUpdateTemplate: () => void;
    onReturnToDashboard: () => void;
    onOpenAiTools: () => void;
    onOpenProjectDoc: () => void;
}

const Header: React.FC<HeaderProps> = ({ pages, jsonData, currentTheme, setTheme, onUpdateTemplate, onReturnToDashboard, onOpenAiTools, onOpenProjectDoc }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    const generatePdf = async () => {
        setIsProcessing(true);
        const { jsPDF } = window.jspdf;

        let data;
        try {
            data = JSON.parse(jsonData);
        } catch (e) {
            alert('Datos JSON inválidos. No se puede generar el PDF.');
            setIsProcessing(false);
            return;
        }

        const firstPageProps = pages[0]?.properties || DEFAULT_PAGE_PROPERTIES;
        const isFirstPageLandscape = firstPageProps.orientation === 'Landscape';
        const pdf = new jsPDF({
            orientation: isFirstPageLandscape ? 'l' : 'p',
            unit: 'px',
            format: isFirstPageLandscape ? [1056, 816] : [816, 1056],
            hotfixes: ['px_scaling'],
        });

        for (let i = 0; i < pages.length; i++) {
            const pageData = pages[i];
            const { properties, widgets } = pageData;
            const isLandscape = properties.orientation === 'Landscape';

            if (i > 0) {
                pdf.addPage(isLandscape ? [1056, 816] : [816, 1056], isLandscape ? 'l' : 'p');
            }

            const pageElement = document.createElement('div');
            pageElement.style.width = isLandscape ? '1056px' : '816px';
            pageElement.style.height = isLandscape ? '816px' : '1056px';
            pageElement.style.backgroundColor = properties.backgroundColor;
            pageElement.style.position = 'relative';
            pageElement.style.overflow = 'hidden';
            pageElement.className = 'theme-light';
            
            if (properties.watermark.enabled) {
                if (properties.watermark.type === 'Image' && properties.watermark.src) {
                    const watermarkEl = document.createElement('img');
                    watermarkEl.src = properties.watermark.src;
                    watermarkEl.className = 'page-watermark';
                    Object.assign(watermarkEl.style, {
                        opacity: properties.watermark.opacity.toString(),
                        transform: `translate(-50%, -50%) rotate(${properties.watermark.angle}deg)`,
                        maxWidth: '80%',
                        maxHeight: '80%',
                    });
                    pageElement.appendChild(watermarkEl);
                } else {
                    const watermarkEl = document.createElement('div');
                    watermarkEl.className = 'page-watermark';
                    watermarkEl.innerText = properties.watermark.text;
                    Object.assign(watermarkEl.style, { color: properties.watermark.color, opacity: properties.watermark.opacity.toString(), fontSize: `${properties.watermark.fontSize}px`, transform: `translate(-50%, -50%) rotate(${properties.watermark.angle}deg)`, });
                    pageElement.appendChild(watermarkEl);
                }
            }
            if (properties.header.enabled) {
                const headerEl = document.createElement('div');
                headerEl.className = 'page-header';
                headerEl.innerText = properties.header.text;
                pageElement.appendChild(headerEl);
            }
            if (properties.pagination.enabled) {
                const footerEl = document.createElement('div');
                footerEl.className = 'page-footer';
                footerEl.innerText = `Página ${i + 1} de ${pages.length}`;
                pageElement.appendChild(footerEl);
            }

            for (const widget of widgets) {
                const resolvedWidget = resolveWidgetProps(widget, data);
                const widgetEl = document.createElement('div');
                widgetEl.style.position = 'absolute';
                widgetEl.style.left = `${resolvedWidget.x}px`;
                widgetEl.style.top = `${resolvedWidget.y}px`;
                widgetEl.style.width = `${resolvedWidget.width}px`;
                widgetEl.style.height = `${resolvedWidget.height}px`;
                widgetEl.style.boxSizing = 'border-box';
                widgetEl.innerHTML = renderWidgetToStaticHtml(resolvedWidget, data);
                pageElement.appendChild(widgetEl);
            }
            
            document.body.appendChild(pageElement);
            const canvas = await window.html2canvas(pageElement, { 
                scale: 2, 
                backgroundColor: properties.backgroundColor,
                useCORS: true,
                logging: false,
            });
            document.body.removeChild(pageElement);
            
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save('document.pdf');
        setIsProcessing(false);
    };
    
    const themeButtonClass = (theme: Theme) => `p-1.5 rounded-full transition-colors ${currentTheme === theme ? 'bg-indigo-600 text-white' : 'hover:bg-tertiary'}`;

    return (
        <header className="bg-panel border-b border-main p-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
                <button onClick={onReturnToDashboard} className="p-2 rounded-full hover:bg-tertiary text-subtle" title="Volver al Dashboard">
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold text-main">Editor</h1>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 p-1 bg-editor-canvas rounded-full border border-main">
                    <button onClick={() => setTheme('theme-light')} className={themeButtonClass('theme-light')} aria-label="Modo claro"><SunIcon className="h-5 w-5" /></button>
                    <button onClick={() => setTheme('theme-dark')} className={themeButtonClass('theme-dark')} aria-label="Modo oscuro"><MoonIcon className="h-5 w-5" /></button>
                    <button onClick={() => setTheme('theme-night')} className={themeButtonClass('theme-night')} aria-label="Modo noche"><SparklesIcon className="h-5 w-5" /></button>
                    <button onClick={() => setTheme('theme-forest')} className={themeButtonClass('theme-forest')} aria-label="Modo bosque"><LeafIcon className="h-5 w-5" /></button>
                    <button onClick={() => setTheme('theme-ocean')} className={themeButtonClass('theme-ocean')} aria-label="Modo océano"><WaterDropIcon className="h-5 w-5" /></button>
                </div>

                <div className="flex items-center space-x-2">
                    <button 
                        onClick={onOpenProjectDoc}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"
                    >
                        <FolderPlusIcon className="h-5 w-5 text-indigo-500" />
                        <span>Documentar Proyecto</span>
                    </button>
                    <button 
                        onClick={onOpenAiTools}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"
                    >
                        <MagicWandIcon className="h-5 w-5 text-indigo-500" />
                        <span>Herramientas IA</span>
                    </button>
                    <button 
                        onClick={onUpdateTemplate}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary"
                    >
                        <SaveIcon className="h-5 w-5" />
                        <span>Actualizar Plantilla</span>
                    </button>
                    <button 
                        onClick={generatePdf}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <PdfIcon className="h-5 w-5" />
                        <span>{isProcessing ? 'Procesando...' : 'Exportar PDF'}</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;