import { Produtos } from './produtos';

export interface OrcamentoPayload {
  messageId?: string;
  nome?: string;
  numeroTelefone?: string;
  produtos?: Produtos[];
  closed?: boolean;
  status?: string;
}