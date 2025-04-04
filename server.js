const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const dotenv = require('dotenv')
dotenv.config()
const userService = require('./user-service.js')

const HTTP_PORT = process.env.PORT || 8080
console.log(HTTP_PORT)

let ExtractJwt = passportJWT.ExtractJwt
let JwtStrategy = passportJWT.Strategy

console.log(process.env.JWT_SECRET !== null)
let jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: process.env.JWT_SECRET,
}

let strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  console.log('payload received', jwt_payload)

  let user = jwt_payload
    ? {
      _id: jwt_payload._id,
      userName: jwt_payload.userName,
    }
    : false

  next(null, user)
})

passport.use(strategy)
app.use(passport.initialize())

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send({ message: 'Api listening' })
})

app.post('/api/user/register', (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg })
    })
    .catch((msg) => {
      res.status(422).json({ message: msg })
    })
})

app.post('/api/user/login', (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      let payload = {
        _id: user._id,
        userName: user.userName,
        fullName: user.fullName,
        role: user.role,
      }

      let token = jwt.sign(payload, jwtOptions.secretOrKey)

      res.json({ message: 'login successful', token: token })
    })
    .catch((msg) => {
      res.status(422).json({ message: msg })
    })
})

app.get(
  '/api/user/favourites',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data)
      })
      .catch((msg) => {
        res.status(422).json({ error: msg })
      })
  }
)

app.put(
  '/api/user/favourites/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data)
      })
      .catch((msg) => {
        res.status(422).json({ error: msg })
      })
  }
)

app.delete(
  '/api/user/favourites/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data)
      })
      .catch((msg) => {
        res.status(422).json({ error: msg })
      })
  }
)

app.get(
  '/api/user/history',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .getHistory(req.user._id)
      .then((data) => {
        res.json(data)
      })
      .catch((msg) => {
        res.status(422).json({ error: msg })
      })
  }
)

app.put('/api/user/history/:id', (req, res) => {
  userService
    .addHistory(req.user._id, req.params.id)
    .then((data) => {
      res.json(data)
    })
    .catch((msg) => {
      res.status(422).json({ error: msg })
    })
})

app.delete(
  '/api/user/history/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .removeHistory(req.user._id, req.params.id)
      .then((data) => {
        res.json(data)
      })
      .catch((msg) => {
        res.status(422).json({ error: msg })
      })
  }
)

app.get('/', (req, res) => {
  res.send({ message: 'API Listening' })
})
userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log('API listening on: ' + HTTP_PORT)
    })
  })
  .catch((err) => {
    console.log('unable to start the server: ' + err)
    process.exit()
  })
