import config from '../configs/config';
import { OrcamentoPayload } from '../models/orcamentoPayload';
import { Produtos } from '../models/produtos';
import axios from 'axios';

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
}