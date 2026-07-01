import React from 'react';
import NavIconDropdown from './NavIconDropdown';
import { LANGUAGE_OPTIONS } from './NavIconDropdown';

/**
 * Header language picker — shows flag images from backend public/assets/images/flags.
 */
const LanguageSwitcher = ({
  id = 'language',
  value,
  onChange,
  options = LANGUAGE_OPTIONS,
  darkMode = false,
  disabled = false,
  triggerVariant = 'default',
  className = 'language-selector',
}) => (
  <NavIconDropdown
    id={id}
    value={value}
    onChange={onChange}
    options={options}
    darkMode={darkMode}
    ariaLabel="Language"
    showCodeInTrigger
    variant="language"
    triggerVariant={triggerVariant}
    disabled={disabled}
    className={className}
  />
);

export default LanguageSwitcher;
