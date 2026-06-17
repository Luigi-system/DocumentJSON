import React from 'react';
import { QrCodeIcon } from '@/shared/icons';
import { TextInput, CollapsibleSection } from '../PropertyControls';
import WidgetPaletteItem from './WidgetPaletteItem';
import { WidgetDefinition } from './types';

const QrPropertyPanel: WidgetDefinition['PropertyPanel'] = ({ widget, handlePropChange }) => (
    <CollapsibleSection title="Datos del Código QR" icon={QrCodeIcon}>
        <TextInput label="Datos del Código QR" value={widget.props.data || ''} onChange={(v) => handlePropChange('data', v)} />
    </CollapsibleSection>
);

export const widgetCodigoQrDefinition: WidgetDefinition = {
    type: 'QR Code',
    icon: QrCodeIcon,
    defaultProps: {
        width: 100, height: 100, x: 50, y: 50,
        props: { data: 'https://gemini.google.com' },
        style: { margin: 0, borderWidth: 0, borderStyle: 'solid', borderRadius: 0, opacity: 1 },
    },
    bindableProperties: [{ property: 'props.data', label: 'Datos del Código QR' }],
    PropertyPanel: QrPropertyPanel,
    appearanceMode: 'default',
};

const WidgetCodigoQr: React.FC = () => <WidgetPaletteItem definition={widgetCodigoQrDefinition} />;

export default WidgetCodigoQr;
