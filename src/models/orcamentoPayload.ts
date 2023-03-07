import { Produtos } from './produtos';

export interface OrcamentoPayload {
  nome: string;
  numeroTelefone: string;
  produtos: Produtos[];
  status: string;
  created_at: Date;
  updated_at: Date;
  messageId?: string;
  closed?: boolean;
  propostaBlingId?: Number;
  propostaBlingNumber?: Number;
}