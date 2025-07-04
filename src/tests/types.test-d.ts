import { expectType } from "tsd";
import { ContractFunctionReturnType } from "../coinbase/types/contract";
import { testAllReadTypesABI } from "./utils";

// Test for uint8
type PureUint8Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureUint8">;
expectType<number>({} as PureUint8Return);

// Test for uint16
type PureUint16Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureUint16">;
expectType<number>({} as PureUint16Return);

// Test for uint32
type PureUint32Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureUint32">;
expectType<number>({} as PureUint32Return);

// Test for uint64
type PureUint64Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureUint64">;
expectType<bigint>({} as PureUint64Return);

// Test for uint128
type PureUint128Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureUint128">;
expectType<bigint>({} as PureUint128Return);

// Test for uint256
type PureUint256Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureUint256">;
expectType<bigint>({} as PureUint256Return);

// Tests for int types
type PureInt8Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureInt8">;
expectType<number>({} as PureInt8Return);

type PureInt16Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureInt16">;
expectType<number>({} as PureInt16Return);

type PureInt32Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureInt32">;
expectType<number>({} as PureInt32Return);

type PureInt64Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureInt64">;
expectType<bigint>({} as PureInt64Return);

type PureInt128Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureInt128">;
expectType<bigint>({} as PureInt128Return);

type PureInt256Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureInt256">;
expectType<bigint>({} as PureInt256Return);

// Test for array
type PureArrayReturn = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureArray">;
expectType<readonly bigint[]>({} as PureArrayReturn);

// Test for address
type PureAddressReturn = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureAddress">;
expectType<`0x${string}`>({} as PureAddressReturn);

// Test for string
type PureStringReturn = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureString">;
expectType<string>({} as PureStringReturn);

// Test for boolean
type PureBoolReturn = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBool">;
expectType<boolean>({} as PureBoolReturn);

// Test for bytes
type PureBytesReturn = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes">;
expectType<`0x${string}`>({} as PureBytesReturn);

// Tests for bytes1 to bytes32
type PureBytes1Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes1">;
expectType<`0x${string}`>({} as PureBytes1Return);

type PureBytes2Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes2">;
expectType<`0x${string}`>({} as PureBytes2Return);

type PureBytes3Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes3">;
expectType<`0x${string}`>({} as PureBytes3Return);

type PureBytes4Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes4">;
expectType<`0x${string}`>({} as PureBytes4Return);

type PureBytes5Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes5">;
expectType<`0x${string}`>({} as PureBytes5Return);

type PureBytes6Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes6">;
expectType<`0x${string}`>({} as PureBytes6Return);

type PureBytes7Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes7">;
expectType<`0x${string}`>({} as PureBytes7Return);

type PureBytes8Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes8">;
expectType<`0x${string}`>({} as PureBytes8Return);

type PureBytes9Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes9">;
expectType<`0x${string}`>({} as PureBytes9Return);

type PureBytes10Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes10">;
expectType<`0x${string}`>({} as PureBytes10Return);

type PureBytes11Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes11">;
expectType<`0x${string}`>({} as PureBytes11Return);

type PureBytes12Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes12">;
expectType<`0x${string}`>({} as PureBytes12Return);

type PureBytes13Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes13">;
expectType<`0x${string}`>({} as PureBytes13Return);

type PureBytes14Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes14">;
expectType<`0x${string}`>({} as PureBytes14Return);

type PureBytes15Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes15">;
expectType<`0x${string}`>({} as PureBytes15Return);

type PureBytes16Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes16">;
expectType<`0x${string}`>({} as PureBytes16Return);

type PureBytes17Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes17">;
expectType<`0x${string}`>({} as PureBytes17Return);

type PureBytes18Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes18">;
expectType<`0x${string}`>({} as PureBytes18Return);

type PureBytes19Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes19">;
expectType<`0x${string}`>({} as PureBytes19Return);

type PureBytes20Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes20">;
expectType<`0x${string}`>({} as PureBytes20Return);

type PureBytes21Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes21">;
expectType<`0x${string}`>({} as PureBytes21Return);

type PureBytes22Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes22">;
expectType<`0x${string}`>({} as PureBytes22Return);

type PureBytes23Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes23">;
expectType<`0x${string}`>({} as PureBytes23Return);

type PureBytes24Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes24">;
expectType<`0x${string}`>({} as PureBytes24Return);

type PureBytes25Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes25">;
expectType<`0x${string}`>({} as PureBytes25Return);

type PureBytes26Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes26">;
expectType<`0x${string}`>({} as PureBytes26Return);

type PureBytes27Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes27">;
expectType<`0x${string}`>({} as PureBytes27Return);

type PureBytes28Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes28">;
expectType<`0x${string}`>({} as PureBytes28Return);

type PureBytes29Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes29">;
expectType<`0x${string}`>({} as PureBytes29Return);

type PureBytes30Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes30">;
expectType<`0x${string}`>({} as PureBytes30Return);

type PureBytes31Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes31">;
expectType<`0x${string}`>({} as PureBytes31Return);

type PureBytes32Return = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureBytes32">;
expectType<`0x${string}`>({} as PureBytes32Return);

type PureFunctionReturn = ContractFunctionReturnType<typeof testAllReadTypesABI, "returnFunction">;
expectType<`0x${string}${string}`>({} as PureFunctionReturn);

type PureTupleReturn = ContractFunctionReturnType<typeof testAllReadTypesABI, "pureTuple">;
expectType<readonly [bigint, bigint]>({} as PureTupleReturn);
