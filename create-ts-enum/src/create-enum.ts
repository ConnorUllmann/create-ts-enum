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
type SubtractTuple<Tuple extends readonly any[], Union> = RemoveMarkedElementsFromTuple<
  MarkTupleElementsForRemoval<Tuple, Union>
>;


type EnumConfig = ReadonlyArray<Readonly<Record<string, PropertyKey>>>;

/**
 * A name-to-value mapping of the given EnumConfig (multiple names per value to account for aliases)
 */
type EnumConfigMap<config extends EnumConfig> = MergeIntersections<
  UnionToIntersection<
    {
      [K in keyof config]: { [N in keyof config[K]]: config[K][N] };
    }[number]
  >
>;

/**
 * A value-to-names mapping of the given EnumConfig (multiple names per value to account for aliases)
 */
type InvertedEnumConfigMap<config extends EnumConfig> = MergeIntersections<
  UnionToIntersection<
    {
      [tupleIndex in keyof config]: {
        [name in keyof config[tupleIndex] as config[tupleIndex][name]]: name;
      };
    }[number]
  >
>

/**
 * A name-to-value mapping filtered down to only match the given value union
 */
type EnumConfigMapForValues<
  config extends EnumConfig,
  allowedValueUnion extends PropertyKey
> = EnumConfigMap<config> extends infer enumConfigMap
  ? { [K in keyof enumConfigMap as enumConfigMap[K] extends allowedValueUnion ? K : never]: enumConfigMap[K] }
  : never;

/**
 * An ordered tuple of all values in the given EnumConfig
 */
type EnumConfigList<config extends EnumConfig> = {
  [index in keyof config]: {
    [name in keyof config[index]]: config[index][name] extends infer value
      ? value extends PropertyKey // should already be assured, but is necessary for downstream types
        ? value
        : never
      : never;
  }[keyof config[index]];
};

/**
 * Returns a tuple with the same length as TupleLength but where all values are of type Value
 */
type SameLengthDifferentType<TupleLength extends ReadonlyArray<any>, Value> = {
  [K in keyof TupleLength]: Value;
};

/**
 * Returns a tuple with the same length as TupleLength where all the values match those in TupleValues by key (and using BackfillValue where there isn't one present)
 */
type BackfillTupleWithType<
  TupleValues extends ReadonlyArray<any>,
  TupleLength extends ReadonlyArray<any>,
  BackfillValue
> = {
  [K in keyof TupleLength]: K extends keyof TupleValues ? TupleValues[K] : BackfillValue;
};

/**
 * Finds the last element in Tuple that is already present in the Tuple and replaces it with the given ReplaceValue
 */
type ReplaceDuplicate<
  Tuple extends ReadonlyArray<any>,
  ReplaceValue,
  Suffix extends ReadonlyArray<any> = []
> = Tuple extends [...infer Rest, infer Last]
  ? Last extends Rest[number]
    ? [...Rest, ReplaceValue, ...Suffix]
    : ReplaceDuplicate<Rest, ReplaceValue, [Last, ...Suffix]>
  : [...Tuple, ...Suffix];

/**
 * Given all the values and the tuple of values that the user has provided, validate that the tuple is an ordering of all values.
 * If it isn't valid, return a best guess modification to point out the error.
 */
type TupleOrdering<
  EnumValues extends ReadonlyArray<PropertyKey>,
  Tuple extends ReadonlyArray<PropertyKey>
> = EnumValues extends ReadonlyArray<any>
  ? EnumValues[number] extends infer EnumTypeUnion
    ? Tuple[number] extends infer TupleUnion
      ? Exclude<TupleUnion, EnumTypeUnion> extends never
        ? Exclude<EnumTypeUnion, TupleUnion> extends never
          ? EnumValues['length'] extends Tuple['length']
            ? Tuple
            : // if the length is different but the unions match, complain about the length
              SameLengthDifferentType<EnumValues, EnumTypeUnion>
          : // if values from the enum aren't in the tuple, complain about the length
            BackfillTupleWithType<
              ReplaceDuplicate<Tuple, Exclude<EnumTypeUnion, TupleUnion>>,
              EnumValues,
              Exclude<EnumTypeUnion, TupleUnion>
            >
        : // if some element in the tuple isn't in the enum, complain about the unknown value
          SameLengthDifferentType<Tuple, EnumTypeUnion>
      : never
    : never
  : never;

/**
 * Given all the values and the tuple of values that the user has provided, validate that the tuple is a subset of all values.
 * If it isn't valid, return a best guess modification to point out the error.
 */
