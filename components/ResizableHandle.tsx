
import React from 'react';

interface ResizableHandleProps {
    onResize: (newSize: number) => void;
    isRight?: boolean;
}

const ResizableHandle: React.FC<ResizableHandleProps> = ({ onResize, isRight = false }) => {
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (isRight) {
                onResize(moveEvent.clientX);
            } else {
                onResize(moveEvent.clientX);
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            className="w-1.5 h-full cursor-col-resize flex-shrink-0 bg-tertiary hover:bg-indigo-500 transition-colors"
        />
    );
};

export default ResizableHandle;
