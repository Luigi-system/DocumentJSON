import React, { useRef } from 'react';

interface JsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    error: string | null;
    fontSize: number;
}

const highlightJSON = (jsonString: string): string => {
    if (!jsonString) return '';
    
    // This is a simplified version for demonstration. A more robust solution might be needed for complex cases.
    return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
    }).replace(/[{}[\]:,]/g, (match) => `<span class="json-punctuation">${match}</span>`);
};


const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, error, fontSize }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };
    
    const highlighted = highlightJSON(value);

    const lineNumbers = value.split('\n').map((_, i) => i + 1).join('\n');

    return (
        <div 
            className="relative w-full h-full font-mono bg-tertiary text-main" 
            style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px` }}
        >
            <div className="absolute top-0 left-0 h-full p-2.5 pr-2 text-right text-subtle select-none bg-editor-canvas border-r border-main">
                {value.split('\n').map((_, i) => <div key={i}>{i+1}</div>)}
            </div>

            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                className="absolute top-0 left-0 w-full h-full p-2.5 pl-12 bg-transparent text-transparent caret-main resize-none outline-none border-none z-10"
                spellCheck="false"
                style={{ lineHeight: 'inherit' }}
            />
            <pre
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full p-2.5 pl-12 m-0 overflow-auto pointer-events-none"
                style={{ lineHeight: 'inherit' }}
            >
                <code dangerouslySetInnerHTML={{ __html: highlighted }} />
            </pre>
            {error && (
                <div className="absolute bottom-0 left-0 w-full bg-red-500/20 text-red-600 p-2 text-xs border-t border-red-500/30 z-20">
                    {error}
                </div>
            )}
        </div>
    );
};

export default JsonEditor;