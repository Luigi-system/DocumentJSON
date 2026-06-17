import React from 'react';
import { Theme } from '@/types';

interface CanvasPageProps {
    children: React.ReactNode;
    currentTheme: Theme;
    isRenderMode: boolean;
    onCloseContextMenu: () => void;
}

const CanvasPage: React.FC<CanvasPageProps> = ({ children, currentTheme, isRenderMode, onCloseContextMenu }) => {
    return (
        <div
            className={`flex flex-col font-sans ${currentTheme} ${isRenderMode ? 'min-h-screen h-auto' : 'h-screen'}`}
            onClick={onCloseContextMenu}
        >
            {children}
        </div>
    );
};

export default CanvasPage;
