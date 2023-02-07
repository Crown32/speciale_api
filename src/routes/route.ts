import express from 'express';
import service from '../services/service';
import { WppService } from '../services/wppService';

const wppService = new WppService();

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

export default router;