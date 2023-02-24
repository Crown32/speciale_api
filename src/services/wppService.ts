import axios from 'axios';
import { Request, Response } from 'express';
import { MongoService } from './mongoService';
import { OrcamentoPayload } from '../models/orcamentoPayload';
import { OrcamentoStatus } from '../models/orcamentoStatus';
import { BlingService } from './blingService';
import { Utils } from '../utils/utils';
import { Config } from '../configs/config';
export class WppService {

  constructor() { }

  mongoService = new MongoService(new Config());
  blingService = new BlingService(new Config());

  formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BRL',
  });

  async orcamentoConfirmMessage(req: Request, res: Response) {    

    const orcamentoPayload: OrcamentoPayload = req.body;
    orcamentoPayload.status = OrcamentoStatus.CONTACTED;

    if(!orcamentoPayload.produtos){
      res.status(400).send('Produtos não informados');
      return;
    }
      
    const totalQuantidade = orcamentoPayload.produtos.reduce((a, b) => a + (b.quantidade || 0), 0);

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
          "components": [
            {
              "type": "header",
              "parameters": [
                {
                  "type": "text",
                  "text": orcamentoPayload.nome
                },
              ]
            },
            {
              "type": "body",
              "parameters": [
                {
                  "type": "text",
                  "text": totalQuantidade
                },
              ]
            }
          ]
        }
      }
    }

    try {
      
      const response = await axios.request(options)

      orcamentoPayload.messageId = response.data.messages[0].id;

      this.mongoService.saveOrcamento(orcamentoPayload);

      res.status(200).send(response.data);

    } catch (error) {
      console.log(error);
      
      res.status(500).send(error)
    }

  }

  async enviarOrcamento(orcamentoPayload: OrcamentoPayload) { 

    const blingProducts: any[] = await this.blingService.getProdutosByCodigo(orcamentoPayload.produtos);

    blingProducts.forEach(p => {
      if(orcamentoPayload.produtos){
        let produtoOrcamento = orcamentoPayload.produtos.find(x => x.codigo == p.codigo);
        p.quantidade = produtoOrcamento ? produtoOrcamento.quantidade : 1;
        p.preco = p.preco * p.quantidade;
      }            
    });

    const message = `Aqui está seu orçamento 😁\n\n${blingProducts.map(p => `- ${p.quantidade}x ${p.descricao} -> ${this.formatter.format(parseFloat(p.preco)).replace(/^(\D+)/, '$1 ').replace(/\s+/, ' ')}`).join('\n')} \n\n Total: ${this.formatter.format(Number(blingProducts.reduce((a, b) => a + Number(b.preco), 0))).replace(/^(\D+)/, '$1 ').replace(/\s+/, ' ')} \n\nDeseja confirmar o orçamento?`;

    const options = {
      method: 'POST',
      url: 'https://graph.facebook.com/v15.0/100354289646333/messages',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.WPP_API_KEY
      },
      data: {
        "messaging_product": "whatsapp",
        "to": orcamentoPayload.numeroTelefone,
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
      return response.data;
    } catch (error) {
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

  async alertaOrcamentoSolicitado(propostaComercialId: number, orcamentoPayload: OrcamentoPayload) {

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
          "name": "alerta_solicitacao_orcamento",
          "language": {
            "code": "pt_BR"
          },
          "components": [
            {
              "type": "body",
              "parameters": [
                {
                  "type": "text",
                  "text": orcamentoPayload.nome
                },
                {
                  "type": "text",
                  "text": orcamentoPayload.numeroTelefone ? Utils.formatNumber(orcamentoPayload.numeroTelefone) : orcamentoPayload.numeroTelefone
                },
                {
                  "type": "text",
                  "text": propostaComercialId
                },
              ]
            }
          ]
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

  async alertaOrcamentoAceito(propostaComercialId: string, orcamentoPayload: OrcamentoPayload) {

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
          "name": "alerta_orcamento_aceito",
          "language": {
            "code": "pt_BR"
          },
          "components": [
            {
              "type": "body",
              "parameters": [
                {
                  "type": "text",
                  "text": orcamentoPayload.nome
                },
                {
                  "type": "text",
                  "text": orcamentoPayload.numeroTelefone ? Utils.formatNumber(orcamentoPayload.numeroTelefone) : orcamentoPayload.numeroTelefone
                },
                {
                  "type": "text",
                  "text": propostaComercialId
                },
              ]
            }
          ]
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

  async alertaOrcamentoRejeitado(propostaComercialId: string, orcamentoPayload: OrcamentoPayload) {

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
          "name": "alerta_orcamento_recusado",
          "language": {
            "code": "pt_BR"
          },
          "components": [
            {
              "type": "body",
              "parameters": [
                {
                  "type": "text",
                  "text": orcamentoPayload.nome
                },
                {
                  "type": "text",
                  "text": orcamentoPayload.numeroTelefone ? Utils.formatNumber(orcamentoPayload.numeroTelefone) : orcamentoPayload.numeroTelefone
                },
                {
                  "type": "text",
                  "text": propostaComercialId
                },
              ]
            }
          ]
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

  async orcamentoFirstMessageRejected(orcamentoPayload: OrcamentoPayload) {
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
          "name": "orcamento_rejected",
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

  async orcamentoRejected(orcamentoPayload: OrcamentoPayload) {
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
          "name": "orcamento_rejected",
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

}

/* TODO: Criar a nova função de webhook, vai continuar com a primeira msg de confirmação de envio, mas a próxima será a de pdf de orçamento
* Mas caso não tenha um dos produtos no estoque, enviar na msg debaixo de confirmação avisando que não temos o produto em estoque
* Após ele confirmar ou não, finalizar o processo de orçamento,
* Válidar msgs de alerta nos templates do facebook
*/