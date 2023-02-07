import axios from 'axios';
import { Request, Response } from 'express';
import { MongoService } from './mongoService';
import { OrcamentoPayload } from '../models/orcamentoPayload';
import { OrcamentoStatus } from '../models/orcamentoStatus';

export class WppService {

  constructor() { }

  mongoService = new MongoService();

  async sendTestMessage(req: Request, res: Response) {
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

  async orcamentoConfirmMessage(req: Request, res: Response) {

    const orcamentoPayload: OrcamentoPayload = req.body;
    orcamentoPayload.status = OrcamentoStatus.CONTACTED;

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
          "name": "hello_world",
          "language": {
            "code": "en_US"
          },
        }
      }
    }

    try {

      const response = await axios.request(options)

      orcamentoPayload.messageId = response.data.messages[0].id;

      this.mongoService.saveOrcamento(orcamentoPayload);

      res.status(200).send(response.data);

    } catch (error) {
      res.status(500).send(error)
    }

  }

  async enviarOrcamento(orcamentoPayload: OrcamentoPayload) {    
    const message = `Aqui está seu orçamento 😁

- 5x limpadores de parabrisa -> R$75,99
- 5x limpadores de parabrisa -> R$75,99 
- 5x limpadores de parabrisa -> R$75,99
    
Clique no botão abaixo para aceitar ou recusar este orçamento.`

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
        "type": "interactive",
        "interactive": {
          "type": "button",
          "body": {
            "text": message
          },
          "action": {
            "buttons": [
              {
                "type": "reply",
                "reply": {
                  "id": Math.random().toString(36).substring(7),
                  "title": "Sim"
                }
              },
              {
                "type": "reply",
                "reply": {
                  "id": Math.random().toString(36).substring(7),
                  "title": "Não"
                }
              }
            ]
          }
        }
      }
    }

    try {
      const response = await axios.request(options)
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error)
      return error;
    }
  }

  async orcamentoAcceptedMessage(orcamentoPayload: OrcamentoPayload) {
    
    orcamentoPayload.status = OrcamentoStatus.CONTACTED;

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
          "name": "orcamento_thanks_message",
          "language": {
            "code": "pt_BR"
          },
        }
      }
    }

    try {
      const response = await axios.request(options)
      return response.data;
    } catch (error) {
      return error;
    }

  }

  async webhookAuth(req: Request, res: Response) {
    const verify_token = process.env.WPP_WEBHOOK_KEY;

    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === verify_token) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  }

  async webhook(req: Request, res: Response) {
    const body = req.body;
    const messageResponse = body.entry[0].changes[0].value.messages[0].button.text    
    const messageId = body.entry[0].changes[0].value.messages[0].id

    if(messageResponse === "Sim"){
      this.mongoService.getOrcamento(messageId).then((orcamento: any) => {
        if (orcamento) {
          const orcamentoPayload = orcamento as OrcamentoPayload;
  
          if (orcamentoPayload.status === OrcamentoStatus.CONTACTED) {
            this.enviarOrcamento(orcamentoPayload).then((response: any) => {
              orcamentoPayload.status = OrcamentoStatus.ORCAMENTO_SENT;
              orcamentoPayload.messageId = response.messages[0].id;
              this.mongoService.updateOrcamento(messageId, orcamentoPayload);
              res.status(200).send(response);
            });
          } else if (orcamentoPayload.status === OrcamentoStatus.ORCAMENTO_SENT) {
            this.orcamentoAcceptedMessage(orcamentoPayload).then((response: any) => {
              orcamentoPayload.status = OrcamentoStatus.ACCEPTED;
              orcamentoPayload.messageId = response.messages[0].id;
              this.mongoService.updateOrcamento(messageId, orcamentoPayload);
              res.status(200).send("Orçamento aceito");
            });
          }
  
        } else {
          res.status(200).send("Orcamento não encontrado");
        }
      });
    }else{
      //Enviar uma mensagem padrão de desculpas e agradecimento
      res.status(200).send("Mensagem não é de orçamento");
    }
  }
}