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
        text: 'Добрый день. Ниже вы найдете файл конфигурации для подключения VPN. Для подключения Вам нужно скачать из Apple Store или Google Play приложение Amnezia. Далее вам нужно добавить прикрепленный файл конфигурации в него и нажать кнопку подключиться', // Текст
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