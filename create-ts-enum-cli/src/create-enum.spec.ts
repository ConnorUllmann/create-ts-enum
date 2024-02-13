import { CreateEnum } from '@cullmann/create-ts-enum';
import { itTypes } from './type-tests';

function CreateBasicEnum() {
  return CreateEnum(
    { A: 'a' },
    { B: 'b' },
    { C: 'c' }
  )
}

describe('CreateEnum', () => {
  describe('argument validity checks', () => {
    itTypes('aliases must have same value', () => {
      CreateEnum(
        //@ts-expect-error Values must be the same for a single entry
        { A: 'a', A2: 'a2' }
      )
    })

    itTypes('no matching keys in different entries', () => {
      CreateEnum(
        //@ts-expect-error Can't have the same key in two different entries
        { A: 'a' },
        { A: 'b' }
      )
    })

    itTypes('no matching values in different entries', () => {
      CreateEnum(
        //@ts-expect-error Can't have the same value in two different entries
        { A: 'a' },
        { B: 'a' }
      )
    })

    itTypes('no matching keys & values in different entries', () => {
      CreateEnum(
        //@ts-expect-error Can't have the same key & value in two different entries
        { A: 'a' },
        { A: 'a' }
      )
    })

    itTypes('enum type enforces value constraint', () => {
      const { Enum, List } = CreateEnum(
        { A: 'a' },
        { B: 'b' },
        { C: 'c' }
      );
      type Enum = typeof List[number];

      const a: Enum = Enum.A;
      const b: Enum = Enum.B;
      const c: Enum = Enum.C;

      // ensure variables are "used"
      a, b, c;

      //@ts-expect-error Cannot assign non-enum value to enum type.
      const d: Enum = 'd';
    })
  });

  describe('Enum', () => {
    it('accurately reflects names and values in config', () => {
      const { Enum } = CreateBasicEnum();
      expect(Enum.A).toEqual('a')
      expect(Enum.B).toEqual('b')
      expect(Enum.C).toEqual('c')
    })

    it('accurately reflects names and values in config with aliases', () => {
      const { Enum } = CreateEnum(
        { A: 'a', A2: 'a' },
        { B: 'b', },
        { C: 'c', c: 'c' }
      )
      expect(Enum.A).toEqual('a')
      expect(Enum.A2).toEqual('a')
      expect(Enum.B).toEqual('b')
      expect(Enum.C).toEqual('c')
      expect(Enum.c).toEqual('c')
    })
  });

  describe('List', () => {
    it('accurately reflects order of values in config', () => {
      const { Enum, List } = CreateBasicEnum();
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
      CreateSubset(Enum.C, Enum.A, 'N');
      //@ts-expect-error Unrecognized entry with all other values present
      CreateSubset(Enum.C, Enum.A, 'N', Enum.B);
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

        expect(EnumSubset.A).toEqual(Enum.A);
        expect(EnumSubset.B).toEqual(Enum.B);
        expect(EnumSubset.C).toEqual(Enum.C);
      })
      it('can still create full mapping when values are provided in an alternate order', () => {
        const { Enum, CreateSubset } = CreateBasicEnum();
        const { Enum: EnumSubset } = CreateSubset(Enum.A, Enum.C, Enum.B);

        expect(EnumSubset.A).toEqual(Enum.A);
        expect(EnumSubset.B).toEqual(Enum.B);
        expect(EnumSubset.C).toEqual(Enum.C);
      })
      it('can create partial mapping to match partial subset', () => {
        const { Enum, CreateSubset } = CreateBasicEnum();
        const { Enum: EnumSubset } = CreateSubset(Enum.A, Enum.C);

        expect(EnumSubset.A).toEqual(Enum.A);
        //@ts-expect-error "B" key & value has been omitted
        expect(EnumSubset.B).toEqual(undefined);
        expect(EnumSubset.C).toEqual(Enum.C);
      })
      it('can create partial mapping to match singleton subset', () => {
        const { Enum, CreateSubset } = CreateBasicEnum();
        const { Enum: EnumSubset } = CreateSubset(Enum.A);

        expect(EnumSubset.A).toEqual(Enum.A);
        //@ts-expect-error "B" key & value has been omitted
        expect(EnumSubset.B).toEqual(undefined);
        //@ts-expect-error "C" key & value has been omitted
        expect(EnumSubset.C).toEqual(undefined);
      })
      it('can create empty mapping to match empty subset', () => {
        const { CreateSubset } = CreateBasicEnum();
        const { Enum: EnumSubset } = CreateSubset();

        //@ts-expect-error "A" key & value has been omitted
        expect(EnumSubset.A).toEqual(undefined);
        //@ts-expect-error "B" key & value has been omitted
        expect(EnumSubset.B).toEqual(undefined);
        //@ts-expect-error "C" key & value has been omitted
        expect(EnumSubset.C).toEqual(undefined);
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
        CreateSubsetInner(Enum.A, Enum.B, 'c');
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
        CreateComplementSubsetInner('c');
        //@ts-expect-error Entry is not a part of the parent subset
        CreateComplementSubsetInner(Enum.A, Enum.C);
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
        CreateOrdering(Enum.A, 'N');
        //@ts-expect-error Unrecognized entry but all other values present
        CreateOrdering(Enum.A, 'N', Enum.B);
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
  })

  describe('CreateComplementSubset', () => {
    itTypes('cannot create subset with invalid values', () => {
      const { Enum, CreateComplementSubset } = CreateBasicEnum();
      
      //@ts-expect-error Unrecognized entry
      CreateComplementSubset('d');
      //@ts-expect-error Cannot provide the same entry twice
      CreateComplementSubset(Enum.A, Enum.A);
    })

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
      CreateOrdering(Enum.C, Enum.A, 'N');
      //@ts-expect-error Unrecognized entry but all other values present
      CreateOrdering(Enum.C, Enum.A, 'N', Enum.B);
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
})