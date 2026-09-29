# API

- POST /auth/sign-up | sign-in | refresh | logout
- GET/PATCH /me
- GET /team  PATCH /users/{id}/role  (manager)
- GET/POST /boards  GET /boards/{id}
- POST /boards/{id}/cards  PATCH /boards/{id}/cards/{id}
- POST /boards/{id}/cards/{id}/move  (409 at WIP for non-managers)
- POST /boards/{id}/cards/{id}/block
- POST /boards/{id}/cards/{id}/comments  POST checklist  PATCH checklist/{id}
- PATCH /boards/{id}/columns/{id}  policy + wip_limit
- GET /calendar?year=&month=  (manager | authorized)
