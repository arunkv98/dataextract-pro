import React, { useState } from 'react';
import type { HighlightBox } from './PDFPreview';

interface ExtractedDataProps {
  data: Record<string, any>;
  onHighlight: (text: string | null) => void;
}

export function ExtractedData({ data, onHighlight }: ExtractedDataProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Invoice Header': true,
    'Buyer Information': false,
    'Supplier Information': false,
    'Purchase Order': false,
    'Line Items': false,
  });

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const unwrap = (val: any): any => {
    if (val === null || val === undefined) return val;

    if (typeof val === 'object' && !Array.isArray(val)) {
      if ('value' in val && '_location' in val) {
        return val.value;
      }

      const cleanObj: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        if (k.startsWith('_')) continue;
        cleanObj[k] = unwrap(v);
      }

      if (cleanObj.amount !== undefined) return cleanObj.amount;
      if (cleanObj.value !== undefined) return cleanObj.value;
      if (Object.keys(cleanObj).length > 0) return cleanObj;
      return val;
    }

    if (Array.isArray(val)) {
      return val.map(item => unwrap(item));
    }

    return val;
  };

  const sections = [
    {
      title: 'Invoice Header',
      icon: '🧾',
      color: '#2563eb',
      bgColor: '#eff6ff',
      key: 'invoiceHeader',
      fields: [
        'invoiceNumber', 'invoiceDate', 'dueDate', 'currency', 'paymentTerms',
        'subtotal', 'discount', 'freight', 'tax', 'total', 'amountDue',
        'taxJurisdiction', 'taxExempt', 'salesTax', 'reverseCharge', 'placeOfSupply',
        'arContact', 'arContactPhone', 'salesperson', 'vendorNumber', 'dunsNumber',
        'totalItemsShipped', 'pageCount'
      ]
    },
    {
      title: 'Buyer Information',
      icon: '🏢',
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      key: 'invoiceHeader',
      fields: ['buyerName', 'billTo', 'shipTo']
    },
    {
      title: 'Supplier Information',
      icon: '🏭',
      color: '#059669',
      bgColor: '#ecfdf5',
      key: 'supplierHeader',
      fields: ['supplierName', 'legalName', 'addressLine1', 'addressLine2', 'city',
               'stateProvince', 'postalCode', 'country', 'phone', 'fax', 'email',
               'dunsNumber', 'vendorNumber', 'taxIdentificationNumber']
    },
    {
      title: 'Purchase Order',
      icon: '📋',
      color: '#d97706',
      bgColor: '#fffbeb',
      key: 'poHeader',
      fields: ['poNumber', 'orderNumber', 'deliveryNumber', 'shippingMethod',
               'shippingReference', 'deliveringPlant', 'warehouse',
               'weightLb', 'weightKg', 'volumeFt3']
    },
    {
      title: 'Line Items',
      icon: '📦',
      color: '#dc2626',
      bgColor: '#fef2f2',
      key: 'lineItem',
      isTable: true
    }
  ];

  const extractValue = (value: any): { display: string; location: HighlightBox | null } => {
    if (value === null || value === undefined || value === '') {
      return { display: '-', location: null };
    }

    if (typeof value === 'object' && value !== null) {
      if ('_location' in value && value._location) {
        const loc = value._location;
        const display = renderValue(value.value !== undefined ? value.value : value);
        return {
          display,
          location: { page: loc.page, x: loc.x, y: loc.y, w: loc.w, h: loc.h }
        };
      }
      if ('value' in value && typeof value.value === 'object' && value.value !== null && '_location' in value.value) {
        const loc = value.value._location;
        const display = renderValue(value.value.value !== undefined ? value.value.value : value.value);
        return {
          display,
          location: { page: loc.page, x: loc.x, y: loc.y, w: loc.w, h: loc.h }
        };
      }
    }

    return { display: renderValue(value), location: null };
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    if (typeof value === 'object' && !Array.isArray(value)) {
      if ('_location' in value && 'value' in value) {
        return renderValue(value.value);
      }
      if (value.amount !== undefined) return renderValue(value.amount);
      if (value.value !== undefined) return renderValue(value.value);

      const parts: string[] = [];
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith('_')) continue;
        const rendered = renderValue(v);
        if (rendered && rendered !== '-' && rendered !== '{}') {
          parts.push(rendered);
        }
      }
      if (parts.length > 0) return parts.join(', ');
      return '-';
    }

    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';

    if (typeof value === 'number') {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(value);
  };

  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const handleHighlight = (text: string | null) => {
    onHighlight(text);
  };

  const handleRowClick = (item: any) => {
    const desc = unwrap(item.description);
    if (desc) {
      onHighlight(String(desc));
    }
  };

  const renderLineItemsTable = (items: any[]) => {
    if (!items || items.length === 0) return <div className="no-data">No line items</div>;

    return (
      <div className="line-items-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const lineNumber = unwrap(item.lineNumber);
              const desc = unwrap(item.description);
              const qty = unwrap(item.quantity);
              const price = unwrap(item.unitPrice);
              const amt = unwrap(item.extendedAmount) || unwrap(item.amount);

              return (
                <tr
                  key={index}
                  className="clickable-row"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="line-num">{lineNumber || index + 1}</td>
                  <td className="line-desc">{desc || '-'}</td>
                  <td className="line-qty">{qty || '-'}</td>
                  <td className="line-price">{renderValue(price)}</td>
                  <td className="line-amount">{renderValue(amt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="extracted-data">
      <div className="data-header">
        <div className="data-header-left">
          <span className="data-check">✓</span>
          <span className="data-title">Extracted Data</span>
        </div>
        <span className="data-badge">JSON</span>
      </div>
      <div className="data-list">
        {sections.map((section) => {
          const sectionData = section.key.split('.').reduce((obj: any, k) => obj?.[k], data);
          const isExpanded = expandedSections[section.title] !== false;

          return (
            <div key={section.title} className="data-section">
              <div
                className="section-header clickable"
                style={{ background: section.bgColor, borderColor: section.color }}
                onClick={() => toggleSection(section.title)}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-title" style={{ color: section.color }}>{section.title}</span>
                {section.isTable && sectionData && (
                  <span className="section-count" style={{ background: section.color, color: '#fff' }}>
                    {sectionData.length || 0}
                  </span>
                )}
                <span className={`section-chevron ${isExpanded ? 'expanded' : ''}`}>⌄</span>
              </div>
              {isExpanded && (
                <div className="section-body">
                  {section.isTable ? (
                    renderLineItemsTable(sectionData)
                  ) : section.fields ? (
                    section.fields.map((field) => {
                      const rawValue = sectionData?.[field];

                      if (rawValue === undefined) return null;
                      if (field.startsWith('_')) return null;

                      if (field === 'billToAddress' || field === 'shipToAddress' ||
                          field === 'supplierAddress' || field === 'remitToAddress' ||
                          field === 'buyerAddress' || field === 'address') {
                        if (!rawValue || typeof rawValue !== 'object') return null;

                        return (
                          <div key={field} className="data-subsection">
                            <div className="subsection-label" style={{ color: section.color }}>{formatFieldName(field)}</div>
                            {Object.entries(rawValue).map(([key, val]) => {
                              if (key.startsWith('_')) return null;
                              const { display } = extractValue(val);
                              return (
                                <div
                                  key={key}
                                  className="data-row clickable-row"
                                  onClick={() => display !== '-' && handleHighlight(display)}
                                  onMouseEnter={() => display !== '-' && handleHighlight(display)}
                                  onMouseLeave={() => handleHighlight(null)}
                                >
                                  <span className="data-key">{formatFieldName(key)}</span>
                                  <span className="data-value">{display}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      const { display } = extractValue(rawValue);
                      console.log(`Field: ${field}, Value:`, rawValue, 'Display:', display);
                      return (
                        <div
                          key={field}
                          className="data-row clickable-row"
                          onClick={() => display !== '-' && handleHighlight(display)}
                          onMouseEnter={() => display !== '-' && handleHighlight(display)}
                          onMouseLeave={() => handleHighlight(null)}
                        >
                          <span className="data-key">{formatFieldName(field)}</span>
                          <span className="data-value">{display}</span>
                        </div>
                      );
                    })
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
