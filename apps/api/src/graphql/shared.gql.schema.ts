import * as v from "valibot";

// Shared GraphQL building blocks (mirrors the filmkit convention).

/** A whole number mapped to GraphQL `Int` by the valibot weaver preset. */
export const int = () => v.pipe(v.number(), v.integer());

/** A nullish string — the default for optional ERPNext text fields. */
export const str = () => v.nullish(v.string());
