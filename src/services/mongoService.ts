import { Config } from '../configs/config';
import { OrcamentoPayload } from '../models/orcamentoPayload';

export class MongoService {

  constructor(private config: Config) {}

  async saveTestes(payload: any) {
    const client = this.config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('testes');
      await collection.insertOne(payload);
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

  async saveOrcamento(orcamento: OrcamentoPayload) {
    const client = this.config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('orcamentos');
      orcamento.created_at = new Date();
      orcamento.updated_at = new Date();
      await collection.insertOne(orcamento);
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

  async getOrcamento(messageId: string) {
    const client = this.config.mongodbConnection();
    await client.connect();
    const database = client.db('wpp_api');
    const collection = database.collection('orcamentos');
    return collection.findOne({ messageId: messageId });
  }

  async getOrcamentos() {
    const client = this.config.mongodbConnection();
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

  async updateOrcamento(messageId: string, orcamento: OrcamentoPayload)  {
    const client = this.config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('orcamentos');
      orcamento.updated_at = new Date();
      await collection.updateOne({ messageId: messageId }, { $set: orcamento });
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

  async closeOrcamento(messageId: string)  {
    const client = this.config.mongodbConnection();
    try {
      await client.connect();
      const database = client.db('wpp_api');
      const collection = database.collection('orcamentos');
      await collection.updateOne({ messageId: messageId }, { $set: { closed: true, updated_at: new Date() } });
    } catch (e) {
      console.log(e);
      return e;
    } finally {
      await client.close();
    }
  }

}