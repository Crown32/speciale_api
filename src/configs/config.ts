import { MongoClient } from 'mongodb';
import { Bling } from 'bling-erp-api';
 
const mongodbConnection = () => {
  const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  return client;
}

const blingConnection = () => {
  const bling = new Bling(process.env.BLING_API_KEY || '');
  return bling;
}

export default {
  mongodbConnection,
  blingConnection,
};