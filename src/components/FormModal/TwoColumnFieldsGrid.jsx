import React from 'react';
import { shouldFieldSpanFullWidth } from '../../utils/formFieldLayout';

/**
 * Reusable 2-column field layout for forms.
 * - Desktop: 2 columns
 * - Mobile: 1 column
 * - Description stays beside name; textarea/custom/file/checkbox span both columns unless overridden.
 */
const TwoColumnFieldsGrid = ({ fields = [], renderField }) => {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {fields.map((field) => {
        const spanClass = shouldFieldSpanFullWidth(field) ? 'md:col-span-2' : 'md:col-span-1';
        return (
          <div key={field?.name || String(field?.label)} className={spanClass}>
            {renderField(field)}
          </div>
        );
      })}
    </div>
  );
};

export default TwoColumnFieldsGrid;
