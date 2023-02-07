import config from '../configs/config';
import { OrcamentoPayload } from '../models/orcamentoPayload';

export class MongoService {

  constructor() {}

  async testMongo() {
    const client = config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('test');
      const collection = database.collection('test');
      await collection.insertOne({ name: 'test' });
    } catch (e) {
      return e;
    } finally {
      await client.close();
    }
  }

  async saveOrcamento(orcamento: OrcamentoPayload) {
    const client = config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('orcamentos');
      await collection.insertOne(orcamento);
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

  async getOrcamento(messageId: string) {
    const client = config.mongodbConnection();
    await client.connect();
    const database = client.db('wpp_api');
    const collection = database.collection('orcamentos');
    return collection.findOne({ messageId: messageId });
  }

  async updateOrcamento(messageId: string, orcamento: OrcamentoPayload)  {
    const client = config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('orcamentos');
      await collection.updateOne({ messageId: messageId }, { $set: orcamento });
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

  async closeOrcamento(messageId: string)  {
    const client = config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('orcamentos');
      await collection.updateOne({ messageId: messageId }, { $set: { closed: true } });
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

  async getOrcamentos() {
    const client = config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('orcamentos');
      const orcamentos = await collection.find({}).toArray();
      return orcamentos;
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

}