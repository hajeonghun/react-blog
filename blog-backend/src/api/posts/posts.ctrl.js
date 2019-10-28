/* eslint-disable require-atomic-updates */
import Post from '../../models/post';
import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';
//Request Body 검증
import Joi from 'joi';

const sanitizeOption = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allwedSchemes: ['data', 'http'],
};

//Object 검증 및 포스트 조회
const { ObjectId } = mongoose.Types;
export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400;
    return;
  }
  try {
    const post = await Post.findById(id);
    if (!post) {
      ctx.stauts = 404; //Not Found
      return;
    }
    ctx.state.post = post;
    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

//id로 조회한 포스트가 로그인 중인 사용자가 작성한 것인지 확인.
export const checkOwnPost = (ctx, next) => {
  const { user, post } = ctx.state;
  if (post.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};

/* 포스트 작성
POST /api/posts
{title, body, tags} */
export const write = async ctx => {
  //---------------Request Body 검증-----------------s
  const schema = Joi.object().keys({
    //객체가 다음 필드를 가지고 있음을 검증
    title: Joi.string().required(), //required()가 있으면 필수 항목
    body: Joi.string().required(),
    tags: Joi.array()
      .items(Joi.string())
      .required(), //문자열로 이루어진 배열
  });
  //검증 후 실패인 경우 에러처리
  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  //---------------------------------------------

  const { title, body, tags } = ctx.request.body;
  const post = new Post({
    title,
    body: sanitizeHtml(body,sanitizeOption),
    tags,
    user: ctx.state.user,
  });
  try {
    await post.save(); //save함수호출시, DB에 저장
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

const removeHtmlAndShorten = body => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });
  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};
/* 포스트 목록 조회
GET /api/posts
*/
export const list = async ctx => {
  //query는 문자열, 페이지네이션 기능
  const page = parseInt(ctx.query.page || '1', 10);
  if (page < 1) {
    ctx.status = 400;
    return;
  }
  const { tag, username } = ctx.query;
  const query = {
    ...(username ? { 'user.username': username } : {}),
    ...(tag ? { tags: tag } : {}),
  };

  try {
    const posts = await Post.find(query)
      //   .where(fieldname, value)   //조건
      .sort({ _id: -1 }) //id필드 기준으로 역순 정렬
      .limit(10) //10개 제한
      .skip((page - 1) * 10) //(page-1) * 10 개수 제외하고 보여줌.
      .lean() //데이터 JSON형태로 조회
      .exec(); //쿼리 서버로 전달

    const postCount = await Post.countDocuments(query).exec();
    ctx.set('Last-Page', Math.ceil(postCount / 10));

    //내용 길이 제한 첫번째 방법
    // ctx.body = posts
    //   .map(post => post.toJSON())
    //   .map(post => ({
    //     ...post,
    //     body:
    //       post.body.length < 200 ? post.body : `${post.body.slice(0, 200)}...`,
    //   }));

    //내용 길이 제한 두번째 방법(find뒤에 lean()함수 사용시 처음부터 데이터 JSON형태로 조회)
    ctx.body = posts.map(post => ({
      ...post,
      body: removeHtmlAndShorten(post.body),
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*특정 포스트 조회
GET /api/posts/:id
*/
export const read = ctx => {
  ctx.body = ctx.state.post;
};

/* 특정 포스트 제거
DELETE /api/posts/:id66
*/
export const remove = async ctx => {
  const { id } = ctx.params;
  try {
    await Post.findByIdAndRemove(id).exec();

    ctx.status = 204; //No Content(성공했지만 응답 데이터 X)
  } catch (e) {
    ctx.throw(500, e);
  }
};

/* 포스트 수정(교체)
PUT /api/posts/:id
{title, body}
*/
// export const replace = ctx => {};

/* 포스트 수정(특정 필드 변경)
PATCH /api/posts/:id
{title, body}
*/
export const update = async ctx => {
  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });
  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { id } = ctx.params;
  const nextData = {...ctx.request.body};
  if(nextData.body){
    nextData.body = sanitizeHtml(nextData.body);
  }

  try {
    //findByIdAndUpdate(id, 변경 값, 옵션, 콜백)
    const post = await Post.findByIdAndUpdate(id, nextData, {
      new: true, // 이 값 설정하면 업데이트된 데이터를 반환함
    }).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }

    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

//--------------- 연습 칸 ---------------------//

//--------------- User 연습용 ---------------
// export const write = async ctx => {
//   const { name, id, passwd } = ctx.request.body;
//   const user = new User({
//     name,
//     id,
//     passwd,
//   });
//   try {
//       await user.save();
//
//       ctx.body = user;
//   } catch(e){
//       ctx.throw(500,e);
//   }
// };