type TupleSubset<
  EnumValues extends ReadonlyArray<PropertyKey>,
  Tuple extends ReadonlyArray<PropertyKey>
> = EnumValues extends ReadonlyArray<any>
  ? EnumValues[number] extends infer EnumTypeUnion
    ? Tuple[number] extends infer TupleUnion
      ? Exclude<TupleUnion, EnumTypeUnion> extends never
        ? Exclude<EnumTypeUnion, TupleUnion> extends never
          ? EnumValues['length'] extends Tuple['length']
            ? Tuple
            : // if the length is different but the unions match, complain about the length
              SameLengthDifferentType<EnumValues, EnumTypeUnion>
          : // if values in the enum exist that aren't in the tuple, then just remove duplicates
            ReplaceDuplicate<Tuple, never>
        : // if some element in the tuple isn't in the enum, complain about the unknown value
          SameLengthDifferentType<Tuple, EnumTypeUnion>
      : never
    : never
  : never;

/**
 * Looks for entries in the enum config which have multiple values in the same object definition
 * when found, those objects are replaced with single-value-object options instead as a suggestion.
 * e.g. { A: 'a', B: 'b' } will be suggested as { A: 'a', B: never } | { A: never, B: 'b' }
 */
type AllSingleValueObjectsEnumConfig<config extends EnumConfig> = {
  [index in keyof config]: SingleValueObject<config[index]> extends true
    ? config[index]
    : config[index] extends infer entry
    ? {
        [name1 in keyof entry]: {
          [name2 in keyof entry]: entry[name2] extends entry[name1]
            ? entry[name1] extends entry[name2]
              ? entry[name1]
              : never
            : never;
        };
      }[keyof entry]
    : never;
};

/**
 * Given a tuple of objects with a single value, removes the last object that has the same value as another object.
 */
type RemoveDuplicateSingleValueObject<
  Tuple extends ReadonlyArray<any>,
  ReplaceValue = never,
  Suffix extends ReadonlyArray<any> = []
> = Tuple extends Readonly<[...infer Rest, infer Last]>
  ? Last[keyof Last] extends {
      [K in keyof Rest]: Rest[K][keyof Rest[K]];
    }[number]
    ? Readonly<[...Rest, ReplaceValue, ...Suffix]>
    : RemoveDuplicateSingleValueObject<Rest, ReplaceValue, [Last, ...Suffix]>
  : Readonly<[...Tuple, ...Suffix]>;

/**
 * Given a tuple of objects, removes the last object that contains a key that is shared with another object.
 */
type RemoveDuplicateKeys<
  Tuple extends ReadonlyArray<any>,
  ReplaceValue = never,
  Suffix extends ReadonlyArray<any> = []
> = Tuple extends Readonly<[...infer Rest, infer Last]>
  ? AnyKeyInUnion<keyof Last, { [K in keyof Rest]: keyof Rest[K] }[number]> extends true
    ? Readonly<[...Rest, ReplaceValue, ...Suffix]>
    : RemoveDuplicateKeys<Rest, ReplaceValue, [Last, ...Suffix]>
  : Readonly<[...Tuple, ...Suffix]>;

/**
 * Returns true if any key in Keys is present in Union
 */
type AnyKeyInUnion<Keys extends PropertyKey, Union extends PropertyKey> = {
  [K in Keys]: K extends Union ? unknown : never;
}[Keys] extends never
  ? false
  : true;

/**
 * Returns a mapping each value in the enum config to its index in the list of values in the config.
 */
type EnumConfigIndexByValue<EnumValues extends ReadonlyArray<PropertyKey>> = MergeIntersections<
  UnionToIntersection<
    {
      [index in keyof EnumValues]: { [enumValue in EnumValues[index]]: index extends `${infer indexNumber extends number}` ? indexNumber : never };
    }[number]
  >
>;

/**
 * Returns a modification of the given enum config that accounts for duplicate keys, duplicate values, and objects with multiple values.
 */
type EnumConfigConstraint<config extends EnumConfig> = RemoveDuplicateKeys<
  RemoveDuplicateSingleValueObject<AllSingleValueObjectsEnumConfig<config>>
>;

type EnumConfigCreateOrdering<ParentConfig extends EnumConfig, EnumValues extends ReadonlyArray<PropertyKey>> = <
  const Tuple extends ReadonlyArray<PropertyKey>
>(
  ...tuple: TupleOrdering<EnumValues, Tuple>
) => ConfigSubset<ParentConfig, Tuple>;

