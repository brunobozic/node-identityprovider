# Node.js Identity API

Node.js Identity API

- structure separated into `frontend` and `backend`, so in order to work in either of them, your current working directory should be located in
  the respective path, so if your working on the node backend, you need to be in the `backend` folder
- backend (`node.js`) and frontend (`angular 10`) will naturally have different linting, prettifying and test configurations so be mindful of that
- the reason why I adopted this folder structure is because I will, at some point, want to use `docker-compose` to bring up the entire stack

## BACKEND
- A simple node restfull API that features user registration, login, authentication and jwt token + refresh token operations
- No typescript (hence no transpiling nor tsconfigs needed)
- No babel (since I dont know which ECMA version restriction will be applied in production, will add babel later if needed)
- Using lint (AirBnB style)
- Has a dependency on a mailer subsystem that is needed in order to send email verification tokens to users who wish to register with the service,
  therefore a working email account is needed for this to work in production, otherwise the users will not be able to verify their accounts
- Has an open api route (swagger UI) located at `root-url/api-docs` route
- Didnt have time to make a separate repository/ORM layer, but for simple apps this is not a requirement anyhow

## FRONTEND
- A simple angular 10 app that uses ugly bootstrap styling 
- Very basic, does not showcase many things I usually need from day 1 when doing angular development.

# URLs
- production backend (Azure): https://nodeidentityapi-bbozic.azurewebsites.net/api-docs/
- production frontend (Azure): tbd
- local development backend (nodemon): http://localhost:4000/api-docs/
- local development frontend (ng): http://localhost:4200 (use `ng serve -o`)

# Error handling (logging)

- I decided to use Winston, had the best documentation

`npm install winston`

# Email setup

- A newly created Gmail email address can be used to testing purposes, for production this is, obviously, not recommended

# How to setup the app (backend)

- The main config file is, obviously: `config.json`
- You need to setup your Mongo connection string in that file in order for the Db connection to be established
- Email (SMTP) settings need to be configured correctly in `config.json` as well
- The first user that is created will get an `admin` role assigned to it by default, all the other users will be "regular" users

# How to debug (backend)

- Using VSC you can attach to a running process
- You can start the proces by using `nodemon server.js` while located (current working directory) in the root directory (backend subfolder)
- I have also included `launch.json` under sample-launch-settings folder that you need to copy into your own `.vscode` folder
- The above mentioned `launch.json` file holds configuration that will enable you to use `Run => Start debugging` from VSC, whilst using nodemon to monitor changes and restart the app

# Jaeger
- mostly to be done in the near future

URL: https://edspencer.net/2020/10/13/distributed-tracing-with-node-js/


# How to PM2

- to be done in the future

`npm install -g pm2`
`pm2 start server.js`
`pm2 start server.js --watch`

`pm2 list` Lists your applications. You'll see a numeric id associated with the applications managed by pm2. You can use that id in the commands you'd like to execute.
`pm2 logs` Checks the logs of your application.
`pm2 stop` Stops your process. (Just because the process is stopped, it doesn't mean it stopped existing. If you want to completely remove the process, you'll have to use delete)
`pm2 delete` Deletes the process. (You don't need to stop and delete separately, you can just go straight for delete, which will stop and delete the process for you)

# Docker stuff

- to be done in the future

`docker build -t nodeidentityprovider .`
`docker image ls`
`docker run -p 4000:4000 nodeidentityprovider`
`docker container ls`


# How to integrate lint and prettier (backend)

- this is how I setup linter:

`npm install eslint eslint-config-prettier prettier -D`

- create a new file named .prettierrc and add the following

`{	 
 "trailingComma": "es5",	 
 "tabWidth": 2,	 
 "semi": false,	 
 "singleQuote": true	 
}`

`./node_modules/.bin/eslint --init`

- also edit this in the file `.eslintrc.js`: 
`"extends": ["airbnb-base","prettier"]`

# How to integrate husky commit hook for prettify (backend)

- to be done in the future:

npm i husky lint-staged -D

- add this to `package.json`:

`"lint-staged": {	 
 	"**/*.{js,jsx}": [	 
 		"npm run lint",	 
 		"prettier --write"	 
 	]	 
 }`

 `npx husky install`

 `npx husky add .husky/pre-commit "npm test"`

 - now edit the precommit file:
<code>
 #!/bin/sh	 
. "$(dirname "$0")/_/husky.sh"	 
# npm test	 
npx lint-staged
</code>


# Rate limiting (express.js) (backend)

- to be done in the future
- sample code below:

<code>
import RateLimit from 'express-rate-limit'

const limiter = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false, 
})
app.use(limiter)`
</code>

# Consul (discovery service) 

- to be done later

# Load test

- to be done later

`npm install -g loadtest`
`loadtest http://localhost:4000/api/nocluster -n 1000 -c 100`


# TODOs and open questions
## backend
- update all npm packages and the package.json file itself
- introduce pretifier with commit hooks enabled
- add PM2 for production deploys (not for managed cloud deploys - obviously)
- PM2 load balancing
- introduce Traefik + LetsEncrypt (probably not for managed cloud deploys)
    need SSL certificate self renewal 
    under docker environment -> do we need PM2? how will Traefik know that a node went down and another went up?
- introduce Prometheus + Grafana (dockerfile, obviously not for managed cloud deploy)
- nodeenv (docker environment variables?)
- Consul discovery service
- application gateway

## frontend
- go MaterialDesign
- introduce the classic UI elements as samples (accordion, paginated grid, wizard, treeview, drag and drop etc.)