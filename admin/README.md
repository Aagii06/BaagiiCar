# baagii-car-dealer · admin

Admin panel for the BaagiiCar backend (`../backend`, port 5008), in the AutoZah style. Same structure as the baagii-shop admin: Next.js 16, phone-width layout with a bottom tab bar.

```bash
cp .env.example .env   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WEB_URL
npm install
npm run dev            # http://localhost:3781
```

Sign in with a user whose role is `Админ` (see `backend/seeders/…-seed-admin.js`).

| Tab | What | Backend |
| --- | --- | --- |
| Самбар | Counts, latest ads | `/api/base/{cars,users,brands,carModels}`, `/api/base/vwCars` |
| Зарууд | Search / filter ads; feature, mark sold, delete; edit or add (`/cars/new`) | `/api/base/vwCars`, `/api/cars/save`, `/api/cars/mark-sold` |
| Каталог | Brands, models, body types, locations (CRUD) | `/api/base/{brands,carModels,bodyTypes,locations}` |
| Хэрэглэгч | Users: role, status, password | `/api/base/users`, `/api/users/change-password` |
| Профайл | Own password, sign out | `/api/users/change-password` |

`/api/cars/save` deletes any photo it isn't told to keep, so the "Онцлох" toggle re-sends the ad's existing photo ids (`setFeatured` in `src/lib/api/admin.ts`).
