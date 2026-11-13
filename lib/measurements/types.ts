import type { MeasurementsValues } from "@/lib/schemas/measurements";

/** Результат серверных экшенов мерок (T-19); модуль экшенов может экспортировать только функции. */
export interface MeasurementsActionResult {
  status: "success" | "error";
  message: string;
  values?: MeasurementsValues;
}
