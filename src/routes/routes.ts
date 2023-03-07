import express from 'express';
import { BlingService } from '../services/blingService';
import { WppService } from '../services/wppService';
import { Config } from '../configs/config';

const router = express.Router();

const blingService = new BlingService(new Config());
const wppService = new WppService();

router.get('/webhook', async (req, res) => {
    wppService.webhookAuth(req, res);
});    

router.post('/webhook', async (req, res) => {
    wppService.webhookMessage(req, res);
});

router.post('/enviarorcamento', (req, res) => {
  wppService.orcamentoConfirmMessage(req, res);
});

export default router