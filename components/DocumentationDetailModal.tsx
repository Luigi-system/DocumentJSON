

import React, { useState, useEffect } from 'react';
import { CloseIcon, DocumentIcon, RefreshIcon } from './icons';
import { DocGenConfig } from '../types';
import { regenerateFileExplanation } from '../services/geminiService';

interface DocumentationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: {
        title: string;
        code: string;
        explanation: string;
        config: DocGenConfig;
    } | null;
    onRegenerate: (filePath: string, newExplanation: string) => void;
}

const highlightCode = (code: string): string => {
    if (!code) return '';
    // IMPORTANT: Escape HTML characters first to prevent them from being interpreted as tags.
    let highlightedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Process from most specific to least specific to avoid conflicts.
    // 1. Comments (single and multi-line)
    highlightedCode = highlightedCode.replace(/(\/\*[\s\S]*?\*\/)|(\/\/.*)/g, '<span class="syntax-comment">$&</span>');
    
    // 2. Strings (single, double, template literals)
    highlightedCode = highlightedCode.replace(/(['"`])(?:(?=(\\?))\2.)*?\1/g, '<span class="syntax-string">$&</span>');

    // 3. Class declarations
    highlightedCode = highlightedCode.replace(/(class\s+)([A-Z]\w*)/g, '<span class="syntax-keyword">$1</span><span class="syntax-class">$2</span>');

    // 4. Function declarations
    highlightedCode = highlightedCode.replace(/(function\s+)([a-zA-Z0-9_]+)/g, '<span class="syntax-keyword">$1</span><span class="syntax-function">$2</span>');

    // 5. JSX Tags and Attributes (must use the escaped versions)
    // Component Tags (e.g., <MyComponent />)
    highlightedCode = highlightedCode.replace(/(&lt;\/?\s*)([A-Z]\w*)/g, '$1<span class="syntax-component-tag">$2</span>');
    // HTML Tags (e.g., <div>)
    highlightedCode = highlightedCode.replace(/(&lt;\/?\s*)([a-z][a-z0-9-]*)/g, '$1<span class="syntax-tag">$2</span>');
    // JSX Attributes
    highlightedCode = highlightedCode.replace(/(\s+)([a-zA-Z0-9-]+)(?==)/g, '$1<span class="syntax-attr">$2</span>');

    // 6. General keywords (that weren't part of other rules)
    highlightedCode = highlightedCode.replace(/\b(import|export|from|const|let|var|return|if|else|switch|case|for|while|do|new|try|catch|finally|extends|super|async|await|default|type|interface|public|private|protected)\b/g, '<span class="syntax-keyword">$&</span>');

    // 7. Standalone function calls (heuristic)
    highlightedCode = highlightedCode.replace(/([a-zA-Z0-9_]+)(?=\()/g, (match, p1) => {
        // Avoid matching keywords that are functions, e.g. `if (`
        const keywords = ['if', 'for', 'while', 'switch', 'catch'];
        if (keywords.includes(p1)) return match;
        return `<span class="syntax-function">${p1}</span>`;
    });

    // 8. Booleans & null
    highlightedCode = highlightedCode.replace(/\b(true|false|null|undefined)\b/g, '<span class="syntax-boolean">$&</span>');
    
    // 9. Numbers
    highlightedCode = highlightedCode.replace(/\b(-?\d+(\.\d+)?)\b/g, '<span class="syntax-number">$&</span>');
    
    // 10. Punctuation
    highlightedCode = highlightedCode.replace(/([{}()[\],;.=<>+\-*/!&|?:]|=>|&gt;)/g, '<span class="syntax-punctuation">$&</span>');

    return highlightedCode;
};

const DocumentationDetailModal: React.FC<DocumentationDetailModalProps> = ({ isOpen, onClose, content, onRegenerate }) => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [currentExplanation, setCurrentExplanation] = useState('');

    useEffect(() => {
        if (content) {
            setCurrentExplanation(content.explanation);
        }
    }, [content]);

    if (!isOpen || !content) return null;

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const newExplanation = await regenerateFileExplanation(content.title, content.code, content.config);
            setCurrentExplanation(newExplanation);
            onRegenerate(content.title, newExplanation);
        } catch (error) {
            console.error("Failed to regenerate explanation:", error);
            alert("No se pudo regenerar la explicación. Por favor, inténtalo de nuevo.");
        } finally {
            setIsRegenerating(false);
        }
    };
    
    const formattedCode = content.code.replace(/```(tsx|ts|js|jsx|html|css|json)?/g, '').trim();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-panel rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-main" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-main flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-main flex items-center">
                        <DocumentIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        <span className="font-mono text-sm">{content.title}</span>
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-tertiary">
                        <CloseIcon className="h-5 w-5 text-subtle" />
                    </button>
                </header>
                <main className="flex-grow overflow-hidden grid grid-cols-2 gap-4 p-4">
                    <div className="flex flex-col h-full overflow-hidden">
                        <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mb-2">Código Fuente</h3>
                        <pre className="bg-tertiary rounded-md p-3 text-xs font-mono text-main overflow-auto flex-grow border border-main">
                            <code dangerouslySetInnerHTML={{ __html: highlightCode(formattedCode) }} />
                        </pre>
                    </div>
                    <div className="flex flex-col h-full overflow-hidden">
                         <div className="flex items-center justify-between mb-2">
                             <h3 className="text-sm font-bold text-subtle uppercase tracking-wider">Análisis de IA</h3>
                             <button 
                                 onClick={handleRegenerate} 
                                 disabled={isRegenerating} 
                                 className="p-1.5 rounded-full hover:bg-tertiary text-subtle disabled:cursor-not-allowed disabled:opacity-50"
                                 title="Regenerar análisis"
                            >
                                {isRegenerating 
                                    ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    : <RefreshIcon className="h-4 w-4" />
                                }
                             </button>
                         </div>
                         <div className="bg-tertiary rounded-md p-3 text-sm text-main overflow-auto flex-grow border border-main prose prose-sm max-w-none">
                            <p>{currentExplanation}</p>
                         </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DocumentationDetailModal;