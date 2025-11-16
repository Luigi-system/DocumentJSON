import React from 'react';
import { PageData, WidgetInstance } from '../types';
import WidgetComponent from './WidgetComponent';
// Removed FloatingControls import

interface PageProps {
    pageData: PageData;
    pageIndex: number;
    pageNumber: number;
    totalPages: number;
    jsonData: string;
    onAddWidget: (pageIndex: number, widget: Omit<WidgetInstance, 'id'>) => void;
    onUpdateWidget: (widgetId: string, newProps: Partial<WidgetInstance>) => void;
    onSelectWidget: (widgetId: string | null) => void;
    selectedWidgetId: string | null;
    onWidgetRightClick: (e: React.MouseEvent, widget: WidgetInstance) => void;
    onPageRightClick: (e: React.MouseEvent, pageIndex: number) => void;
    isActive: boolean;
    onSetActivePage: (index: number) => void;
    copiedWidget: WidgetInstance | null;
    onCopyWidget: () => void;
    onPasteWidget: () => void;
    onDuplicateWidget: () => void;
    editorZoom: number; // New prop for scaling overlays
    alignmentGuides: { vertical: number[], horizontal: number[] };
    setAlignmentGuides: (guides: { vertical: number[], horizontal: number[] }) => void;
}

const Page: React.FC<PageProps> = (props) => {
    const pageRef = React.useRef<HTMLDivElement>(null);
    const { properties, widgets } = props.pageData;
    const { alignmentGuides, setAlignmentGuides } = props;
    const isLandscape = properties.orientation === 'Landscape';

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const widgetDataString = event.dataTransfer.getData('application/json');
        if (!widgetDataString || !pageRef.current) return;

        try {
            const widgetData = JSON.parse(widgetDataString);
            const pageRect = pageRef.current.getBoundingClientRect();
            
            const x = event.clientX - pageRect.left;
            const y = event.clientY - pageRect.top;

            props.onAddWidget(props.pageIndex, {
                type: widgetData.type,
                x,
                y,
                width: widgetData.width,
                height: widgetData.height,
                props: widgetData.props,
                style: widgetData.style,
                bindings: {},
            });
        } catch (e) {
            console.error("Failed to parse widget data:", e);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handlePageClick = (e: React.MouseEvent) => {
        props.onSetActivePage(props.pageIndex);
        
        if (e.target === pageRef.current) {
            props.onSelectWidget(null);
        }
    };

    const watermarkBaseStyle: React.CSSProperties = {
        opacity: properties.watermark.opacity,
        transform: `translate(-50%, -50%) rotate(${properties.watermark.angle}deg)`,
    };
    
    return (
        <div
            ref={pageRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handlePageClick}
            onContextMenu={(e) => props.onPageRightClick(e, props.pageIndex)}
            className={`shadow-lg relative overflow-hidden transition-all duration-200 ${props.isActive ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-editor-canvas' : ''}`}
            style={{
                width: isLandscape ? '11in' : '8.5in',
                height: isLandscape ? '8.5in' : '11in',
                backgroundColor: properties.backgroundColor,
                userSelect: 'none', // Prevent text selection on the page
                MozUserSelect: 'none', // Firefox
                WebkitUserSelect: 'none', // Chrome, Safari
                msUserSelect: 'none', // IE/Edge
            }}
        >
             {properties.watermark.enabled && (
                properties.watermark.type === 'Image' && properties.watermark.src ? (
                    <img 
                        src={properties.watermark.src} 
                        alt="Watermark" 
                        className="page-watermark" 
                        style={{
                            ...watermarkBaseStyle,
                            maxWidth: '80%',
                            maxHeight: '80%',
                            objectFit: 'contain',
                            // Counter-scale watermark to appear constant regardless of page zoom
                            transform: `translate(-50%, -50%) rotate(${properties.watermark.angle}deg) scale(${1 / props.editorZoom})`,
                        }}
                    />
                ) : (
                    <div className="page-watermark" style={{
                        ...watermarkBaseStyle,
                        color: properties.watermark.color,
                        fontSize: `${properties.watermark.fontSize}px`,
                        // Counter-scale watermark to appear constant regardless of page zoom
                        transform: `translate(-50%, -50%) rotate(${properties.watermark.angle}deg) scale(${1 / props.editorZoom})`,
                    }}>
                        {properties.watermark.text}
                    </div>
                )
            )}
            {properties.header.enabled && (
                <div className="page-header" style={{ transform: `scale(${1 / props.editorZoom})`, transformOrigin: 'top center' }}>
                    {properties.header.text}
                </div>
            )}
             {properties.pagination.enabled && (
                <div className="page-footer" style={{ transform: `scale(${1 / props.editorZoom})`, transformOrigin: 'bottom center' }}>
                    Página {props.pageNumber} de {props.totalPages}
                </div>
            )}
             {/* Render Alignment Guides */}
            {alignmentGuides.vertical.map((guideX, index) => (
                <div key={`v-${index}`} className="absolute bg-red-500 z-20" style={{ left: guideX, top: 0, width: '1px', height: '100%', pointerEvents: 'none' }} />
            ))}
            {alignmentGuides.horizontal.map((guideY, index) => (
                <div key={`h-${index}`} className="absolute bg-red-500 z-20" style={{ top: guideY, left: 0, height: '1px', width: '100%', pointerEvents: 'none' }} />
            ))}

            {widgets.map(widget => (
                <WidgetComponent
                    key={widget.id}
                    widget={widget}
                    jsonData={props.jsonData}
                    onUpdate={props.onUpdateWidget}
                    onSelect={props.onSelectWidget}
                    isSelected={props.selectedWidgetId === widget.id}
                    onRightClick={props.onWidgetRightClick}
                    pageBounds={pageRef.current?.getBoundingClientRect()}
                    otherWidgets={widgets.filter(w => w.id !== widget.id)}
                    setAlignmentGuides={setAlignmentGuides}
                />
            ))}
        </div>
    );
};

export default Page;