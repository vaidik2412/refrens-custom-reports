const { ObjectId } = require('mongodb');

const SHARE_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DEFAULT_REMINDERS = {
  recipients: [],
  cc: [],
  tcc: [],
  from: { name: '', identity: null },
  sendWith: null,
  templateId: null,
  to: {},
  refrensProgram: false,
  replyTo: { phone: '', emails: [] },
  selfEmail: false,
  emails: [],
  emailReminder: false,
  whatsappReminder: false,
  dunningEnabled: false,
  dunning: [],
  sent: false,
  attachClientStatement: false,
  statementPeriod: null,
  statementStartDate: null,
  statementEndDate: null,
};
const DEFAULT_VENDOR_REMINDER = {
  recipients: [],
  cc: [],
  from: { name: '', identity: null },
  to: {},
  refrensProgram: false,
  replyTo: { phone: '', emails: [] },
  sendWith: null,
  templateId: null,
  selfEmail: false,
  emails: [],
  sent: false,
  attachClientStatement: false,
  statementPeriod: null,
  statementStartDate: null,
  statementEndDate: null,
};
const DEFAULT_PAYMENT_OPTIONS = {
  accountTransfer: false,
  smartTransfer: false,
  creditCards: false,
  debitCards: false,
  netBanking: false,
  upi: false,
  pgUPI: false,
  smartUPI: false,
  wallets: false,
  foreignCards: false,
  tazapayDirect: false,
  tazapayCards: false,
  vendorAccountTransfer: false,
  meta: {
    allowPartialPayment: false,
    allowCardPayment: false,
    allowTDS: true,
    createInvoiceOnPayment: false,
  },
};
const DEFAULT_TOP_LEVEL_ARRAYS = {
  payments: [],
  creditClaims: [],
  tags: [],
  rejectedByBusinesses: [],
  acceptedByBusinesses: [],
  acceptedByBusinessesData: [],
  documentAcceptanceRecord: [],
  customHeaders: [],
  additionalCharges: [],
  extraTotalFields: [],
  linkedDocuments: [],
  linkedInvoices: [],
  linkedProformaInvoices: [],
  linkedPurchaseOrders: [],
  linkedSalesOrders: [],
  complianceDocuments: [],
  activities: [],
  leadCollaborators: [],
  attachments: [],
  customFooters: [],
  resyncHistory: [],
  cesses: [],
  terms: [],
};
const DEFAULT_ITEM = {
  group: false,
  hidden: false,
  images: [],
  originalImages: [],
  totalRoundOff: 0,
  amountRoundOff: 0,
  discount: {
    discountType: 'PERCENTAGE',
    amount: 0,
  },
  custom: {},
  isStockManaged: false,
  trackingMethod: 'NONE',
  allocations: [],
  itc: 'INELIGIBLE_OTHERS',
  showSku: false,
};

function randomString(length) {
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += SHARE_ID_ALPHABET[Math.floor(Math.random() * SHARE_ID_ALPHABET.length)];
  }
  return result;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toObjectId(value) {
  if (!value) return value;
  return value instanceof ObjectId ? value : new ObjectId(String(value));
}

function normalizeEinvoiceStatus(value) {
  if (!value) return 'NOT_GENERATED';
  if (value === 'NOT GENERATED') return 'NOT_GENERATED';
  return value;
}

function normalizeIrn(irn) {
  if (!irn || typeof irn !== 'object' || Array.isArray(irn)) return irn;

  const { irn: legacyIrn, ackNo, ackDt, qrCode, status, ...rest } = irn;
  return {
    ...rest,
    ...(legacyIrn ? { Irn: legacyIrn } : {}),
    ...(ackNo ? { AckNo: ackNo } : {}),
    ...(ackDt ? { AckDt: ackDt } : {}),
    ...(qrCode ? { qr: qrCode } : {}),
    ...(status ? { Status: status } : {}),
  };
}

