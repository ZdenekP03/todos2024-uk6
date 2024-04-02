import express from 'express'
import knex from 'knex'
import knexfile from './knexfile.js'

const app = express()
const db = knex(knexfile)

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  console.log('Incomming request', req.method, req.url)
  next()
})

app.get('/', async (req, res) => {
  const todos = await db().select('*').from('todos')

  res.render('index', {
    title: 'Todos',
    todos,
  })
})

app.get('/todo/:id', async (req, res, next) => {
  const todo = await db('todos').select('*').where('id', req.params.id).first()

  if (!todo) return next()

  res.render('todo', {
    todo,
  })
})

app.post('/add-todo', async (req, res) => {
  const todo = {
    title: req.body.title,
    done: false,
  }

  await db('todos').insert(todo)

  res.redirect('/')
})

app.post('/update-todo/:id', async (req, res, next) => {
  const todo = await db('todos').select('*').where('id', req.params.id).first()

  if (!todo) return next()

  await db('todos').update({ title: req.body.title }).where('id', todo.id)

  res.redirect('back')
})

app.get('/remove-todo/:id', async (req, res) => {
  const todo = await db('todos').select('*').where('id', req.params.id).first()

  if (!todo) return next()

  await db('todos').delete().where('id', todo.id)

  res.redirect('/')
})

app.get('/toggle-todo/:id', async (req, res, next) => {
  const todo = await db('todos').select('*').where('id', req.params.id).first()

  if (!todo) return next()

  await db('todos').update({ done: !todo.done }).where('id', todo.id)

  res.redirect('back')
})

app.get('/change-priority/:id', async (req, res) => {
  const todoId = req.params.id;

  try {
    const todo = await db('todos').select('priority').where('id', todoId).first();
    
    const priorities = ['low', 'normal', 'high'];

    const currentIndex = priorities.indexOf(todo.priority);

    const newIndex = (currentIndex + 1) % priorities.length;

    const newPriority = priorities[newIndex];

    await db('todos').update({ priority: newPriority }).where('id', todoId);

    res.redirect("back")
  } catch (error) {
    console.error('Chyba při změně priority úkolu:', error);
    res.status(500).json({ error: 'Došlo k chybě při změně priority úkolu.' });
  }
});

app.use((req, res) => {
  res.status(404)
  res.send('404 - Stránka nenalezena')
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500)
  res.send('500 - Chyba na straně serveru')
})

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000')
})
