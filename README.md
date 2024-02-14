# create-ts-enum
 A utility for making type-safe, ordered, set-oriented enums in TypeScript.

# CreateEnum

`CreateEnum` is a function that is used to generate an enum and corresponding type-safe utilities from a configuration.
```typescript
const { Enum: Color } = CreateEnum(
  { Red: 'r' },
  { Green: 'g' },
  { Blue: 'b' },
);

const color = Color.Red; // 'r'
```

These utilities include an ordered list of elements, a type-guard, a mapping from each value to its index in the list, and various functions for making subsets and reorderings. The major advantage of this approach is its type-safety; the type of every value returned is known exactly at compile-time.
```typescript
const {
  Enum,
  List,
  CreateOrdering,
  CreateSubset,
  CreateComplementSubset,
  TypeGuard,
  IndexByValue,
} = CreateEnum(
  { Red: 'r' },
  { Green: 'g' },
  { Blue: 'b' },
);
```

The `CreateSubset` & `CreateComplementSubset` functions can be used in a type-safe way to declare relationships between different values of an enum:
```typescript
const {
  Enum: LivingBeing,
  CreateSubset: CreateLivingBeingSubset,
  CreateComplementSubset: CreateLivingBeingComplementSubset
} = CreateEnum(
  { Wolf: 'wolf' },
  { Bear: 'bear' },
  { Jellyfish: 'jellyfish' },
  { Lion: 'lion' },
  { Tiger: 'tiger' },
  { Tree: 'tree' },
  { Grass: 'grass' },
  { Mushroom: 'mushroom' }
);

const { List: Plants } = CreateLivingBeingSubset(LivingBeing.Tree, LivingBeing.Grass);

const {
  CreateSubset: CreateNonPlantSubset,
  CreateComplementSubset: CreateNonPlantComplementSubset
} = CreateLivingBeingComplementSubset(...Plants);

const { List: Fungi } = CreateNonPlantSubset(LivingBeing.Mushroom);

const {
  Enum: Animal,
  CreateSubset: CreateAnimalSubset,
} = CreateNonPlantComplementSubset(...Fungi);

const {
  Enum: Mammal,
  List: Mammals,
  CreateSubset: CreateMammalSubset,
  CreateComplementSubset: CreateMammalComplementSubset
} = CreateAnimalSubset(Animal.Wolf, Animal.Bear, Animal.Lion, Animal.Tiger);

const { List: Cats } = CreateMammalSubset(Mammal.Lion, Mammal.Tiger);

const { List: NonCatMammals, IndexByValue: NonCatMammalsIndexByValue } = CreateMammalComplementSubset(...Cats);

// Each of the below has a type that exactly matches its value!

Plants;                    // ['tree', 'grass']
Mammals;                   // ['wolf', 'bear', 'lion', 'tiger']
NonCatMammals;             // ['wolf', 'bear']
NonCatMammalsIndexByValue; // { wolf: 0, bear: 1 }
```

The `CreateOrdering` is the same as `CreateSubset` except you must specify all elements of the enum, but you can specify them in a new order.
```typescript
const {
  Enum: Color,
  CreateOrdering: CreateColorOrdering
} = CreateEnum(
  { Red: 'r' },
  { Green: 'g' },
  { Yellow: 'y' },
  { Blue: 'b' },
  { Purple: 'p' },
  { Orange: 'o' }
)

const { List: PrimarySecondaryColors } = CreateColorOrdering(
  Color.Red,
  Color.Yellow,
  Color.Blue,
  Color.Orange,
  Color.Green,
  Color.Purple
);

const { List: HueColors } = CreateColorOrdering(
  Color.Red,
  Color.Orange,
  Color.Yellow,
  Color.Green,
  Color.Blue,
  Color.Purple
);
```

Declaring multiple names for the same value is supported, as is any combination of `string`, `number`, and `symbol` values.
```typescript
const blueSymbol = Symbol('blue');

const { Enum: Color } = CreateEnum(
  { Red: 'r', R: 'r', red: 'r' },
  { Green: 2 },
  { Blue: blueSymbol },
);
```

It is recommended to export a type containing the union of values in your enum, like so:
```typescript
const { Enum: Color, List: Colors } = CreateEnum(...);
type Color = (typeof Colors)[number];

function getRandomColor(): Color { ... }
```

# EnumOneToOneMapper

`EnumOneToOneMapper` is a curried function that ensures exact 1:1 matching between two enums. It can be called as follows to retrieve the validated mapping and its inverse.
```typescript
const {
  Enum: BodyPart,
  List: BodyParts
} = CreateEnum(
  { Head: 0 },
  { Feet: 1 },
  { Hands: 2 }
);

const {
  Enum: ClothingItem,
  List: ClothingItems
} = CreateEnum(
  { Boots: 'boots' },
  { Gloves: 'gloves' },
  { Hat: 'hat' }
);

const {
  Mapping: ClothingItemByBodyPart,
  InverseMapping: BodyPartByClothingItem
} = EnumOneToOneMapper(BodyParts, ClothingItems).Create({
  [BodyPart.Head]: ClothingItem.Hat,
  [BodyPart.Feet]: ClothingItem.Boots,
  [BodyPart.Hands]: ClothingItem.Gloves,
});

// Each of the below has a type that exactly matches its value!

ClothingItemByBodyPart; // { 0: 'hat', 1: 'boots', 2: 'gloves' }
BodyPartByClothingItem; // { hat: 0, boots: 1, gloves: 2 }
```