require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const {execSync} = require('child_process')

const PORT = 3000;
const app = express()
const server = http.createServer(app);
const TOKEN = process.env.AMO_TOKEN
const MAIL_PASS = process.env.MAIL_PASS

const transport = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
        user: 's.gorbachev@webmarvels.ru',
        pass: MAIL_PASS

    }
})

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    credentials: true,
    origin: '*'
}))

app.post('/sendData', async(req, res) => {
    let { name, email, site } = req.body
    console.log(name, email, site);
    if (!site) {
        site = 'Сайта нет'
    }
    try {
        const response = await axios.post('https://webmarvels.amocrm.ru/api/v4/leads/complex',
            [
                {
                    "name": "Новая сделка с Instagram",
                    "pipeline_id": 8819058,
                    "_embedded": {
                        "contacts": [
                            {
                                "first_name": name,
                                "custom_fields_values": [
                                    {
                                        "field_id": 593341,
                                        "values": [
                                            {
                                                "value": email,
                                                "enum_id": 433701,
                                                "enum_code": "WORK"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    "custom_fields_values": [
                        {
                            "field_id": 594271,
                            "values": [{ "value": site }]
                        }
                    ],
                }
            ],
            {headers: {'Authorization':`Bearer ${TOKEN}`}}
        )
        if (response.status === 200) {
            res.status(200).send('ok')
            await  generateClientIp(email)
        } else if (response.status === 401) {
            console.log('Ебана амо црм')
        }
    } catch(error) {
        console.error(error)
    }
})

const SERVER_IP = '103.137.251.50'
const SERVER_PORT = 51820

async function generateClientConfig(clientName, clientIp) {
    try {
        const clientPrivateKey = execSync("wg genkey").toString().trim();
        const psk = execSync("wg genpsk").toString().trim();

// Генерация публичного ключа клиента на основе приватного ключа
        const clientPublicKey = execSync("wg pubkey", {
            input: clientPrivateKey // Передаем privateKey в stdin
        }).toString().trim();

// Получение публичного ключа сервера из конфигурации wg0.conf
        const serverPrivateKey = execSync("grep PrivateKey /etc/wireguard/wg0.conf | cut -d ' ' -f 3").toString().trim();
        const serverPublicKey = execSync("wg pubkey", {
            input: serverPrivateKey // Передаем serverPrivateKey в stdin
        }).toString().trim();
        const clientConfig = `
[Interface]
PrivateKey = ${clientPrivateKey}
Address = 10.7.0.${clientIp}/24
DNS = 8.8.8.8, 8.8.4.4

[Peer]
PublicKey = ${serverPublicKey}
PresharedKey = ${psk}
Endpoint = ${SERVER_IP}:${SERVER_PORT}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`
        const filePath = `/root/clients/${clientName}.conf`
         await fs.writeFileSync(filePath, clientConfig)
        console.log('Конфигурация создана')
        await  addClinetOnServerConfig(clientIp, clientName, clientPublicKey, psk)
    } catch(error) {
        console.error(error);
    }
}
async function addClinetOnServerConfig(ipS, clientName, clientPublicKey, psk) {
    try {
        const serverconfigpath = '/etc/wireguard/wg0.conf';
        const clientConfig = `
# BEGIN_PEER ${clientName}
[Peer]
PublicKey = ${clientPublicKey}
PresharedKey = ${psk}
AllowedIPs = 10.7.0.${ipS}/32
# END_PEER ${clientName}`
        fs.appendFileSync(serverconfigpath, clientConfig)
        console.log('Клиент добавлен в конфиг сервера')
        await  postClientConfig(clientName)
        execSync("sudo systemctl restart wg-quick@wg0.service")
        console.log('Сервер перезапущен')
    } catch(error) {
        console.error(error)
    }
}
async function generateClientIp(email) {
    const input = JSON.parse(fs.readFileSync('clients.json', 'utf8'))
    let newIp = 0;
    for (let i = 0; i <= input.length; i++) {
        if (i === input.length - 1) {
            newIp = input[i].ip + 1
        }
    }
    const newClient = { name: email, ip: newIp }
    input.push(newClient);
    fs.writeFileSync('clients.json', JSON.stringify(input, null, 2))
    await  generateClientConfig(email, newIp)
}

async function postClientConfig(clientName) {
    const filePath = path.join('/root/clients/', `${clientName}.conf`);
    let mailOptions = {
        from: '"VPN" <s.gorbachev@webmarvels.ru>', // От кого
        to: clientName,               // Кому
        subject: 'Инструкция и конфигурация для VPN', // Тема
        html: `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="ru">
            <head>
            <meta charset="UTF-8">
            <meta content="width=device-width, initial-scale=1" name="viewport">
            <meta name="x-apple-disable-message-reformatting">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="telephone=no" name="format-detection">
            <title>Empty template</title><!--[if (mso 16)]>
                <style type="text/css">
                a {text-decoration: none;}
                </style>
                <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
            <noscript>
                    <xml>
                    <o:OfficeDocumentSettings>
                    <o:AllowPNG></o:AllowPNG>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
            <![endif]-->
            <style type="text/css">
            .rollover:hover .rollover-first {
            max-height:0px!important;
            display:none!important;
            }
            .rollover:hover .rollover-second {
            max-height:none!important;
            display:block!important;
            }
            .rollover span {
            font-size:0px;
            }
            u + .body img ~ div div {
            display:none;
            }
            #outlook a {
            padding:0;
            }
            span.MsoHyperlink,
            span.MsoHyperlinkFollowed {
            color:inherit;
            mso-style-priority:99;
            }
            a.es-button {
            mso-style-priority:100!important;
            text-decoration:none!important;
            }
            a[x-apple-data-detectors],
            #MessageViewBody a {
            color:inherit!important;
            text-decoration:none!important;
            font-size:inherit!important;
            font-family:inherit!important;
            font-weight:inherit!important;
            line-height:inherit!important;
            }
            .es-desk-hidden {
            display:none;
            float:left;
            overflow:hidden;
            width:0;
            max-height:0;
            line-height:0;
            mso-hide:all;
            }
            @media only screen and (max-width:600px) {.es-m-p20b { padding-bottom:20px!important } .es-p-default { } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } .es-header-body p { } .es-content-body p { } .es-footer-body p { } .es-infoblock p { } h1 { font-size:30px!important; text-align:left } h2 { font-size:24px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:24px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body a { font-size:14px!important } .es-footer-body p, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .rollover:hover .rollover-second, .es-m-txt-c .rollover:hover .rollover-second, .es-m-txt-l .rollover:hover .rollover-second { display:inline!important } .es-m-txt-r .rollover span, .es-m-txt-c .rollover span, .es-m-txt-l .rollover span { line-height:0!important; font-size:0!important; display:block } .es-spacer { display:inline-table } a.es-button, button.es-button { font-size:18px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } a.es-button, button.es-button, .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } .h-auto { height:auto!important } .img-2669 { width:120px!important; height:auto!important } .img-1945 { width:120px!important; height:auto!important } .img-7216 { width:240px!important; height:auto!important } }
            @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
            </style>
            </head>
            <body class="body" style="width:100%;height:100%;padding:0;Margin:0">
            <div dir="ltr" class="es-wrapper-color" lang="ru" style="background-color:#F6F6F6"><!--[if gte mso 9]>
                        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                            <v:fill type="tile" color="#f6f6f6"></v:fill>
                        </v:background>
                    <![endif]-->
            <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6">
                <tr>
                <td valign="top" style="padding:0;Margin:0">
                <table cellspacing="0" cellpadding="0" align="center" class="es-header" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
                    <tr>
                    <td align="center" style="padding:0;Margin:0">
                    <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-header-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                        <tr>
                        <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-right:20px;padding-left:20px"><!--[if mso]><table style="width:560px" cellpadding="0"
                                        cellspacing="0"><tr><td style="width:180px" valign="top"><![endif]-->
                        <table cellspacing="0" cellpadding="0" align="left" class="es-left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                            <tr>
                            <td valign="top" align="center" class="es-m-p20b" style="padding:0;Margin:0;width:180px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                <td align="center" style="padding:0;Margin:0;font-size:0"><img src="https://fppidvu.stripocdn.email/content/guids/CABINET_96c8c32e5c2e923dd4cb55524e0a4a10ef1260fff03aad81d1ee9d9990398120/images/vpn_logo.png" alt="" width="180" class="img-7216" height="180" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none"></td>
                                </tr>
                            </table></td>
                            </tr>
                        </table><!--[if mso]></td><td style="width:20px"></td><td style="width:360px" valign="top"><![endif]-->
                        <table cellspacing="0" cellpadding="0" align="right" class="es-right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                            <tr>
                            <td align="left" style="padding:0;Margin:0;width:360px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                <td align="left" style="padding:0;Margin:0"><h1 style="Margin:0;font-family:verdana, geneva, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:30px;font-style:normal;font-weight:normal;line-height:36px;color:#333333"><strong>Инструкция и файл конфигурации для VPN</strong></h1></td>
                                </tr>
                            </table></td>
                            </tr>
                        </table><!--[if mso]></td></tr></table><![endif]--></td>
                        </tr>
                    </table></td>
                    </tr>
                </table>
                <table cellspacing="0" cellpadding="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
                    <tr>
                    <td align="center" style="padding:0;Margin:0">
                    <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                        <tr>
                        <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-right:20px;padding-left:20px">
                        <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                            <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                <td align="left" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Добрый день.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Для использования нашего VPN вам потребуется:</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">1. Скачать клиентское приложение Amnezia (ссылки на APP Store и Google Play ниже)</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">2. Сохранить файл конфигурации из письма на телефон</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">3. В приложении Amnezia выбрать "Добавить конфигурацию из файла" и выбрать сохраненный файл</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">4. Нажать подключиться</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Готово! Ваш VPN настроен и уже работает</p></td>
                                </tr>
                            </table></td>
                            </tr>
                        </table></td>
                        </tr>
                    </table></td>
                    </tr>
                </table>
                <table cellspacing="0" cellpadding="0" align="center" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
                    <tr>
                    <td align="center" style="padding:0;Margin:0">
                    <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                        <tr>
                        <td align="left" style="Margin:0;padding-top:20px;padding-right:20px;padding-left:20px;padding-bottom:20px"><!--[if mso]><table style="width:560px" cellpadding="0" 
                                    cellspacing="0"><tr><td style="width:270px" valign="top"><![endif]-->
                        <table cellspacing="0" cellpadding="0" align="left" class="es-left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                            <tr>
                            <td align="left" class="es-m-p20b" style="padding:0;Margin:0;width:270px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                <td align="center" style="padding:0;Margin:0;font-size:0"><a target="_blank" href="https://apps.apple.com/us/app/amneziavpn/id1600529900" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img src="https://fppidvu.stripocdn.email/content/guids/CABINET_96c8c32e5c2e923dd4cb55524e0a4a10ef1260fff03aad81d1ee9d9990398120/images/pngwingcom.png" alt="" width="120" class="img-2669" height="46" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none"></a></td>
                                </tr>
                            </table></td>
                            </tr>
                        </table><!--[if mso]></td><td style="width:20px"></td><td style="width:270px" valign="top"><![endif]-->
                        <table cellspacing="0" cellpadding="0" align="right" class="es-right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                            <tr>
                            <td align="left" style="padding:0;Margin:0;width:270px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                <td align="center" style="padding:0;Margin:0;font-size:0"><a target="_blank" href="https://play.google.com/store/apps/details?id=org.amnezia.vpn&pli=1" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2CB543;font-size:14px"><img src="https://fppidvu.stripocdn.email/content/guids/CABINET_96c8c32e5c2e923dd4cb55524e0a4a10ef1260fff03aad81d1ee9d9990398120/images/pngwingcom_1.png" alt="" width="120" class="img-1945" height="48" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none"></a></td>
                                </tr>
                            </table></td>
                            </tr>
                        </table><!--[if mso]></td></tr></table><![endif]--></td>
                        </tr>
                    </table></td>
                    </tr>
                </table></td>
                </tr>
            </table>
            </div>
            </body>
        </html>
        `,
        // text: 'Добрый день. Ниже вы найдете файл конфигурации для подключения VPN. Для подключения Вам нужно скачать из Apple Store или Google Play приложение Amnezia. Далее вам нужно добавить прикрепленный файл конфигурации в него и нажать кнопку подключиться',
        attachments: [
            {
                filename: `${clientName}.conf`, // Имя файла в письме
                path: filePath,                 // Путь к файлу
            },
        ],
    };
    try {
        const response = await transport.sendMail(mailOptions)
        if (response) {
            console.log('отправилось')
        }
    } catch(error) {
        console.error(error)
    }
}

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`)
})