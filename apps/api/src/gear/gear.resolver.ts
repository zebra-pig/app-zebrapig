import { listSilk, query, resolver } from "@gqloom/core";
import * as v from "valibot";
import { GearCategorySchema, GearUnitSchema } from "./gear.gql.schema";
import { useGearService } from "./gear.service";
import { getContext } from "../graphql/graphql.helpers";
import { bearerGuard } from "../auth/bearerGuard";

/**
 * Privileged gear reads for internal / mobile-app use. Guarded by a static
 * bearer today (bearerGuard); swap to Better Auth's authGuard() later without
 * touching the resolver shape.
 */
export const gearResolver = resolver(
  {
    gearUnits: query(listSilk(GearUnitSchema))
      .input({ category: v.nullish(v.string()), status: v.nullish(v.string()) })
      .resolve(async ({ category, status }, payload) => {
        const c = getContext(payload);
        return useGearService(c).listUnits({
          category: category ?? undefined,
          status: status ?? undefined,
        });
      }),

    gearUnit: query(v.nullish(GearUnitSchema))
      .input({ name: v.string() })
      .resolve(async ({ name }, payload) => {
        const c = getContext(payload);
        return useGearService(c).getUnit(name);
      }),

    gearCategories: query(listSilk(GearCategorySchema)).resolve(async (_input, payload) => {
      const c = getContext(payload);
      return useGearService(c).listCategories();
    }),
  },
  { middlewares: [bearerGuard()] },
);
