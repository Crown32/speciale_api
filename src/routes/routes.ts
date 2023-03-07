import express from 'express';
import { BlingService } from '../services/blingService';
import { WppService } from '../services/wppService';
import { Config } from '../configs/config';
import { PdfService } from '../services/pdfService';
import { Produtos } from '../models/produtos';

const router = express.Router();

const blingService = new BlingService(new Config());
const wppService = new WppService();
const pdfService = new PdfService();

router.get('/webhook', async (req, res) => {
    wppService.webhookAuth(req, res);
});    

router.post('/webhook', async (req, res) => {
    wppService.webhook(req, res);
});

router.post('/enviarorcamento', (req, res) => {
  wppService.orcamentoConfirmMessage(req, res);
});

router.post('/testPdf', async (req, res) => {
  const orcamentoPayload = req.body;

  const blingProducts = await blingService.getProdutosByCodigo(orcamentoPayload.produtos);  

  blingProducts.forEach((produto: any) => {
    let produtoOrcamento = orcamentoPayload.produtos.find((x: Produtos) => x.codigo == produto.codigo);    
    if(produtoOrcamento){
      produto.quantidade = produtoOrcamento.quantidade ? produtoOrcamento.quantidade : 1;
      produto.preco = produto.preco * produto.quantidade;
    }
  });

  const pdf = await pdfService.createPdf(blingProducts, orcamentoPayload);

  res.contentType("application/pdf");
  res.send(pdf);
});

export default router