type EnumConfigCreateSubset<ParentConfig extends EnumConfig, EnumValues extends ReadonlyArray<PropertyKey>> = <
  const Tuple extends ReadonlyArray<PropertyKey>
>(
  ...tuple: TupleSubset<EnumValues, Tuple>
) => ConfigSubset<ParentConfig, Tuple>;

type EnumConfigCreateComplementSubset<
  ParentConfig extends EnumConfig,
  EnumValues extends ReadonlyArray<PropertyKey>
> = <const Tuple extends ReadonlyArray<PropertyKey>>(
  ...tuple: TupleSubset<EnumValues, Tuple>
) => ConfigSubset<ParentConfig, SubtractTuple<EnumValues, Tuple[number]>>;

type EnumConfigTypeGuard<EnumValues extends ReadonlyArray<PropertyKey>> = (
  value: PropertyKey
) => value is EnumValues[number];

type ConfigSubset<ParentConfig extends EnumConfig, EnumValues extends readonly PropertyKey[]> = {
  /**
   * @description An object mapping each name to each value in the enum.
   * @example ```typescript
   * const { Enum } = CreateEnum(
   *   { A: 'a' },
   *   { B: 'b' },
   *   { C: 'c' },
   * );
   * const result = Enum.A; // 'a'
   * ```
   */
  Enum: EnumConfigMapForValues<ParentConfig, EnumValues[number]>;
  /**
   * @description A list containing each value in the enum in the declared order.
   * @example ```typescript
   * const { List } = CreateEnum(
   *   { A: 'a' },
   *   { B: 'b' },
   *   { C: 'c' },
   * );
   * const result = List; // ['a', 'b', 'c']
   * ```
   */
  List: EnumValues;
  /**
   * @description A "subset" that has all the same elements as the original set, but in a different order.
   * @example ```typescript
   * const { Enum, CreateOrdering } = CreateEnum(
   *   { A: 'a' },
   *   { B: 'b' },
   *   { C: 'c' },
   * );
   * const { List } = CreateOrdering(Enum.B, Enum.A, Enum.C); // ['b', 'a', 'c']
   * ```
   */
  CreateOrdering: EnumConfigCreateOrdering<ParentConfig, EnumValues>;
  /**
   * @description A subset of this enum, including a list in the order given as well as other utilities (a set, a type guard, etc.)
   * @example ```typescript
   * const { Enum, CreateSubset } = CreateEnum(
   *   { A: 'a' },
   *   { B: 'b' },
   *   { C: 'c' },
   * );
   * const { List } = CreateSubset(Enum.B, Enum.A); // ['b', 'a']
   * ```
   */
  CreateSubset: EnumConfigCreateSubset<ParentConfig, EnumValues>;
  /**
   * @description A list containing all values in the enum except those passed in (guaranteeing that omitted values
   * are only specified once and that the resulting list is in the same order as in the original configuration).
   * @example ```typescript
   * const { Enum, CreateComplementSubset } = CreateEnum(
   *   { A: 'a' },
   *   { B: 'b' },
   *   { C: 'c' },
   *   { D: 'd' },
   * );
   * const result = CreateComplementSubset(Enum.C, Enum.A); // ['b', 'd']
   * ```
   */
  CreateComplementSubset: EnumConfigCreateComplementSubset<ParentConfig, EnumValues>;
  /**
   * @description A type guard to determine if a value is a member of the enum.
   * @param value The value to test.
   * @returns A boolean whether the value is a member of the enum or not.
   * @example ```typescript
   * const { Enum: EnumThing, List: EnumThings, TypeGuard: isEnumThing } = CreateEnum(
   *   { A: 'a' },
   *   { B: 'b' },
   *   { C: 'c' },
   * );
   * type EnumThing = (typeof EnumThings)[number];
   *
   * const x: string = 'b';
   * if (isEnumThing(x)) const y: EnumThing = x;
   * ```
   */
  TypeGuard: EnumConfigTypeGuard<EnumValues>;
  /**
   * @description A mapping from each member of the enum to its index in the list generated alongside this property.
   * @example ```typescript
   * const { Enum, IndexByValue } = CreateEnum(
   *   { A: 'a' },
   *   { B: 'b' },
   *   { C: 'c' },
   * );
   * const result = IndexByValue[Enum.B]; // 1
   * ```
   */
  IndexByValue: EnumConfigIndexByValue<EnumValues>;
};

