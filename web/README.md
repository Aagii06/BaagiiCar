# baagii-car-dealer · web

Baagii Car Dealer site, built from the AutoZah design (`Downloads/AutoZah - web&mobile`) on Next.js 16 + Tailwind 4. Public car-ad site for the BaagiiCar backend (`../backend`, port 5011).

```bash
cp .env.example .env   # NEXT_PUBLIC_API_URL=http://localhost:5011
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
| `/login` (`/register` redirects here) | Phone → 4-digit code; a new number is registered on the spot. Until SMS is connected the code is `OTP_DEV_CODE` from `backend/.env` (default `2222`) for every number; admin accounts are refused and use their password in the admin panel | `/api/users/otp-send`, `/api/users/otp-login` |
| `/leasing`, `/help` | Calculator, FAQ + contact | — |
| `/chat` | Chat layout; no messaging API yet, shows the seller's phone | — |

Notes
- The leasing calculator uses illustrative terms (`src/lib/constants.ts` → `LEASING`).
- Sort menu: newest, oldest, price ↑, price ↓, most viewed (`CAR_SORTS` in `src/lib/api/cars.ts`).
- The help form opens a mail draft to `NEXT_PUBLIC_CONTACT_EMAIL`; there is no contact endpoint.
