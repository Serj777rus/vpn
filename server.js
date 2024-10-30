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
// const TOKEN = process.env.AMO_TOKEN
const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImIwNmI5ZWUxNTJlMjg0Y2Y0NzZiYzc3Nzk0Yjg3Y2ZhNzQ5ZmYwMzYxZDRjODAzNGY3NGM2OTg5ZDJjNTBhMjgzNjJjYjBjYTVhOWQ5ZGYwIn0.eyJhdWQiOiIxMDI5NzI4MS0wYzNhLTQ5ZjMtODEzNS01MjhlYmNhYTM5ZjciLCJqdGkiOiJiMDZiOWVlMTUyZTI4NGNmNDc2YmM3Nzc5NGI4N2NmYTc0OWZmMDM2MWQ0YzgwMzRmNzRjNjk4OWQyYzUwYTI4MzYyY2IwY2E1YTlkOWRmMCIsImlhdCI6MTczMDI4NjU5NiwibmJmIjoxNzMwMjg2NTk2LCJleHAiOjE4MjQ5NDA4MDAsInN1YiI6IjExNzEzNzQ2IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyMDM4MTU4LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiZTFkMDViYjktMjQzNC00OWJiLTg1ZmMtZmVmMmFlYmQ2OWE2IiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.RLOG0NL8DNs4FKx9pcElQ2BGF_SBieE6YWuP46WNkvbTjZSGbBiniCW8Rxu0W846tviDEeIxpXVNC0Se2Q9sfsZ-GStJ72ej774lizlGghsbDLmTAWJbvqKy0eWc9HI9K7snV1_YXR5Eyxdg1b3YLQ29eeC_Ts4UWq7478cEpEqj_BR0UOxRNPjqWjMbcl7HLWO8KhH3MAo_WGyILT3GM0pVcbOlf8c-1dYFzYZJN37c0U2G4QWWWVxJX6PGBcuINZ9Q68AGzF2Q7ZHs0RuomQbxQNRhwykLECAqWuI7fEht5G4OcojUqPahsU3dmXIS_JXE2jRzil025_imMoFJ3A'

const transport = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
        user: 's.gorbachev@webmarvels.ru',
        pass: 'Ft6VwK1jNBbPC63sbxzC'
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
            await  generateClientIp(email)
            res.status(200).send('ok')
        } else if (response.status === 401) {
            console.log('Ебана амо црм')
        }
    } catch(error) {
        console.error(error)
    }
})

const SERVER_PUBLIC_KEY = '2f5LePw6whVG1UKXRCWo25/MWVuPxL5brXVFLrW8UDc=';
const SERVER_IP = '103.137.251.50'
const SERVER_PORT = 51820
const PRESHARED_KEY = '5tDDcUMdal61j7+jcCRKR/60Yry1nuU08IbWOaDdMJA='

async function generateClientConfig(clientName, clientIp) {
    try {
        const clientPrivateKey = execSync("wg genkey").toString().trim();
        const clientPublicKey = execSync(`echo ${clientPrivateKey} | wg pubkey`).toString().trim();
        const clientConfig = `
        [interface]
        PrivateKey = ${clientPrivateKey}
        Address = 10.7.0.${clientIp}/24
        DNS = 8.8.8.8, 8.8.4.4

        [peer]
        PublicKey = ${SERVER_PUBLIC_KEY}
        PresharedKey = ${PRESHARED_KEY}
        Endpoint = ${SERVER_IP}:${SERVER_PORT}
        AllowedIPs = 0.0.0.0/0 ::0
        PersistentKeepalive = 25
        `
        const filePath = `/root/clients/${clientName}.conf`
        fs.writeFileSync(filePath, clientConfig)
        console.log('Конфигурация создана')
        await  addClinetOnServerConfig(clientIp, clientName)
    } catch(error) {
        console.error(error);
    }
}
async function addClinetOnServerConfig(ipS, clientName, SERVER_PUBLIC_KEY, PRESHARED_KEY) {
    try {
        const serverconfigpath = '/etc/wireguard/wg0.conf';
        const clientConfig = `
        [peer]
        PublicKey = ${SERVER_PUBLIC_KEY}
        PresharedKey = ${PRESHARED_KEY}
        AllowedIPs = 10.7.0.${ipS}/32
        `
        fs.appendFileSync(serverconfigpath, clientConfig)
        console.log('Клиент добавлен в конфиг сервера')

        execSync("wg-quick down wg0 && wg-quick up wg0")
        console.log('Сервер перезапущен')
        await  postClientConfig(clientName)
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
        from: 's.gorbachev@webmarvels.ru', // От кого
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
        await transport.sendMail(mailOptions)
    } catch(error) {
        console.error(error)
    }
}

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`)
})