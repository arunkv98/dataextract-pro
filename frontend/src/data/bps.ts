import type { BP } from "../types/bp";

export const dummyBPs: BP[] = [
  {
    id: 1,
    name: 'AI invoice extraction',
    description: 'Extract invoice data from PDF using OpenAI API — supplier, buyer, line items, taxes and more.',
    icon: '📄',
    color: '#ef4444',
    count: 0,
    status: 'active',
    features: [
      'Upload invoice to AI Files ',
      'AI extracts invoice, supplier, buyer fields',
      'Returns JSON with line items, PO, GST/VAT'
    ],
    buttonText: 'Open invoice extraction'
  },
  {
    id: 2,
    name: 'PDF Extraction',
    description: 'Extract invoice details including number, date, supplier, line items, taxes and total amounts.',
    icon: '🧾',
    color: '#22c55e',
    count: 0,
    status: 'active',
    features: [
      'Extracts invoice header and line items',
      'Supports GST, HST, VAT, PST taxes',
      'Returns structured JSON output'
    ],
    buttonText: 'Open PDF Extraction'
  },
  // {
  //   id: 3,
  //   name: 'Bill Extraction',
  //   description: 'Process utility bills, receipts and billing statements with automatic field detection.',
  //   icon: '📋',
  //   color: '#8b5cf6',
  //   count: 0,
  //   status: 'active',
  //   features: [
  //     'Supports multiple bill formats',
  //     'Extracts structured information',
  //     'Improves speed and accuracy'
  //   ],
  //   buttonText: 'Open Bill Extraction'
  // }
];