function CreateSubset<const ParentConfig extends EnumConfig, EnumValues extends ReadonlyArray<PropertyKey>>(
  NamesByValue: InvertedEnumConfigMap<ParentConfig>,
  ...tuple: EnumValues
): ConfigSubset<ParentConfig, EnumValues> {
  const set = new Set<EnumValues[number]>(tuple);
  return new Proxy<ConfigSubset<ParentConfig, EnumValues>>({
    Enum: undefined,
    List: undefined,
    CreateOrdering: undefined,
    CreateSubset: undefined,
    CreateComplementSubset: undefined,
    TypeGuard: undefined,
    IndexByValue: undefined,
  } as any, {
    get(target: any, key: string | symbol) {
      switch(key) {
        case 'Enum': return target.Enum ??= tuple.reduce((acc, tupleValue: EnumValues[number]) => {
          const names = (NamesByValue as Record<PropertyKey, string[]>)[tupleValue];
          for (const name of names) {
            acc[name] = tupleValue;
          }
          return acc;
        }, {} as Record<string, PropertyKey>) as EnumConfigMapForValues<ParentConfig, EnumValues[number]>;
        case 'List': return target.List ??= tuple;
        case 'CreateOrdering': return target.CreateOrdering ??= <const Tuple extends readonly PropertyKey[]>(...tupleTemp: TupleOrdering<EnumValues, Tuple>) => CreateSubset<ParentConfig, Tuple>(NamesByValue, ...tupleTemp as Tuple);
        case 'CreateSubset': return target.CreateSubset ??= <const Tuple extends readonly PropertyKey[]>(...tupleTemp: TupleSubset<EnumValues, Tuple>) => CreateSubset<ParentConfig, Tuple>(NamesByValue, ...tupleTemp as Tuple);
        case 'CreateComplementSubset': return target.CreateComplementSubset ??= <const Tuple extends readonly PropertyKey[]>(..._tuple: TupleSubset<EnumValues, Tuple>) => {
          const setTemp = new Set(_tuple);
          const tupleComplement = tuple.filter(element => !setTemp.has(element));
          return CreateSubset(NamesByValue, ...tupleComplement) as any;
        };
        case 'TypeGuard': return target.TypeGuard ??= (value: PropertyKey): value is EnumValues[number] => set.has(value);
        case 'IndexByValue': return target.IndexByValue ??= tuple.reduce((acc, value: EnumValues[number], index) => {
          acc[value] = index;
          return acc;
        }, {} as Record<PropertyKey, number>) as EnumConfigIndexByValue<EnumValues>;
        default: return undefined;
      }
    }
  })
}

/**
 * @description An alternative to the "enum" keyword for making enums where order is well-known, values are not inferred, and subsets are supported with utility functions.
 * @param enumConfig A list of objects whose keys are the enum names (multiple allowed as aliases) and whose values are the enum values.
 * @returns A pseudo-enum object ("Enum" is used like an enum as an object mapping names to values, "List" is a list of all values in the enum in order, functions for making subsets, etc.)
 * @example ```typescript
 * const { Enum: EnumThing, List: EnumThings } = CreateEnum(
 *   { A: 'a' },
 *   { B: 'b' },
 *   { C: 'c' },
 * );
 * type EnumThing = (typeof EnumThings)[number];
 *
 * const value: EnumThing = EnumThing.A; // 'a'
 * ```
 */
export function CreateEnum<const T extends EnumConfig & EnumConfigConstraint<T>>(
  ...enumConfig: T
): ConfigSubset<T, EnumConfigList<T>> {
  const List = enumConfig.reduce((acc, configElement) => {
    const key = Object.keys(configElement)[0];
    if(key != null) {
      const value = configElement[key]
      if(value != null) {
        acc.push(value);
      }
    }
    return acc;
  }, [] as PropertyKey[]) as EnumConfigList<T>;

  const NamesByValue = enumConfig.reduce((acc, configElement) => {
    for (const key of Object.keys(configElement)) {
      const value = configElement[key];
      if(value != null) {
        (acc[value] ??= []).push(key);
      }
    }
    return acc;
  }, {} as Record<PropertyKey, string[]>) as InvertedEnumConfigMap<T>;

  return CreateSubset(NamesByValue, ...List) as ConfigSubset<T, EnumConfigList<T>>;
}

/**
 * Return true when all of an object's keys have the same value; false otherwise.
 */
type SingleValueObject<T> = UnionToIntersection<T[keyof T]> extends never ? false : true;

/**
 * Change a union of values into an intersection of those same values.
 */
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

/**
 * Take a union of objects and turn it into a single objects; generally just an aesthetic/readability change.
 */
type MergeIntersections<T> = Pick<T, keyof T>;
