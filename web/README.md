# baagii-car-dealer · web

AutoZah design (`Downloads/AutoZah - web&mobile`) on Next.js 16 + Tailwind 4. Public car-ad site for the BaagiiCar backend (`../backend`, port 5008).

```bash
cp .env.example .env   # NEXT_PUBLIC_API_URL=http://localhost:5008
npm install
npm run dev            # http://localhost:3880
```

| Route | Page | Backend |
| --- | --- | --- |
| `/` | Нүүр: hero search, body types, featured ads | `/web/base/vwCars`, `vwBodyTypes`, `vwBrands`, `carModels` |
| `/cars` | Машин авах: filters, sort, pagination | `/web/base/vwCars` |
| `/cars/[id]` | Дэлгэрэнгүй: gallery, specs, leasing calculator | `/web/base/vwCars/:id`, `/web/base/allFiles` |
| `/sell` (`?id=` to edit) | Зар нэмэх | `POST /api/cars/save` (multipart) |
| `/profile` | My ads: edit, mark sold, delete | `/api/cars/mark-sold`, `DELETE /api/base/cars` |
| `/saved` | Favorites | `/api/cars/favorites`, `/api/cars/favorite` |
| `/login`, `/register` | Phone + password | `/api/users/login`, `/api/users/register` |
| `/leasing`, `/help` | Calculator, FAQ + contact | — |
| `/chat` | Chat layout; no messaging API yet, shows the seller's phone | — |

Notes
- The leasing calculator uses illustrative terms (`src/lib/constants.ts` → `LEASING`).
- The backend only applies `desc: true` sorts, so the sort menu offers descending orders only.
- The help form opens a mail draft to `NEXT_PUBLIC_CONTACT_EMAIL`; there is no contact endpoint.
