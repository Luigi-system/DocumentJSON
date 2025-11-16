
import React, { useState, useEffect } from 'react';
import { BoldIcon, ItalicIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, InformationCircleIcon, MagicWandIcon, ChevronDownIcon, ChevronRightIcon, CogIcon, DocumentIcon, DocumentIconOutline } from './icons';

export const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative flex items-center">
        <InformationCircleIcon className="h-4 w-4 text-subtle cursor-help" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {text}
        </div>
    </div>
);

export const Label: React.FC<{ children: React.ReactNode, htmlFor?: string, tooltip?: string, onAction?: () => void }> = ({ children, htmlFor, tooltip, onAction }) => (
    <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1.5">
            <label htmlFor={htmlFor} className="text-xs font-medium text-subtle block">{children}</label>
            {tooltip && <InfoTooltip text={tooltip} />}
        </div>
         {onAction && (
            <button onMouseDown={e => e.stopPropagation()} onClick={onAction} className="p-1 rounded-full hover:bg-tertiary text-subtle" title="Generar con IA">
                <MagicWandIcon className="h-4 w-4 text-indigo-500" />
            </button>
        )}
    </div>
);

export const Section: React.FC<{ title: string; children: React.ReactNode; tooltip?: string }> = ({ title, children, tooltip }) => (
    <div>
        <div className="flex items-center space-x-1.5 mb-2">
            <h3 className="text-xs font-bold uppercase text-subtle tracking-wider">{title}</h3>
            {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="space-y-3 p-3 bg-tertiary rounded-md">{children}</div>
    </div>
);

export const TwoColumnGrid: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="grid grid-cols-2 gap-3">{children}</div>
)

interface TextInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    isTextarea?: boolean;
    tooltip?: string;
    onLabelAction?: () => void;
}
export const TextInput: React.FC<TextInputProps> = ({ label, value, onChange, isTextarea, tooltip, onLabelAction }) => {
    const [localValue, setLocalValue] = useState(value);
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !isTextarea) {
            (e.target as HTMLInputElement).blur();
        }
    };

    const commonClasses = "w-full p-2 text-sm border border-main rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-panel text-main";
    
    return (
        <div>
            <Label tooltip={tooltip} onAction={onLabelAction}>{label}</Label>
            {isTextarea ? (
                <textarea 
                    value={localValue} 
                    onMouseDown={stopPropagation} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    className={`${commonClasses} h-24 resize-y`} 
                />
            ) : (
                <input 
                    type="text" 
                    value={localValue} 
                    onMouseDown={stopPropagation} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={commonClasses} 
                />
            )}
        </div>
    );
};

interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    tooltip?: string;
}
export const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, tooltip }) => {
    const [localValue, setLocalValue] = useState(String(value));

    useEffect(() => {
        setLocalValue(String(value));
    }, [value]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        const num = parseFloat(localValue);
        if (!isNaN(num) && num !== value) {
            onChange(num);
        } else {
            setLocalValue(String(value));
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div>
            <Label tooltip={tooltip}>{label}</Label>
            <input 
                type="number" 
                value={localValue} 
                onMouseDown={(e) => e.stopPropagation()} 
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full p-2 text-sm border border-main rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-panel text-main" 
            />
        </div>
    );
};

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    tooltip?: string;
}
export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, tooltip }) => (
    <div>
        <Label tooltip={tooltip}>{label}</Label>
        <div className="relative w-full h-9 border border-main rounded-md overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute -top-1 -left-1 w-12 h-12 cursor-pointer" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono">{value}</span>
        </div>
    </div>
);


interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    tooltip?: string;
}
export const Slider: React.FC<SliderProps> = ({ label, value, onChange, min=0, max=100, step=1, tooltip }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <Label tooltip={tooltip}>{label}</Label>
            <span className="text-xs font-mono text-subtle">{value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-2 bg-editor-canvas rounded-lg appearance-none cursor-pointer" />
    </div>
);

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    tooltip?: string;
}
export const Select: React.FC<SelectProps> = ({ label, value, onChange, options, tooltip }) => (
    <div>
        <Label tooltip={tooltip}>{label}</Label>
        <select value={value} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => onChange(e.target.value)} className="w-full p-2 text-sm border border-main rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-panel text-main">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

interface ToggleButtonProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    icon?: React.FC<{className?: string}>
}
export const ToggleButton: React.FC<ToggleButtonProps> = ({ label, value, onChange, icon: Icon }) => (
    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => onChange(!value)} className={`flex-1 px-2 py-1.5 text-xs rounded-md border border-main flex items-center justify-center space-x-1 ${value ? 'bg-indigo-600 text-white' : 'bg-panel hover:bg-tertiary'}`}>
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
    </button>
);

interface AlignmentButtonsProps {
    value: 'left' | 'center' | 'right';
    onChange: (value: 'left' | 'center' | 'right') => void;
}
export const AlignmentButtons: React.FC<AlignmentButtonsProps> = ({ value, onChange }) => {
    const buttonClass = (align: string) => `p-2 rounded-md border border-main ${value === align ? 'bg-indigo-600 text-white' : 'bg-panel hover:bg-tertiary'}`;
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
    return (
        <div>
            <Label>Alineación</Label>
            <div className="flex space-x-1">
                <button title="Alinear a la Izquierda" onMouseDown={stopPropagation} onClick={() => onChange('left')} className={buttonClass('left')}><AlignLeftIcon className="h-4 w-4" /></button>
                <button title="Alinear al Centro" onMouseDown={stopPropagation} onClick={() => onChange('center')} className={buttonClass('center')}><AlignCenterIcon className="h-4 w-4" /></button>
                <button title="Alinear a la Derecha" onMouseDown={stopPropagation} onClick={() => onChange('right')} className={buttonClass('right')}><AlignRightIcon className="h-4 w-4" /></button>
            </div>
        </div>
    )
}

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    tooltip?: string;
}
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, tooltip }) => (
    <div className="flex items-center justify-between">
        <Label tooltip={tooltip}>{label}</Label>
        <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-editor-canvas border border-main'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

// New component moved from Sidebar and Widgets
export const CollapsibleSection: React.FC<{ title: string; icon: React.FC<{className?: string}>; children: React.ReactNode; defaultOpen?: boolean; onToggle?: (isOpen: boolean) => void }> = ({ title, icon: Icon, children, defaultOpen = true, onToggle }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleToggle = () => {
        setIsOpen(prev => {
            const newState = !prev;
            onToggle?.(newState);
            return newState;
        });
    };

    return (
        <div className="mb-4">
            <button
                onClick={handleToggle}
                className="flex items-center justify-between w-full py-2 text-sm font-bold text-main hover:text-indigo-500 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`section-${title.replace(/\s+/g, '-')}`}
            >
                <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </button>
            {isOpen && (
                <div id={`section-${title.replace(/\s+/g, '-')}`} className="pl-1 pt-2 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
};