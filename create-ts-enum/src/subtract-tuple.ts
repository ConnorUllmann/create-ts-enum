const removeElementSymbol = Symbol();

type MarkTupleElementsForRemoval<T, U> = {
  [K in keyof T]: T[K] extends U ? typeof removeElementSymbol : T[K];
};

type RemoveMarkedElementsFromTuple<Tuple, Result extends readonly any[] = []> = Tuple extends readonly []
  ? Result
  : Tuple extends readonly [infer First, ...infer Rest]
  ? First extends typeof removeElementSymbol
    ? RemoveMarkedElementsFromTuple<Rest, Result>
    : RemoveMarkedElementsFromTuple<Rest, [...Result, First]>
  : [];

/**
 * @description Given a tuple, returns a new tuple that removes all elements that extend the given union while maintaining order.
 * @example ```typescript
 * type Tuple = ['a', 'b', 'c', 'd', 'e']
 * type Exclusion = 'b' | 'd';
 * type Result = SubtractTuple<Tuple, Exclusion> // ['a', 'c', 'e']
 * ```
 */
export type SubtractTuple<Tuple extends readonly any[], Union> = RemoveMarkedElementsFromTuple<
  MarkTupleElementsForRemoval<Tuple, Union>
>;