function normalizeInvoiceItem(item) {
  return {
    ...DEFAULT_ITEM,
    ...item,
    discount: {
      ...DEFAULT_ITEM.discount,
      ...(item.discount || {}),
    },
    custom: item.custom || {},
    images: Array.isArray(item.images) ? item.images : [],
    originalImages: Array.isArray(item.originalImages) ? item.originalImages : [],
    allocations: Array.isArray(item.allocations) ? item.allocations : [],
  };
}

function computeTotals(doc) {
  const existing = doc.totals || {};
  const items = Array.isArray(doc.items) ? doc.items : [];

  const computed = items.reduce(
    (acc, item) => {
      acc.subTotal += Number(item.subTotal || 0);
      acc.amount += Number(item.amount || item.subTotal || 0);
      acc.igst += Number(item.igst || 0);
      acc.cgst += Number(item.cgst || 0);
      acc.sgst += Number(item.sgst || 0);
      acc.total += Number(item.total || item.amount || item.subTotal || 0);
      return acc;
    },
    {
      subTotal: 0,
      amount: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
    },
  );

  return {
    subTotal: roundCurrency(Number(existing.subTotal ?? computed.subTotal)),
    amount: roundCurrency(Number(existing.amount ?? computed.amount)),
    igst: roundCurrency(Number(existing.igst ?? computed.igst)),
    cgst: roundCurrency(Number(existing.cgst ?? computed.cgst)),
    sgst: roundCurrency(Number(existing.sgst ?? computed.sgst)),
    total: roundCurrency(Number(existing.total ?? computed.total)),
    discount: roundCurrency(Number(existing.discount ?? 0)),
    totalRoundOff: roundCurrency(Number(existing.totalRoundOff ?? 0)),
    amountRoundOff: roundCurrency(Number(existing.amountRoundOff ?? 0)),
    cessTotal: existing.cessTotal || {},
  };
}

function computeBalance(doc, totals) {
  const existing = doc.balance || {};
  const payments = Array.isArray(doc.payments) ? doc.payments : [];
  const paidFromPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const paid = roundCurrency(
    Number(existing.paid ?? existing.received ?? doc.amountPaid ?? paidFromPayments ?? 0),
  );
  const tds = roundCurrency(Number(existing.tds ?? 0));
  const transactionCharge = roundCurrency(Number(existing.transactionCharge ?? 0));
  const due = roundCurrency(
    Number(existing.due ?? totals.total - paid - tds - transactionCharge),
  );

  return {
    paid,
    tds,
    transactionCharge,
    due: Math.max(0, due),
  };
}

function buildTotalConversions(currency, totals, balance, conversionRates) {
  const normalized = {};
  const baseCurrency = currency || 'INR';
  const baseAmounts = {
    total: roundCurrency(totals.total),
    paid: roundCurrency(balance.paid),
    tds: roundCurrency(balance.tds),
    transactionCharge: roundCurrency(balance.transactionCharge),
    due: roundCurrency(balance.due),
  };

  normalized[baseCurrency] = baseAmounts;

  if (conversionRates && typeof conversionRates === 'object') {
    for (const [targetCurrency, rawRate] of Object.entries(conversionRates)) {
      const rate = Number(rawRate);
      if (!Number.isFinite(rate) || rate <= 0 || targetCurrency === baseCurrency) continue;
      normalized[targetCurrency] = {
        total: roundCurrency(baseAmounts.total * rate),
        paid: roundCurrency(baseAmounts.paid * rate),
        tds: roundCurrency(baseAmounts.tds * rate),
        transactionCharge: roundCurrency(baseAmounts.transactionCharge * rate),
        due: roundCurrency(baseAmounts.due * rate),
      };
    }
  }

  return normalized;
}

