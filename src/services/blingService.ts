import { Config } from '../configs/config';
import { OrcamentoPayload } from '../models/orcamentoPayload';
import { Produtos } from '../models/produtos';
import { ICommercialProposal } from 'bling-erp-api/lib/entities/commercialProposals';
import axios from 'axios';

export class BlingService{
  constructor(private config: Config) {}
  
  async getProdutosByCodigo(produtos: Produtos[]){

    if(!produtos) return [];

    const promisses = produtos.map(async (produto) => {    
      const url = `https://bling.com.br/Api/v2/produto/${produto.codigo}/json&?estoque=S&apikey=${process.env.BLING_API_KEY}`
      return axios.get(url);
    });
    
    const axiosResponse = await Promise.all(promisses).catch(err => {
      console.log(err);
      return [];
    });

    const produtosSelecionados = axiosResponse.map((response) => {
      return response.data.retorno.produtos[0].produto;
    });
    
    return produtosSelecionados;
  }

  async createPropostaComercial(orcamentoPayload: OrcamentoPayload) {
    const bling = this.config.blingConnection();

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
        nome: orcamentoPayload.nome,
        fone: orcamentoPayload.numeroTelefone
      },
      itens: produtos
    };

    const response = await bling.commercialProposals().create(data);

    return response;
  }

}
