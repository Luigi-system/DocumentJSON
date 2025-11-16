import React from 'react';
import Page from './Page';
import PageManager from './PageManager';
import Pagination from './Pagination';
import { PageData, WidgetInstance, EditorLayout } from '../types';
// Removed FloatingControls import

interface EditorProps {
    pages: PageData[];
    jsonData: string;
    onAddPage: () => void;
    onDeletePage: (index: number) => void;
    onAddWidget: (pageIndex: number, widget: Omit<WidgetInstance, 'id'>) => void;
    onUpdateWidget: (widgetId: string, newProps: Partial<WidgetInstance>) => void;
    onSelectWidget: (widgetId: string | null) => void;
    selectedWidgetId: string | null;
    onWidgetRightClick: (e: React.MouseEvent, widget: WidgetInstance) => void;
    onPageRightClick: (e: React.MouseEvent, pageIndex: number) => void;
    activePageIndex: number;
    onSetActivePage: (index: number) => void;
    editorView: 'canvas' | 'manager';
    setEditorView: (view: 'canvas' | 'manager') => void;
    onOpenPageAiModal: (index: number) => void;
    editorZoom: number; // Passed from App, no longer set locally
    // Removed setEditorZoom
    editorLayout: EditorLayout; // Passed from App
    // Removed setEditorLayout
    copiedWidget: WidgetInstance | null;
    onCopyWidget: () => void;
    onPasteWidget: () => void;
    onDuplicateWidget: () => void;
    alignmentGuides: { vertical: number[]; horizontal: number[] };
    setAlignmentGuides: (guides: { vertical: number[]; horizontal: number[] }) => void;
}

const Editor: React.FC<EditorProps> = (props) => {
    
    const viewButtonClass = (view: 'canvas' | 'manager') => 
        `px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            props.editorView === view 
            ? 'bg-panel text-indigo-500 shadow-sm' 
            : 'text-subtle hover:bg-tertiary'
        }`;

    return (
        <div className="flex-grow flex flex-col relative">
            <div className="p-2 border-b border-main flex-shrink-0 flex items-center justify-start space-x-2">
                 <div className="p-1 bg-tertiary rounded-lg flex">
                    <button onClick={() => props.setEditorView('canvas')} className={viewButtonClass('canvas')}>
                        Editor Visual
                    </button>
                    <button onClick={() => props.setEditorView('manager')} className={viewButtonClass('manager')}>
                        Gestor de Páginas
                    </button>
                </div>
            </div>
             {/* FloatingControls are now rendered within each Page component */}
            {props.editorView === 'canvas' ? (
                 <div className="bg-editor-canvas p-4 md:p-10 flex-grow overflow-auto">
                    <div 
                        className="flex flex-col items-center gap-8 mx-auto"
                        style={{ transform: `scale(${props.editorZoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}
                    >
                        {props.editorLayout === 'paginated' ? (
                            <Page
                                key={props.pages[props.activePageIndex]?.id || props.activePageIndex}
                                pageData={props.pages[props.activePageIndex]}
                                jsonData={props.jsonData}
                                pageIndex={props.activePageIndex}
                                pageNumber={props.activePageIndex + 1}
                                totalPages={props.pages.length}
                                onAddWidget={props.onAddWidget}
                                onUpdateWidget={props.onUpdateWidget}
                                onSelectWidget={props.onSelectWidget}
                                selectedWidgetId={props.selectedWidgetId}
                                onWidgetRightClick={props.onWidgetRightClick}
                                onPageRightClick={props.onPageRightClick}
                                isActive={true}
                                onSetActivePage={() => {}}
                                copiedWidget={props.copiedWidget}
                                onCopyWidget={props.onCopyWidget}
                                onPasteWidget={props.onPasteWidget}
                                onDuplicateWidget={props.onDuplicateWidget}
                                editorZoom={props.editorZoom} // Pass editorZoom
                                alignmentGuides={props.alignmentGuides}
                                setAlignmentGuides={props.setAlignmentGuides}
                            />
                        ) : (
                            props.pages.map((pageData, index) => (
                                <Page
                                    key={pageData.id}
                                    pageData={pageData}
                                    jsonData={props.jsonData}
                                    pageIndex={index}
                                    pageNumber={index + 1}
                                    totalPages={props.pages.length}
                                    onAddWidget={props.onAddWidget}
                                    onUpdateWidget={props.onUpdateWidget}
                                    onSelectWidget={props.onSelectWidget}
                                    selectedWidgetId={props.selectedWidgetId}
                                    onWidgetRightClick={props.onWidgetRightClick}
                                    onPageRightClick={props.onPageRightClick}
                                    isActive={index === props.activePageIndex}
                                    onSetActivePage={props.onSetActivePage}
                                    copiedWidget={props.copiedWidget}
                                    onCopyWidget={props.onCopyWidget}
                                    onPasteWidget={props.onPasteWidget}
                                    onDuplicateWidget={props.onDuplicateWidget}
                                    editorZoom={props.editorZoom} // Pass editorZoom
                                    alignmentGuides={props.alignmentGuides}
                                    setAlignmentGuides={props.setAlignmentGuides}
                                />
                            ))
                        )}

                        {props.editorLayout === 'paginated' && props.pages.length > 0 && (
                            <Pagination 
                                currentPage={props.activePageIndex + 1}
                                totalPages={props.pages.length}
                                onPageChange={(page) => props.onSetActivePage(page - 1)}
                                onAddPage={props.onAddPage}
                            />
                        )}
                    </div>
                 </div>
            ) : (
                <PageManager 
                    pages={props.pages}
                    onAddPage={props.onAddPage}
                    onDeletePage={props.onDeletePage}
                    onOpenPageAiModal={props.onOpenPageAiModal}
                />
            )}
        </div>
    );
};

export default Editor;
