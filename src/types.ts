/**
 * Types pour l'application CerfaBot
 */

export interface CerfaField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  category: 'identity' | 'address' | 'vehicle' | 'other';
  value: string;
  x?: number; // Position X en % sur le PDF
  y?: number; // Position Y en % sur le PDF
  width?: number; // Largeur en % sur le PDF
  page?: number; // Numéro de page
  isExtracted?: boolean; // Vrai si rempli par l'IA
}

export interface CerfaTemplate {
  id: string;
  name: string;
  cerfaNumber: string;
  description: string;
  category: string;
  fields: CerfaField[];
  previewUrl?: string;
  isCertified?: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  extractedFieldsCount?: number;
}

export interface ExtractionStatus {
  step: 'idle' | 'reading' | 'analyzing' | 'matching' | 'filling' | 'completed' | 'error';
  progress: number;
  message: string;
}
