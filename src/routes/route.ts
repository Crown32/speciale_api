import express from 'express';
import service from '../services/service';

const router = express.Router();

router.get('/ping', (req, res) => {
  service.ping(req, res);
});

router.get('/testwpp', (req, res) => {
  service.testWpp(req, res);
});

router.get('/enviarorcamento', (req, res) => {
  service.enviarOrcamento(req, res);
});

router.get('/webhookauth', (req, res) => {
  service.webhookAuth(req, res);
});

export default router;