const express = require('express')
const { MongoClient, ObjectID } = require('mongodb')

const PORT = 3000
const dbUrl = 'mongodb://localhost:27017'

const client = new MongoClient(dbUrl, {
  useUnifiedTopology: true,
  socketTimeoutMS: 3000
});

const app = express()

// 处理 contentType = 'application/json' 格式的请求体
// 处理结果放置到req.body中
app.use(express.json())

// 新增文章
app.post('/articles', async (req, res, next) => {
  try {
    // 获取参数
    const { article } = req.body
    // 校验参数
    if (!article || !article.body || !article.title || !article.description) {
      return res.status(422).json({
        error: '请求参数不合法'
      })
    }
    article.createdAt = new Date()
    article.updatedAt = new Date()
  
    await client.connect()
    const dbCollection = client.db('test').collection('article')
    const result = await dbCollection.insertOne(article)
    article._id = result.insertedId
    await client.close()
  
    res.status(201).json({
      article
    })
  } catch (err) {
    next(err)
  }
})

// 获取文章列表
app.get('/articles', async (req, res, next) => {
  try {
    let { page = 1, size = 10 } = req.query
    page = Number.parseInt(page)
    size = Number.parseInt(size)
    await client.connect()
    const dbCollection = client.db('test').collection('article')
    const result = await dbCollection
      .find({})
      .skip((page - 1) * size)
      .limit(size)
    const articles = await result.toArray()
    const articleCount = await dbCollection.countDocuments()
    res.status(200).json({
      articles,
      articleCount
    })
  } catch (err) {
    next(err)
  }
})

// 获取单个文章
app.get('/articles/:id', async (req, res, next) => {
  try {
    const _id = ObjectID(req.params.id)
    await client.connect()
    const dbCollection = client.db('test').collection('article')
    const article = await dbCollection.findOne({
      _id
    })
    res.status(200).json({
      article
    })
  } catch (err) {
    next(err)
  }
})

// 更新文章
app.patch('/articles/:id', async (req, res, next) => {
  try {
    const _id = ObjectID(req.params.id)
    let article = req.body.article
    console.log(123, article)
    await client.connect()
    const dbCollection = client.db('test').collection('article')
    dbCollection.updateOne({
      _id
    }, {
      $set: article
    })
    article = await dbCollection.findOne({
      _id
    })
    res.status(200).json({
      article
    })
  } catch(err) {
    next(err)
  }
})

// 删除文章
app.delete('/articles/:id', async (req, res, next) => {
  try {
    const _id = ObjectID(req.params.id)
    await client.connect()
    const dbCollection = client.db('test').collection('article')
    await dbCollection.deleteOne({
      _id
    })
    res.status(200).end()
  } catch(err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  })
})

app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`)
})