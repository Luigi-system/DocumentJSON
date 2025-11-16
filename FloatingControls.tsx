import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrashIcon, MagicWandIcon, PlusIcon, MinusIcon, DocumentIconOutline, ViewColumnsIcon } from './components/icons';
import { EditorLayout } from './types';

interface FloatingControlsProps {
    onDeletePage: (index: number) => void;
    onGenerateAi: (index: number) => void;
    activePageIndex: number; 

    editorZoom: number;
    setEditorZoom: (updater: number | ((zoom: number) => number)) => void;
    editorLayout: EditorLayout;
    onSetEditorLayout: (layout: EditorLayout) => void;

    initialX: number;
    initialY: number;
    onPositionChange: (x: number, y: number) => void;
}

const FloatingControls: React.FC<FloatingControlsProps> = (props) => {
    const { 
        onDeletePage, onGenerateAi, activePageIndex, 
        editorZoom, setEditorZoom, editorLayout, onSetEditorLayout,
        initialX, initialY, onPositionChange
    } = props;

    // Local state for the floating controls' position
    // Initialize once from props. After that, it's managed by dragging.
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 }); // Offset from mouse to element's top-left corner
    const wrapperRef = useRef<HTMLDivElement>(null); // Ref to the draggable div

    // IMPORTANT: Removed the useEffect that was causing conflicts by resetting position.
    // The initialX/initialY props are only used for the initial useState call.

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !wrapperRef.current) return;

        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        // Keep within viewport bounds
        const currentWidth = wrapperRef.current.offsetWidth;
        const currentHeight = wrapperRef.current.offsetHeight;
        newX = Math.max(0, Math.min(newX, window.innerWidth - currentWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - currentHeight));

        // Update local state, this will trigger a re-render of the component
        setPosition({ x: newX, y: newY });
    }, [isDragging]); // Only depends on isDragging

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        // Call parent's onPositionChange with the final position from local state.
        onPositionChange(position.x, position.y);
    }, [position, onPositionChange]); // Depends on `position` to capture its latest value, and `onPositionChange`

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0 || !wrapperRef.current) return;
        const target = e.target as HTMLElement;
        // Prevent dragging if a button inside is clicked
        if (target.closest('button')) return;

        setIsDragging(true);
        const rect = wrapperRef.current.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        e.preventDefault(); // Prevent default browser drag behavior
    }, []);

    // Effect to attach/detach global mouse event listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const buttonClass = "p-2 bg-panel rounded-md shadow-md text-subtle hover:text-main hover:bg-tertiary transition-colors border border-main";
    const toggleButtonClass = (isActive: boolean) => `p-2 rounded-md ${isActive ? 'bg-indigo-600 text-white' : 'text-subtle bg-panel hover:bg-tertiary'}`;

    return (
        <div 
            ref={wrapperRef}
            className="fixed z-50 p-1.5 bg-panel/80 backdrop-blur-sm rounded-lg shadow-2xl border border-main" 
            style={{ 
                left: position.x, 
                top: position.y,
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center space-x-2">
                {/* Page Actions */}
                <div className="flex items-center space-x-1 p-1 bg-tertiary rounded-md">
                    <button onClick={() => onGenerateAi(activePageIndex)} title="Generar con IA en esta página" className={buttonClass}>
                        <MagicWandIcon className="h-5 w-5 text-indigo-500" />
                    </button>
                    <button onClick={() => onDeletePage(activePageIndex)} title="Eliminar Página Actual" className={`${buttonClass} hover:text-red-500`}>
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 p-1 bg-tertiary rounded-md">
                    <button onClick={() => onSetEditorLayout('paginated')} title="Vista Paginada" className={toggleButtonClass(editorLayout === 'paginated')}>
                        <DocumentIconOutline className="h-5 w-5" />
                    </button>
                     <button onClick={() => onSetEditorLayout('scroll')} title="Vista de Scroll Continuo" className={toggleButtonClass(editorLayout === 'scroll')}>
                        <ViewColumnsIcon className="h-5 w-5" />
                    </button>
                </div>

                 {/* Zoom Controls */}
                <div className="flex items-center space-x-1 p-1 bg-tertiary rounded-md">
                    <button onClick={() => setEditorZoom(z => Math.max(0.2, z - 0.1))} title="Alejar" className={buttonClass}>
                        <MinusIcon className="h-5 w-5" />
                    </button>
                     <button onClick={() => setEditorZoom(1)} title="Restablecer Zoom" className={`${buttonClass} w-14 text-sm font-semibold`}>
                        {Math.round(editorZoom * 100)}%
                    </button>
                    <button onClick={() => setEditorZoom(z => Math.min(2, z + 0.1))} title="Acercar" className={buttonClass}>
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingControls;