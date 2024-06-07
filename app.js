const express = require('express')
const app = express()

const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

let db = null

const intailizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running started at localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}

app.use(express.json())
intailizeDBAndServer()

///API1
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
app.get('/todos/', async (request, response) => {
  let data = null
  let getQuery = ''
  let {search_q = '', status, priority} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getQuery = `
      SELECT *
      FROM todo 
      WHERE todo LIKE '%${search_q}%',
      AND status = '${status}',
      AND priority = '${priority}';
      `
      break
    case hasPriorityProperty(request.query):
      getQuery = `
    SELECT *
    FROM todo 
    WHERE todo LIKE '%${search_q}%' 
    AND priority = '${priority}';
    `
      break
    case hasStatusProperty(request.query):
      getQuery = `
    SELECT *
    FROM todo 
    WHERE todo LIKE '%${search_q}'
    AND status = '${status}';
    `
      break
    default:
      getQuery = `
    SELECT *
    FROM todo 
    WHERE todo LIKE '%${search_q}%';
    `
  }
  data = await db.all(getQuery)
  const ans = data => {
    return {
      id: data.id,
      todo: data.todo,
      priority: data.priority,
      status: data.status,
    }
  }
  response.send(data.map(each => ans(each)))
})
module.exports = app
///API2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoID} = request.params
  const getQuery = `
  SELECT * 
  FROM todo 
  WHERE id = '${todoID}';
  `
  let query = await db.get(getQuery)
  response.send({
    id: query.id,
    todo: query.todo,
    priority: query.priority,
    status: query.status,
  })
})

//API 3

app.post('/todos/', async (request, response) => {
  const bodydetails = request.body
  const {id, todo, priority, status} = bodydetails
  const getquery = `
  INSERT INTO todo (id,todo,priority,status)
  VALUES (
    '${id}',
    '${todo}',
    '${priority}',
    '${status}'
  );
  `
  await db.run(getquery)
  response.send('Todo Successfully Added')
})

//API4
app.put('/todos/:todoId/', async (request, response) => {
  let updateColumn = ''
  const {todoID} = request.params
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
  }
  const priviousQuery = `
  SELECT *
  FROM todo 
  WHERE id = '${todoID}';
  `
  const priviousTodo = await db.run(priviousQuery)
  const {
    todo = priviousTodo.todo,
    priority = priviousTodo.priority,
    status = priviousTodo.status,
  } = requestBody
  const updatedTodoQuery = `
  UPDATE todo
  SET 
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE 
  id ='${todoID}';
  `
  await db.run(updatedTodoQuery)
  response.send(`${updateColumn} Updated`)
})

//API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoID} = request.params
  const getQuery = `
  DELETE FROM todo 
  WHERE id = '${todoID}';
  `
  await db.run(getQuery)
  response.send('Todo Deleted')
})
module.exports = app
