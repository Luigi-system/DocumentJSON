import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { WidgetInstance, WidgetStyle } from '../types';
import { renderWidgetToStaticHtml, renderListToHtml } from '../utils/renderHtml'; // Import from new utility file

interface WidgetComponentProps {
    widget: WidgetInstance;
    jsonData: string;
    onUpdate: (id: string, newProps: Partial<WidgetInstance>) => void;
    onSelect: (id: string | null) => void;
    isSelected: boolean;
    onRightClick: (e: React.MouseEvent, widget: WidgetInstance) => void;
    pageBounds: DOMRect | undefined;
    otherWidgets: WidgetInstance[];
    setAlignmentGuides: (guides: { vertical: number[], horizontal: number[] }) => void;
}

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// Hook to resolve properties by checking bindings first, then falling back to static props.
const useResolvedWidget = (widget: WidgetInstance, jsonDataString: string) => {
    return useMemo(() => {
        try {
            const jsonData = JSON.parse(jsonDataString || '{}');
            const resolvedWidget = JSON.parse(JSON.stringify(widget)); // Deep copy

            for (const key in widget.bindings) {
                const dataPath = widget.bindings[key];
                let value = getNestedValue(jsonData, dataPath);

                if (value !== undefined) {
                    // Truncate large arrays in editor for performance
                    if ((key === 'props.tableData' || key === 'props.content') && Array.isArray(value) && value.length > 10) {
                         value = value.slice(0, 10);
                         resolvedWidget.props.isTruncated = true; // Flag for UI hint
                    }

                    const propPath = key.split('.');
                    let current = resolvedWidget;
                    for (let i = 0; i < propPath.length - 1; i++) {
                        current = current[propPath[i]] || (current[propPath[i]] = {});
                    }
                    current[propPath[propPath.length - 1]] = value;
                }
            }
            return resolvedWidget;
        } catch (e) {
            console.error("Error parsing JSON data in useResolvedWidget:", e);
            return widget;
        }
    }, [widget, jsonDataString]);
};

export const getBindableProperties = (type: WidgetInstance['type']): { property: string; label: string }[] => {
    const typography = [
        { property: 'props.content', label: 'Contenido' },
        { property: 'style.color', label: 'Color' },
        { property: 'style.fontSize', label: 'Tamaño de Fuente' },
        { property: 'props.link', label: 'Hipervínculo' },
    ];
    const appearance = [
        { property: 'style.backgroundColor', label: 'Color de Relleno' },
        { property: 'style.borderColor', label: 'Color de Trazo' },
        { property: 'style.borderWidth', label: 'Ancho de Trazo' },
        { property: 'style.opacity', label: 'Opacidad' },
    ];

    switch (type) {
        case 'Title':
        case 'Subtitle':
        case 'Text':
        case 'Styled Paragraph':
        case 'Index':
            return [...typography, ...appearance];
        case 'Image':
            return [{ property: 'props.src', label: 'Fuente de Imagen' }, { property: 'style.opacity', label: 'Opacidad' }, { property: 'style.borderRadius', label: 'Radio de Esquina' }];
        case 'Table':
            return [{ property: 'props.tableData', label: 'Datos de Tabla' }];
        case 'List':
             return [{ property: 'props.content', label: 'Elementos de la Lista' }];
        case 'Rectangle':
        case 'Circle':
        case 'Triangle':
        case 'Arrow':
            return appearance;
        case 'Checkbox':
            return [{ property: 'props.label', label: 'Etiqueta' }, { property: 'props.checked', label: 'Estado Marcado' }];
        case 'QR Code':
            return [{ property: 'props.data', label: 'Datos del Código QR' }];
        default:
            return [];
    }
};

const ListRenderer: React.FC<{ items: [string, any[]][], jsonData: any }> = ({ items, jsonData }) => {
    if (!Array.isArray(items)) return null;
    return (
        <ol className="list-decimal pl-5">
            {items.map(([text, subItems], index) => (
                <li key={index}>
                    {getNestedValue(jsonData, text) || text} {/* Changed to use getNestedValue if text is a path */}
                    {subItems && subItems.length > 0 && <ListRenderer items={subItems} jsonData={jsonData} />}
                </li>
            ))}
        </ol>
    );
};

