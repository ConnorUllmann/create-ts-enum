import { CreateEnum, EnumOneToOneMapper } from "@cullmann/create-ts-enum";
import { itTypes } from "./type-tests";

describe('EnumOneToOneMapper (numbers)', () => {
  const a = 0;
  const b = 1;
  const c = 2;
  const d = 3;
  const unrecognizedValue = 1234;

  const { Enum: Test1, List: Test1s } = CreateEnum({ A: a }, { B: b }, { C: c });
  const { Enum: Test2, List: Test2s } = CreateEnum({ B: b }, { C: c }, { D: d });
  const { List: Test3s } = CreateEnum({ A: a }, { B: b }, { C: c }, { D: d });

  itTypes('rejects impossible mappings', () => {
    // @ts-expect-error Too many entries in second enum
    const mapperImpossible1 = EnumOneToOneMapper(Test1s, Test3s);
    // @ts-expect-error Too few entries in second enum
    const mapperImpossible2 = EnumOneToOneMapper(Test3s, Test1s);
  })

  itTypes('rejects failed mapping inputs', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    mapper.Create({
      [Test1.A]: Test2.D,
      // @ts-expect-error Unrecognized value
      [Test1.B]: unrecognizedValue,
      [Test1.C]: Test2.B,
    });
  
    mapper.Create({
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate value
      [Test1.B]: Test2.B,
      //@ts-expect-error Duplicate value
      [Test1.C]: Test2.B,
    });
  
    mapper.Create(
      // @ts-expect-error Missing keys
      { [Test1.A]: Test2.D }
    );
  
    mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
      //@ts-expect-error Unrecognized key
      test: Test2.B,
    });
  
    mapper.Create({
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.B,
      //@ts-expect-error Duplicate keys
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });
  })

  it('can create a mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      Mapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(Mapping).toEqual({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    })
  })

  it('can create an inverse mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      InverseMapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(InverseMapping).toEqual({
      [Test2.D]: Test1.A,
      [Test2.B]: Test1.B,
      [Test2.C]: Test1.C,
    })
  })
})

describe('EnumOneToOneMapper (strings)', () => {
  const a = 'a';
  const b = 'b';
  const c = 'c';
  const d = 'd';
  const unrecognizedValue = 'asdf';
  
  const { Enum: Test1, List: Test1s } = CreateEnum({ A: a }, { B: b }, { C: c });
  const { Enum: Test2, List: Test2s } = CreateEnum({ B: b }, { C: c }, { D: d });
  const { List: Test3s } = CreateEnum({ A: a }, { B: b }, { C: c }, { D: d });

  itTypes('rejects impossible mappings', () => {
    // @ts-expect-error Too many entries in second enum
    const mapperImpossible1 = EnumOneToOneMapper(Test1s, Test3s);
    // @ts-expect-error Too few entries in second enum
    const mapperImpossible2 = EnumOneToOneMapper(Test3s, Test1s);
  })

  itTypes('rejects failed mapping inputs', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    mapper.Create({
      [Test1.A]: Test2.D,
      // @ts-expect-error Unrecognized value
      [Test1.B]: unrecognizedValue,
      [Test1.C]: Test2.B,
    });
  
    mapper.Create({
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate value
      [Test1.B]: Test2.B,
      //@ts-expect-error Duplicate value
      [Test1.C]: Test2.B,
    });
  
    mapper.Create(
      // @ts-expect-error Missing keys
      { [Test1.A]: Test2.D }
    );
  
    mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
      //@ts-expect-error Unrecognized key
      test: Test2.B,
    });
  
    mapper.Create({
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.B,
      //@ts-expect-error Duplicate keys
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    mapper.Create({
      //@ts-expect-error Cannot map to non-property-key value
      [Test1.A]: [Test2.D],
      //@ts-expect-error Cannot map to non-property-key value
      [Test1.B]: [Test2.B],
      //@ts-expect-error Cannot map to non-property-key value
      [Test1.C]: [Test2.C],
    })
  })

  it('can create a mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      Mapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(Mapping).toEqual({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    })
  })

  it('can create an inverse mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      InverseMapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(InverseMapping).toEqual({
      [Test2.D]: Test1.A,
      [Test2.B]: Test1.B,
      [Test2.C]: Test1.C,
    })
  })
})

