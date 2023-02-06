import { MongoClient } from 'mongodb';
 
const mongodbConnection = () => {
  const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  return client;
}

export default {
  mongodbConnection
};