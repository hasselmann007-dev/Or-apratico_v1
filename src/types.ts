export enum QuoteStatus {
  DRAFT = 'Rascunho',
  SENT = 'Enviado',
  APPROVED = 'Aprovado',
}

export interface QuoteItem {
  id: string;
  category: string;
  description: string;
  length: number;
  widthOrHeight: number;
  area: number;
  unitPrice: number;
  total: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  startDate: string;
}

export interface Quote {
  id: string;
  date: string;
  customer: CustomerInfo;
  items: QuoteItem[];
  discount: number;
  adjustment: number;
  notes: string;
  executionTerm: string;
  paymentTerms: string;
  professionalName: string;
  professionalTaxId: string;
  professionalPhone: string;
  status: QuoteStatus;
  totalAmount: number;
}
