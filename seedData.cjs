const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const { normalizeInvoiceDocument } = require('./invoiceSeedContract.cjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

const getObjId = (hex) => new ObjectId(hex.padEnd(24, '0'));

const vendorIds = {
  techPvtLtd: getObjId('5a000000000000000000001'),
  saasPlatform: getObjId('5a000000000000000000002'),
  freshProduce: getObjId('5a000000000000000000003'),
  desertSupply: getObjId('5a000000000000000000004'),
};

const clientIds = {
  alphaCorp: getObjId('5b000000000000000000001'),
  betaRetail: getObjId('5b000000000000000000002'),
  localCafe: getObjId('5b000000000000000000003'),
  gammaStartups: getObjId('5b000000000000000000004'),
};

const users = {
  admin: getObjId('5c000000000000000000001')
};

const getBaseInvoice = (idx, invoiceNumberPrefix, vendorId) => ({
  _id: new ObjectId(),
  isExpenditure: false,
  billType: 'INVOICE',
  invoiceNumber: `${invoiceNumberPrefix}-${100 + idx}`,
  creator: users.admin,
  owner: vendorId,
  author: vendorId,
  invoiceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  dueDate: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
  currency: 'INR',
  conversionRates: { INR: 1 },
  totalConversions: {
    INR: { total: 0, paid: 0, tds: 0, transactionCharge: 0, due: 0 }
  },
  totals: {
    subTotal: 0,
    amount: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    total: 0,
    discount: 0,
    totalRoundOff: 0,
    amountRoundOff: 0
  },
  balance: { paid: 0, tds: 0, transactionCharge: 0, due: 0 },
  isSourceConverted: false,
  // Filter-critical defaults (Mongoose defaults don't apply via raw MongoClient)
  isRemoved: false,
  isArchived: false,
  isHardRemoved: false,
  isSharedDocument: false,
  invoiceAccepted: 'WAITING',
  einvoiceGeneratedStatus: 'NOT_GENERATED',
  taxType: 'INDIA',
  source: 'DASHBOARD',
  recurringInvoice: {
    frequency: 'None',
    status: 'DRAFT',
    endDate: null
  },
  // Default empty arrays for $size / $exists queries
  payments: [],
  creditClaims: [],
  tags: [],
  rejectedByBusinesses: [],
  acceptedByBusinesses: [],
  acceptedByBusinessesData: [],
  documentAcceptanceRecord: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  _systemMeta: {
    source: 'seed-script'
  }
});

const documents = [];

for (let i = 0; i < 5; i++) {
  // Scenario 1: Standard B2B Invoice (Fully Paid) + Indian Compliance
  documents.push({
    ...getBaseInvoice(i, 'INV-SC1', vendorIds.techPvtLtd),
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'PAID',
    invoiceTitle: 'Software Consulting Invoice',
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstState: '29', // Karnataka
      gstin: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      city: 'Bangalore',
      phone: '+919876543210',
      email: 'billing@techsolutions.in',
      clientType: 'BUSINESS',
      additionalIds: [{ label: 'CIN', value: 'U72200KA2018PTC123456', showInInvoice: true, useForEInvoice: false }]
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstState: '27', // Maharashtra
      gstin: '27ZYXWV9876Q1Z9',
      panNumber: 'ZYXWV9876Q',
      city: 'Mumbai',
      email: 'finance@alphacorp.in',
      phone: '+919123456789',
      clientType: 'BUSINESS'
    },
    tags: ['Q3-Services', 'Retainer'],
    placeOfSupply: '27', // Maharashtra (billedTo state)
    igst: true, // inter-state: KARNATAKA → MAHARASHTRA
    irn: {
      irn: `a1b2c3d4e5f6g7h8i9j0_${i}`,
      ackNo: `9876543210${i}`,
      ackDt: new Date(),
      qrCode: 'mocked_qr_code_string',
      status: 'ACT'
    },
    einvoiceGeneratedStatus: 'GENERATED',
    items: [
      {
        _id: new ObjectId(),
        name: 'Software Architecture Consulting',
        description: 'End-to-end architecture review and consulting services',
        hsn: '9983',
        gstRate: 18,
        quantity: 40 + i,
        rate: 5000,
        subTotal: (40 + i) * 5000,
        amount: (40 + i) * 5000,
        igst: (40 + i) * 5000 * 0.18,
        total: (40 + i) * 5000 * 1.18
      }
    ],
    totals: {
      subTotal: (40 + i) * 5000,
      amount: (40 + i) * 5000,
      igst: (40 + i) * 5000 * 0.18,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: (40 + i) * 5000 * 1.18
    },
    payments: [
      {
        _id: new ObjectId(),
        paymentDate: new Date(),
        paymentMethod: 'NEFT',
        amount: (40 + i) * 5000 * 1.18,
        notes: `Bank Transfer Ref: HDFC${i}8932`,
        isRemoved: false,
        isApproved: false,
        business: vendorIds.techPvtLtd,
        user: users.admin,
        paymentAccount: new ObjectId(),
        attachments: [],
        tags: []
      }
    ],
    linkedPurchaseOrder: new ObjectId()
  });

  // Scenario 2: Recurring Software Invoice (Overdue) + Int'l & Vendor Fields
  let usdSubtotal = 199.99;
  documents.push({
    ...getBaseInvoice(i, 'INV-SC2', vendorIds.saasPlatform),
    business: vendorIds.saasPlatform,
    clientProfile: clientIds.betaRetail,
    status: 'OVERDUE',
    invoiceTitle: 'Monthly SaaS Premium',
    currency: 'USD',
    conversionRates: { INR: 83.5 },
    totalConversions: {
      total: usdSubtotal * 83.5,
      subTotal: usdSubtotal * 83.5
    },
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    billedBy: {
      name: 'SaaS Platform Inc.',
      country: 'US',
      state: 'CA',
      city: 'San Francisco'
    },
    billedTo: {
      name: 'Beta Retailers',
      country: 'IN',
      state: 'DELHI',
      city: 'New Delhi',
      email: 'accounts@betaretail.in'
    },
    igst: true, // international invoice — no Indian GST split
    tags: ['SaaS', 'Recurring', 'International'],
    vendorFields: {
      r_str_001: `V-8910${i}`,
      r_str_002: 'Marketing',
      r_num_001: 50 + i
    },
    recurringInvoice: {
      frequency: 'Monthly',
      periodInDays: 30,
      nextDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'DRAFT'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Premium Cloud Subscription',
        description: 'Premium Cloud Subscription (Monthly)',
        hsn: '998311',
        gstRate: 0,
        quantity: 1,
        rate: usdSubtotal,
        subTotal: usdSubtotal,
        amount: usdSubtotal,
        total: usdSubtotal
      }
    ],
    totals: {
      subTotal: usdSubtotal,
      amount: usdSubtotal,
      igst: 0,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: usdSubtotal
    },
    linkedDocuments: [new ObjectId()]
  });

  // Scenario 3: Product Invoice + Inventory & E-way Bill
  let prodSubtotal = 50 * (i + 1) * 800; // 40000
  let prodDiscount = prodSubtotal * 0.05; // 2000
  let prodAmount = prodSubtotal - prodDiscount; // 38000
  let prodCgst = prodAmount * 0.025; // 950
  let prodSgst = prodAmount * 0.025; // 950
  let prodTotal = prodAmount + prodCgst + prodSgst; // 39900

  documents.push({
    ...getBaseInvoice(i, 'INV-SC3', vendorIds.freshProduce),
    business: vendorIds.freshProduce,
    clientProfile: clientIds.localCafe,
    status: 'UNPAID',
    invoiceTitle: 'Wholesale Produce Supply',
    igst: false, // intra-state: MAHARASHTRA → MAHARASHTRA
    tags: ['Inventory', 'Intra-State', 'Produce'],
    billedBy: {
      name: 'Fresh Produce Co.',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27AAAAA0000A1Z5',
      city: 'Pune'
    },
    billedTo: {
      name: 'Local Cafe',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27BBBBB1111B1Z6',
      city: 'Mumbai',
      email: 'manager@localcafe.com'
    },
    shippedTo: {
      name: 'Local Cafe Warehouse',
      country: 'IN',
      state: 'MAHARASHTRA',
      city: 'Mumbai',
      street: `Warehouse Block ${i}, Andheri East`,
      pincode: '400069'
    },
    transportDetails: {
      distance: 145 + i,
      vehicleNumber: `MH 12 AB 90${i}2`,
      transportMode: 'ROAD'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Premium Coffee Beans (1kg)',
        description: 'Single-origin Arabica beans, medium roast',
        hsn: '0901',
        gstRate: 5,
        quantity: 50 * (i + 1),
        rate: 800,
        subTotal: prodSubtotal,
        discount: { discountType: 'PERCENTAGE', amount: 5 },
        amount: prodAmount,
        cgst: prodCgst,
        sgst: prodSgst,
        total: prodTotal,
        allocations: [
          { batch: `BATCH-C-${i}`, quantity: 50 * (i + 1) }
        ],
        inventory: new ObjectId(),
        isStockManaged: true,
        trackingMethod: 'BATCH'
      }
    ],
    totals: {
      subTotal: prodSubtotal,
      amount: prodAmount,
      igst: 0,
      discount: prodDiscount,
      cgst: prodCgst,
      sgst: prodSgst,
      total: prodTotal
    }
  });

  // Scenario 4: ZATCA Compliance Invoice (Saudi Arabia)
  let ksaAmount = 15000 + (1000 * i);
  let ksaTax = ksaAmount * 0.15;
  let ksaTotal = ksaAmount + ksaTax;

  documents.push({
    ...getBaseInvoice(i, 'INV-SC4', vendorIds.desertSupply),
    business: vendorIds.desertSupply,
    clientProfile: clientIds.gammaStartups,
    status: 'PARTIALLY_PAID',
    invoiceTitle: 'Industrial Equipment Lease',
    igst: true, // non-Indian — no CGST/SGST split
    tags: ['ZATCA', 'Equipment', 'KSA'],
    currency: 'SAR',
    conversionRates: { SAR: 1 },
    billedBy: {
      name: 'Desert Supply LLC',
      country: 'SA',
      vatNumber: `300${i}12345600003`,
      street: 'King Fahd Road',
      city: 'Riyadh'
    },
    billedTo: {
      name: 'Gamma Startups',
      country: 'SA',
      vatNumber: `300${i}98765400003`,
      street: 'Olaya Street',
      city: 'Riyadh'
    },
    zatca: {
      certificate: 'mocked_cert_string',
      cryptographicStamp: `mocked_hash_stamp_${i}`,
      previousInvoiceHash: `mocked_prev_hash_${i}`,
      xmlHash: `mocked_xml_hash_${i}`,
      reported: true,
      cleared: true
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Heavy Drilling Equipment Lease',
        description: 'Heavy Drilling Equipment (Monthly Lease)',
        gstRate: 15,
        quantity: 1,
        rate: ksaAmount,
        subTotal: ksaAmount,
        amount: ksaAmount,
        igst: ksaTax,
        total: ksaTotal
      }
    ],
    additionalCharges: [
      { label: 'Freight and Handling', amount: 500, amountType: 'FIXED', key: 'freight' }
    ],
    totals: {
      subTotal: ksaAmount + 500,
      amount: ksaAmount + 500,
      igst: ksaTax + (500 * 0.15),
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: ksaTotal + (500 * 1.15)
    },
    payments: [
      {
        _id: new ObjectId(),
        paymentDate: new Date(),
        paymentMethod: 'CASH',
        amount: (ksaTotal + (500 * 1.15)) / 2,
        notes: `Initial 50% Deposit Received (Receipt #R-${i})`,
        isRemoved: false,
        isApproved: false,
        business: vendorIds.desertSupply,
        user: users.admin,
        paymentAccount: new ObjectId(),
        attachments: [],
        tags: []
      }
    ]
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 5: Tech Pvt Ltd — Credit Note (partial refund against SC1)
  // Tests: billType CREDITNOTE, creditNoteStatus, negative-value reporting
  // ──────────────────────────────────────────────────────────────────────
  let cnAmount = (40 + i) * 5000 * 0.10; // 10% refund of SC1 subtotal
  let cnIgst = cnAmount * 0.18;
  let cnTotal = cnAmount + cnIgst;

  documents.push({
    ...getBaseInvoice(i, 'CN-SC5', vendorIds.techPvtLtd),
    billType: 'CREDITNOTE',
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'PAID',
    creditNoteStatus: 'ADJUSTED',
    invoiceTitle: 'Credit Note — Scope Reduction',
    igst: true, // inter-state: KARNATAKA → MAHARASHTRA
    tags: ['Credit-Note', 'Adjustment'],
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27ZYXWV9876Q1Z9',
      city: 'Mumbai',
      email: 'finance@alphacorp.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Architecture Review Hours (Refund)',
        description: 'Refund — Unused Architecture Review Hours',
        hsn: '9983',
        gstRate: 18,
        quantity: 4 + i,
        rate: 5000,
        subTotal: cnAmount,
        amount: cnAmount,
        igst: cnIgst,
        total: cnTotal
      }
    ],
    totals: {
      subTotal: cnAmount,
      amount: cnAmount,
      igst: cnIgst,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: cnTotal
    },
    linkedDocuments: [new ObjectId()],
    documentReason: 'Scope reduced after mid-project review'
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 6: Tech Pvt Ltd — Multi-line project invoice + invoice-level
  //   discount + reverse charge
  // Tests: multiple items[], discount object, reverseCharge, multi-HSN
  // ──────────────────────────────────────────────────────────────────────
  let sc6Line1Sub = 20 * 8000;   // Architecture: 20h × ₹8000
  let sc6Line2Sub = 80 * 3500;   // Dev: 80h × ₹3500
  let sc6Line3Sub = 10 * 6000;   // QA: 10h × ₹6000
  let sc6SubTotal = sc6Line1Sub + sc6Line2Sub + sc6Line3Sub;
  let sc6Discount = sc6SubTotal * 0.08;
  let sc6Amount = sc6SubTotal - sc6Discount;
  let sc6Igst = sc6Amount * 0.18;
  let sc6Total = sc6Amount + sc6Igst;

  documents.push({
    ...getBaseInvoice(i, 'INV-SC6', vendorIds.techPvtLtd),
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'UNPAID',
    invoiceTitle: 'Full-Stack Development Project',
    igst: true, // inter-state: KARNATAKA → MAHARASHTRA
    tags: ['Project', 'Multi-Line', 'Reverse-Charge'],
    reverseCharge: true,
    discount: {
      discountType: 'PERCENTAGE',
      discountMethod: 'WEIGHTED',
      amount: 8
    },
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27ZYXWV9876Q1Z9',
      city: 'Mumbai',
      email: 'finance@alphacorp.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Solution Architecture & Design',
        description: 'High-level system design and architecture documentation',
        hsn: '9983',
        gstRate: 18,
        quantity: 20,
        rate: 8000,
        subTotal: sc6Line1Sub,
        discount: { discountType: 'PERCENTAGE', amount: 8 },
        amount: sc6Line1Sub * 0.92,
        igst: sc6Line1Sub * 0.92 * 0.18,
        total: sc6Line1Sub * 0.92 * 1.18
      },
      {
        _id: new ObjectId(),
        name: 'Full-Stack Development',
        description: 'Full-Stack Development (React + Node)',
        hsn: '998314',
        gstRate: 18,
        quantity: 80,
        rate: 3500,
        subTotal: sc6Line2Sub,
        discount: { discountType: 'PERCENTAGE', amount: 8 },
        amount: sc6Line2Sub * 0.92,
        igst: sc6Line2Sub * 0.92 * 0.18,
        total: sc6Line2Sub * 0.92 * 1.18
      },
      {
        _id: new ObjectId(),
        name: 'QA & Performance Testing',
        description: 'Comprehensive QA and load testing',
        hsn: '998316',
        gstRate: 18,
        quantity: 10,
        rate: 6000,
        subTotal: sc6Line3Sub,
        discount: { discountType: 'PERCENTAGE', amount: 8 },
        amount: sc6Line3Sub * 0.92,
        igst: sc6Line3Sub * 0.92 * 0.18,
        total: sc6Line3Sub * 0.92 * 1.18
      }
    ],
    totals: {
      subTotal: sc6SubTotal,
      amount: sc6Amount,
      discount: sc6Discount,
      igst: sc6Igst,
      cgst: 0,
      sgst: 0,
      total: sc6Total
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 7: SaaS Platform — Annual Enterprise License (GBP, multi-payment)
  // Tests: GBP currency, multiple payments, paid status with 2 instalments
  // ──────────────────────────────────────────────────────────────────────
  let sc7Rate = 4999.99;
  let sc7Conv = 105.2; // GBP → INR

  documents.push({
    ...getBaseInvoice(i, 'INV-SC7', vendorIds.saasPlatform),
    business: vendorIds.saasPlatform,
    clientProfile: clientIds.betaRetail,
    status: 'PAID',
    invoiceTitle: 'Annual Enterprise License',
    igst: true, // international invoice
    tags: ['SaaS', 'Annual', 'Enterprise'],
    currency: 'GBP',
    conversionRates: { INR: sc7Conv },
    totalConversions: {
      total: sc7Rate * sc7Conv,
      subTotal: sc7Rate * sc7Conv
    },
    billedBy: {
      name: 'SaaS Platform Inc.',
      country: 'GB',
      state: 'London',
      city: 'London'
    },
    billedTo: {
      name: 'Beta Retailers',
      country: 'IN',
      state: 'DELHI',
      city: 'New Delhi',
      email: 'accounts@betaretail.in'
    },
    vendorFields: {
      r_str_001: `ENT-${i}`,
      r_str_002: 'Enterprise',
      r_num_001: 200 + i
    },
    recurringInvoice: {
      frequency: 'Yearly',
      periodInDays: 365,
      nextDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'DRAFT'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Enterprise Cloud Suite (Annual)',
        description: 'Enterprise Cloud Suite — Annual License (50 seats)',
        hsn: '998311',
        gstRate: 0,
        quantity: 1,
        rate: sc7Rate,
        subTotal: sc7Rate,
        amount: sc7Rate,
        total: sc7Rate
      }
    ],
    totals: {
      subTotal: sc7Rate,
      amount: sc7Rate,
      igst: 0,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc7Rate
    },
    payments: [
      {
        _id: new ObjectId(),
        paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        paymentMethod: 'BANK_TRANSFER',
        amount: sc7Rate * 0.5,
        notes: `1st instalment — Wire Transfer`,
        isRemoved: false,
        isApproved: false,
        business: vendorIds.saasPlatform,
        user: users.admin,
        paymentAccount: new ObjectId(),
        attachments: [],
        tags: []
      },
      {
        _id: new ObjectId(),
        paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paymentMethod: 'BANK_TRANSFER',
        amount: sc7Rate * 0.5,
        notes: `2nd instalment — Wire Transfer`,
        isRemoved: false,
        isApproved: false,
        business: vendorIds.saasPlatform,
        user: users.admin,
        paymentAccount: new ObjectId(),
        attachments: [],
        tags: []
      }
    ]
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 8: Fresh Produce — Multi-product invoice with mixed GST rates
  //   + shippedFrom
  // Tests: multiple items with 5%/12%/18% GST, shippedFrom, intra-state
  // ──────────────────────────────────────────────────────────────────────
  let sc8Item1Sub = 30 * 400;  // Tea (5%)
  let sc8Item1Cgst = sc8Item1Sub * 0.025;
  let sc8Item1Sgst = sc8Item1Sub * 0.025;
  let sc8Item2Sub = 20 * 1200; // Olive Oil (12%)
  let sc8Item2Cgst = sc8Item2Sub * 0.06;
  let sc8Item2Sgst = sc8Item2Sub * 0.06;
  let sc8Item3Sub = 15 * 2500; // Imported Spice Blend (18%)
  let sc8Item3Cgst = sc8Item3Sub * 0.09;
  let sc8Item3Sgst = sc8Item3Sub * 0.09;
  let sc8SubTotal = sc8Item1Sub + sc8Item2Sub + sc8Item3Sub;
  let sc8Cgst = sc8Item1Cgst + sc8Item2Cgst + sc8Item3Cgst;
  let sc8Sgst = sc8Item1Sgst + sc8Item2Sgst + sc8Item3Sgst;
  let sc8Total = sc8SubTotal + sc8Cgst + sc8Sgst;

  documents.push({
    ...getBaseInvoice(i, 'INV-SC8', vendorIds.freshProduce),
    business: vendorIds.freshProduce,
    clientProfile: clientIds.localCafe,
    status: 'UNPAID',
    invoiceTitle: 'Mixed Grocery & Specialty Supply',
    igst: false, // intra-state: MAHARASHTRA → MAHARASHTRA
    tags: ['Inventory', 'Mixed-GST', 'Multi-Product'],
    billedBy: {
      name: 'Fresh Produce Co.',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27AAAAA0000A1Z5',
      city: 'Pune'
    },
    billedTo: {
      name: 'Local Cafe',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27BBBBB1111B1Z6',
      city: 'Mumbai',
      email: 'manager@localcafe.com'
    },
    shippedFrom: {
      name: 'Fresh Produce Warehouse',
      country: 'IN',
      state: 'MAHARASHTRA',
      city: 'Pune',
      pincode: '411001',
      gstin: '27AAAAA0000A1Z5'
    },
    shippedTo: {
      name: 'Local Cafe — Main Kitchen',
      country: 'IN',
      state: 'MAHARASHTRA',
      city: 'Mumbai',
      street: 'Bandra West, Linking Road',
      pincode: '400050'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Darjeeling First Flush Tea (500g)',
        description: 'Premium first flush tea from Darjeeling estate',
        hsn: '0902',
        gstRate: 5,
        quantity: 30,
        rate: 400,
        subTotal: sc8Item1Sub,
        amount: sc8Item1Sub,
        cgst: sc8Item1Cgst,
        sgst: sc8Item1Sgst,
        total: sc8Item1Sub + sc8Item1Cgst + sc8Item1Sgst,
        inventory: new ObjectId(),
        isStockManaged: true,
        trackingMethod: 'NONE'
      },
      {
        _id: new ObjectId(),
        name: 'Extra Virgin Olive Oil (1L)',
        description: 'Cold-pressed extra virgin olive oil, imported',
        hsn: '1509',
        gstRate: 12,
        quantity: 20,
        rate: 1200,
        subTotal: sc8Item2Sub,
        amount: sc8Item2Sub,
        cgst: sc8Item2Cgst,
        sgst: sc8Item2Sgst,
        total: sc8Item2Sub + sc8Item2Cgst + sc8Item2Sgst,
        inventory: new ObjectId(),
        isStockManaged: true,
        trackingMethod: 'NONE'
      },
      {
        _id: new ObjectId(),
        name: 'Imported Spice Blend (100g)',
        description: 'Imported Spice Blend — Saffron & Truffle (100g)',
        hsn: '0910',
        gstRate: 18,
        quantity: 15,
        rate: 2500,
        subTotal: sc8Item3Sub,
        amount: sc8Item3Sub,
        cgst: sc8Item3Cgst,
        sgst: sc8Item3Sgst,
        total: sc8Item3Sub + sc8Item3Cgst + sc8Item3Sgst,
        inventory: new ObjectId(),
        isStockManaged: true,
        trackingMethod: 'NONE'
      }
    ],
    totals: {
      subTotal: sc8SubTotal,
      amount: sc8SubTotal,
      igst: 0,
      cgst: sc8Cgst,
      sgst: sc8Sgst,
      discount: 0,
      total: sc8Total
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 9: Fresh Produce — Proforma Invoice
  // Tests: billType PROFORMAINV, quotationStatus, convertedFrom flow
  // ──────────────────────────────────────────────────────────────────────
  let sc9Sub = 100 * 850;
  let sc9Cgst = sc9Sub * 0.025;
  let sc9Sgst = sc9Sub * 0.025;
  let sc9Total = sc9Sub + sc9Cgst + sc9Sgst;

  documents.push({
    ...getBaseInvoice(i, 'PI-SC9', vendorIds.freshProduce),
    billType: 'PROFORMAINV',
    business: vendorIds.freshProduce,
    clientProfile: clientIds.localCafe,
    status: 'UNPAID',
    invoiceTitle: 'Proforma — Bulk Order Estimate',
    igst: false, // intra-state: MAHARASHTRA → MAHARASHTRA
    tags: ['Proforma', 'Bulk-Order'],
    billedBy: {
      name: 'Fresh Produce Co.',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27AAAAA0000A1Z5',
      city: 'Pune'
    },
    billedTo: {
      name: 'Local Cafe',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27BBBBB1111B1Z6',
      city: 'Mumbai',
      email: 'manager@localcafe.com'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Arabica Coffee Beans (1kg)',
        description: 'Arabica Coffee Beans — Chikmagalur Estate (1kg)',
        hsn: '0901',
        gstRate: 5,
        quantity: 100,
        rate: 850,
        subTotal: sc9Sub,
        amount: sc9Sub,
        cgst: sc9Cgst,
        sgst: sc9Sgst,
        total: sc9Total
      }
    ],
    totals: {
      subTotal: sc9Sub,
      amount: sc9Sub,
      igst: 0,
      cgst: sc9Cgst,
      sgst: sc9Sgst,
      discount: 0,
      total: sc9Total
    },
    terms: [
      {
        label: 'Terms and Conditions',
        terms: [
          'Prices valid for 15 days from invoice date.',
          'Delivery within 7 working days of confirmation.',
          'Payment due before dispatch.'
        ]
      }
    ]
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 10: Desert Supply — Expenditure / Purchase Bill
  // Tests: isExpenditure true, owner = clientProfile, expense workflow
  // ──────────────────────────────────────────────────────────────────────
  let sc10Amount = 8000 + (500 * i);
  let sc10Tax = sc10Amount * 0.15;
  let sc10Total = sc10Amount + sc10Tax;

  documents.push({
    ...getBaseInvoice(i, 'EXP-SC10', clientIds.gammaStartups),
    isExpenditure: true,
    billType: 'INVOICE',
    expenseNumber: `EXP-${100 + i}`,
    business: vendorIds.desertSupply,
    clientProfile: clientIds.gammaStartups,
    owner: clientIds.gammaStartups,
    author: clientIds.gammaStartups,
    status: 'PAID',
    invoiceTitle: 'Office Supplies Purchase',
    igst: true, // non-Indian
    tags: ['Expenditure', 'Office-Supplies', 'KSA'],
    currency: 'SAR',
    conversionRates: { SAR: 1 },
    billedBy: {
      name: 'Desert Supply LLC',
      country: 'SA',
      vatNumber: `300${i}12345600003`,
      street: 'King Fahd Road',
      city: 'Riyadh'
    },
    billedTo: {
      name: 'Gamma Startups',
      country: 'SA',
      vatNumber: `300${i}98765400003`,
      street: 'Olaya Street',
      city: 'Riyadh'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Ergonomic Office Chairs',
        description: 'Ergonomic Office Chairs (Batch)',
        gstRate: 15,
        quantity: 5 + i,
        rate: 1600,
        subTotal: (5 + i) * 1600,
        amount: (5 + i) * 1600,
        igst: (5 + i) * 1600 * 0.15,
        total: (5 + i) * 1600 * 1.15
      }
    ],
    totals: {
      subTotal: sc10Amount,
      amount: sc10Amount,
      igst: sc10Tax,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc10Total
    },
    payments: [
      {
        _id: new ObjectId(),
        paymentDate: new Date(),
        paymentMethod: 'CASH',
        amount: sc10Total,
        notes: `Full payment — Office Supplies`,
        isRemoved: false,
        isApproved: false,
        business: clientIds.gammaStartups,
        user: users.admin,
        paymentAccount: new ObjectId(),
        attachments: [],
        tags: []
      }
    ]
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 11: Quotation — Stalled Proposal (WAITING)
  // Satisfies: KS1 (Stalled Proposals), CS1 (Open Quotation Pipeline)
  // ──────────────────────────────────────────────────────────────────────
  let sc11Sub = 75000 + (5000 * i);
  let sc11Tax = sc11Sub * 0.18;
  let sc11Total = sc11Sub + sc11Tax;

  documents.push({
    ...getBaseInvoice(i, 'QT-SC11', vendorIds.techPvtLtd),
    billType: 'QUOTATION',
    quotationStatus: 'OPEN',
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'DRAFT',
    invoiceAccepted: 'WAITING',
    isSourceConverted: false,
    invoiceTitle: 'Website Redesign Proposal',
    igst: true,
    tags: ['Quotation', 'Proposal'],
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27ZYXWV9876Q1Z9',
      city: 'Mumbai',
      email: 'finance@alphacorp.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Website Redesign & Development',
        description: 'Complete website redesign with CMS integration',
        hsn: '998314',
        gstRate: 18,
        quantity: 1,
        rate: sc11Sub,
        subTotal: sc11Sub,
        amount: sc11Sub,
        igst: sc11Tax,
        total: sc11Total
      }
    ],
    totals: {
      subTotal: sc11Sub,
      amount: sc11Sub,
      igst: sc11Tax,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc11Total
    },
    balance: { due: sc11Total, paid: 0 }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 12: Proforma Invoice — Paid but never converted to Invoice
  // Satisfies: KS2 (Advances Collected But Never Invoiced),
  //            CS3 (Advances Received Without Final Invoice)
  // ──────────────────────────────────────────────────────────────────────
  let sc12Sub = 45000 + (3000 * i);
  let sc12Tax = sc12Sub * 0.18;
  let sc12Total = sc12Sub + sc12Tax;

  documents.push({
    ...getBaseInvoice(i, 'PI-SC12', vendorIds.techPvtLtd),
    billType: 'PROFORMAINV',
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'PAID',
    isSourceConverted: false,
    invoiceTitle: 'Advance — Annual Maintenance Contract',
    igst: true,
    tags: ['Proforma', 'Advance', 'Paid'],
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27ZYXWV9876Q1Z9',
      city: 'Mumbai',
      email: 'finance@alphacorp.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Annual Maintenance Contract — Advance',
        description: 'Advance payment for 12-month AMC coverage',
        hsn: '9983',
        gstRate: 18,
        quantity: 1,
        rate: sc12Sub,
        subTotal: sc12Sub,
        amount: sc12Sub,
        igst: sc12Tax,
        total: sc12Total
      }
    ],
    totals: {
      subTotal: sc12Sub,
      amount: sc12Sub,
      igst: sc12Tax,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc12Total
    },
    balance: { due: 0, paid: sc12Total },
    payments: [
      {
        _id: new ObjectId(),
        paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        paymentMethod: 'NEFT',
        amount: sc12Total,
        notes: 'Advance payment for AMC',
        isRemoved: false,
        isApproved: false,
        business: vendorIds.techPvtLtd,
        user: users.admin,
        paymentAccount: new ObjectId(),
        attachments: [],
        tags: []
      }
    ]
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 13: Purchase Order — Awaiting acceptance
  // Satisfies: TD1 (Open Purchase Orders)
  // ──────────────────────────────────────────────────────────────────────
  let sc13Sub = 120000 + (10000 * i);
  let sc13Tax = sc13Sub * 0.025;
  let sc13Total = sc13Sub + sc13Tax * 2; // CGST + SGST

  documents.push({
    ...getBaseInvoice(i, 'PO-SC13', vendorIds.freshProduce),
    billType: 'PURCHASEORDER',
    business: vendorIds.freshProduce,
    clientProfile: clientIds.localCafe,
    status: 'DRAFT',
    invoiceAccepted: 'WAITING',
    isSourceConverted: false,
    invoiceTitle: 'Quarterly Supply Order — Q2 2026',
    igst: false,
    tags: ['Purchase-Order', 'Quarterly', 'Supply'],
    billedBy: {
      name: 'Fresh Produce Co.',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27AAAAA0000A1Z5',
      city: 'Pune'
    },
    billedTo: {
      name: 'Local Cafe',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27BBBBB1111B1Z6',
      city: 'Mumbai',
      email: 'manager@localcafe.com'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Assorted Fresh Produce — Quarterly Bulk',
        description: 'Quarterly bulk order for fresh fruits, vegetables, and herbs',
        hsn: '0901',
        gstRate: 5,
        quantity: 1,
        rate: sc13Sub,
        subTotal: sc13Sub,
        amount: sc13Sub,
        cgst: sc13Tax,
        sgst: sc13Tax,
        total: sc13Total
      }
    ],
    totals: {
      subTotal: sc13Sub,
      amount: sc13Sub,
      igst: 0,
      cgst: sc13Tax,
      sgst: sc13Tax,
      discount: 0,
      total: sc13Total
    },
    balance: { due: sc13Total, paid: 0 }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 14: Invoice — E-Invoice NOT_GENERATED (pending IRN)
  // Satisfies: TD3 (E-Invoices Without IRN)
  // ──────────────────────────────────────────────────────────────────────
  let sc14Sub = 85000 + (2000 * i);
  let sc14Tax = sc14Sub * 0.18;
  let sc14Total = sc14Sub + sc14Tax;

  documents.push({
    ...getBaseInvoice(i, 'INV-SC14', vendorIds.techPvtLtd),
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'UNPAID',
    einvoiceGeneratedStatus: 'NOT_GENERATED',
    invoiceTitle: 'Cloud Migration Services',
    igst: true,
    tags: ['E-Invoice-Pending', 'Services'],
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27ZYXWV9876Q1Z9',
      city: 'Mumbai',
      email: 'finance@alphacorp.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Cloud Infrastructure Migration',
        description: 'Complete AWS to GCP migration with zero-downtime',
        hsn: '998314',
        gstRate: 18,
        quantity: 1,
        rate: sc14Sub,
        subTotal: sc14Sub,
        amount: sc14Sub,
        igst: sc14Tax,
        total: sc14Total
      }
    ],
    totals: {
      subTotal: sc14Sub,
      amount: sc14Sub,
      igst: sc14Tax,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc14Total
    },
    balance: { due: sc14Total, paid: 0 }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 15: Invoice — IRN generated but EWB missing
  // Satisfies: TD4 (IRN Generated But EWB Missing)
  // irn object has Irn, AckNo, AckDt but NO EwbNo
  // ──────────────────────────────────────────────────────────────────────
  let sc15Sub = 95000 + (3000 * i);
  let sc15Tax = sc15Sub * 0.18;
  let sc15Total = sc15Sub + sc15Tax;

  documents.push({
    ...getBaseInvoice(i, 'INV-SC15', vendorIds.techPvtLtd),
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.betaRetail,
    status: 'UNPAID',
    einvoiceGeneratedStatus: 'GENERATED',
    invoiceTitle: 'Data Analytics Platform Setup',
    igst: true,
    tags: ['E-Invoice', 'No-EWB'],
    irn: {
      Irn: `irn_hash_sc15_${i}_abcdef1234567890`,
      AckNo: `1234567890${i}`,
      AckDt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      Status: 'ACT'
      // Deliberately NO EwbNo — satisfies TD4 filter
    },
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Beta Retailers',
      country: 'IN',
      state: 'DELHI',
      city: 'New Delhi',
      email: 'accounts@betaretail.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Analytics Platform Implementation',
        description: 'End-to-end data analytics platform with dashboards',
        hsn: '998314',
        gstRate: 18,
        quantity: 1,
        rate: sc15Sub,
        subTotal: sc15Sub,
        amount: sc15Sub,
        igst: sc15Tax,
        total: sc15Total
      }
    ],
    totals: {
      subTotal: sc15Sub,
      amount: sc15Sub,
      igst: sc15Tax,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc15Total
    },
    balance: { due: sc15Total, paid: 0 }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 16: Invoice — Partially Paid (INR)
  // Satisfies: DS2 (Partial Payment Recovery)
  // ──────────────────────────────────────────────────────────────────────
  let sc16Sub = 60000 + (2000 * i);
  let sc16Cgst = sc16Sub * 0.06;
  let sc16Sgst = sc16Sub * 0.06;
  let sc16Total = sc16Sub + sc16Cgst + sc16Sgst;
  let sc16Paid = Math.round(sc16Total * 0.4);

  documents.push({
    ...getBaseInvoice(i, 'INV-SC16', vendorIds.freshProduce),
    business: vendorIds.freshProduce,
    clientProfile: clientIds.localCafe,
    status: 'PARTIALLY_PAID',
    invoiceTitle: 'Premium Ingredients Supply — March',
    igst: false,
    tags: ['Partial-Payment', 'Supply'],
    billedBy: {
      name: 'Fresh Produce Co.',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27AAAAA0000A1Z5',
      city: 'Pune'
    },
    billedTo: {
      name: 'Local Cafe',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27BBBBB1111B1Z6',
      city: 'Mumbai',
      email: 'manager@localcafe.com'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Premium Organic Ingredients Bundle',
        description: 'Monthly supply of organic coffee, spices, and dairy',
        hsn: '0901',
        gstRate: 12,
        quantity: 1,
        rate: sc16Sub,
        subTotal: sc16Sub,
        amount: sc16Sub,
        cgst: sc16Cgst,
        sgst: sc16Sgst,
        total: sc16Total
      }
    ],
    totals: {
      subTotal: sc16Sub,
      amount: sc16Sub,
      igst: 0,
      cgst: sc16Cgst,
      sgst: sc16Sgst,
      discount: 0,
      total: sc16Total
    },
    balance: { due: sc16Total - sc16Paid, paid: sc16Paid },
    payments: [
      {
        _id: new ObjectId(),
        paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        paymentMethod: 'UPI',
        amount: sc16Paid,
        notes: 'Partial payment — 40% advance',
        isRemoved: false,
        isApproved: false,
        business: vendorIds.freshProduce,
        user: users.admin,
        paymentAccount: new ObjectId(),
        attachments: [],
        tags: []
      }
    ]
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 17: Invoice — High value UNPAID (Large B2B Receivable)
  // Satisfies: MF2 (Large B2B ≥200k), CS2 (Large Outstanding ≥50k)
  // ──────────────────────────────────────────────────────────────────────
  let sc17Sub = 250000 + (25000 * i);
  let sc17Tax = sc17Sub * 0.18;
  let sc17Total = sc17Sub + sc17Tax;

  documents.push({
    ...getBaseInvoice(i, 'INV-SC17', vendorIds.techPvtLtd),
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'UNPAID',
    invoiceTitle: 'Enterprise Software Licensing — Q1',
    igst: true,
    tags: ['Large-Value', 'Enterprise', 'B2B'],
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27ZYXWV9876Q1Z9',
      city: 'Mumbai',
      email: 'finance@alphacorp.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Enterprise ERP License (50 users)',
        description: 'Annual enterprise ERP license with support',
        hsn: '998311',
        gstRate: 18,
        quantity: 1,
        rate: sc17Sub,
        subTotal: sc17Sub,
        amount: sc17Sub,
        igst: sc17Tax,
        total: sc17Total
      }
    ],
    totals: {
      subTotal: sc17Sub,
      amount: sc17Sub,
      igst: sc17Tax,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc17Total
    },
    balance: { due: sc17Total, paid: 0 }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 18: Sales Order — Not yet converted
  // Satisfies: MFSO (Open Sales Orders)
  // ──────────────────────────────────────────────────────────────────────
  let sc18Sub = 180000 + (15000 * i);
  let sc18Tax = sc18Sub * 0.18;
  let sc18Total = sc18Sub + sc18Tax;

  documents.push({
    ...getBaseInvoice(i, 'SO-SC18', vendorIds.techPvtLtd),
    billType: 'SALESORDER',
    business: vendorIds.techPvtLtd,
    clientProfile: clientIds.alphaCorp,
    status: 'DRAFT',
    invoiceAccepted: 'WAITING',
    isSourceConverted: false,
    linkedInvoices: [],
    invoiceTitle: 'Custom CRM Development — Sales Order',
    igst: true,
    tags: ['Sales-Order', 'CRM', 'Pending'],
    billedBy: {
      name: 'Tech Solutions Pvt Ltd',
      country: 'IN',
      state: 'KARNATAKA',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore'
    },
    billedTo: {
      name: 'Alpha Corp',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27ZYXWV9876Q1Z9',
      city: 'Mumbai',
      email: 'finance@alphacorp.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Custom CRM Development & Integration',
        description: 'Full-cycle CRM development with 3rd-party integrations',
        hsn: '998314',
        gstRate: 18,
        quantity: 1,
        rate: sc18Sub,
        subTotal: sc18Sub,
        amount: sc18Sub,
        igst: sc18Tax,
        total: sc18Total
      }
    ],
    totals: {
      subTotal: sc18Sub,
      amount: sc18Sub,
      igst: sc18Tax,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc18Total
    },
    balance: { due: sc18Total, paid: 0 }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 19: Invoice — International (USD), UNPAID, due in ~5 days
  // Satisfies: SP1 (International Revenue), SP2 (Invoices Nearing Due),
  //            MF1 (Export Invoice Pipeline)
  // ──────────────────────────────────────────────────────────────────────
  let sc19Sub = 3500 + (500 * i);
  let sc19Conv = 83.5;

  documents.push({
    ...getBaseInvoice(i, 'INV-SC19', vendorIds.saasPlatform),
    business: vendorIds.saasPlatform,
    clientProfile: clientIds.betaRetail,
    status: 'UNPAID',
    invoiceTitle: 'API Integration Services',
    currency: 'USD',
    conversionRates: { INR: sc19Conv },
    totalConversions: {
      total: sc19Sub * sc19Conv,
      subTotal: sc19Sub * sc19Conv
    },
    igst: true,
    tags: ['International', 'USD', 'Due-Soon'],
    // Set invoiceDate to start of current month (for this_month/this_quarter date filters)
    invoiceDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1 + i),
    // Set dueDate to ~5 days from now (within next_7_days window)
    dueDate: new Date(Date.now() + (3 + i) * 24 * 60 * 60 * 1000),
    billedBy: {
      name: 'SaaS Platform Inc.',
      country: 'US',
      state: 'CA',
      city: 'San Francisco'
    },
    billedTo: {
      name: 'Beta Retailers',
      country: 'IN',
      state: 'DELHI',
      city: 'New Delhi',
      email: 'accounts@betaretail.in'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'API Gateway Integration',
        description: 'Custom API gateway setup and integration services',
        hsn: '998314',
        gstRate: 0,
        quantity: 1,
        rate: sc19Sub,
        subTotal: sc19Sub,
        amount: sc19Sub,
        total: sc19Sub
      }
    ],
    totals: {
      subTotal: sc19Sub,
      amount: sc19Sub,
      igst: 0,
      cgst: 0,
      sgst: 0,
      discount: 0,
      total: sc19Sub
    },
    balance: { due: sc19Sub, paid: 0 }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Scenario 20: Credit Note — Current month (guaranteed)
  // Satisfies: DS1 (Returns & Refunds This Month)
  // ──────────────────────────────────────────────────────────────────────
  let sc20Sub = 5000 + (1000 * i);
  let sc20Cgst = sc20Sub * 0.025;
  let sc20Sgst = sc20Sub * 0.025;
  let sc20Total = sc20Sub + sc20Cgst + sc20Sgst;

  documents.push({
    ...getBaseInvoice(i, 'CN-SC20', vendorIds.freshProduce),
    billType: 'CREDITNOTE',
    business: vendorIds.freshProduce,
    clientProfile: clientIds.localCafe,
    status: 'PAID',
    creditNoteStatus: 'ADJUSTED',
    invoiceTitle: 'Credit Note — Damaged Goods Return',
    igst: false,
    tags: ['Credit-Note', 'Return', 'Current-Month'],
    // Explicitly set to current month for DS1 report reliability
    invoiceDate: new Date(new Date().getFullYear(), new Date().getMonth(), 2 + i),
    billedBy: {
      name: 'Fresh Produce Co.',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27AAAAA0000A1Z5',
      city: 'Pune'
    },
    billedTo: {
      name: 'Local Cafe',
      country: 'IN',
      state: 'MAHARASHTRA',
      gstin: '27BBBBB1111B1Z6',
      city: 'Mumbai',
      email: 'manager@localcafe.com'
    },
    items: [
      {
        _id: new ObjectId(),
        name: 'Damaged Produce — Return Credit',
        description: 'Credit for damaged items in last shipment',
        hsn: '0901',
        gstRate: 5,
        quantity: 1,
        rate: sc20Sub,
        subTotal: sc20Sub,
        amount: sc20Sub,
        cgst: sc20Cgst,
        sgst: sc20Sgst,
        total: sc20Total
      }
    ],
    totals: {
      subTotal: sc20Sub,
      amount: sc20Sub,
      igst: 0,
      cgst: sc20Cgst,
      sgst: sc20Sgst,
      discount: 0,
      total: sc20Total
    },
    balance: { due: 0, paid: sc20Total },
    linkedDocuments: [new ObjectId()],
    documentReason: 'Damaged goods received — partial lot return'
  });
}

// Any missing totals auto-calc block removed since we rigidly define totals inside each scenario
// based on exactly the new schema definitions.

async function runSeed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected correctly to MongoDB Atlas');
    
    const db = client.db('invoices'); 
    const col = db.collection('invoices');
    const normalizedDocuments = documents.map((doc) => normalizeInvoiceDocument(doc));
    
    console.log(`Clearing existing documents (if any) to ensure fresh seed...`);
    await col.deleteMany({ '_systemMeta.source': 'seed-script' });
    await col.createIndex(
      { isRemoved: 1, isHardRemoved: 1, tags: 1 },
      { name: 'invoice_tag_search_idx' }
    );

    console.log(`Inserting ${normalizedDocuments.length} sample invoices into the "invoices" collection with canonical production-parity shape...`);
    const result = await col.insertMany(normalizedDocuments);
    console.log(`${result.insertedCount} documents were successfully inserted.`);
  } catch (err) {
    console.error('Error seeding data:', err.stack);
  } finally {
    await client.close();
  }
}

runSeed();
