type IsUnion<T, B = T> = T extends any ? ([B] extends [T] ? false : true) : never;

type RemoveDuplicates<A extends PropertyKey, B extends PropertyKey, T> = T extends Record<A, B>
  ? {
      [K in keyof T as T[K]]: IsUnion<K> extends true ? never : K;
    } extends infer X
    ? X extends Record<PropertyKey, PropertyKey>
      ? Readonly<InvertedMapping<X>> & {
          readonly [K in Exclude<A, X[keyof X]>]: never;
        }
      : never
    : never
  : never;

type ExtraKeys<A extends PropertyKey, T> = Exclude<keyof T, A>;

type ExtraValues<B extends PropertyKey, T> = Exclude<T[keyof T], B>;

type Result<A extends PropertyKey, B extends PropertyKey, T> = ExtraKeys<A, T> extends never
  ? ExtraValues<B, T> extends never
    ? RemoveDuplicates<A, B, T>
    : { readonly [K in keyof T]: ExtraValues<B, T> extends T[K] ? never : T[K] }
  : { readonly [K in keyof T]: K extends ExtraKeys<A, T> ? never : T[K] };

type GetTupleIndicesUnion<tuple extends readonly PropertyKey[]> = {
  [index in keyof tuple]: index;
}[number];

type AreTuplesSameLength<tupleA extends readonly PropertyKey[], tupleB extends readonly PropertyKey[]> = Exclude<
  GetTupleIndicesUnion<tupleB>,
  GetTupleIndicesUnion<tupleA>
> extends never
  ? Exclude<GetTupleIndicesUnion<tupleA>, GetTupleIndicesUnion<tupleB>> extends never
    ? true
    : false
  : false;

type InvertedMapping<T> = T extends Record<PropertyKey, PropertyKey>
  ? {
      [K in keyof T as T[K]]: K;
    }
  : never;

/**
 * @param mapping A mapping for which to invert keys & values.
 * @param valueByMappingKey A mapping from the keys of mapping to the actual value for that key in the enum (since it being a key in mapping means it may have been coerced to a string).
 * @returns The inverse of the given mapping.
 */
function invertMapping<T extends Record<PropertyKey, PropertyKey>>(mapping: T, valueByMappingKey: Record<PropertyKey, PropertyKey>): InvertedMapping<T> {
  const invertedMapping = {} as Record<PropertyKey, PropertyKey>;

  const keys: (string | symbol)[] = Object.keys(mapping);
  
  // Include symbol keys from the mapping as well
  for(const symbol of Object.getOwnPropertySymbols(mapping)) {
    keys.push(symbol);
  }

  for (const key of keys) {
    const keyAsEnumValue = valueByMappingKey[key]
    const value = mapping[key];
    if(value != null && keyAsEnumValue != null) {
      invertedMapping[value] = keyAsEnumValue
    }
  }
  return invertedMapping as InvertedMapping<T>;
}

/**
 * @param enumValuesA The list of enum values to expect as keys.
 * @param _enumValuesB The list of enum values to expect as values.
 * @returns An object with a Create method that can be called with a mapping which will guarantee it is a one-to-one mapping and return an object containing the mapping and its inverse.
 * @example ```typescript
 * const { Enum: Enum0, List: List0 } = CreateEnum({ A: 0 }, { B: 1 }, { C: 2 });
 * const { Enum: Enum1, List: List1 } = CreateEnum({ B: 'b' }, { C: 'c' }, { D: 'd' });
 * 
 * const { Mapping, InverseMapping } = EnumOneToOneMapper(List0, List1).Create({
 *   [Enum0.A]: Enum1.D,
 *   [Enum0.B]: Enum1.B,
 *   [Enum0.C]: Enum1.C
 * });
 * 
 * Mapping; // { 0: 'd', 1: 'b', 2: 'c' }
 * InverseMapping; // { d: 0, b: 1, c: 2 }
 * ```
 */
export function EnumOneToOneMapper<
  const A extends readonly PropertyKey[],
  const B extends readonly PropertyKey[]
>(enumValuesA: A, _enumValuesB: AreTuplesSameLength<A, B> extends true ? B : never) {
  // Get a mapping from the object key form of each value in enumValuesA to its actual enum value.
  const enumValueByKeyA = enumValuesA.reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {} as Record<PropertyKey, PropertyKey>);

  return {
    /**
     * @param mapping A mapping from the values in curried enum A to the values in curried enum B.
     * @returns An object containing the mapping and its inverse.
     */
    Create: <const T>(
      mapping: T & Result<A[number], B[number], T>
    ): {
      Mapping: T;
      InverseMapping: InvertedMapping<T>;
    } => ({
      Mapping: mapping,
      InverseMapping: invertMapping(mapping as T & Record<A[number], B[number]>, enumValueByKeyA) as any,
    }),
  };
}
