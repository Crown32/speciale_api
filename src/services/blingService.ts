import config from '../configs/config';
import { OrcamentoPayload } from '../models/orcamentoPayload';
import { Produtos } from '../models/produtos';
import axios from 'axios';
import { IOrder } from 'bling-erp-api/lib/entities/orders';
import { ICommercialProposal } from 'bling-erp-api/lib/entities/commercialProposals';

export class BlingService{
  constructor() {}
  
  async getProdutosByCodigo(produtos ?: Produtos[]){

    if(!produtos) return [];

    const bling = config.blingConnection();

    const promisses = produtos.map(async (produto) => {      
      const response = await bling.products().find(produto.codigo || '');
      return response;
    });
    
    const produtosSelecionados = await Promise.all(promisses);

    return produtosSelecionados;
  }

  async getProdutos(){
    const bling = config.blingConnection();

    const produtos = await bling.products().all();
    
    return produtos;
  }

  async createPedidoDeVenda(orcamentoPayload: OrcamentoPayload) {
    const bling = config.blingConnection();

    const blingProducts: any[] = await this.getProdutosByCodigo(orcamentoPayload.produtos);

    blingProducts.forEach(p => {
      if(orcamentoPayload.produtos){
        let produtoOrcamento = orcamentoPayload.produtos.find(x => x.codigo == p.codigo);
        p.quantidade = produtoOrcamento ? produtoOrcamento.quantidade : 1;
        p.preco = p.preco * p.quantidade;
      }            
    });

    const produtos = blingProducts.map(p => {
      return {
        item: {
          codigo: p.codigo,
          descricao: p.descricao,
          un: p.un,
          qtde: p.quantidade,
          vlr_unit: p.preco
        }
      }
    });

    const data: IOrder = {
      cliente: {
        nome: orcamentoPayload.nome ? orcamentoPayload.nome : 'Cliente sem nome',
        fone: orcamentoPayload.numeroTelefone
      },
      itens: produtos
    };

    const response = await bling.orders().create(data);

    return response;
  }

  async createPropostaComercial(orcamentoPayload: OrcamentoPayload) {
    const bling = config.blingConnection();

    const blingProducts: any[] = await this.getProdutosByCodigo(orcamentoPayload.produtos);

    blingProducts.forEach(p => {
      if(orcamentoPayload.produtos){
        let produtoOrcamento = orcamentoPayload.produtos.find(x => x.codigo == p.codigo);
        p.quantidade = produtoOrcamento ? produtoOrcamento.quantidade : 1;
        p.preco = p.preco * p.quantidade;
      }            
    });

    const produtos = blingProducts.map(p => {
      return {
        item: {
          codigo: p.codigo,
          descricao: p.descricao,
          un: p.un,
          qtde: p.quantidade,
          valorUnidade: p.preco
        }
      }
    });

    const data: ICommercialProposal = {
      cliente: {
        nome: orcamentoPayload.nome ? orcamentoPayload.nome : 'Cliente sem nome',
        fone: orcamentoPayload.numeroTelefone
      },
      itens: produtos
    };

    const response = await bling.commercialProposals().create(data);

    return response;
  }

}