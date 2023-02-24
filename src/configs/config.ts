import { MongoClient } from 'mongodb';
import { Bling } from 'bling-erp-api';
 
export class Config {
  mongodbConnection = () => {
    const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri);
    return client;
  }
  
  blingConnection = () => {
    const bling = new Bling(process.env.BLING_API_KEY || '');
    return bling;
  }
  
}

