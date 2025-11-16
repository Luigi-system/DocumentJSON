import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, PlusIcon, MinusIcon, MagicWandIcon, UploadIcon, FormatIcon } from './icons';
import JsonEditor from './JsonEditor';

interface JsonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    jsonData: string;
    setJsonData: (json: string) => void;
    onOpenGenerateModal: () => void;
}

const JsonEditorModal: React.FC<JsonEditorModalProps> = ({ isOpen, onClose, jsonData, setJsonData, onOpenGenerateModal }) => {
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 700, height: 500 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState(14);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            JSON.parse(jsonData);
            setJsonError(null);
        } catch (e: any) {
            setJsonError(e.message);
        }
    }, [jsonData]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);
    
    const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        const startSize = { ...size };
        const startPos = { ...position };
        const startMouse = { x: e.clientX, y: e.clientY };

        const doResize = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startMouse.x;
            const dy = moveEvent.clientY - startMouse.y;
            
            const MIN_WIDTH = 400;
            const MIN_HEIGHT = 300;

            let nextWidth = startSize.width;
            let nextHeight = startSize.height;
            let nextX = startPos.x;
            let nextY = startPos.y;

            if (direction.includes('e')) {
                nextWidth = Math.max(MIN_WIDTH, startSize.width + dx);
            }
            if (direction.includes('w')) {
                const potentialWidth = startSize.width - dx;
                if (potentialWidth >= MIN_WIDTH) {
                    nextWidth = potentialWidth;
                    nextX = startPos.x + dx;
                }
            }
            if (direction.includes('s')) {
                nextHeight = Math.max(MIN_HEIGHT, startSize.height + dy);
            }
            if (direction.includes('n')) {
                const potentialHeight = startSize.height - dy;
                if (potentialHeight >= MIN_HEIGHT) {
                    nextHeight = potentialHeight;
                    nextY = startPos.y + dy;
                }
            }
            
            setSize({ width: nextWidth, height: nextHeight });
            setPosition({ x: nextX, y: nextY });
        };

        const stopResize = () => {
            window.removeEventListener('mousemove', doResize);
            window.removeEventListener('mouseup', stopResize);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
    };


    const handleFormatJson = () => {
      try {
        const parsed = JSON.parse(jsonData);
        setJsonData(JSON.stringify(parsed, null, 2));
      } catch (e) {
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setJsonData(text);
        };
        reader.readAsText(file);
      }
    };

    if (!isOpen) return null;

    const resizeHandles = [
        { dir: 'n', cursor: 'ns-resize', className: 'absolute top-0 left-0 w-full h-2' },
        { dir: 's', cursor: 'ns-resize', className: 'absolute bottom-0 left-0 w-full h-2' },
        { dir: 'w', cursor: 'ew-resize', className: 'absolute top-0 left-0 w-2 h-full' },
        { dir: 'e', cursor: 'ew-resize', className: 'absolute top-0 right-0 w-2 h-full' },
        { dir: 'nw', cursor: 'nwse-resize', className: 'absolute top-0 left-0 w-3 h-3' },
        { dir: 'ne', cursor: 'nesw-resize', className: 'absolute top-0 right-0 w-3 h-3' },
        { dir: 'sw', cursor: 'nesw-resize', className: 'absolute bottom-0 left-0 w-3 h-3' },
        { dir: 'se', cursor: 'nwse-resize', className: 'absolute bottom-0 right-0 w-3 h-3' },
    ];

    return (
        <div className="fixed inset-0 z-40">
            <div
                className="bg-panel rounded-lg shadow-2xl flex flex-col border border-main"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    width: size.width,
                    height: size.height,
                }}
            >
                <header
                    className="p-2 border-b border-main flex justify-between items-center cursor-move"
                    onMouseDown={handleMouseDown}
                >
                    <h2 className="text-sm font-semibold text-main px-2">
                        Editor de Datos JSON
                    </h2>
                    <div className="flex items-center space-x-1">
                      <button onClick={handleFormatJson} title="Formatear JSON" className="p-1.5 rounded hover:bg-tertiary text-subtle"><FormatIcon className="h-4 w-4" /></button>
                      <button onClick={onOpenGenerateModal} title="Generar con IA" className="p-1.5 rounded hover:bg-tertiary text-subtle"><MagicWandIcon className="h-4 w-4" /></button>
                      <button onClick={() => fileInputRef.current?.click()} title="Cargar JSON" className="p-1.5 rounded hover:bg-tertiary text-subtle"><UploadIcon className="h-4 w-4" /></button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                      <div className="w-px h-5 bg-main mx-1"></div>
                      <button onClick={() => setFontSize(f => Math.max(8, f - 1))} title="Alejar" className="p-1.5 rounded hover:bg-tertiary text-subtle"><MinusIcon className="h-4 w-4" /></button>
                      <button onClick={() => setFontSize(f => Math.min(24, f + 1))} title="Acercar" className="p-1.5 rounded hover:bg-tertiary text-subtle"><PlusIcon className="h-4 w-4" /></button>
                       <div className="w-px h-5 bg-main mx-1"></div>
                      <button onClick={onClose} className="p-1 rounded-full hover:bg-tertiary">
                          <CloseIcon className="h-5 w-5 text-subtle" />
                      </button>
                    </div>
                </header>
                <main className="flex-grow overflow-hidden relative">
                    <JsonEditor value={jsonData} onChange={setJsonData} error={jsonError} fontSize={fontSize} />
                </main>
                 {resizeHandles.map(handle => (
                    <div
                        key={handle.dir}
                        style={{ cursor: `${handle.dir}-resize` }}
                        className={handle.className}
                        onMouseDown={(e) => handleResizeMouseDown(e, handle.dir)}
                    />
                ))}
            </div>
        </div>
    );
};

export default JsonEditorModal;