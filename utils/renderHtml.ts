import { WidgetInstance, WidgetStyle } from '../types';

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const resolveInlinedVariables = (text: string, data: any): string => {
    if (typeof text !== 'string') return text;
    return text.replace(/{{(.*?)}}/g, (match, path) => {
        const value = getNestedValue(data, path.trim());
        return value !== undefined ? String(value) : match;
    });
};

export const renderListToHtml = (items: [string, any[]][], resolve: (text: string) => string): string => {
    if (!Array.isArray(items)) return '';
    let html = '<ol style="list-style-type: decimal; padding-left: 20px;">';
    for (const [text, subItems] of items) {
        html += `<li>${resolve(text)}`;
        if (subItems && subItems.length > 0) {
            html += renderListToHtml(subItems, resolve);
        }
        html += `</li>`;
    }
    html += '</ol>';
    return html;
};

export const renderWidgetToStaticHtml = (widget: WidgetInstance, jsonData?: any): string => {
    const data = jsonData || {};
    const resolve = (text: string) => resolveInlinedVariables(String(text || ''), data);
    
    const { props, style, type } = widget;
    
    let styleString = '';
    for (const key in style) {
        const cssKey = key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
        const value = style[key as keyof typeof style];
        // Add px to numeric values for properties that need it
        if (typeof value === 'number' && ['fontSize', 'borderWidth', 'borderRadius', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(key)) {
            styleString += `${cssKey}: ${value}px; `;
        } else {
            styleString += `${cssKey}: ${value}; `;
        }
    }

    const textContent = typeof props.content === 'string' ? resolve(props.content || '') : '';
    const textHtml = props.link ? `<a href="${props.link}" target="_blank" rel="noopener noreferrer">${textContent}</a>` : textContent;

    switch (type) {
        case 'Title': return `<h1 style="width:100%; margin:0; padding:2px; box-sizing:border-box; ${styleString}">${textHtml}</h1>`;
        case 'Subtitle': return `<h2 style="width:100%; margin:0; padding:2px; box-sizing:border-box; ${styleString}">${textHtml}</h2>`;
        case 'Text':
        case 'Styled Paragraph':
            return `<p style="width:100%; margin:0; padding:2px; box-sizing:border-box; white-space: pre-wrap; ${styleString}">${textHtml}</p>`;
        case 'Index':
             return `<div style="width:100%; margin:0; padding:2px; box-sizing:border-box; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-style:italic; ${styleString}">Índice</div>`;
        case 'List':
            return `<div style="width:100%; margin:0; padding:2px; box-sizing:border-box; ${styleString}">${renderListToHtml(Array.isArray(props.content) ? props.content : [], resolve)}</div>`;
        case 'Image': return `<img src="${props.src || ''}" alt="Image" style="width:100%; height:100%; ${styleString}" />`;
        case 'QR Code': return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(props.data || '')}" alt="QR Code" style="width:100%; height:100%;" />`;
        case 'Rectangle':
        case 'Circle': return `<div style="width:100%; height:100%; ${styleString}"></div>`;
        case 'Triangle': return `<div style="width:100%; height:100%; background-color:${style.backgroundColor || 'transparent'}; ${styleString} clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`;
        case 'Arrow':
            const arrowStyle = `fill:${style.backgroundColor || 'black'}; stroke:${style.borderColor || 'none'}; stroke-width:${style.borderWidth || 0}; opacity: ${style.opacity || 1}`;
            return `<svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none"><polygon points="0,15 70,15 70,0 100,20 70,40 70,25 0,25" style="${arrowStyle}" /></svg>`;
        case 'Checkbox':
            const boxSize = (style.fontSize || 16) * 1.1;
            const checkmarkSvg = props.checked 
                ? `<svg viewBox="0 0 20 20" fill="${style.color || '#000000'}" style="width: 100%; height: 100%;"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`
                : '';
            const checkboxHtml = `<div style="width: ${boxSize}px; height: ${boxSize}px; border: 1.5px solid ${style.color || '#000000'}; background-color: ${style.backgroundColor || 'transparent'}; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; border-radius: 3px;">${checkmarkSvg}</div>`;
            return `<div style="${styleString} display: flex; align-items: center; gap: 8px;">${checkboxHtml}<label>${resolve(props.label || '')}</label></div>`;
        case 'Table': {
            let tableData: any[] = Array.isArray(props.tableData) ? props.tableData : [];
            let headers: string[] = [];
            let rows: any[][] = [];
            let isObjectData = tableData.length > 0 && typeof tableData[0] === 'object' && !Array.isArray(tableData[0]) && tableData[0] !== null;

            if (isObjectData) {
                const objectKeys = Object.keys(tableData[0]);
                const orderedKeys = (props.columnOrder && props.columnOrder.length > 0) ? props.columnOrder.filter(k => objectKeys.includes(k)) : objectKeys;
                headers = orderedKeys.map(key => (props.columnHeaders && props.columnHeaders[key]) ? props.columnHeaders[key] : key);
                rows = tableData.map(row => orderedKeys.map(key => String(row[key] ?? '')));
            } else if (tableData.length > 0) {
                const firstRow = tableData[0];
                if (Array.isArray(firstRow)) {
                    headers = firstRow.map(h => String(h));
                    rows = tableData.slice(1);
                }
            }
            
            const colCount = headers.length > 0 ? headers.length : (rows[0] ? rows[0].length : 1);
            const colWidths = props.colWidths || Array(colCount).fill(widget.width / colCount);

            let tableHtml = `<table style="width:100%; font-size: 14px; border-collapse: collapse; table-layout: fixed; ${styleString}">`;
            
            tableHtml += '<colgroup>';
            colWidths.forEach(w => { tableHtml += `<col style="width: ${w}px">`});
            tableHtml += '</colgroup>';

            let headerStyleString = '';
            if(props.headerStyle) {
                for (const key in props.headerStyle) {
                    const cssKey = key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
                    const value = props.headerStyle[key as keyof WidgetStyle];
                    if (typeof value === 'number' && ['fontSize', 'borderWidth', 'borderRadius', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(key)) {
                        headerStyleString += `${cssKey}: ${value}px; `;
                    } else {
                        headerStyleString += `${cssKey}: ${value}; `;
                    }
                }
            }
            
            tableHtml += `<thead><tr style="${headerStyleString}">`;
            headers.forEach(header => {
                tableHtml += `<th style="border: 1px solid ${style.borderColor || '#d1d5db'}; padding: 8px; text-align: left; font-weight: bold; word-wrap: break-word; color: ${props.headerStyle?.color || 'inherit'};">${resolve(header)}</th>`;
            });
            tableHtml += '</tr></thead>';

            tableHtml += '<tbody>';
            rows.forEach((row, rIdx) => {
                let rowStyle = rIdx % 2 === 0 ? props.evenRowStyle : props.oddRowStyle;
                let rowStyleString = '';
                if(rowStyle) {
                    for (const key in rowStyle) {
                        const cssKey = key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
                        const value = rowStyle[key as keyof WidgetStyle];
                        if (typeof value === 'number' && ['fontSize', 'borderWidth', 'borderRadius', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(key)) {
                            rowStyleString += `${cssKey}: ${value}px; `;
                        } else {
                            rowStyleString += `${cssKey}: ${value}; `;
                        }
                    }
                }
                
                const height = `${(props.rowHeights || [])[rIdx] || 'auto'}px`;
                rowStyleString += `height: ${height};`;

                tableHtml += `<tr style="${rowStyleString}">`;
                row.forEach(cell => {
                    tableHtml += `<td style="border: 1px solid ${style.borderColor || '#d1d5db'}; padding: 8px; word-wrap: break-word; color: ${rowStyle?.color || 'inherit'};">${resolve(String(cell))}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody>';

            tableHtml += '</table>';
            return tableHtml;
        }
        default: return '<div></div>';
    }
}