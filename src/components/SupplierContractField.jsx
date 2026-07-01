import React, { useEffect, useMemo } from 'react';
import { FiExternalLink, FiFileText } from 'react-icons/fi';
import { resolveApiAssetUrl } from '../utils/resolveApiAssetUrl';

const PDF_ACCEPT = 'application/pdf,.pdf';

const SupplierContractField = ({ formData, onInputChange, errors = {}, darkMode = false, isEditing = false }) => {
  const selectedFile = formData.contract instanceof File ? formData.contract : null;
  const existingUrl = !selectedFile && formData.contract_url ? resolveApiAssetUrl(formData.contract_url) : '';
  const objectUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : ''),
    [selectedFile]
  );

  useEffect(() => {
    if (!objectUrl) return undefined;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const previewUrl = objectUrl || existingUrl;
  const displayName =
    selectedFile?.name ||
    formData.contract_original_name ||
    (existingUrl ? 'Current contract.pdf' : '');

  const handleFileChange = (event) => {
    onInputChange(event);
  };

  const labelClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-600 bg-gray-900/40' : 'border-gray-200 bg-gray-50';
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white ${
    darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'
  } ${errors.contract ? 'border-red-500' : ''}`;

  return (
    <div className="space-y-4">
      <div>
        <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Contract document (PDF)</label>
        <input
          type="file"
          name="contract"
          accept={PDF_ACCEPT}
          onChange={handleFileChange}
          className={inputClass}
        />
        <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          PDF only, max 10MB. {isEditing ? 'Upload a new file to replace the current contract.' : 'Required when creating a supplier.'}
        </p>
        {errors.contract ? <p className="mt-1 text-sm text-red-600">{errors.contract}</p> : null}
      </div>

      {displayName ? (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${borderClass}`}>
          <FiFileText className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{displayName}</span>
          {selectedFile ? (
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>(new upload)</span>
          ) : null}
        </div>
      ) : null}

      {previewUrl ? (
        <div className={`overflow-hidden rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`flex items-center justify-between border-b px-3 py-2 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'}`}>
            <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Contract preview
            </span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              Open in new tab
              <FiExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <iframe
            title={displayName || 'Supplier contract preview'}
            src={previewUrl}
            className="h-[min(420px,60vh)] w-full bg-white"
          />
        </div>
      ) : null}
    </div>
  );
};

export default SupplierContractField;
