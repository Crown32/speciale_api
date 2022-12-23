import { Request, Response} from 'express';
import wppService from '../services/wppService';

const ping = (req: Request, res: Response) => {
  res.status(200).send('pong');
};

const testWpp = async (req: Request, res: Response) => {
    await wppService.sendTestMessage(req, res);
};

const enviarOrcamento = async (req: Request, res: Response) => {
  const data = await wppService.enviarOrcamento(req, res);
}

const webhookAuth = async (req: Request, res: Response) => {
  await wppService.webhookAuth(req, res);
}

export default {
  ping,
  testWpp,
  enviarOrcamento,
  webhookAuth
};