import { ObjectId } from 'mongodb';
import type { DateFieldConfig } from '@/types';
import { resolveDateField } from './date-utils';

/**
 * Strips UI-only extensions ($inOptions) from a query object
 * and converts date strings to Date objects for MongoDB.
 */
export function buildMongoQuery(
  query: Record<string, any>,
  dateFields?: DateFieldConfig[]
): Record<string, any> {
  const mongoQuery: Record<string, any> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleaned: Record<string, any> = {};
      for (const [op, opVal] of Object.entries(value)) {
        // Skip UI-only extension
        if (op === '$inOptions') continue;

        // Convert date strings and numeric strings in comparison operators
        if ((op === '$gte' || op === '$gt' || op === '$lte' || op === '$lt' || op === '$ne') && typeof opVal === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(opVal)) {
            cleaned[op] = (op === '$lte' || op === '$lt')
              ? new Date(opVal + 'T23:59:59.999Z')
              : new Date(opVal + 'T00:00:00.000Z');
          } else if (!isNaN(Number(opVal)) && opVal.trim() !== '') {
            cleaned[op] = Number(opVal);
          } else {
            cleaned[op] = opVal;
          }
        } else if ((op === '$in' || op === '$nin' || op === '$all') && Array.isArray(opVal)) {
          // Convert special values in array operators
          cleaned[op] = opVal.map((v: string) => {
            if (typeof v === 'string' && v === 'null') return null;
            if (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v)) {
              return new ObjectId(v);
            }
            return v;
          });
        } else {
          cleaned[op] = opVal;
        }
      }
      if (Object.keys(cleaned).length > 0) {
        mongoQuery[key] = cleaned;
      }
    } else if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
      mongoQuery[key] = new ObjectId(value);
    } else {
      mongoQuery[key] = value;
    }
  }

  // Resolve dateFields and merge
  if (dateFields && dateFields.length > 0) {
    for (const df of dateFields) {
      const range = resolveDateField(df);
      mongoQuery[df.accessor] = {
        $gte: new Date(range.$gte + 'T00:00:00.000Z'),
        $lte: new Date(range.$lte + 'T23:59:59.999Z'),
      };
    }
  }

  return mongoQuery;
}

/**
 * Parses bracket-notation query params from a URL into a nested object.
 * e.g. "invoiceDate[$gte]=2026-01-01" → { invoiceDate: { $gte: "2026-01-01" } }
 */
export function parseQueryParams(searchParams: URLSearchParams): {
  filter: Record<string, any>;
  sort: Record<string, number>;
  limit: number;
  skip: number;
} {
  const filter: Record<string, any> = {};
  let sort: Record<string, number> = { invoiceDate: -1 };
  let limit = 10;
  let skip = 0;

  for (const [rawKey, value] of searchParams.entries()) {
    if (rawKey === '$limit') {
      limit = Math.min(Math.max(parseInt(value, 10) || 10, 1), 100);
      continue;
    }
    if (rawKey === '$skip') {
      skip = Math.max(parseInt(value, 10) || 0, 0);
      continue;
    }

    // Handle $sort[field]
    const sortMatch = rawKey.match(/^\$sort\[(.+)\]$/);
    if (sortMatch) {
      const field = sortMatch[1];
      sort[field] = value === '-1' || value === 'false' ? -1 : 1;
      continue;
    }

    // Skip non-filter params
    if (rawKey.startsWith('$') || rawKey === 'addShareLink') continue;

    // Handle bracket notation: field[$in][0]=value, field[$nin][0]=value, or field[$op]=value
    const arrayOpMatch = rawKey.match(/^(.+?)\[(\$(?:in|nin|all))\]\[(\d+)\]$/);
    if (arrayOpMatch) {
      const field = arrayOpMatch[1];
      const op = arrayOpMatch[2];
      if (!filter[field]) filter[field] = {};
      if (!filter[field][op]) filter[field][op] = [];
      filter[field][op].push(value);
      continue;
    }

    const bracketMatch = rawKey.match(/^(.+?)\[(\$[a-zA-Z]+)\]$/);
    if (bracketMatch) {
      const field = bracketMatch[1];
      const op = bracketMatch[2];
      if (!filter[field]) filter[field] = {};
      filter[field][op] = value;
    } else {
      // Check for boolean-like values
      if (value === 'true') {
        filter[rawKey] = true;
      } else if (value === 'false') {
        filter[rawKey] = false;
      } else {
        filter[rawKey] = value;
      }
    }
  }

  return { filter, sort, limit, skip };
}