describe('EnumOneToOneMapper (symbols)', () => {
  const a = Symbol('a')
  const b = Symbol('b')
  const c = Symbol('c')
  const d = Symbol('d')
  const unrecognizedValue = Symbol('e')

  const { Enum: Test1, List: Test1s } = CreateEnum({ A: a }, { B: b }, { C: c });
  const { Enum: Test2, List: Test2s } = CreateEnum({ B: b }, { C: c }, { D: d });
  const { List: Test3s } = CreateEnum({ A: a }, { B: b }, { C: c }, { D: d });

  itTypes('rejects impossible mappings', () => {
    // @ts-expect-error Too many entries in second enum
    const mapperImpossible1 = EnumOneToOneMapper(Test1s, Test3s);
    // @ts-expect-error Too few entries in second enum
    const mapperImpossible2 = EnumOneToOneMapper(Test3s, Test1s);
  })

  itTypes('rejects failed mapping inputs', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    mapper.Create({
      [Test1.A]: Test2.D,
      // @ts-expect-error Unrecognized value
      [Test1.B]: unrecognizedValue,
      [Test1.C]: Test2.B,
    });
  
    mapper.Create({
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate value
      [Test1.B]: Test2.B,
      //@ts-expect-error Duplicate value
      [Test1.C]: Test2.B,
    });
  
    mapper.Create(
      // @ts-expect-error Missing keys
      { [Test1.A]: Test2.D }
    );
  
    mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
      //@ts-expect-error Unrecognized key
      test: Test2.B,
    });
  
    mapper.Create({
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.B,
      //@ts-expect-error Duplicate keys
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });
  })

  it('can create a mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      Mapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(Mapping).toEqual({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    })
  })

  it('can create an inverse mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      InverseMapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(InverseMapping).toEqual({
      [Test2.D]: Test1.A,
      [Test2.B]: Test1.B,
      [Test2.C]: Test1.C,
    })
  })
})

describe('EnumOneToOneMapper (mixed)', () => {
  const a = 0;
  const b = 'b';
  const c = Symbol('c');
  const d = 'd';
  const unrecognizedValue = 1234;

  const { Enum: Test1, List: Test1s } = CreateEnum({ A: a }, { B: b }, { C: c });
  const { Enum: Test2, List: Test2s } = CreateEnum({ B: b }, { C: c }, { D: d });
  const { List: Test3s } = CreateEnum({ A: a }, { B: b }, { C: c }, { D: d });

  itTypes('rejects impossible mappings', () => {
    // @ts-expect-error Too many entries in second enum
    const mapperImpossible1 = EnumOneToOneMapper(Test1s, Test3s);
    // @ts-expect-error Too few entries in second enum
    const mapperImpossible2 = EnumOneToOneMapper(Test3s, Test1s);
  })

  itTypes('rejects failed mapping inputs', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    mapper.Create({
      [Test1.A]: Test2.D,
      // @ts-expect-error Unrecognized value
      [Test1.B]: unrecognizedValue,
      [Test1.C]: Test2.B,
    });
  
    mapper.Create({
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate value
      [Test1.B]: Test2.B,
      //@ts-expect-error Duplicate value
      [Test1.C]: Test2.B,
    });
  
    mapper.Create(
      // @ts-expect-error Missing keys
      { [Test1.A]: Test2.D }
    );
  
    mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
      //@ts-expect-error Unrecognized key
      test: Test2.B,
    });
  
    mapper.Create({
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.D,
      //@ts-expect-error Duplicate keys
      [Test1.A]: Test2.B,
      //@ts-expect-error Duplicate keys
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });
  })

  it('can create a mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      Mapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(Mapping).toEqual({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    })
  })

  it('can create an inverse mapping successfully', () => {
    const mapper = EnumOneToOneMapper(Test1s, Test2s);
  
    const {
      InverseMapping
    } = mapper.Create({
      [Test1.A]: Test2.D,
      [Test1.B]: Test2.B,
      [Test1.C]: Test2.C,
    });

    expect(InverseMapping).toEqual({
      [Test2.D]: Test1.A,
      [Test2.B]: Test1.B,
      [Test2.C]: Test1.C,
    })
  })
})