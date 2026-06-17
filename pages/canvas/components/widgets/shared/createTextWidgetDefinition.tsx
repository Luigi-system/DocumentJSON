import React from 'react';
import { TextIcon } from '@/shared/icons';
import { WidgetInstance, WidgetType } from '@/types';
import { CollapsibleSection } from '../../PropertyControls';
import TextPropertyPanel from './TextPropertyPanel';
import { TEXT_WIDGET_BINDABLE } from './bindablePresets';
import { WidgetDefinition } from '../types';

export function createTextWidgetDefinition(
    type: WidgetType,
    icon: React.FC<{ className?: string }>,
    defaultProps: Partial<WidgetInstance>,
): WidgetDefinition {
    const PropertyPanel: WidgetDefinition['PropertyPanel'] = (props) => (
        <CollapsibleSection title="Contenido y Tipografía" icon={TextIcon}>
            <TextPropertyPanel {...props} />
        </CollapsibleSection>
    );

    return {
        type,
        icon,
        defaultProps,
        bindableProperties: TEXT_WIDGET_BINDABLE,
        PropertyPanel,
        appearanceMode: 'default',
    };
}
