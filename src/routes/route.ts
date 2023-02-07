import express from 'express';
import service from '../services/service';
import { WppService } from '../services/wppService';
import { BlingService } from '../services/blingService';

const wppService = new WppService();
const blingService = new BlingService();

const router = express.Router();

router.get('/testwpp', (req, res) => {
  service.testWpp(req, res);
});

router.get('/webhook', (req, res) => {
  service.webhookAuth(req, res);
});

router.post('/webhook', (req, res) => {
  wppService.webhook(req, res);
});

router.get('/testmongo', (req, res) => {
  service.testMongo(req, res);
});

router.post('/enviarorcamento', (req, res) => {
  wppService.orcamentoConfirmMessage(req, res);
});

router.get('/testbling', (req, res) => {
  const produtos = blingService.getProdutos().then((produtos) => {
    res.send(produtos);
  }).catch((err) => {
    res.send(err);
    console.log(err);
    
  });
});

export default router;