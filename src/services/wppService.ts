import axios from 'axios';
import { Request, Response } from 'express';
import { MongoService } from './mongoService';
import { OrcamentoPayload } from '../models/orcamentoPayload';
import { OrcamentoStatus } from '../models/orcamentoStatus';
import { BlingService } from './blingService';
import { Utils } from '../utils/utils';
import { Config } from '../configs/config';
import { BlingReturnProduct } from '../models/blingReturnProduct';
import { PdfService } from './pdfService';
import FormData from 'form-data';

export class WppService {

  constructor() { }

  mongoService = new MongoService(new Config());
  blingService = new BlingService(new Config());
  pdfService = new PdfService();

  formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BRL',
  });

  //Mensagem de confirmação de solicitação de orçamento
  async orcamentoConfirmMessage(req: Request, res: Response) {   

    let phoneFormatted = req.body.billing.phone.replace(/\D/g, '');

    if(!phoneFormatted.startsWith('55')){
      phoneFormatted = '55' + phoneFormatted;
    }

    const orcamentoPayload: OrcamentoPayload = {
      nome: req.body.billing.first_name + ' ' + req.body.billing.last_name,
      numeroTelefone: phoneFormatted,
      status: OrcamentoStatus.CONTACTED,
      produtos: req.body.line_items.map((item: any) => {
        return {
          codigo: item.sku,
          nome: item.name,
          quantidade: item.quantity
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    }
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

  //Mensagem antiga de enviar orçamento -> Nova é de PDF
  //Adicionar aviso de falta de estoque -> Implementar para PDF no futuro
  async enviarOrcamento(orcamentoPayload: OrcamentoPayload) { 

    const blingProducts: BlingReturnProduct[] = await this.blingService.getProdutosByCodigo(orcamentoPayload.produtos);     
    
    blingProducts.forEach((produto: BlingReturnProduct) => {
      if(orcamentoPayload.produtos){
        let produtoOrcamento = orcamentoPayload.produtos.find(x => x.codigo == produto.codigo);
        if(produtoOrcamento){
          produto.quantidade = produtoOrcamento.quantidade ? produtoOrcamento.quantidade : 1;
          produto.preco = produto.preco * produto.quantidade;
        }
      }            
    });

    const pdf = await this.pdfService.createPdf(blingProducts, orcamentoPayload);

    const formData = new FormData();

    formData.append('file', pdf, `orcamento_${orcamentoPayload.nome}.pdf`);
    formData.append('messaging_product', 'whatsapp');

    const optionsUploadMedia = {
      method: 'POST',
      url: 'https://graph.facebook.com/v15.0/100354289646333/media',
      headers: {
        'Content-Type': `multipart/form-data`,
        'Authorization': 'Bearer ' + process.env.WPP_API_KEY
      },
      data: formData
    }

    const optionsSendOrcamento = {
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
        "type": "document",
        "document": {
          "id": null,
          "caption": "",
          "filename": `orcamento_${orcamentoPayload.nome}.pdf`,
        }
      }
    }

    const optionsConfirmMessage = {
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
            "text": "Aqui está seu orçamento 😁\n\nGostaria de confirmar o pedido?"
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
      const responseUploadMedia = await axios.request(optionsUploadMedia)
      
      optionsSendOrcamento.data.document.id = responseUploadMedia.data.id;

      const responseSendOrcamento = await axios.request(optionsSendOrcamento)
      const responseConfirmMessage = await axios.request(optionsConfirmMessage)
      
      return responseConfirmMessage.data;
    } catch (error) {
      return error;
    }
  }

  //Mensagem de agradecimento por aceitar o orçamento
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

  //Mensagem de alerta para o vendedor de quando um cliente solicita um orçamento
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

  //Mensagem de alerta para o vendedor quando o cliente aceita o orçamento
  async alertaOrcamentoAceito(orcamentoPayload: OrcamentoPayload) {

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
                  "text": "null"
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

  //Mensagem de alerta para o vendedor quando o cliente rejeita o orçamento
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

  //Mensaem de solicitação de orçamento recusada
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

  //Mensagem de orçamento rejeitado após o primeiro contato
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
  
  async webhook(req: Request, res: Response) {
    const body = req.body;

    if(!body.entry[0].changes[0].value.messages){
      console.log(body.entry[0].changes[0].value.messages);
      console.log("Mensagem não é do tipo resposta de botão");
      res.status(200).send("EVENT_RECEIVED");
      return;
    }

    const messageResponse = body.entry[0].changes[0].value.messages[0]    
    const messageId = body.entry[0].changes[0].value.messages[0].context.id

    if((messageResponse.button && String(messageResponse.button.text).toLowerCase() === 'sim') || (messageResponse.interactive && String(messageResponse.interactive.button_reply.title).toLowerCase() === 'sim')){
      //Aceito
      this.mongoService.getOrcamento(messageId).then((orcamento: any) => {
        if (orcamento) {
          const orcamentoPayload = orcamento as OrcamentoPayload;
          if (orcamentoPayload.status === OrcamentoStatus.CONTACTED) {
            this.enviarOrcamento(orcamentoPayload).then(async (response: any) => {      
              orcamentoPayload.status = OrcamentoStatus.ORCAMENTO_SENT;
              orcamentoPayload.messageId = response.messages[0].id;
              const blingResponse = await this.blingService.createPropostaComercial(orcamentoPayload);              
              orcamentoPayload.propostaBlingId = blingResponse[0].id;
              this.mongoService.updateOrcamento(messageId, orcamentoPayload);
              await this.alertaOrcamentoSolicitado(blingResponse[0].id, orcamentoPayload);
              console.log("Orçamento enviado");
              res.status(200).send("EVENT_RECEIVED");
            });
          } else if (orcamentoPayload.status === OrcamentoStatus.ORCAMENTO_SENT) {
            this.orcamentoAcceptedMessage(orcamentoPayload).then(async (response: any) => {
              orcamentoPayload.status = OrcamentoStatus.ACCEPTED;
              orcamentoPayload.messageId = response.messages[0].id;
              this.mongoService.updateOrcamento(messageId, orcamentoPayload);
              await this.alertaOrcamentoAceito(orcamentoPayload);
              console.log("Orçamento aceito");
              res.status(200).send("EVENT_RECEIVED");
            });
          }

        } else {
          console.log("Orçamento não encontrado");
          res.status(200).send("EVENT_RECEIVED");
        }
      });
    }else{
      //Rejeitado
      this.mongoService.getOrcamento(messageId).then((orcamento: any) => {
        if (orcamento) {
          const orcamentoPayload = orcamento as OrcamentoPayload;
          if (orcamentoPayload.status === OrcamentoStatus.CONTACTED) {
            this.orcamentoFirstMessageRejected(orcamentoPayload).then(async (response: any) => {
              orcamentoPayload.status = OrcamentoStatus.REJECTED;
              orcamentoPayload.messageId = response.messages[0].id;
              this.mongoService.updateOrcamento(messageId, orcamentoPayload);
              console.log("Contato rejeitado");
              res.status(200).send("EVENT_RECEIVED");
            });
          } else if (orcamentoPayload.status === OrcamentoStatus.ORCAMENTO_SENT) {
            this.orcamentoRejected(orcamentoPayload).then(async (response: any) => {
              orcamentoPayload.status = OrcamentoStatus.REJECTED;
              orcamentoPayload.messageId = response.messages[0].id;
              this.mongoService.updateOrcamento(messageId, orcamentoPayload);
              await this.alertaOrcamentoRejeitado(orcamentoPayload.propostaBlingId?.toString() || '', orcamentoPayload);
              console.log("Orçamento rejeitado");
              res.status(200).send("EVENT_RECEIVED");
            });
          }

        } else {
          console.log("Não encontrou o orçamento");
          res.status(200).send("EVENT_RECEIVED");
        }
      });
    }
  }
}