const TableResizer: React.FC<{
    widget: WidgetInstance;
    tableRef: React.RefObject<HTMLTableElement>; // Use the correct ref
    onUpdate: (newProps: Partial<WidgetInstance>) => void;
    isResizingWidget: boolean;
}> = ({ widget, tableRef, onUpdate, isResizingWidget }) => {
    const { props } = widget;
    const [colLines, setColLines] = useState<number[]>([]);
    const [rowLines, setRowLines] = useState<number[]>([]);

    useEffect(() => {
        if (!tableRef.current) return;
        const colHeaders = tableRef.current.querySelectorAll('thead th, thead td, tbody tr:first-child th, tbody tr:first-child td');
        let currentLeft = 0;
        const newColLines: number[] = [];
        colHeaders.forEach((th, i) => {
            if (i < colHeaders.length - 1) {
                currentLeft += (th as HTMLElement).offsetWidth;
                newColLines.push(currentLeft);
            }
        });
        setColLines(newColLines);

        const rows = tableRef.current.querySelectorAll('tbody tr');
        let currentTop = tableRef.current.querySelector('thead')?.offsetHeight || 0;
        const newRowLines: number[] = [];
        rows.forEach((tr, i) => {
            if (i < rows.length - 1) {
                currentTop += (tr as HTMLElement).offsetHeight;
                newRowLines.push(currentTop);
            }
        });
        setRowLines(newRowLines);
    }, [widget.props.colWidths, widget.props.rowHeights, widget.width, widget.height, props.tableData]);

    const handleColResize = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const initialWidths = props.colWidths || [];
        const leftColInitialWidth = initialWidths[index];
        const rightColInitialWidth = initialWidths[index + 1];

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const newLeftWidth = Math.max(20, leftColInitialWidth + dx);
            const newRightWidth = Math.max(20, rightColInitialWidth - dx);
            
            const newWidths = [...initialWidths];
            newWidths[index] = newLeftWidth;
            newWidths[index+1] = newRightWidth;

            const totalWidth = newWidths.reduce((a, b) => a + b, 0);
            onUpdate({ props: { ...props, colWidths: newWidths }, width: totalWidth });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleRowResize = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const startY = e.clientY;
        const initialHeights = (props.rowHeights || []) as (number | 'auto')[];
        const tbodyRows = tableRef.current?.querySelectorAll('tbody tr');
        const rowInitialHeight = tbodyRows ? (tbodyRows[index] as HTMLElement).offsetHeight : 30; // default guess

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dy = moveEvent.clientY - startY;
            const newHeight = Math.max(20, rowInitialHeight + dy);
            
            const newHeights: (number|'auto')[] = [...initialHeights];
            // fill up to index if sparse
            if(tbodyRows) {
                for (let i = 0; i <= index; i++) {
                    if (newHeights[i] === undefined || newHeights[i] === 'auto') {
                        newHeights[i] = (tbodyRows[i] as HTMLElement).offsetHeight;
                    }
                }
            }
            newHeights[index] = newHeight;
            onUpdate({ props: { ...props, rowHeights: newHeights }});
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {colLines.map((left, i) => (
                <div key={`c-${i}`} onMouseDown={(e) => handleColResize(e, i)}
                    className="absolute top-0 h-full w-1.5 -translate-x-1/2 cursor-col-resize pointer-events-auto hover:bg-indigo-500/50"
                    style={{ left: `${left}px` }} />
            ))}
             {rowLines.map((top, i) => (
                <div key={`r-${i}`} onMouseDown={(e) => handleRowResize(e, i)}
                    className="absolute left-0 w-full h-1.5 -translate-y-1/2 cursor-row-resize pointer-events-auto hover:bg-indigo-500/50"
                    style={{ top: `${top}px` }} />
            ))}
        </div>
    );
};


