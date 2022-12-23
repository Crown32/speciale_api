import { Request, Response} from 'express';
import wppService from '../services/wppService';

const ping = (req: Request, res: Response) => {
  res.status(200).send('pong');
};

//TODO: Passar o req and res dos dois primeiros métodos para wppService
const testWpp = async (req: Request, res: Response) => {
  try {
    const data = await wppService.sendTestMessage();
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send(error)
  }
};

const enviarOrcamento = async (req: Request, res: Response) => {
  try {
    const data = await wppService.enviarOrcamento(req.body);
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send(error)
  }
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