import express from 'express';
import service from '../services/service';
import wppService from '../services/wppService';

const router = express.Router();

router.get('/testwpp', (req, res) => {
  service.testWpp(req, res);
});

router.get('/webhookauth', (req, res) => {
  service.webhookAuth(req, res);
});

router.get('/testmongo', (req, res) => {
  service.testMongo(req, res);
});

router.post('/enviarorcamento', (req, res) => {
  wppService.orcamentoConfirmMessage(req, res);
});

export default router;