const WidgetRenderer: React.FC<{
    widget: WidgetInstance,
    onUpdate: (newProps: Partial<WidgetInstance>) => void,
    jsonData: any,
    isDraggingWidget: boolean, // Add this prop
    isResizingWidget: boolean, // Add this prop
    setMinContentHeight: React.Dispatch<React.SetStateAction<number>>; // Add this prop
    contentRef: React.RefObject<HTMLElement>; // Ref for text/list content
    tableRef: React.RefObject<HTMLTableElement>; // Ref for table content
}> = ({ widget, onUpdate, jsonData, isDraggingWidget, isResizingWidget, setMinContentHeight, contentRef, tableRef }) => {
    const { props, style } = widget;
    
    const textContent = getNestedValue(jsonData, widget.bindings['props.content']) || (typeof props.content === 'string' ? props.content : '');
    const textElement = props.link 
        ? <a href={props.link} target="_blank" rel="noopener noreferrer">{textContent}</a>
        : <>{textContent}</>;

    const observer = useRef(
        new ResizeObserver(entries => {
            if (!entries[0]) return;
            // If user is actively dragging or resizing, don't auto-adjust.
            if (isDraggingWidget || isResizingWidget) {
                return;
            }
            const newIntrinsicHeight = Math.ceil(entries[0].contentRect.height);
            // Update the parent component's state to reflect intrinsic content height
            setMinContentHeight(newIntrinsicHeight);
        })
    );

    useEffect(() => {
        const isTextWidget = ['Title', 'Subtitle', 'Text', 'Styled Paragraph', 'List', 'Index'].includes(widget.type);
        const isTableWidget = widget.type === 'Table';

        // Observe the text content or the table itself for intrinsic height changes
        if (isTextWidget && contentRef.current) {
            observer.current.observe(contentRef.current);
        } else if (isTableWidget && tableRef.current) {
            observer.current.observe(tableRef.current);
        }
        
        return () => {
            if (contentRef.current) {
                observer.current.unobserve(contentRef.current);
            }
            if (tableRef.current) {
                observer.current.unobserve(tableRef.current);
            }
        };
    }, [widget.type, onUpdate, widget.height, widget.props, jsonData, isDraggingWidget, isResizingWidget, contentRef, tableRef]);


    switch (widget.type) {
        case 'Title':
            return <h1 ref={contentRef as any} className="w-full p-1 box-border" style={style}>{textElement}</h1>;
        case 'Subtitle':
            return <h2 ref={contentRef as any} className="w-full p-1 box-border" style={style}>{textElement}</h2>;
        case 'Text':
        case 'Styled Paragraph':
            return <p ref={contentRef as any} className="w-full p-1 box-border whitespace-pre-wrap" style={style}>{textElement}</p>;
        case 'Index':
            return <div ref={contentRef as any} className="w-full p-1 box-border flex items-center justify-center text-gray-400 italic" style={style}>Índice</div>;
        case 'List':
            return <div ref={contentRef as any} className="w-full p-1 box-border" style={style}><ListRenderer items={Array.isArray(props.content) ? props.content : []} jsonData={jsonData} /></div>;
        case 'Image':
            return <img src={props.src || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='} alt="Image" className="w-full h-full" style={{...style, pointerEvents: 'none'}} />;
        case 'QR Code':
            return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(props.data || '')}`} alt="QR Code" className="w-full h-full" style={{ pointerEvents: 'none' }} />;
        case 'Rectangle':
        case 'Circle':
            return <div className="w-full h-full" style={style} />;
        case 'Triangle':
            return <div className="w-full h-full" style={{...style, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />;
        case 'Arrow':
             return (
                <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <polygon points="0,15 70,15 70,0 100,20 70,40 70,25 0,25" 
                        style={{ 
                            fill: style.backgroundColor, 
                            stroke: style.borderColor, 
                            strokeWidth: style.borderWidth 
                        }} />
                </svg>
            );
        case 'Checkbox':
            const boxSize = (style.fontSize || 16) * 1.1;
            const checkboxColor = style.color || '#000000';
            const checkboxBackgroundColor = style.backgroundColor || 'transparent';
            const checkboxLabel = props.label || ''; // props.label is already resolved by useResolvedWidget

            return (
                <div style={{...style, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: `${boxSize}px`,
                        height: `${boxSize}px`,
                        border: `1.5px solid ${checkboxColor}`,
                        backgroundColor: checkboxBackgroundColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        borderRadius: '3px',
                    }}>
                        {props.checked && (
                            <svg viewBox="0 0 20 20" fill={checkboxColor} style={{ width: '100%', height: '100%' }}>
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <label style={{ color: checkboxColor, fontSize: style.fontSize }}>
                        {checkboxLabel}
                    </label>
                </div>
            );
        case 'Table': {
            const [editingCell, setEditingCell] = useState<{ type: 'header' | 'body', row: number, col: number } | null>(null);
            const tableMode = props.tableMode || 'static';
            
            const handleCellUpdate = (newValue: string) => {
                if (!editingCell) return;
                const currentData = (props.tableData || []) as string[][];
                const newData = JSON.parse(JSON.stringify(currentData)); // Deep copy

                if (editingCell.type === 'header') {
                    newData[0][editingCell.col] = newValue;
                } else {
                    newData[editingCell.row + 1][editingCell.col] = newValue;
                }
                onUpdate({ props: { ...props, tableData: newData } });
            };

            let tableData: any[] = Array.isArray(props.tableData) ? props.tableData : [];
            let headers: string[] = [];
            let rows: any[][] = [];

            if (tableMode === 'dynamic' && tableData.length > 0 && typeof tableData[0] === 'object' && !Array.isArray(tableData[0]) && tableData[0] !== null) {
                const objectKeys = Object.keys(tableData[0]);
                const orderedKeys = (props.columnOrder && props.columnOrder.length > 0) ? props.columnOrder.filter(k => objectKeys.includes(k)) : objectKeys;
                headers = orderedKeys.map(key => (props.columnHeaders && props.columnHeaders[key]) ? props.columnHeaders[key] : key);
                rows = tableData.map(row => orderedKeys.map(key => row[key]));
            } else { // Static mode or malformed data
                const firstRow = tableData[0];
                if (Array.isArray(firstRow)) {
                    headers = firstRow;
                    rows = tableData.slice(1);
                } else {
                    headers = [];
                    rows = [];
                }
            }

            const colCount = headers.length;
            const colWidths = props.colWidths || Array(colCount).fill(widget.width / colCount);
            
            const cellContent = (type: 'header' | 'body', content: string, r: number, c: number) => {
                if (editingCell && editingCell.type === type && editingCell.row === r && editingCell.col === c) {
                    return (
                        <textarea
                            defaultValue={content}
                            onBlur={(e) => {
                                handleCellUpdate(e.target.value);
                                setEditingCell(null);
                            }}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur() }}
                            className="absolute inset-0 w-full h-full p-2 bg-white z-20 resize-none outline-none ring-2 ring-indigo-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    );
                }
                return getNestedValue(jsonData, widget.bindings[`props.tableData[${r}][${c}]`]) || String(content || ''); // Resolve dynamic table cell content
            };

            return (
                <div className="w-full h-full relative">
                    {props.isTruncated && <div className="absolute bottom-0 w-full text-center text-xs bg-indigo-500/20 text-indigo-800 p-1 z-10">Vista previa - la tabla completa se mostrará en el PDF</div>}
                    <table ref={tableRef as any} className="w-full border-collapse text-sm" style={{...style, tableLayout: 'fixed'}}>
                        <colgroup>
                            {colWidths.map((width, i) => <col key={i} style={{width: `${width}px`}} />)}
                        </colgroup>
                        <thead>
                            <tr style={props.headerStyle}>
                                {headers.map((header, cIdx) => 
                                <th key={cIdx} 
                                    className="p-2 border font-bold break-words relative"
                                    style={{borderColor: style.borderColor}}
                                    onDoubleClick={() => tableMode === 'static' && setEditingCell({ type: 'header', row: 0, col: cIdx })}
                                >
                                    {cellContent('header', header, 0, cIdx)}
                                </th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length > 0 ? rows.map((row, rIdx) => (
                                <tr key={rIdx} style={{
                                    ...(rIdx % 2 === 0 ? props.evenRowStyle : props.oddRowStyle),
                                    height: `${(props.rowHeights || [])[rIdx] || 'auto'}px`,
                                }}>
                                    {row.map((cell, cIdx) => (
                                         <td key={cIdx} 
                                            className="p-2 border break-words relative" 
                                            style={{borderColor: style.borderColor}}
                                            onDoubleClick={() => tableMode === 'static' && setEditingCell({ type: 'body', row: rIdx, col: cIdx })}
                                         >
                                            {cellContent('body', String(cell || ''), rIdx, cIdx)}
                                         </td>
                                    ))}
                                </tr>
                            )) : tableMode === 'dynamic' ? (
                                <tr>
                                    <td colSpan={headers.length || 1} className="p-4 text-center text-xs text-subtle italic border" style={{borderColor: style.borderColor}}>
                                        Tabla dinámica vinculada. El array de datos está vacío.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            )
        }
        default:
            return <div className="bg-gray-200 w-full h-full flex items-center justify-center text-xs text-gray-500">Unsupported</div>;
    }
};

const WidgetComponent: React.FC<WidgetComponentProps> = (props) => {
    const { widget, jsonData, onUpdate, onSelect, isSelected, onRightClick, pageBounds, otherWidgets, setAlignmentGuides } = props;
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLElement>(null); // Ref for text/list content
    const tableRef = useRef<HTMLTableElement>(null); // Ref for table content

    // State to track the intrinsic height of the content (what it needs to display without overflow)
    const [minContentHeight, setMinContentHeight] = useState(widget.height);
    const [isDraggingWidget, setIsDraggingWidget] = useState(false);
    const [isResizingWidget, setIsResizingWidget] = useState(false);

    const resolvedWidget = useResolvedWidget(widget, jsonData);
    
    const jsonDataObject = useMemo(() => {
        try { return JSON.parse(jsonData || '{}'); }
        catch { return {}; }
    }, [jsonData]);

    // Recalculate minContentHeight if widget content or width changes
    useEffect(() => {
        if (!['Title', 'Subtitle', 'Text', 'Styled Paragraph', 'List', 'Index', 'Table'].includes(widget.type)) {
            setMinContentHeight(widget.height); 
        }
    }, [widget.id, widget.props, widget.width, widget.type]);

    const handleUpdate = useCallback((newProps: Partial<WidgetInstance>) => {
        onUpdate(widget.id, newProps);
    }, [widget.id, onUpdate]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).dataset.resizer) {
            return;
        }
        e.stopPropagation();
        onSelect(widget.id);
        setIsDraggingWidget(true);
        
        const startPos = { x: e.clientX, y: e.clientY };
        const startWidgetPos = { x: widget.x, y: widget.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const SNAP_THRESHOLD = 5;
            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;

            let newX = startWidgetPos.x + dx;
            let newY = startWidgetPos.y + dy;

            const activeGeom = {
                left: newX, center: newX + widget.width / 2, right: newX + widget.width,
                top: newY, middle: newY + widget.height / 2, bottom: newY + widget.height,
            };

            const newGuides = { vertical: [] as number[], horizontal: [] as number[] };
            let snappedX = false;
            let snappedY = false;

            const allOtherGeoms = [
                 { v: [0, pageBounds ? pageBounds.width / 2 : 408, pageBounds ? pageBounds.width : 816], h: [0, pageBounds ? pageBounds.height / 2 : 528, pageBounds ? pageBounds.height : 1056] },
                ...otherWidgets.map(other => ({
                    v: [other.x, other.x + other.width / 2, other.x + other.width],
                    h: [other.y, other.y + other.height / 2, other.y + other.height]
                }))
            ];

            for (const otherGeom of allOtherGeoms) {
                if (!snappedX) {
                    for (const activePoint of [activeGeom.left, activeGeom.center, activeGeom.right]) {
                        for (const otherPoint of otherGeom.v) {
                            if (Math.abs(activePoint - otherPoint) < SNAP_THRESHOLD) {
                                newX -= (activePoint - otherPoint);
                                newGuides.vertical.push(otherPoint);
                                snappedX = true; break;
                            }
                        }
                        if (snappedX) break;
                    }
                }
                if (!snappedY) {
                    for (const activePoint of [activeGeom.top, activeGeom.middle, activeGeom.bottom]) {
                        for (const otherPoint of otherGeom.h) {
                            if (Math.abs(activePoint - otherPoint) < SNAP_THRESHOLD) {
                                newY -= (activePoint - otherPoint);
                                newGuides.horizontal.push(otherPoint);
                                snappedY = true; break;
                            }
                        }
                        if (snappedY) break;
                    }
                }
                if (snappedX && snappedY) break;
            }
            
            setAlignmentGuides(newGuides);

            if (pageBounds) {
                newX = Math.max(0, Math.min(newX, pageBounds.width - widget.width));
                newY = Math.max(0, Math.min(newY, pageBounds.height - widget.height));
            }

            if (ref.current) {
                ref.current.style.left = `${newX}px`;
                ref.current.style.top = `${newY}px`;
            }
        };

        const handleMouseUp = () => {
            const finalX = ref.current ? parseFloat(ref.current.style.left) : widget.x;
            const finalY = ref.current ? parseFloat(ref.current.style.top) : widget.y;

            onUpdate(widget.id, { x: finalX, y: finalY });
            setIsDraggingWidget(false);
            setAlignmentGuides({ vertical: [], horizontal: [] });
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setIsResizingWidget(true);
        const startSize = { width: widget.width, height: widget.height };
        const startPos = { x: e.clientX, y: e.clientY };

        const doResize = (moveEvent: MouseEvent) => {
            const SNAP_THRESHOLD = 5;
            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;
            
            let newWidth = startSize.width + dx;
            let newHeight = startSize.height + dy;

            const activeGeom = { right: widget.x + newWidth, bottom: widget.y + newHeight };
            const newGuides = { vertical: [] as number[], horizontal: [] as number[] };
            let snappedX = false, snappedY = false;

            const allOtherGeoms = [
                { v: [0, pageBounds ? pageBounds.width / 2 : 408, pageBounds ? pageBounds.width : 816], h: [0, pageBounds ? pageBounds.height / 2 : 528, pageBounds ? pageBounds.height : 1056] },
               ...otherWidgets.map(other => ({
                   v: [other.x, other.x + other.width / 2, other.x + other.width],
                   h: [other.y, other.y + other.height / 2, other.y + other.height]
               }))
           ];

           for (const otherGeom of allOtherGeoms) {
                if (!snappedX) {
                    for (const otherPoint of otherGeom.v) {
                        if (Math.abs(activeGeom.right - otherPoint) < SNAP_THRESHOLD) {
                            newWidth -= (activeGeom.right - otherPoint);
                            newGuides.vertical.push(otherPoint);
                            snappedX = true; break;
                        }
                    }
                }
                if (!snappedY) {
                    for (const otherPoint of otherGeom.h) {
                        if (Math.abs(activeGeom.bottom - otherPoint) < SNAP_THRESHOLD) {
                            newHeight -= (activeGeom.bottom - otherPoint);
                            newGuides.horizontal.push(otherPoint);
                            snappedY = true; break;
                        }
                    }
                }
                if (snappedX && snappedY) break;
            }
            setAlignmentGuides(newGuides);

            if (pageBounds) {
                newWidth = Math.min(newWidth, pageBounds.width - widget.x);
                newHeight = Math.min(newHeight, pageBounds.height - widget.y);
            }

            if (ref.current) {
                ref.current.style.width = `${Math.max(20, newWidth)}px`;
                ref.current.style.height = `${Math.max(20, newHeight)}px`;
            }
        };

        const stopResize = () => {
            const finalWidth = ref.current ? parseFloat(ref.current.style.width) : widget.width;
            const finalHeight = ref.current ? parseFloat(ref.current.style.height) : widget.height;
            onUpdate(widget.id, {
                width: Math.max(20, finalWidth),
                height: Math.max(20, finalHeight),
            });
            setIsResizingWidget(false);
            setAlignmentGuides({ vertical: [], horizontal: [] });
            window.removeEventListener('mousemove', doResize);
            window.removeEventListener('mouseup', stopResize);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
    };

    return (
        <div
            ref={ref}
            onClick={(e) => { e.stopPropagation(); onSelect(widget.id); }}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => onRightClick(e, widget)}
            style={{
                position: 'absolute',
                left: widget.x,
                top: widget.y,
                width: widget.width,
                height: Math.max(widget.height, minContentHeight),
                cursor: (isDraggingWidget || isResizingWidget) ? 'grabbing' : 'grab',
                border: isSelected ? '2px solid #4f46e5' : '1px solid transparent',
                padding: isSelected ? '1px' : '2px',
            }}
            className="box-border theme-light"
        >
            <WidgetRenderer
                widget={resolvedWidget}
                onUpdate={(p) => handleUpdate(p)}
                jsonData={jsonDataObject}
                isDraggingWidget={isDraggingWidget}
                isResizingWidget={isResizingWidget}
                setMinContentHeight={setMinContentHeight}
                contentRef={contentRef}
                tableRef={tableRef}
            />
            {isSelected && (
                <>
                 {widget.type === 'Table' && (widget.props.tableMode || 'static') === 'static' && <TableResizer widget={widget} tableRef={tableRef} onUpdate={(p) => handleUpdate(p)} isResizingWidget={isResizingWidget} />}
                 <div
                    onMouseDown={handleResizeMouseDown}
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-600 border-2 border-panel rounded-full cursor-nwse-resize z-10"
                    data-resizer="true"
                />
                </>
            )}
        </div>
    );
};

export default WidgetComponent;