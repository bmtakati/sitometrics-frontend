import React from 'react';
import { FiList, FiTrendingUp } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const MenuRecipe = () => {
  const crud = useApiCrud('menu-recipes', {
    initialFormData: {
      menu_id: '',
      item_id: '',
      quantity: 0,
      remarks: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.menu_id) errors.menu_id = 'Menu ID is required';
      if (!data.item_id) errors.item_id = 'Item ID is required';
      if (data.quantity === '' || Number(data.quantity) <= 0) errors.quantity = 'Quantity must be greater than zero';
      return errors;
    },
    transformFormData: (data) => ({
      menu_id: Number(data.menu_id),
      item_id: Number(data.item_id),
      quantity: Number(data.quantity || 0),
      remarks: data.remarks?.trim() || null
    }),
    resourceName: 'Menu Recipe',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiList,
    title: 'Menu Recipes',
    subtitle: 'Manage menu ingredient lines and quantities',
    addButtonLabel: 'Add Recipe Line',
    searchPlaceholder: 'Search menu recipes...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total Recipe Lines', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'menus_with_recipes', label: 'Menus With Recipes', icon: FiList, iconColor: 'green-600' },
    ]
  };

  const tableColumns = [
    { header: 'Menu', accessor: 'menu', noWrap: true, render: (row) => row.menu?.name || row.menu_id },
    { header: 'Ingredient Item', accessor: 'item', noWrap: true, render: (row) => row.item?.name || row.item_id },
    { header: 'Quantity', accessor: 'quantity', noWrap: true },
    { header: 'Remarks', accessor: 'remarks', noWrap: false },
  ];

  const formFields = [
    { name: 'menu_id', label: 'Menu ID', type: 'number', required: true },
    { name: 'item_id', label: 'Ingredient Item ID', type: 'number', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', min: 0.0001, step: '0.0001', required: true },
    { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 2, required: false },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Menu Recipe"
      crud={crud}
      filterOptions={[{ label: 'All', value: 'all' }]}
    />
  );
};

export default MenuRecipe;
