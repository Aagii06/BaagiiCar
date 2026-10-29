# Cardealer SMS Gateway

Android утасны SIM-ээр backend-ийн OTP (нэвтрэх код) SMS-ийг илгээдэг app.

## Ерөнхий бүтэц

```
[Вэб / app] --(1) утасны дугаар--> [Node.js backend] --(2) API--> [Android утас + SIM] --(3) SMS--> [Хэрэглэгч]
[Вэб / app] --(4) дугаар + код --> [Node.js backend] --(5) шалгаад token буцаана
```

- Backend код үүсгэж hash-аар нь хадгална. SMS-ийг `sms_outbox` хүснэгтэд дараалалд хийнэ.
- Android утас backend руу өөрөө холбогдож (long-poll) мессежийг татаж аваад өөрийн SIM-ээр илгээнэ.
- Утас үр дүнгээ (`sent` / `failed`) backend руу мэдээлнэ.
- Утас гаднаас хандах IP хэрэггүй: холболтыг үргэлж утас өөрөө эхлүүлдэг.

## 1. Backend тохиргоо

```bash
cd backend
npm run migrate            # sms_outbox хүснэгт үүснэ
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # token үүсгэнэ
```

Гарсан утгыг `backend/.env` (production дээр `.env.production`)-д нэмнэ:

```
SMS_GATEWAY_TOKEN=энд_үүсгэсэн_token
```

Дараа нь backend-ээ restart хийнэ.

> `SMS_GATEWAY_TOKEN` хоосон бол SMS илгээхгүй бөгөөд бүх дугаарт `OTP_DEV_CODE` (анхдагч `2222`) код ажиллана.

## 2. APK гаргах

```bash
cd sms_gateway_app
flutter build apk --release
```

APK: `sms_gateway_app/build/app/outputs/flutter-apk/app-release.apk`

## 3. Утсанд суулгах

1. APK-г утсандаа хуулна (USB, Telegram, Google Drive г.м.).
2. Нээгээд суулгана. "Тодорхойгүй эх сурвалжаас суулгах"-ыг зөвшөөрөх хэрэгтэй.
3. App-ыг нээхэд гарч ирэх **SMS илгээх** болон **мэдэгдэл**-ийн зөвшөөрлийг өгнө.

## 4. App тохируулах

1. **Серверийн хаяг**: backend-ийн хаяг, жишээ нь `https://api.example.mn` эсвэл `http://192.168.1.10:5011`
2. **Token**: `.env` дахь `SMS_GATEWAY_TOKEN`-тэй яг ижил утга
3. **Эхлүүлэх** дарна. Төлөв ногоон **"Ажиллаж байна"** болно.
4. Шар анхааруулга дээрх **"Чөлөөлөх"**-ийг заавал дарж батарейн хязгаарлалтаас чөлөөлнө. Үгүй бол дэлгэц унтрахад холболт тасарна.
5. **Туршилтын SMS** хэсэгт өөрийн дугаараа оруулаад **Илгээх** дарж SIM ажиллаж байгааг шалгана.

Үүний дараа вэб дээр утсаар нэвтрэхэд код жинхэнэ SMS-ээр очно.

## Анхаарах зүйлс

- **Утсаа цэнэглэгчид залгаатай, интернэттэй (Wi-Fi эсвэл дата) байлгана.**
- SIM-д SMS илгээх эрх, нэгж/багц хангалттай байх ёстой.
- Dual SIM утсанд Android-ийн **үндсэн SMS SIM** ашиглагдана (Тохиргоо → SIM картууд).
- Утас дахин асахад gateway автоматаар эхэлнэ (өмнө нь асаалттай байсан бол).
- Xiaomi, Huawei, Oppo, Vivo, Samsung зэрэг утсанд нэмэлт батарей хэмнэгч байдаг. App-ын тохиргоонд **Autostart**-ыг асааж, батарейн горимыг **"Хязгааргүй / No restrictions"** болгоно.
- Gateway утас 90 секундээс удаан холбогдоогүй бол OTP хүсэлт "SMS илгээх утас холбогдоогүй байна" гэсэн алдаа буцаана.
- 10 минутаас хуучин мессежийг илгээхгүй (OTP аль хэдийн хүчингүй болсон). Илгээж чадаагүй мессежийг 3 хүртэл удаа дахин оролдоно.

## Алдаа засах

| Төлөв / лог | Шалтгаан |
|---|---|
| `Token буруу (401)` | App дахь token `.env`-тэй таарахгүй байна, эсвэл backend-ээ restart хийгээгүй |
| `HTTP 404` | Серверийн хаяг буруу, эсвэл backend шинэчлэгдээгүй |
| `Холболтын алдаа: ...` | Утсанд интернэт алга, эсвэл сервер унтарсан. Автоматаар дахин холбогдоно |
| `Ерөнхий алдаа (данс/SIM шалгана уу)` | SIM-ийн нэгж дууссан, эсвэл SMS эрхгүй |
| `Сүлжээ байхгүй` | SIM сүлжээнд холбогдоогүй |

## API (backend)

Бүх хүсэлтэд `Authorization: Bearer <SMS_GATEWAY_TOKEN>` header хэрэгтэй.

| Method | Зам | Тайлбар |
|---|---|---|
| GET | `/api/sms-gateway/pending?wait=25` | Илгээх SMS-үүд `{ data: [{ id, phonenumber, text }] }`. Байхгүй бол хамгийн ихдээ 25 секунд хүлээнэ |
| POST | `/api/sms-gateway/:id/status` | `{ status: "sent" \| "failed", error }` |

## Кодын байршил

- Backend: `backend/helper/smsHelper.js`, `backend/api/smsGateway/`
- App UI: `sms_gateway_app/lib/main.dart`
- Ар талын service: `sms_gateway_app/android/app/src/main/kotlin/mn/cardealer/sms_gateway_app/`
