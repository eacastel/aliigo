# Local Development

## 1) Install
```bash
pnpm install

2) Environment

Create .env.local with required keys.

3) Run
pnpm dev

4) Test embed page

Visit:

http://localhost:3000/es/chat?key=YOUR_TOKEN&slug=aliigo&brand=Aliigo

5) Test conversation API
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"token":"YOUR_TOKEN","message":"Hola"}'


If domain gating blocks, add localhost to allowed domains for the business.


---

