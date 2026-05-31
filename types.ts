export enum QuoteStatus {
  DRAFT = 'Rascunho',
  SENT = 'Enviado',
  APPROVED = 'Aprovado',
}

export type PricingType = 'm2' | 'fixed';

export interface QuoteItem {
  id: string;
  type?: PricingType;
  category: string;
  description: string;
  
  // m2 specific
  length?: number;
  widthOrHeight?: number;
  area?: number;
  unitPrice?: number;
  
  // fixed specific
  details?: string;
  fixedTerm?: string;
  
  // common
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
  numeroSequencial?: string;
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
  professionalLogoUrl?: string;
  status: QuoteStatus;
  totalAmount: number;
}
