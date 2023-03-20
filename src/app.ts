import express from 'express';
import {TwitterApi, TwitterApiTokens} from "twitter-api-v2";
import 'websocket-polyfill'
import bodyParser from "body-parser";
import {ImgurClient} from "imgur";
require('dotenv').config()

const app = express();
const port = Number(process.env.PORT) || 3333;

app.use(bodyParser.text());

app.get('/twitter/auth', (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    const client = new TwitterApi({ appKey: process.env.APP_KEY, appSecret: process.env.APP_SECRET });
    client.generateAuthLink('https://nostrwitter.onrender.com', { linkMode: 'authorize' }).then(r => {
        res.send(r);
    }, error => {
        console.log(error)
        res.send('Deu errado');
    })
});

app.post('/twitter/tweet', (req: any, res) => {
    const {oauthToken, oauthTokenSecret, oauthVerifier, post, imageBase64} = JSON.parse(req.body);

    const tokens: TwitterApiTokens = {
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
        accessToken: oauthToken,
        accessSecret: oauthTokenSecret
    }

    console.log(tokens)

    const client = new TwitterApi(tokens);

    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    client.login(oauthVerifier).then(r => {
        if(imageBase64){
            r.client.v1.uploadMedia(Buffer.from(imageBase64, 'base64')).then(mediaId =>
                r.client.v1.tweet(post, {media_ids: [mediaId]}).then(r => res.send(r), error => res.send(error))
            )
        }else{
            r.client.v1.tweet(post)
                .then(r => res.send(r), error => res.send(error));
        }
    }, error => res.send(error))
});

app.get('/ping', (req: any, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    res.send('pong!')
})

app.post('/upload', (req: any, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    const imgurClient = new ImgurClient({ clientId: 'bfd3861f722121a'/*process.env.IMGUR_CLIENT_ID*/ });

    const {imageBase64} = JSON.parse(req.body);

    console.log(typeof imageBase64)

    imgurClient.upload({image: imageBase64, type: "base64"})
        .then((r) => res.send(r.data.link))
        .catch(e => {
                console.log(e)
                res.send("error")
            }
        )
})

app.listen(port, '0.0.0.0',0,() => {
     console.log(`server is listening on ${port}`);
});