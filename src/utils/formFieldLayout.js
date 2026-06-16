const NAME_FIELD_KEYS = new Set(['name', 'title']);

export function isNameField(field) {
  return Boolean(field?.name && NAME_FIELD_KEYS.has(field.name));
}

export function isDescriptionField(field) {
  return field?.name === 'description';
}

/**
 * Places description immediately after the primary name/title field and
 * configures both for a shared two-column row.
 */
export function normalizeFormFieldsForLayout(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return fields;

  const nameIdx = fields.findIndex(isNameField);
  const descIdx = fields.findIndex(isDescriptionField);
  if (nameIdx === -1 || descIdx === -1) return fields;

  let result = fields.map((field) => ({ ...field }));

  if (descIdx !== nameIdx + 1) {
    const [descField] = result.splice(descIdx, 1);
    const insertAt = descIdx < nameIdx ? nameIdx : nameIdx + 1;
    result.splice(insertAt, 0, descField);
  }

  return result.map((field) => {
    if (isDescriptionField(field) && field.fullWidth !== true) {
      return {
        ...field,
        fullWidth: false,
        rows: 1,
        type: field.type === 'textarea' ? 'text' : field.type,
      };
    }

    if (isNameField(field)) {
      return { ...field, fullWidth: false };
    }

    return field;
  });
}

export function shouldFieldSpanFullWidth(field) {
  if (field?.fullWidth === true) return true;
  if (field?.fullWidth === false) return false;
  if (isDescriptionField(field)) return false;

  return field?.type === 'textarea' || field?.type === 'custom' || field?.type === 'file' || field?.type === 'checkbox';
}
