import { Request, Response} from 'express';
import { WppService } from './wppService';
import config from '../configs/config';

const wppService = new WppService();

const testWpp = async (req: Request, res: Response) => {
    await wppService.sendTestMessage(req, res);
};

const enviarOrcamento = async (req: Request, res: Response) => {
  const data = await wppService.enviarOrcamento({});
}

const webhookAuth = async (req: Request, res: Response) => {
  await wppService.webhookAuth(req, res);
}

const testMongo = async (req: Request, res: Response) => {
  const client = config.mongodbConnection();
  try {
    await client.connect();
    const database = client.db('test');
    const collection = database.collection('test');
    const result = await collection.insertOne({ name: 'test' });
    res.send(result);
  } catch (e) {
    res.send
  } finally {
    await client.close();
  }
}

export default {
  testWpp,
  enviarOrcamento,
  webhookAuth,
  testMongo
};