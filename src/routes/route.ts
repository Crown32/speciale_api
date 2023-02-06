import express from 'express';
import service from '../services/service';

const router = express.Router();

router.get('/testwpp', (req, res) => {
  service.testWpp(req, res);
});

router.get('/enviarorcamento', (req, res) => {
  service.enviarOrcamento(req, res);
});

router.get('/webhookauth', (req, res) => {
  service.webhookAuth(req, res);
});

router.get('/testmongo', (req, res) => {
  service.testMongo(req, res);
});

export default router;