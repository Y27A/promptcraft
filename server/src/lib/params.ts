import { HttpError } from "../middleware/errorHandler";

export function parseIdParam(value: string | string[] | undefined, name = "id"): number {
  if (typeof value !== "string") throw new HttpError(400, `Invalid ${name}`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `Invalid ${name}`);
  }
  return parsed;
}
