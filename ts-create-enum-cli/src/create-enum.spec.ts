import { CreateEnum } from 'ts-create-enum';
import { itTypes } from './type-tests';

const symbolA = Symbol('a')
const symbolB = Symbol('b')
const symbolC = Symbol('c')
const symbolUnrecognized = Symbol('d')

function runTestsForValues(testName: string, a: 'a' | 0 | typeof symbolA, b: 'b' | 1 | typeof symbolB, c: 'c' | 2 | typeof symbolC, unrecognizedValue: string | number | typeof symbolUnrecognized) {
  const coreMapping = {
    A: a,
    B: b,
    C: c
  } as const;

  type EnumValues = typeof unrecognizedValue;

  function CreateBasicEnum() {
    return CreateEnum(
      { A: coreMapping.A },
      { B: coreMapping.B },
      { C: coreMapping.C }
    )
  }


  describe(`CreateEnum (${testName})`, () => {
    describe('argument validity checks', () => {
      itTypes('aliases must have same value', () => {
        CreateEnum(
          //@ts-expect-error Values must be the same for a single entry
          { A: coreMapping.A, A2: unrecognizedValue }
        )
      })

      itTypes('no matching keys in the same entry', () => {
        CreateEnum(
          //@ts-expect-error Can't have the same key twice in the same entry
          { A: coreMapping.A, A: unrecognizedValue },
        )
      })

      itTypes('no match keys in different entries with other elements', () => {
        CreateEnum(
          //@ts-expect-error Can't have the same key in two different entries with other elements around
          { A: coreMapping.A },
          { A: coreMapping.B },
          { C: coreMapping.C },
        );
      })

      itTypes('no matching keys in different entries', () => {
        CreateEnum(
          //@ts-expect-error Can't have the same key in two different entries
          { A: coreMapping.A },
          { A: coreMapping.B }
        )
      })

      itTypes('no matching values in different entries', () => {
        CreateEnum(
          //@ts-expect-error Can't have the same value in two different entries
          { A: coreMapping.A },
          { B: coreMapping.A }
        )
      })

      itTypes('no matching keys & values in different entries', () => {
        CreateEnum(
          //@ts-expect-error Can't have the same key & value in two different entries
          { A: coreMapping.A },
          { A: coreMapping.A }
        )
      })

      itTypes('enum type enforces value constraint', () => {
        const { Enum, List } = CreateBasicEnum()
        type Enum = typeof List[number];

        const a: Enum = Enum.A;
        const b: Enum = Enum.B;
        const c: Enum = Enum.C;

        // ensure variables are "used"
        a, b, c;

        //@ts-expect-error Cannot assign non-enum value to enum type.
        const d: Enum = unrecognizedValue;
      })
    });

    describe('Enum', () => {
      it('return value has all properties even if not yet populated', () => {
        const result = CreateBasicEnum();

        expect(new Set(Object.keys(result))).toEqual(new Set([
          'Enum',
          'List',
          'CreateOrdering',
          'CreateSubset',
          'CreateComplementSubset',
          'TypeGuard',
          'IndexByValue',
        ]))
      })

      it('accurately reflects names and values in config', () => {
        const { Enum } = CreateBasicEnum();
        
        expect(Enum).toEqual(coreMapping)
      })

      it('accurately reflects names and values in config with aliases', () => {
        const { Enum } = CreateEnum(
          { A: coreMapping.A, A2: coreMapping.A },
          { B: coreMapping.B, },
          { C: coreMapping.C, c: coreMapping.C }
        )
        expect(Enum).toEqual({
          A: coreMapping.A,
          A2: coreMapping.A,
          B: coreMapping.B,
          C: coreMapping.C,
          c: coreMapping.C,
        })
      })
    });

    describe('List', () => {
      it('accurately reflects order of values in config', () => {
        const { Enum, List } = CreateBasicEnum();
        expect(List).toEqual([Enum.A, Enum.B, Enum.C])
      })

      it('accurately reflects order of values in config even with aliases', () => {
        const { Enum, List } = CreateEnum(
          { A: coreMapping.A, A2: coreMapping.A },
          { B: coreMapping.B, },
          { C: coreMapping.C, c: coreMapping.C }
        );
        expect(List).toEqual([Enum.A, Enum.B, Enum.C])
      })
    })

    describe('CreateSubset', () => {
      itTypes('only allows valid arguments', () => {
        const { Enum, CreateSubset } = CreateBasicEnum();
      
        //@ts-expect-error Too many entries
        CreateSubset(Enum.A, Enum.C, Enum.B, Enum.C);
        //@ts-expect-error Duplicate entries but not enough to be too many
        CreateSubset(Enum.C, Enum.C, Enum.A);
        //@ts-expect-error Unrecognized entry
        CreateSubset(Enum.C, Enum.A, unrecognizedValue);
        //@ts-expect-error Unrecognized entry with all other values present
        CreateSubset(Enum.C, Enum.A, unrecognizedValue, Enum.B);
        //@ts-expect-error Duplicate entries of same value
        CreateSubset(Enum.C, Enum.C, Enum.C);
        CreateSubset(
          Enum.C,
          Enum.C,
          Enum.C,
          //@ts-expect-error Too many entries at correct index
          Enum.A,
          Enum.B,
          Enum.B,
          Enum.A,
          Enum.C,
        );
      })

      describe('Enum', () => {
        it('can create full mapping when values are provided in the same order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateSubset(Enum.A, Enum.B, Enum.C);

          expect(EnumSubset).toEqual({
            A: Enum.A,
            B: Enum.B,
            C: Enum.C
          })
        })

        it('can still create full mapping when values are provided in an alternate order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateSubset(Enum.A, Enum.C, Enum.B);

          expect(EnumSubset).toEqual({
            A: Enum.A,
            B: Enum.B,
            C: Enum.C
          })
        })

        it('can create partial mapping to match partial subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateSubset(Enum.A, Enum.C);
          
          expect(EnumSubset).toEqual({
            A: Enum.A,
            C: Enum.C
          })
        })

        it('can create partial mapping to match singleton subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateSubset(Enum.A);
          
          expect(EnumSubset).toEqual({
            A: Enum.A
          })
        })

        it('can create empty mapping to match empty subset', () => {
          const { CreateSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateSubset();
          
          expect(EnumSubset).toEqual({})
        })
      })

      describe('List', () => {
        it('can create full set in same order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { List } = CreateSubset(Enum.A, Enum.B, Enum.C);
          expect(List).toEqual([Enum.A, Enum.B, Enum.C])
        })

        it('can create full set in alternate order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { List } = CreateSubset(Enum.A, Enum.C, Enum.B);
          expect(List).toEqual([Enum.A, Enum.C, Enum.B])
        })

        it('can create partial subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { List } = CreateSubset(Enum.A, Enum.C);
          expect(List).toEqual([Enum.A, Enum.C])
        })

        it('can create singleton subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { List } = CreateSubset(Enum.A);
          expect(List).toEqual([Enum.A])
        })

        it('can create empty subset', () => {
          const { CreateSubset } = CreateBasicEnum();
        
          const { List } = CreateSubset();
          expect(List).toEqual([])
        })
      })

      describe('CreateSubset', () => {
        itTypes('cannot create subset with invalid values', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateSubset: CreateSubsetInner } = CreateSubset(Enum.A, Enum.B);
          
          //@ts-expect-error Unrecognized entry
          CreateSubsetInner(Enum.A, Enum.B, unrecognizedValue);
          //@ts-expect-error Entry is not a part of the parent subset
          CreateSubsetInner(Enum.A, Enum.C);
          //@ts-expect-error Cannot provide the same entry twice
          CreateSubsetInner(Enum.A, Enum.A);
        })

        it('can create full set in same order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateSubset: CreateSubsetInner } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateSubsetInner(Enum.A, Enum.B);

          expect(List).toEqual([Enum.A, Enum.B])
        })

        it('can create full set in alternate order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateSubset: CreateSubsetInner } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateSubsetInner(Enum.B, Enum.A);

          expect(List).toEqual([Enum.B, Enum.A])
        })

        it('can create partial subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateSubset: CreateSubsetInner } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateSubsetInner(Enum.B);

          expect(List).toEqual([Enum.B])
        })
      })

      describe('CreateComplementSubset', () => {
        itTypes('cannot create subset with invalid values', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateSubset(Enum.A, Enum.B);
          
          //@ts-expect-error Unrecognized entry
          CreateComplementSubsetInner(unrecognizedValue);
          //@ts-expect-error Entry is not a part of the parent subset
          CreateComplementSubsetInner(Enum.A, Enum.C);
          //@ts-expect-error Entry is duplicated
          CreateComplementSubsetInner(Enum.B, Enum.B);
        })

        it('can create full set in same order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubsetInner();

          expect(List).toEqual([Enum.A, Enum.B])
        })

        it('can create partial subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubsetInner(Enum.B);

          expect(List).toEqual([Enum.A])
        })

        it('can create empty set', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubsetInner(Enum.A, Enum.B);

          expect(List).toEqual([])
        })
      })

      describe('CreateOrdering', () => {
        itTypes('only allows valid arguments', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateOrdering } = CreateSubset(Enum.A, Enum.B);
        
          //@ts-expect-error Too few entries
          CreateOrdering(Enum.A);
          //@ts-expect-error No entries
          CreateOrdering();
          //@ts-expect-error Duplicate entries and too many entries
          CreateOrdering(Enum.A, Enum.B, Enum.B);
          //@ts-expect-error Duplicate entries
          CreateOrdering(Enum.A, Enum.A);
          //@ts-expect-error Unrecognized entry
          CreateOrdering(Enum.A, unrecognizedValue);
          //@ts-expect-error Unrecognized entry but all other values present
          CreateOrdering(Enum.A, unrecognizedValue, Enum.B);
          CreateOrdering(
            Enum.A,
            Enum.A,
            //@ts-expect-error Too many entries at correct index
            Enum.A,
            Enum.B,
            Enum.B,
            Enum.A,
            Enum.B,
          );
        })
    
        it('can create full set in same order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateOrdering } = CreateSubset(Enum.A, Enum.B);
        
          const { List } = CreateOrdering(Enum.A, Enum.B);
          expect(List).toEqual([Enum.A, Enum.B])
        })

        it('can create full set in alternate order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateOrdering } = CreateSubset(Enum.A, Enum.B);
        
          const { List } = CreateOrdering(Enum.B, Enum.A);
          expect(List).toEqual([Enum.B, Enum.A])
        })
      })

      describe('TypeGuard', () => {
        itTypes('validates to work correctly', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { Enum: EnumSubset, List, TypeGuard } = CreateSubset(Enum.A, Enum.C);
          type EnumSubset = typeof List[number];
    
          // Validate that type guard narrows correctly
          let x: EnumValues = null as any;
          if(TypeGuard(x)) {
            const y: EnumSubset = x;
            y; // "use" variable
          }
    
          // @ts-expect-error Cannot pass a non-property-key to type guard
          TypeGuard({})
        })

        it('can create type guard for full set in same order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateSubset(Enum.A, Enum.B, Enum.C);
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(true);
          expect(TypeGuard(Enum.C)).toEqual(true);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })

        it('can create type guard for full set in alternate order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateSubset(Enum.A, Enum.C, Enum.B);
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(true);
          expect(TypeGuard(Enum.C)).toEqual(true);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })

        it('can create type guard for partial subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateSubset(Enum.A, Enum.C);
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(false);
          expect(TypeGuard(Enum.C)).toEqual(true);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })

        it('can create type guard for singleton subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateSubset(Enum.A);
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(false);
          expect(TypeGuard(Enum.C)).toEqual(false);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })

        it('can create type guard for empty subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateSubset();
          expect(TypeGuard(Enum.A)).toEqual(false);
          expect(TypeGuard(Enum.B)).toEqual(false);
          expect(TypeGuard(Enum.C)).toEqual(false);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })
      })

      describe('IndexByValue', () => {
        itTypes('validate number types', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { Enum: EnumSubset, List, IndexByValue } = CreateSubset(Enum.A, Enum.C);
          type EnumSubset = typeof List[number];
    
          //@ts-expect-error Disallow invalid number assignment
          const x: typeof IndexByValue[EnumSubset] = 3;
    
          type CIndex = typeof IndexByValue[typeof Enum.C];
          // Ensure assignment works for correct number
          const test1: CIndex = 1;
          test1; // "use" variable
          //@ts-expect-error Invalid index for 'b' but valid for 'a'
          const test0: CIndex = 0;
    
          //@ts-expect-error Must pass value from enum subset
          IndexByValue[Enum.B]
        })
    
        it('ensure indices match value index in List', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { Enum: EnumSubset, IndexByValue } = CreateSubset(Enum.A, Enum.C);
    
          expect(IndexByValue).toEqual({
            [EnumSubset.A]: 0,
            [EnumSubset.C]: 1,
          })
        })
      })
    })

    describe('CreateComplementSubset', () => {
      itTypes('cannot create subset with invalid values', () => {
        const { Enum, CreateComplementSubset } = CreateBasicEnum();
        
        //@ts-expect-error Unrecognized entry
        CreateComplementSubset(unrecognizedValue);
        //@ts-expect-error Cannot provide the same entry twice
        CreateComplementSubset(Enum.A, Enum.A);
      })

      describe('Enum', () => {
        it('can create empty mapping when values are provided in the same order', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateComplementSubset(Enum.A, Enum.B, Enum.C);
          
          expect(EnumSubset).toEqual({})
        })

        it('can create empty mapping when values are provided in an alternate order', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateComplementSubset(Enum.A, Enum.C, Enum.B);
          
          expect(EnumSubset).toEqual({})
        })

        it('can create partial mapping to match partial subset', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateComplementSubset(Enum.A, Enum.C);
          
          expect(EnumSubset).toEqual({
            B: Enum.B,
          })
        })

        it('can create partial mapping to match singleton subset', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateComplementSubset(Enum.A);
          
          expect(EnumSubset).toEqual({
            B: Enum.B,
            C: Enum.C
          })
        })

        it('can create empty mapping to match empty subset', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { Enum: EnumSubset } = CreateComplementSubset();
          
          expect(EnumSubset).toEqual({
            A: Enum.A,
            B: Enum.B,
            C: Enum.C
          })
        })
      })

      describe('List', () => {
        it('can create full set in same order', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { List } = CreateComplementSubset()
    
          expect(List).toEqual([Enum.A, Enum.B, Enum.C])
        })
    
        it('can create partial subset', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { List } = CreateComplementSubset(Enum.A, Enum.B)
    
          expect(List).toEqual([Enum.C])
        })
    
        it('can create empty set', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { List } = CreateComplementSubset(Enum.A, Enum.B, Enum.C)
    
          expect(List).toEqual([])
        })
      })

      describe('CreateSubset', () => {
        itTypes('cannot create subset with invalid values', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset } = CreateSubset(Enum.A, Enum.B);
          
          //@ts-expect-error Unrecognized entry
          CreateComplementSubset(Enum.A, Enum.B, unrecognizedValue);
          //@ts-expect-error Entry is not a part of the parent subset
          CreateComplementSubset(Enum.A, Enum.C);
          //@ts-expect-error Cannot provide the same entry twice
          CreateComplementSubset(Enum.A, Enum.A);
        })

        it('can create an empty complement to a full set in same order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubset(Enum.A, Enum.B);

          expect(List).toEqual([])
        })

        it('can create an empty complement to a full set in alternate order', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubset(Enum.B, Enum.A);

          expect(List).toEqual([])
        })

        it('can create partial subset', () => {
          const { Enum, CreateSubset } = CreateBasicEnum();
          const { CreateComplementSubset } = CreateSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubset(Enum.B);

          expect(List).toEqual([Enum.A])
        })
      })

      describe('CreateComplementSubset', () => {
        itTypes('cannot create subset with invalid values', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateComplementSubset(Enum.A, Enum.B);
          
          //@ts-expect-error Unrecognized entry
          CreateComplementSubsetInner(unrecognizedValue);
          //@ts-expect-error Entry is not a part of the parent subset
          CreateComplementSubsetInner(Enum.A, Enum.C);
          //@ts-expect-error Entry is duplicated
          CreateComplementSubsetInner(Enum.C, Enum.C);
        })

        it('can create full complement set', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateComplementSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubsetInner();

          expect(List).toEqual([Enum.C])
        })

        it('can create partial complement subset', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateComplementSubset(Enum.A);
          const { List } = CreateComplementSubsetInner(Enum.C);

          expect(List).toEqual([Enum.B])
        })

        it('can create empty set', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateComplementSubset(Enum.A, Enum.B);
          const { List } = CreateComplementSubsetInner(Enum.C);

          expect(List).toEqual([])
        })
      })

      describe('CreateOrdering', () => {
        itTypes('only allows valid arguments', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { CreateOrdering } = CreateComplementSubset(Enum.A, Enum.B);

        
          //@ts-expect-error No entries
          CreateOrdering();
          //@ts-expect-error Disallow elements outside of set
          CreateOrdering(Enum.C, Enum.A);
          //@ts-expect-error Duplicate entries and too many entries
          CreateOrdering(Enum.C, Enum.C);
          //@ts-expect-error Unrecognized entry
          CreateOrdering(unrecognizedValue);
          //@ts-expect-error Unrecognized entry but all other values present
          CreateOrdering(Enum.C, unrecognizedValue);
          CreateOrdering(
            //@ts-expect-error Too many entries at correct index
            Enum.C,
            Enum.C,
            Enum.C,
            Enum.C,
            Enum.C,
            Enum.C
          );
        })
    
        it('can create full set in same order', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { CreateOrdering } = CreateComplementSubset(Enum.B);
        
          const { List } = CreateOrdering(Enum.A, Enum.C);
          expect(List).toEqual([Enum.A, Enum.C])
        })
        
        it('can create full set in alternate order', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { CreateOrdering } = CreateComplementSubset(Enum.B);
        
          const { List } = CreateOrdering(Enum.C, Enum.A);
          expect(List).toEqual([Enum.C, Enum.A])
        })
      })

      describe('TypeGuard', () => {
        itTypes('validates to work correctly', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
        
          const { Enum: EnumSubset, List, TypeGuard } = CreateComplementSubset(Enum.B);
          type EnumSubset = typeof List[number];
    
          // Validate that type guard narrows correctly
          let x: EnumValues = null as any;
          if(TypeGuard(x)) {
            const y: EnumSubset = x;
            y; // "use" variable
          }
    
          // @ts-expect-error Cannot pass a non-property-key to type guard
          TypeGuard({})
        })

        it('can create type guard for complement of partial set', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateComplementSubset(Enum.B);
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(false);
          expect(TypeGuard(Enum.C)).toEqual(true);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })

        it('can create type guard for complement of empty set', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateComplementSubset();
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(true);
          expect(TypeGuard(Enum.C)).toEqual(true);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })

        it('can create type guard for complement of full set', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
        
          const { TypeGuard } = CreateComplementSubset(Enum.A, Enum.B, Enum.C);
          expect(TypeGuard(Enum.A)).toEqual(false);
          expect(TypeGuard(Enum.B)).toEqual(false);
          expect(TypeGuard(Enum.C)).toEqual(false);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })
      })

      describe('IndexByValue', () => {
        itTypes('validate number types', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { Enum: EnumSubset, List, IndexByValue } = CreateComplementSubset(Enum.A, Enum.C);
          type EnumSubset = typeof List[number];
    
          //@ts-expect-error Disallow invalid number assignment
          const x: typeof IndexByValue[EnumSubset] = 3;
    
          type BIndex = typeof IndexByValue[typeof Enum.B];
          // Ensure assignment works for correct number
          const test0: BIndex = 0;
          test0; // "use" variable
          //@ts-expect-error Valid index in original enum but not in complement
          const test1: BIndex = 1;
    
          //@ts-expect-error Must pass value from enum subset
          IndexByValue[Enum.A]
        })
    
        it('ensure indices match value index in List', () => {
          const { Enum, CreateComplementSubset } = CreateBasicEnum();
          const { Enum: EnumSubset, IndexByValue } = CreateComplementSubset(Enum.A);
    
          expect(IndexByValue).toEqual({
            [EnumSubset.B]: 0,
            [EnumSubset.C]: 1,
          })
        })
      })
    })

    describe('CreateOrdering', () => {
      itTypes('only allows valid arguments', () => {
        const { Enum, CreateOrdering } = CreateBasicEnum();
      
        //@ts-expect-error Too few entries
        CreateOrdering(Enum.A, Enum.C);
        //@ts-expect-error Too few entries with single entry
        CreateOrdering(Enum.A);
        //@ts-expect-error No entries
        CreateOrdering();
        //@ts-expect-error Duplicate entries and too many entries
        CreateOrdering(Enum.A, Enum.C, Enum.B, Enum.C);
        //@ts-expect-error Duplicate entries
        CreateOrdering(Enum.C, Enum.C, Enum.A);
        //@ts-expect-error Unrecognized entry
        CreateOrdering(Enum.C, Enum.A, unrecognizedValue);
        //@ts-expect-error Unrecognized entry but all other values present
        CreateOrdering(Enum.C, Enum.A, unrecognizedValue, Enum.B);
        //@ts-expect-error Same entry repeated to correct length
        CreateOrdering(Enum.C, Enum.C, Enum.C);
        CreateOrdering(
          Enum.C,
          Enum.C,
          Enum.C,
          //@ts-expect-error Too many entries at correct index
          Enum.A,
          Enum.B,
          Enum.B,
          Enum.A,
          Enum.C,
        );
      })

      describe('Enum', () => {
        it('can create full mapping when values are provided in the same order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { Enum: EnumOrdered } = CreateOrdering(Enum.A, Enum.B, Enum.C);

          expect(EnumOrdered).toEqual({
            A: Enum.A,
            B: Enum.B,
            C: Enum.C,
          })
        })

        it('can still create full mapping when values are provided in an alternate order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { Enum: EnumOrdered } = CreateOrdering(Enum.A, Enum.C, Enum.B);

          expect(EnumOrdered).toEqual({
            A: Enum.A,
            C: Enum.C,
            B: Enum.B,
          })
        })
      })

      describe('List', ()  => {
        it('can create full set in same order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
        
          const { List } = CreateOrdering(Enum.A, Enum.B, Enum.C);
          expect(List).toEqual([Enum.A, Enum.B, Enum.C])
        })
    
        it('can create full set in alternate order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
        
          const { List } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          expect(List).toEqual([Enum.A, Enum.C, Enum.B])
        })
      })

      describe('CreateSubset', () => {
        itTypes('cannot create subset with invalid values', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateSubset } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          
          //@ts-expect-error Unrecognized entry
          CreateSubset(Enum.A, Enum.B, unrecognizedValue);
          //@ts-expect-error Cannot provide the same entry twice
          CreateSubset(Enum.A, Enum.A);
        })

        it('can create full set in same order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateSubset } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          const { List } = CreateSubset(Enum.A, Enum.C, Enum.B);

          expect(List).toEqual([Enum.A, Enum.C, Enum.B])
        })

        it('can create full set in alternate order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateSubset } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          const { List } = CreateSubset(Enum.C, Enum.B, Enum.A);

          expect(List).toEqual([Enum.C, Enum.B, Enum.A])
        })

        it('can create partial subset', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateSubset } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          const { List } = CreateSubset(Enum.C, Enum.A);

          expect(List).toEqual([Enum.C, Enum.A])
        })
      })

      describe('CreateComplementSubset', () => {
        itTypes('cannot create subset with invalid values', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          
          //@ts-expect-error Unrecognized entry
          CreateComplementSubsetInner(unrecognizedValue);
          //@ts-expect-error Entry is duplicated
          CreateComplementSubsetInner(Enum.B, Enum.B);
        })

        it('can create full set in same order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateOrdering(Enum.A, Enum.B, Enum.C);
          const { List } = CreateComplementSubsetInner();

          expect(List).toEqual([Enum.A, Enum.B, Enum.C])
        })

        it('can create partial subset', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          const { List } = CreateComplementSubsetInner(Enum.B);

          expect(List).toEqual([Enum.A, Enum.C])
        })

        it('can create empty set', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateComplementSubset: CreateComplementSubsetInner } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          const { List } = CreateComplementSubsetInner(Enum.A, Enum.B, Enum.C);

          expect(List).toEqual([])
        })
      })

      describe('CreateOrdering', () => {
        itTypes('only allows valid arguments', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateOrdering: CreateOrderingInner } = CreateOrdering(Enum.A, Enum.C, Enum.B);
        
          //@ts-expect-error Too few entries
          CreateOrderingInner(Enum.A);
          //@ts-expect-error No entries
          CreateOrderingInner();
          //@ts-expect-error Duplicate entries and too many entries
          CreateOrderingInner(Enum.A, Enum.B, Enum.B);
          //@ts-expect-error Duplicate entries
          CreateOrderingInner(Enum.A, Enum.A);
          //@ts-expect-error Unrecognized entry
          CreateOrderingInner(Enum.A, unrecognizedValue);
          //@ts-expect-error Unrecognized entry but all other values present
          CreateOrderingInner(Enum.A, unrecognizedValue, Enum.B);
          CreateOrderingInner(
            Enum.A,
            Enum.A,
            Enum.A,
            //@ts-expect-error Too many entries at correct index
            Enum.A,
            Enum.B,
            Enum.B,
            Enum.A,
            Enum.B,
          );
        })
    
        it('can create full set in same order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateOrdering: CreateOrderingInner } = CreateOrdering(Enum.A, Enum.B, Enum.C);
        
          const { List } = CreateOrderingInner(Enum.C, Enum.A, Enum.B);
          expect(List).toEqual([Enum.C, Enum.A, Enum.B])
        })

        it('can create full set in alternate order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { CreateOrdering: CreateOrderingInner } = CreateOrdering(Enum.A, Enum.C, Enum.B);
        
          const { List } = CreateOrderingInner(Enum.B, Enum.A, Enum.C);
          expect(List).toEqual([Enum.B, Enum.A, Enum.C])
        })
      })

      describe('TypeGuard', () => {
        itTypes('validates to work correctly', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
        
          const { Enum: EnumOrdered, List, TypeGuard } = CreateOrdering(Enum.A, Enum.B, Enum.C);
          type EnumOrdered = typeof List[number];
    
          // Validate that type guard narrows correctly
          let x: EnumValues = null as any;
          if(TypeGuard(x)) {
            const y: EnumOrdered = x;
            y; // "use" variable
          }
    
          // @ts-expect-error Cannot pass a non-property-key to type guard
          TypeGuard({})
        })

        it('can create type guard for full set in same order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
        
          const { TypeGuard } = CreateOrdering(Enum.A, Enum.B, Enum.C);
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(true);
          expect(TypeGuard(Enum.C)).toEqual(true);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })

        it('can create type guard for full set in alternate order', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
        
          const { TypeGuard } = CreateOrdering(Enum.A, Enum.C, Enum.B);
          expect(TypeGuard(Enum.A)).toEqual(true);
          expect(TypeGuard(Enum.B)).toEqual(true);
          expect(TypeGuard(Enum.C)).toEqual(true);
          expect(TypeGuard(unrecognizedValue)).toEqual(false);
        })
      })

      describe('IndexByValue', () => {
        itTypes('validate number types', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { Enum: EnumSubset, List, IndexByValue } = CreateOrdering(Enum.A, Enum.B, Enum.C);
          type EnumSubset = typeof List[number];
    
          //@ts-expect-error Disallow invalid number assignment
          const x: typeof IndexByValue[EnumSubset] = 3;
    
          type CIndex = typeof IndexByValue[typeof Enum.C];
          // Ensure assignment works for correct number
          const test2: CIndex = 2;
          test2; // "use" variable
          //@ts-expect-error Invalid index for 'c' but valid for 'a'
          const test0: CIndex = 0;
    
          //@ts-expect-error Must pass value from enum
          IndexByValue[unrecognizedValue]
        })
    
        it('ensure indices match value index in List', () => {
          const { Enum, CreateOrdering } = CreateBasicEnum();
          const { Enum: EnumSubset, IndexByValue } = CreateOrdering(Enum.A, Enum.C, Enum.B);
    
          expect(IndexByValue).toEqual({
            [EnumSubset.A]: 0,
            [EnumSubset.C]: 1,
            [EnumSubset.B]: 2,
          })
        })
      })
    })

    describe('TypeGuard', () => {
      itTypes('validates to work correctly', () => {
        const { Enum, List, TypeGuard } = CreateBasicEnum();
        type Enum = typeof List[number];

        // Validate that type guard narrows correctly
        let x: EnumValues = null as any;
        if(TypeGuard(x)) {
          const y: Enum = x;
          y; // "use" variable
        }

        // @ts-expect-error Cannot pass a non-property-key to type guard
        TypeGuard({})
      })

      it('can create type guard for full set', () => {
        const { Enum, TypeGuard } = CreateBasicEnum();

        expect(TypeGuard(Enum.A)).toEqual(true);
        expect(TypeGuard(Enum.B)).toEqual(true);
        expect(TypeGuard(Enum.C)).toEqual(true);
        expect(TypeGuard(unrecognizedValue)).toEqual(false);
      })

      it('can create type guard for partial subset', () => {
        const { Enum, CreateSubset } = CreateBasicEnum();
      
        const { TypeGuard } = CreateSubset(Enum.A, Enum.C);
        expect(TypeGuard(Enum.A)).toEqual(true);
        expect(TypeGuard(Enum.B)).toEqual(false);
        expect(TypeGuard(Enum.C)).toEqual(true);
        expect(TypeGuard(unrecognizedValue)).toEqual(false);
      })

      it('can create type guard for singleton subset', () => {
        const { Enum, CreateSubset } = CreateBasicEnum();
      
        const { TypeGuard } = CreateSubset(Enum.A);
        expect(TypeGuard(Enum.A)).toEqual(true);
        expect(TypeGuard(Enum.B)).toEqual(false);
        expect(TypeGuard(Enum.C)).toEqual(false);
        expect(TypeGuard(unrecognizedValue)).toEqual(false);
      })

      it('can create type guard for empty subset', () => {
        const { Enum, CreateSubset } = CreateBasicEnum();
      
        const { TypeGuard } = CreateSubset();
        expect(TypeGuard(Enum.A)).toEqual(false);
        expect(TypeGuard(Enum.B)).toEqual(false);
        expect(TypeGuard(Enum.C)).toEqual(false);
        expect(TypeGuard(unrecognizedValue)).toEqual(false);
      })
    })

    describe('IndexByValue', () => {
      itTypes('validate number types', () => {
        const { Enum, List, IndexByValue } = CreateBasicEnum();
        type Enum = typeof List[number];

        //@ts-expect-error Disallow invalid number assignment
        const x: typeof IndexByValue[Enum] = 3;

        type BIndex = typeof IndexByValue[typeof Enum.B];
        // Ensure assignment works for correct number
        const test1: BIndex = 1;
        test1; // "use" variable
        //@ts-expect-error Invalid index for 'b' but valid for 'a'
        const test0: BIndex = 0;

        //@ts-expect-error Must pass value from enum
        IndexByValue[unrecognizedValue]
      })

      it('ensure indices match value index in List', () => {
        const { Enum, IndexByValue } = CreateBasicEnum();

        expect(IndexByValue).toEqual({
          [Enum.A]: 0,
          [Enum.B]: 1,
          [Enum.C]: 2
        })
      })
    })
  })

}

// Number-value enums
runTestsForValues('numbers', 0, 1, 2, 1234);

// String-value enums
runTestsForValues('strings', 'a', 'b', 'c', 'asdf');

// Symbol-value enums
runTestsForValues('symbols', symbolA, symbolB, symbolC, symbolUnrecognized);

// Mixed-value enums
runTestsForValues('mixed', 'a', 1, symbolC, 'asdf');