import express from 'express';
import routes from './routes/route';
import config from './configs/config';

const app = express();

config.setup(app);

// Routes 
app.use('/api/v1', routes);

// Server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});