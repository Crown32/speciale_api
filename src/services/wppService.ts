import axios from 'axios';
import { Request, Response} from 'express';
import mongoService from './mongoService';
import { OrcamentoPayload } from '../models/orcamentoPayload';

const sendTestMessage = async (req: Request, res: Response) => {
  const options = {
    method: 'POST',
    url: 'https://graph.facebook.com/v15.0/100354289646333/messages',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.WPP_API_KEY
    },
    data: {
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": "5531991524560",
      "type": "template",
      "template": {
        "name": "hello_world",
        "language": {
          "code": "en_US"
        },
      }
    }
  }

  try {
    const response = await axios.request(options)
    res.status(200).send(response.data);
  } catch (error) {
    res.status(500).send(error)
  }
}

const orcamentoConfirmMessage =async (req: Request, res: Response) => {

  const orcamentoPayload: OrcamentoPayload = req.body;  

  const options = {
    method: 'POST',
    url: 'https://graph.facebook.com/v15.0/100354289646333/messages',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.WPP_API_KEY
    },
    data: {
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": orcamentoPayload.numeroTelefone,
      "type": "template",
      "template": {
        "name": "orcamento_first_message",
        "language": {
          "code": "pt_BR"
        },
      }
    }
  }

  try {

    const response = await axios.request(options)

    orcamentoPayload.wamid = response.data.messages[0].id;

    mongoService.saveOrcamento(orcamentoPayload);

    res.status(200).send(response.data);

  } catch (error) {
    res.status(500).send(error)
  }

}

const enviarOrcamento = async (req: Request, res: Response) => {

  const testString = `Olá qowihdoqhwoidhqowdhqowhdolqwhdoqwhdoqihwdoiqwhdoqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq Seu orçamento foi enviado com sucesso. teste teste teste`

  const options = {
    method: 'POST',
    url: 'https://graph.facebook.com/v15.0/100354289646333/messages',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.WPP_API_KEY
    },
    data: {
      "messaging_product": "whatsapp",
      "to": "5531991524560",
      "type": "text",
      "text": {
        "preview_url": false,
        "body": "funcionei"
      }
    }
  }

  try {
    const response = await axios.request(options)
    res.status(200).send(response.data);
  } catch (error) {
    res.status(500).send(error)
  }
}

const webhookAuth = async (req: Request, res: Response) => {
   const verify_token = process.env.WPP_WEBHOOK_KEY;
   
   // Parse params from the webhook verification request
   let mode = req.query["hub.mode"];
   let token = req.query["hub.verify_token"];
   let challenge = req.query["hub.challenge"];
 
   // Check if a token and mode were sent
   if (mode && token) {
     // Check the mode and token sent are correct
     if (mode === "subscribe" && token === verify_token) {
       // Respond with 200 OK and challenge token from the request
       console.log("WEBHOOK_VERIFIED");
       res.status(200).send(challenge);
     } else {
       // Responds with '403 Forbidden' if verify tokens do not match
       res.sendStatus(403);
     }
   }
}

export default {
  sendTestMessage,
  enviarOrcamento,
  webhookAuth,
  orcamentoConfirmMessage
}