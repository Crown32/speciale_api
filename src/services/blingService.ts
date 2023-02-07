import config from '../configs/config';
import { OrcamentoPayload } from '../models/orcamentoPayload';
import { Produtos } from '../models/produtos';
import axios from 'axios';

export class BlingService{
  constructor() {}

    //TODO: Criar xml de orcamento
  // buildXml(orcamento: OrcamentoPayload) {
  //   const xml = `
  //   <?xml version="1.0" encoding="UTF-8"?>
  //   <pedido>
  //     <cliente>
  //       <nome>${orcamento.cliente.nome}</nome>
  //       <tipoPessoa>J</tipoPessoa>
  //       <endereco>${orcamento.cliente.endereco}</endereco>
  //       <numero>${orcamento.cliente.numero}</numero>
  //       <complemento>${orcamento.cliente.complemento}</complemento>
  //       <bairro>${orcamento.cliente.bairro}</bairro>
  //       <cep>${orcamento.cliente.cep}</cep>
  //       <cidade>${orcamento.cliente.cidade}</cidade>
  //       <uf>${orcamento.cliente.uf}</uf>
  //       <fone>${orcamento.cliente.fone}</fone>
  //       <email>${orcamento.cliente.email}</email>
  //     </cliente>
  //     <transporte>
  //       <transportadora>${orcamento.transportadora}</transportadora>
  //       <tipo_frete>R</tipo_frete>
  //       <servico_correios>${orcamento.servico_correios}</servico_correios>
  //       <dados_etiqueta>
  //         <nome>${orcamento.cliente.nome}</nome>
  //         <endereco>${orcamento.cliente.endereco}</endereco>
  //         <numero>${orcamento.cliente.numero}</numero>
  //         <complemento>${orcamento.cliente.complemento}</complemento>
  //         <municipio>${orcamento.cliente.cidade}</municipio>
  //         <uf>${orcamento.cliente.uf}</uf>
  //         <cep>${orcamento.cliente.cep}</cep>
  //         <bairro>${orcamento.cliente.bairro}</bairro>
  //       </dados_etiqueta>
  //       <volumes>
  //         <volume>
  //           <servico>${orcamento.servico_correios}</servico>
  //           <codigoRastreamento>${orcamento.codigoRastreamento}</codigoRastreamento>
  //         </volume>
  //       </volumes>
  //     </transporte>
  //     <itens>
  //       ${orcamento.itens.map((item) => {
  //         return `
  //         <item>
  //           <codigo>${item.codigo}</codigo>
  //           <descricao>${item.descricao}</descricao>
  //           <un>PÇ</un>
  //           <qtde>${item.qtde}</qtde>
  //           <vlr_unit>${item.vlr_unit}</vlr_unit>
  //         </item>
  //         `;
  //       })}
  //     </itens>
  //     <parcelas>
  //       <parcela>
  //         <data>${orcamento.data}</data>
  //         <vlr>${orcamento.valorTotal}</vlr>
  //         <obs>1/1</obs>
  //       </parcela>
  //     </parcelas>
  //   </pedido>
  //   `;
  //   return xml;
  // }

  //TODO: Criar método para salvar orçamento no Bling
  // async saveOrcamento(orcamento: OrcamentoPayload) {
  //   const bling = config.blingConnection();
  //   const xml = this.buildXml(orcamento);
  //   const response = await bling.post('/pedido/json', {
  //     params: {
  //       apikey: process.env.BLING_API_KEY,
  //       xml: xml,
  //     },
  //   });
  //   return response.data;
  // }

  async getProdutosByCodigo(produtos : Produtos[]){
    const bling = config.blingConnection();

    const data = await bling.products().all();

    const produtosSelecionados:Produtos[] = []

    data.forEach((produto: any) => {
      produtos.forEach((produtoSelecionado) => {
        if(produtoSelecionado.codigo === produto.codigo){
          produtosSelecionados.push(produto);
        }
      });
    });
    
    return produtosSelecionados;
  }

  async getProdutos(){
    const bling = config.blingConnection();

    const produtos = await bling.products().all();
    
    return produtos;
  }
}