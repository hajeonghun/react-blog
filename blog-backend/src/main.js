require('dotenv').config();
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyParser';

import mongoose from 'mongoose';
import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';

import serve from 'koa-static';
import path from 'path';
import send from 'koa-send';

// eslint-disable-next-line no-undef
const { PORT, MONGO_URI } = process.env;

//mongoose -> server 와 DB 연결 (spring mybatis 역할)
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useFindAndModify: false })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(e => {
    console.error(e);
  });

const app = new Koa();
const router = new Router();

router.use('/api', api.routes()); // api 라우터 설정

app.use(bodyParser());
app.use(jwtMiddleware);

app.use(router.routes()).use(router.allowedMethods());

// eslint-disable-next-line no-undef
const buildDirectory = path.resolve(__dirname, '../../blog-frontend/build');
app.use(serve(buildDirectory));
app.use(async ctx => {
  if( ctx.status === 404 && ctx.path.indexOf('/api') !== 0){
    await send(ctx, 'index.html', {root: buildDirectory})
  }
})

const port = PORT || 4000;
app.listen(port, () => {
  console.log('Listening to port %d', port);
});
