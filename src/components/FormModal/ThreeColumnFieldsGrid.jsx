import React from 'react';
import { shouldFieldSpanFullWidth } from '../../utils/formFieldLayout';

/**
 * Reusable 3-column field layout for forms.
 * - Desktop: 3 columns
 * - Mobile: 1 column
 * - Description stays beside name; textarea/file fields span all columns unless overridden.
 */
const ThreeColumnFieldsGrid = ({ fields = [], renderField }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {fields.map((field) => {
        const spanClass = shouldFieldSpanFullWidth(field) ? 'md:col-span-3' : 'md:col-span-1';
        return (
          <div key={field?.name || labelFallback(field)} className={spanClass}>
            {renderField(field)}
          </div>
        );
      })}
    </div>
  );
};

// Fallback label for rare cases when `field.name` is missing
const labelFallback = (field) => {
  return String(field?.label || 'field');
};

export default ThreeColumnFieldsGrid;

