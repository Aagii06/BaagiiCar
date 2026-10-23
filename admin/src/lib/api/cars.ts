// Same surface as the web's lib/api/cars.ts, so the shared CarForm works here.
import * as admin from "./admin";

export type { AutoboxData, CarInput, PhotoItem, VehicleInfo } from "./admin";
export const { getBrands, getBodyTypes, getLocations, getDealers, parseAutobox, saveCar, vehicleLookup } = admin;

export async function getModels(brandId?: number) {
  const rows = await admin.getModels();
  return brandId ? rows.filter((m) => m.brand_id === brandId) : rows;
}
