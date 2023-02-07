import config from '../configs/config';
import { OrcamentoPayload } from '../models/orcamentoPayload';

const testMongo = async () => {
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

const saveOrcamento = async (orcamento: OrcamentoPayload) => {

  const client = config.mongodbConnection();
  await client.connect();
  const database = client.db('wpp_api');

  const collection = database.collection('orcamentos');    

  collection.insertOne(orcamento).then(() => {
  }).catch((err) => {
  console.log(err);
  });
  
}

const getOrcamento = async (wamid: string) => {
  const client = config.mongodbConnection();
  try {
    await client.connect();
    const database = client.db('wpp_api');
    const collection = database.collection('orcamentos');
    const orcamento = await collection.findOne({ _id: wamid });
    return orcamento;
  } catch (e) {
    console.log(e);
    return e;
  } finally {
    await client.close();
  }
}

const updateOrcamento = async (wamid: string, orcamento: OrcamentoPayload) => {
  const client = config.mongodbConnection();
  try {
    await client.connect();
    const database = client.db('wpp_api');
    const collection = database.collection('orcamentos');
    await collection.updateOne({ _id: wamid }, orcamento);
  } catch (e) {
    console.log(e);
    return e;
  } finally {
    await client.close();
  }
}

const closeOrcamento = async (wamid: string) => {
  const client = config.mongodbConnection();
  try {
    await client.connect();
    const database = client.db('wpp_api');
    const collection = database.collection('orcamentos');
    await collection.updateOne({ wamid: wamid }, { $set: { closed: true } });
  } catch (e) {
    console.log(e);
    return e;
  } finally {
    await client.close();
  }
}

const getOrcamentos = async () => {
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

const getOneOpenOrcamento = async (wamid: string) => {
  const client = config.mongodbConnection();
  try {
    await client.connect();
    const database = client.db('wpp_api');
    const collection = database.collection('orcamentos');
    const orcamento = await collection.findOne({ closed: false, wamid: wamid });
    return orcamento;
  } catch (e) {
    console.log(e);
    return e;
  } finally {
    await client.close();
  }
}

export default {
  testMongo,
  saveOrcamento,
  getOrcamento,
  updateOrcamento,
  closeOrcamento,
  getOrcamentos,
  getOneOpenOrcamento
};