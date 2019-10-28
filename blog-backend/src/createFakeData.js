import Post from './models/post';

export default function createFakeData() {
  const posts = [...Array(40).keys()].map(i => ({
    title: `포스트#${i}`,
    body:
      'LoremAnim ea exercitation veniam culpa magna minim amet irure ut est. Magna reprehenderit est officia proident quis pariatur ullamco consectetur minim magna ullamco velit commodo. Cillum eiusmod ut deserunt nostrud non fugiat. Aliquip aliquip adipisicing tempor ullamco reprehenderit dolore proident voluptate cillum reprehenderit pariatur. Ullamco irure sunt proident anim irure incididunt elit non aliqua aliquip proident aute consectetur esse. Esse excepteur dolor est velit enim quis enim sint reprehenderit commodo aliqua tempor.',
    tags: ['가짜', '데이터'],
  }));
  Post.insertMany(posts, (err, docs) => {
    console.log(docs);
  });
}
