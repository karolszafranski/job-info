# job-info

Initial use case is counting number of warnings in a project during build phase. As a part of continuous integration review process you can verify if new warnings were introduced.

### Required environment variables

- `SALT` used in signature
- `DATABASE_URL` postgres database URL, ex `postgres://ussername:password@host.example.com:5432/dbname?ssl=true`

### Deployment

From root directory of the repository:
```
$ heroku create
```

Set salt variable:
```
$ heroku config:set SALT=abcde
```

Add free postgresql db:
```
$ heroku addons:create heroku-postgresql:hobby-dev
```

Connect to db:
```
$ heroku pg:psql
```

Create table:
```
CREATE TABLE warnings (
	id SERIAL PRIMARY KEY,
	app VARCHAR (128) UNIQUE NOT NULL,
	count INT NOT NULL
);
```

Populate:
```
INSERT INTO warnings(app, count) VALUES ('com.example.app', 100);
```

Use `\q` to exit.

Push source code to heroku:
```
$ git push heroku master
```

### Usage

Define variables:

```
HEROKU_URL="https://your.herokuapp.com/"

export SALT="abcde"
export DATE="$(date +%s)"
export APP="com.example.app"
SIGNATURE=$(echo -n "${SALT}${APP}${DATE}" | openssl dgst -sha256)
```

Get current value:

```
curl -X GET \
  "${HEROKU_URL}warning/${APP}" \
  -H "Signature: ${SIGNATURE}" \
  -H "Timestamp: ${DATE}"
```

Update current value:
```
curl -X POST \
  "${HEROKU_URL}warning/${APP}" \
  -H "Signature: ${SIGNATURE}" \
  -H "Timestamp: ${DATE}" \
  -d count=102
```