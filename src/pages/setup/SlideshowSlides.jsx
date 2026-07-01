import React from 'react';
import { FiImage, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import { resolveSlideshowImageUrl } from '../../utils/resolveApiAssetUrl';

const DEFAULT_GRADIENT = 'from-stone-950/70 via-stone-900/55 to-stone-800/35';

const SlideshowSlides = () => {
  const crud = useApiCrud('slideshow-slides', {
    initialFormData: {
      title: '',
      description: '',
      gradient: DEFAULT_GRADIENT,
      sort_order: 0,
      status_id: '',
      image: null,
      remove_image: false,
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.title?.trim()) {
        errors.title = 'Slide title is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      if (!data.image && !data.image_url) {
        errors.image = 'Slide image is required';
      }
      return errors;
    },
    transformFormData: (data) => ({
      ...data,
      sort_order: data.sort_order === '' || data.sort_order == null ? 0 : Number(data.sort_order),
      remove_image: data.remove_image ? '1' : '0',
    }),
    transformResponse: (data) => {
      const patch = (item) => ({
        ...item,
        image: null,
        remove_image: false,
      });
      if (Array.isArray(data)) return data.map(patch);
      if (data && typeof data === 'object') return patch(data);
      return data;
    },
    resourceName: 'Slideshow slide',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiImage,
    title: 'Slideshow',
    subtitle: 'Manage hero carousel slides on the public landing page',
    addButtonLabel: 'Add Slide',
    searchPlaceholder: 'Search slides...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
    ],
  };

  const tableColumns = [
    {
      header: 'Image',
      accessor: 'image_url',
      noWrap: true,
      render: (row) => {
        const url = resolveSlideshowImageUrl(row);
        if (!url) {
          return <span className="text-xs text-gray-400">—</span>;
        }
        return (
          <img
            src={url}
            alt=""
            className="h-12 w-20 rounded-md border border-gray-200 object-cover dark:border-gray-600"
          />
        );
      },
    },
    {
      header: 'Title',
      accessor: 'title',
      noWrap: true,
    },
    {
      header: 'Description',
      accessor: 'description',
      noWrap: false,
      render: (row) => row.description || '—',
    },
    {
      header: 'Order',
      accessor: 'sort_order',
      noWrap: true,
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'status',
      noWrap: true,
    },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Slides Found',
      description: 'Add slides to populate the landing page hero carousel.',
    },
  };

  const formFields = [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      autoFocus: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3,
      required: false,
    },
    {
      name: 'sort_order',
      label: 'Sort order',
      type: 'number',
      required: false,
      min: 0,
      helpText: 'Lower numbers appear first in the carousel.',
    },
    {
      name: 'gradient',
      label: 'Overlay gradient (Tailwind classes)',
      type: 'text',
      required: false,
      placeholder: DEFAULT_GRADIENT,
      helpText: 'CSS gradient classes applied over the slide image for text readability.',
    },
    {
      name: 'image',
      label: 'Slide image',
      type: 'file',
      required: false,
      accept: 'image/png,image/jpeg,image/gif,image/webp',
      helpText: 'JPG, PNG, GIF, or WebP (max 5MB). Recommended 1920×1080. Leave empty when editing to keep the current image.',
    },
    {
      name: 'status_id',
      label: 'Status',
      type: 'status_id',
      required: true,
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Slideshow Slide"
      crud={crud}
    />
  );
};

export default SlideshowSlides;
