# Apika

> **Just.. don't**

# Backend

Setup with Fastify.

```typescript
import {ApikaServ} from 'apika/serv';

export const apiControllers = {
  client_product_loadAll: loadAllController,
  ...
} as const;

export type ApiControllers = typeof apiControllers;

export const apikaServ = new ApikaServ(apiControllers);
```

```typescript
Core.app.post('/api/:controller', async _req => {
  return await apikaServ.handle({
    controller: (_req.params as any).controller,
    body: _req.body,
    ctx: {
      headers: _req.headers,
    },
  });
});
```


# Frontend

It is important to import exactly types, not the whole backend code: `import type ...`.

```typescript
import type {ApiControllers} from '@@api';
import {Injectable} from '@angular/core';
import {Apika} from 'apika';

@Injectable({
  providedIn: 'root',
})
export class Api extends Apika<ApiControllers> {
  url = '/api/';
}
```

**Apika** uses `HttpClient`, you have to setup it properly:

```typescript
TODO
```

## Req

Render template if status is `Succeed`:

```html
<div *req="loadAllReq.status">
  ...
</div>
```

You can provide custom views for `Ongoing` and `Failed` statuses:

```typescript
{
  provide: ApikaReqOngoing,
  useValue: LoadingSpinnerComponent,
},
{
  provide: ApikaReqFailed,
  useValue: LoadingErrorComponent,
}
```

# TODO

* prettier
* README
  * ReqOutlet demo
  * tsconfig paths demo
  * Controller demo
  * Auth demo
  * zod demo
  * Prisma demo
  * err
* tests
