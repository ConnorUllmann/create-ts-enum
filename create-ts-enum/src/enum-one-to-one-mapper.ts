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

function invertMapping<T extends Record<PropertyKey, PropertyKey>>(mapping: T): InvertedMapping<T> {
  const invertedMapping = {} as Record<PropertyKey, PropertyKey>;
  for (const key of Object.keys(mapping)) {
    const value = mapping[key];
    if(value != null) {
      invertedMapping[value] = key;
    }
  }
  return invertedMapping as InvertedMapping<T>;
}

export function EnumOneToOneMapper<
  const A extends readonly PropertyKey[],
  const B extends readonly PropertyKey[]
>(_a: A, _b: AreTuplesSameLength<A, B> extends true ? B : never) {
  return {
    Create: <T>(
      value: T & Result<A[number], B[number], T>
    ): {
      Mapping: T;
      InverseMapping: InvertedMapping<T>;
    } => ({
      Mapping: value,
      InverseMapping: invertMapping(value as T & Record<A[number], B[number]>) as any,
    }),
  };
}