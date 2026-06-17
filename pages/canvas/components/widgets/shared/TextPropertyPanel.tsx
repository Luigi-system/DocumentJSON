import React from 'react';
import {
    ColorPicker, NumberInput, Select, TextInput, ToggleButton, AlignmentButtons,
    Section, TwoColumnGrid,
} from '../../PropertyControls';
import { WidgetPropertyPanelProps } from '../types';

const TextPropertyPanel: React.FC<WidgetPropertyPanelProps> = ({
    widget,
    onOpenAiTextModal,
    handlePropChange,
    handleStyleChange,
}) => (
    <>
        <Section title="Contenido">
            <TextInput
                label="Texto"
                value={typeof widget.props.content === 'string' ? widget.props.content : ''}
                onChange={(v) => handlePropChange('content', v)}
                isTextarea
                onLabelAction={() => onOpenAiTextModal(widget.id)}
            />
            <TextInput
                label="Hipervínculo"
                value={widget.props.link || ''}
                onChange={(v) => handlePropChange('link', v)}
                tooltip="Enlaza este texto a una URL externa. Asegúrate de incluir https://."
            />
        </Section>
        <Section title="Tipografía">
            <TwoColumnGrid>
                <NumberInput label="Tamaño" value={widget.style.fontSize || 16} onChange={(v) => handleStyleChange('fontSize', v)} />
                <ColorPicker label="Color" value={widget.style.color || '#000000'} onChange={(v) => handleStyleChange('color', v)} />
            </TwoColumnGrid>
            <Select
                label="Fuente"
                value={widget.style.fontFamily || 'sans-serif'}
                onChange={(v) => handleStyleChange('fontFamily', v)}
                options={[
                    { value: 'sans-serif', label: 'Sans Serif' },
                    { value: 'serif', label: 'Serif' },
                    { value: 'monospace', label: 'Monospace' },
                ]}
            />
            <div className="flex items-center space-x-2 mt-2">
                <ToggleButton label="Negrita" value={widget.style.fontWeight === 'bold'} onChange={(v) => handleStyleChange('fontWeight', v ? 'bold' : 'normal')} />
                <ToggleButton label="Cursiva" value={widget.style.fontStyle === 'italic'} onChange={(v) => handleStyleChange('fontStyle', v ? 'italic' : 'normal')} />
            </div>
            <AlignmentButtons value={widget.style.textAlign || 'left'} onChange={(v) => handleStyleChange('textAlign', v)} />
        </Section>
    </>
);

export default TextPropertyPanel;