function normalizeInvoiceDocument(doc) {
  const items = Array.isArray(doc.items) ? doc.items.map(normalizeInvoiceItem) : [];
  const totals = computeTotals({ ...doc, items });
  const balance = computeBalance(doc, totals);
  const business = toObjectId(doc.business);
  const clientProfile = toObjectId(doc.clientProfile);
  const owner = toObjectId(doc.owner || (doc.isExpenditure ? clientProfile : business));
  const author = toObjectId(doc.author || owner);
  const normalized = {
    ...DEFAULT_TOP_LEVEL_ARRAYS,
    ...doc,
    business,
    client: toObjectId(doc.client || clientProfile || null),
    vendor: toObjectId(doc.vendor || (doc.isExpenditure ? business : null)),
    clientProfile,
    creator: toObjectId(doc.creator),
    owner,
    author,
    shareId: doc.shareId || randomString(18),
    locale: doc.locale || 'en-IN',
    reminders: { ...DEFAULT_REMINDERS, ...(doc.reminders || {}) },
    vendorReminder: { ...DEFAULT_VENDOR_REMINDER, ...(doc.vendorReminder || {}) },
    paymentOptions: {
      ...DEFAULT_PAYMENT_OPTIONS,
      ...(doc.paymentOptions || {}),
      meta: {
        ...DEFAULT_PAYMENT_OPTIONS.meta,
        ...((doc.paymentOptions && doc.paymentOptions.meta) || {}),
      },
    },
    recurringInvoice: {
      frequency: 'None',
      status: 'DRAFT',
      endDate: null,
      ...(doc.recurringInvoice || {}),
    },
    items,
    totals,
    balance,
    totalConversions: buildTotalConversions(
      doc.currency || 'INR',
      totals,
      balance,
      doc.conversionRates,
    ),
    amountPaid: balance.paid,
    grandTotal: doc.grandTotal ?? totals.total,
    invoiceType: doc.invoiceType || doc.billType,
    einvoiceGeneratedStatus: normalizeEinvoiceStatus(doc.einvoiceGeneratedStatus),
    irn: normalizeIrn(doc.irn),
    columns: Array.isArray(doc.columns) ? doc.columns : [],
    customLabels: doc.customLabels || {},
    contact: doc.contact || {},
    // Boolean defaults that Mongoose would auto-set
    status: doc.status || 'UNPAID',
    isExpenditure: doc.isExpenditure ?? false,
    isSharedDocument: doc.isSharedDocument ?? false,
    isSourceConverted: doc.isSourceConverted ?? false,
    invoiceAccepted: doc.invoiceAccepted || 'WAITING',
    taxType: doc.taxType || 'INDIA',
    source: doc.source || 'DASHBOARD',
    reverseCharge: doc.reverseCharge ?? false,
    utgst: doc.utgst ?? false,
    partialConvert: doc.partialConvert ?? false,
    hasPgPayments: doc.hasPgPayments ?? false,
    batchDocument: doc.batchDocument ?? false,
    tdsReportCollected: doc.tdsReportCollected ?? false,
    isQuickExpenditure: doc.isQuickExpenditure ?? false,
    requestedInvoice: doc.requestedInvoice ?? false,
    isBulkExpenditure: doc.isBulkExpenditure ?? false,
    showInSuggestion: doc.showInSuggestion ?? false,
    isColumnsModified: doc.isColumnsModified ?? false,
    hideTaxes: doc.hideTaxes ?? false,
    hideTotals: doc.hideTotals ?? false,
    hideTotalInWords: doc.hideTotalInWords ?? false,
    showTotalsRow: doc.showTotalsRow ?? false,
    // Invoice-level discount default
    discount: {
      discountType: 'PERCENTAGE',
      ...(doc.discount || {}),
    },
    // Early pay discount default
    earlyPayDiscount: {
      enabled: false,
      applied: false,
      discountType: 'PERCENTAGE',
      ...(doc.earlyPayDiscount || {}),
    },
    invoiceId:
      doc.invoiceId ||
      (!doc.isExpenditure && ['PROFORMAINV', 'INVOICE'].includes(doc.billType) ? doc._id : undefined),
    expenditureId:
      doc.expenditureId || (doc.isExpenditure ? doc._id : undefined),
    _systemMeta: {
      ...(doc._systemMeta || {}),
      source: 'seed-script',
      contractVersion: '2026-03-production-parity-v1',
    },
  };

  if (!normalized.linkedPurchaseOrders.length && normalized.linkedPurchaseOrder) {
    normalized.linkedPurchaseOrders = [normalized.linkedPurchaseOrder];
  }

  return normalized;
}

module.exports = {
  normalizeInvoiceDocument,
  roundCurrency,
};
