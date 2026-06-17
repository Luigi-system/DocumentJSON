import { Template, PageData, WidgetInstance } from '../types';
import { v4 as uuidv4 } from 'uuid';

const PAGE_HEIGHT_PX = 1056; // 11in * 96dpi
const PAGE_MARGIN_BOTTOM = 40;
const DEFAULT_ROW_HEIGHT = 30; // Approximation if not set
const HEADER_HEIGHT = 40; // Approximation

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const paginateTemplate = (template: Template): Template => {
    const newTemplate = JSON.parse(JSON.stringify(template)) as Template;
    const jsonData = JSON.parse(newTemplate.jsonData || '{}');

    // We iterate with a standard loop because the array might grow as we insert pages
    for (let i = 0; i < newTemplate.pages.length; i++) {
        const page = newTemplate.pages[i];

        // Sort widgets by Y position to handle flow correctly
        page.widgets.sort((a, b) => a.y - b.y);

        // Find tables that need pagination
        // We look for tables that have dynamic data binding
        const widgetsToProcess = [...page.widgets]; // Copy to iterate safely while modifying page

        for (const widget of widgetsToProcess) {
            if (widget.type !== 'Table') continue;

            // Check if table has data binding for 'tableData'
            const tableDataBinding = widget.bindings['props.tableData'];
            let tableData: any[] = [];

            if (tableDataBinding) {
                tableData = getNestedValue(jsonData, tableDataBinding);
            } else if (Array.isArray(widget.props.tableData)) {
                tableData = widget.props.tableData;
            }

            if (!tableData || !Array.isArray(tableData) || tableData.length === 0) continue;

            // Calculate estimated height
            const rowHeights = widget.props.rowHeights || [];
            let totalHeight = HEADER_HEIGHT; // Header

            // If rowHeights is missing or partial, we assume default for the rest
            // But we actually need to know the height of *all* rows to see if it fits.
            // Simplified approach: Calculate how many rows FIT on the current page from the table's Y position.

            // Determine page height based on orientation
            const isLandscape = page.properties.orientation === 'Landscape';
            const pageHeight = isLandscape ? 816 : 1056;

            const availableHeight = pageHeight - widget.y - PAGE_MARGIN_BOTTOM;

            // Calculate how many rows fit
            let currentHeight = HEADER_HEIGHT;
            let splitIndex = -1;

            for (let r = 0; r < tableData.length; r++) {
                const h = (rowHeights[r] as number) || DEFAULT_ROW_HEIGHT;
                if (currentHeight + h > availableHeight) {
                    splitIndex = r;
                    break;
                }
                currentHeight += h;
            }

            if (splitIndex !== -1 && splitIndex < tableData.length) {
                // We need to split this table!

                // 1. Data for current page
                const currentData = tableData.slice(0, splitIndex);
                // 2. Data for next page(s)
                const remainingData = tableData.slice(splitIndex);

                // Update current widget properties to only show currentData
                // We need to "break" the binding effectively, or create a static version for the PDF render
                // But since we are modifying the template clone for render only, we can just replace the data prop directly
                // and REMOVE the binding so it doesn't get re-resolved to the full list.
                delete widget.bindings['props.tableData'];
                widget.props.tableData = currentData;
                widget.height = currentHeight; // Update height to fit what we have

                // 3. Create new page (or use next page?)
                // Strategy: Insert a new page immediately after current page to hold the rest.
                const newPageId = uuidv4();
                const newPage: PageData = {
                    id: newPageId,
                    widgets: [],
                    properties: { ...page.properties } // Copy background, etc.
                };

                // 4. Create new widget for next page
                const nextWidget = JSON.parse(JSON.stringify(widget)) as WidgetInstance;
                nextWidget.id = uuidv4();
                nextWidget.y = 40; // Start at top of new page (plus margin)
                // For the next widget, we provide the remaining data
                // Recursive call? No, let's just let the main loop categorize it on the next iteration
                // But we need to set the data on it so the next iteration knows.
                delete nextWidget.bindings['props.tableData'];
                nextWidget.props.tableData = remainingData;

                // 5. Move "below" widgets to the new page
                // Any widget whose Y was greater than (widget.y + original_estimated_height) ??
                // Actually, just any widget strictly below the table visually in the editor.
                // Since we sorted by Y, we can look for widgets with index > current widget index? 
                // No, Y comparison is safer.
                const widgetsBelow = page.widgets.filter(w => w.id !== widget.id && w.y > widget.y);

                // Remove them from current page
                page.widgets = page.widgets.filter(w => w.id === widget.id || w.y <= widget.y);

                // Add next table part to new page
                newPage.widgets.push(nextWidget);

                // Add below widgets to new page, shifted
                // We shift them relative to the new table position
                const offset = nextWidget.y + HEADER_HEIGHT + (DEFAULT_ROW_HEIGHT * 5); // Rough estimation of where they sit relative to top
                // Better: maintain relative distance from table bottom?
                // Old Table Bottom (virtual) vs Old Widget Y.
                // We just place them after the *new* table on the *new* page? 
                // For simplicity, let's put them after the new table starts. 
                // But the new table might *also* split.
                // So we just push them to the new page, preserving their relative order.

                let startY = nextWidget.y + 50; // Initial gap if table was 0 height (impossible)
                // We don't know height of next table yet (it will be calculated in next iteration).
                // So we place them at a safe distance?
                // Actually, the next iteration will handle the next table's size.
                // We just need to ensure they are "below" the next table in Y coordinate.
                // Let's place the next table, and place the other widgets *after* it.
                // The next table starts at 40.
                // The other widgets should preserve their relative distance to *each other*.

                if (widgetsBelow.length > 0) {
                    const firstBelowY = Math.min(...widgetsBelow.map(w => w.y));
                    const dy = firstBelowY - (widget.y + widget.height); // Gap between table bottom and first widget
                    // Wait, widget.height is now the *shrunk* height.
                    // We want the original gap.
                    // It's hard to know original gap without knowing original rendered height.
                    // Let's assume a default gap of 20px for now.

                    let currentY = nextWidget.y + 20; // Will be adjusted by next loop or we just set it large enough?
                    // Actually, if we just put them in the array, the sort at start of loop will handle order.
                    // But we want to ensure they don't overlap.
                    // We can set their Y to standard offset for now.

                    widgetsBelow.forEach(w => {
                        const relativeY = w.y - firstBelowY;
                        w.y = nextWidget.y + 100 + relativeY; // +100 is arbitrary "after table" buffer.
                        // This is tricky because the next table height isn't known yet.
                        // But that's okay! On the next iteration (i+1), we process `newPage`.
                        // We will calculate the table height.
                        // Then we should probably shift the *other* widgets down to be after the table.
                        // So we need a "Layout Pass" or "Reflow" step?
                        newPage.widgets.push(w);
                    });
                }

                // Insert new page
                newTemplate.pages.splice(i + 1, 0, newPage);
                // The loop will continue to i+1, which is our new page.
                // It will process the 'nextWidget' (Table Part 2).
                // It will calculate ITS height.
                // It will check if IT needs splitting.
                // AND it should ideally reflow the *other* widgets to be below the calculated height.

                // Stop processing other widgets on this page since we modified it heavily
                break;
            }
        }

        // Post-process page: Reflow widgets to ensure no overlaps if table expanded or shrank?
        // Specifically for the "next page" scenario where we dumped widgets blindly.
        // We need to re-position widgets that come AFTER a table, based on the table's actual height.

        let currentY = 0;
        for (const widget of page.widgets) {
            // Re-sort again just in case
        }
        page.widgets.sort((a, b) => a.y - b.y);

        for (let wIndex = 0; wIndex < page.widgets.length; wIndex++) {
            const w = page.widgets[wIndex];
            if (w.type === 'Table' && w.props.tableData) {
                // Calculate height again (it might have been split and fixed, or just normal)
                const rows = w.props.tableData.length;
                const calculatedHeight = HEADER_HEIGHT + (rows * DEFAULT_ROW_HEIGHT); // Better to use rowHeights if avail
                w.height = calculatedHeight;

                // Push subsequent widgets down
                const bottomOfTable = w.y + w.height + 20; // 20px padding

                // Look at next widgets
                for (let k = wIndex + 1; k < page.widgets.length; k++) {
                    const nextW = page.widgets[k];
                    if (nextW.y < bottomOfTable) {
                        const shift = bottomOfTable - nextW.y;
                        nextW.y += shift;
                        // This might push it off page! 
                        // If it pushes off page, should we move it to next page?
                        // Yes, ideally. But let's assume "push down" logic for now.
                        // If we are in the main 'i' loop, and we push it down, 
                        // does it trigger a "new page" split for THAT widget?
                        // Our current loop only looks for Tables.
                        // Ideally we should have a generic "Check Overflow" loop.
                    }
                }
            }
        }

        // Final overflow check for ANY widget?
        // If sorting pushed a widget > PAGE_HEIGHT, we should move it to i+1.
        // Dynamic Page Height Check
        const isLandscape = page.properties.orientation === 'Landscape';
        const pageHeight = isLandscape ? 816 : 1056;

        const overflowingWidgets = page.widgets.filter(w => w.y + w.height > pageHeight);
        if (overflowingWidgets.length > 0) {
            // Move them to next page
            const nextIdx = i + 1;
            let targetPage = newTemplate.pages[nextIdx];
            if (!targetPage) {
                targetPage = {
                    id: uuidv4(),
                    widgets: [],
                    properties: { ...page.properties }
                };
                newTemplate.pages.push(targetPage);
            }

            // Remove from current
            page.widgets = page.widgets.filter(w => w.y + w.height <= pageHeight);

            // Add to next, resetting Y to top (+ margin)
            // Maintain relative order
            const minY = Math.min(...overflowingWidgets.map(w => w.y));
            overflowingWidgets.forEach(w => {
                w.y = 40 + (w.y - minY);
                targetPage.widgets.push(w);
            });
            // We need to ensure loop processes this new/updated next page
            // verifying i < newTemplate.pages.length covers it.
        }
    }

    return newTemplate;
};
