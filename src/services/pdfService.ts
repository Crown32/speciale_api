import fs from 'fs';
import { BlingReturnProduct } from '../models/blingReturnProduct';
import { OrcamentoPayload } from '../models/orcamentoPayload';
const html_to_pdf = require('html-pdf-node');

export class PdfService {
  constructor() {}
  
  formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BRL',
  });

  async createPdf(blingProducts: BlingReturnProduct[], orcamentoPayload: OrcamentoPayload) {
    const hmtl = fs.readFileSync('./src/templates/template.html', 'utf8');

    const itens = blingProducts.map(produto => {
      return `<tr>
                <td style="word-break: break-all;">${produto.descricao}</td>
                <td class="left" style="white-space: nowrap;">${produto.codigo}</td>
                <td class="right">UN</td>
                <td class="right">${produto.quantidade}</td>
                <td class="right">${this.formatter.format(produto.preco).replace(/^(\D+)/, '$1 ').replace(/\s+/, ' ')}</td>
                <td class="right">0,0000</td>
                <td width="10%" class=" right">0,00</td>
                <td class="right">${this.formatter.format(produto.preco).replace(/^(\D+)/, '$1 ').replace(/\s+/, ' ')}</td>
                <td class="right">${this.formatter.format(Number(produto.preco) * Number(produto.quantidade)).replace(/^(\D+)/, '$1 ').replace(/\s+/, ' ')}</td>
              </tr>`
    }
    ).join('');

    const cliente = `${orcamentoPayload.nome} <br> 
    ${orcamentoPayload.numeroTelefone}`
    const numeroProposta = orcamentoPayload.propostaBlingNumber ? orcamentoPayload.propostaBlingNumber.toString() : '';
    const data = new Date().toLocaleDateString();
    const numeroItens = blingProducts.length;
    const quantidadeTotal = blingProducts.reduce((acc, produto) => acc + Number(produto.quantidade), 0);
    const valorTotal = this.formatter.format(blingProducts.reduce((acc, produto) => acc + (Number(produto.preco) * Number(produto.quantidade)), 0)).replace(/^(\D+)/, '$1 ').replace(/\s+/, ' ');

    const htmlFinal = hmtl.replace('{ITENS}', itens)
      .replace('{CLIENTE}', cliente)
      .replace('{NUMERO_PROPOSTA}', numeroProposta)
      .replace('{NUMERO_PROPOSTA_HEADING}', numeroProposta)
      .replace('{DATA}', data)
      .replace('{NUMERO_ITENS}', numeroItens.toString())
      .replace('{QUANTIDADE_TOTAL}', quantidadeTotal.toString())
      .replace('{PRECO_TOTAL}', valorTotal.toString())
      .replace('{TOTAL_PROPOSTA}', valorTotal.toString());


    const options = { format: 'A4' };
    const file = { content: htmlFinal };

    const pdf = await html_to_pdf.generatePdf(file, options);

    return pdf;
  }
}