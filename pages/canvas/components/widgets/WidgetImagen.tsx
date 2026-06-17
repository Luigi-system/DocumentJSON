import React, { useRef } from 'react';
import { ImageIcon, UploadIcon } from '@/shared/icons';
import {
    Select, TextInput, Label, CollapsibleSection,
} from '../PropertyControls';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const ImagePropertyPanel: WidgetDefinition['PropertyPanel'] = ({
    widget, handlePropChange, handleStyleChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handlePropChange('src', event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <CollapsibleSection title="Fuente de la Imagen" icon={ImageIcon}>
                <Select
                    label="Tipo de Fuente"
                    tooltip="Elige si la imagen se carga desde una URL pública o desde datos Base64 incrustados."
                    value={widget.props.srcType || 'url'}
                    onChange={(v) => handlePropChange('srcType', v)}
                    options={[{ value: 'url', label: 'URL' }, { value: 'base64', label: 'Base64' }]}
                />
                {widget.props.srcType === 'base64' ? (
                    <div>
                        <Label>Datos Base64</Label>
                        <textarea onMouseDown={(e) => e.stopPropagation()} value={widget.props.src || ''} readOnly className="w-full h-16 p-2 text-xs font-mono border border-main rounded-md bg-panel text-main resize-none" />
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={() => fileInputRef.current?.click()} className="mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                            <UploadIcon className="h-4 w-4" />
                            <span>Subir Imagen</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                ) : (
                    <TextInput label="URL de la Imagen" value={widget.props.src || ''} onChange={(v) => handlePropChange('src', v)} isTextarea />
                )}
            </CollapsibleSection>
            <CollapsibleSection title="Apariencia de la Imagen" icon={ImageIcon}>
                <Select
                    label="Ajuste"
                    tooltip="'Cubrir' llena el área cortando la imagen, 'Contener' muestra la imagen completa ajustándola, 'Rellenar' estira la imagen para llenar el área."
                    value={widget.style.objectFit || 'cover'}
                    onChange={(v) => handleStyleChange('objectFit', v)}
                    options={[{ value: 'cover', label: 'Cubrir' }, { value: 'contain', label: 'Contener' }, { value: 'fill', label: 'Rellenar' }]}
                />
            </CollapsibleSection>
        </>
    );
};

export const widgetImagenDefinition: WidgetDefinition = {
    type: 'Image',
    icon: ImageIcon,
    defaultProps: {
        width: 200, height: 150, x: 50, y: 50,
        props: { src: '', srcType: 'url' },
        style: { objectFit: 'cover', margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
    },
    bindableProperties: [
        { property: 'props.src', label: 'Fuente de Imagen' },
        { property: 'style.opacity', label: 'Opacidad' },
        { property: 'style.borderRadius', label: 'Radio de Esquina' },
    ],
    PropertyPanel: ImagePropertyPanel,
    appearanceMode: 'borderOnly',
};

const WidgetImagen: React.FC = () => <WidgetPaletteItem definition={widgetImagenDefinition} />;

export default WidgetImagen;
