import { GolangInfo } from './generator';
import { ethers } from 'ethers';
import { append } from './file-utils';
import { JsonFragmentType } from '@ethersproject/abi/src.ts/fragments';
import { camelCase, indent } from './string-utils';

type Method = {
	name: string;
	nameCamelCase: string;
	stateMutability: 'payable' | 'nonpaybale';
	inputs: ReadonlyArray<JsonFragmentType>;
	outputs: ReadonlyArray<JsonFragmentType>;
};

const mapSolidityToGoType = (fragment: JsonFragmentType, useStructName: boolean) => {
	const mapTypes = new Map<string, string>([
		['uint', '*big.Int'],
		['uint256', '*big.Int'],
		['uint128', '*big.Int'],
		['uint64', 'uint64'],
		['uint32', 'uint32'],
		['uint24', 'uint32'],
		['uint16', 'uint16'],
		['uint8', 'uint8'],
		['int', '*big.Int'],
		['int256', '*big.Int'],
		['int128', '*big.Int'],
		['int64', 'int64'],
		['int32', 'int32'],
		['int24', 'int32'],
		['int16', 'int16'],
		['int8', 'int8'],
		['bool', 'bool'],
		['bytes', '[]byte'],
		['address', 'common.Address'],
	]);

	const regex = new RegExp(/^([a-zA-Z]\w*)(\W*)$/);
	const matchResult = regex.exec(fragment.type);

	const plainType = matchResult[1];
	const array = matchResult[2];

	if (mapTypes.has(plainType)) {
		return array + mapTypes.get(plainType);
	} else if (plainType === 'tuple' && fragment.components) {
		if (useStructName) {
			const regex = new RegExp(/^struct ([a-zA-Z0-9.]+)/);
			const regRes = regex.exec(fragment.internalType);
			if (regRes) {
				return (array + regRes[1]).split('.').join('');
			}
		}

		const struct = [array + 'struct {'];
		for (const arg of fragment.components) {
			struct.push(`\t${camelCase(arg.name)} ${mapSolidityToGoType(arg, false)}`);
		}
		struct.push('}');
		return struct.join('\n');
	} else {
		throw new Error(`Bad solidity type ${plainType}`);
	}
};

/**
 * Add static call for non-view methods.
 * @param fileContent
 * @param goinfo
 */
export const generatorStaticCall = (fileContent: string, goinfo: GolangInfo) => {
	const lines: string[] = [];

	// 1. List events and create const
	const methods: Method[] = [];
	for (const frag of goinfo.abi) {
		if (frag.type === 'function' && frag.stateMutability !== 'view') {
			const nameCamelCase = frag.name.charAt(0).toUpperCase() + frag.name.substring(1);
			methods.push({
				name: frag.name,
				nameCamelCase: nameCamelCase,
				stateMutability: frag.stateMutability as 'payable' | 'nonpaybale',
				inputs: frag.inputs,
				outputs: frag.outputs,
			});
		}
	}

	// 2. Create functions for parsing receipt
	for (const method of methods) {
		let allArgs = '';
		let signature = `func (contract *${goinfo.structName}) Static${method.nameCamelCase}(opts *bind.CallOpts`;
		if (method.stateMutability === 'payable') {
			signature += `, value *big.Int`;
		}
		for (const input of method.inputs) {
			signature += `, ${input.name} ${mapSolidityToGoType(input, true)}`;
			allArgs += `, ${input.name}`;
		}

		let outputType: string;
		let outputTarget: 'tuple' | 'single' | 'none' = 'none';
		let defaultReturn: string;
		if (method.outputs.length === 1) {
			outputType = mapSolidityToGoType(method.outputs[0], false);
			outputTarget = 'single';

			defaultReturn = outputType.charAt(0) === '*' ? 'nil' : outputType.includes('int') ? '0' : 'false';
			defaultReturn += ', err';
		} else if (method.outputs.length > 1) {
			outputType = mapSolidityToGoType(
				{
					type: 'tuple',
					components: method.outputs,
				},
				false,
			);
			outputTarget = 'tuple';
			defaultReturn = '*outstruct, err';
		} else {
			outputType = '';
			defaultReturn = 'err';
		}

		signature += `) (${outputType}${outputTarget !== 'none' ? ', ' : ''}error)`;

		lines.push(
			`// Static${method.nameCamelCase} perform a Static Call on the method ${method.name}`,
			`${signature} {`,
			`	input, err := contract.ABI.Pack("${method.name}"${allArgs})`,
			`	if err != nil {`,
			`		return ${defaultReturn}`,
			`	}`,
			'',
			`	${outputTarget !== 'none' ? 'data' : '_'}, err ${
				outputTarget !== 'none' ? ':' : ''
			}= contract.Backend.CallContract(context.Background(), ethereum.CallMsg{`,
			`		From:  opts.From,`,
			`		To:    &contract.Address,` + (method.stateMutability === 'payable' ? `\n\t\tValue: value,` : ''),
			`		Data:  input,`,
			`	}, opts.BlockNumber)`,
			'',
			`	if err != nil {`,
			`		return ${defaultReturn}`,
			`	}`,
			'',
		);

		if (outputTarget !== 'none') {
			lines.push(
				`	out, err := contract.ABI.Unpack("${method.name}", data)`,
				`	if err != nil {`,
				`		return ${defaultReturn}`,
				`	}`,
				'',
			);
		}

		if (outputTarget === 'single') {
			lines.push(`	return *abi.ConvertType(out[0], new(${outputType})).(*${outputType}), nil`);
		} else if (outputTarget === 'tuple') {
			lines.push(`	outstruct := new(${indent(outputType, '\t', true)})`);

			let i = 0;
			for (const out of method.outputs) {
				const fieldType = mapSolidityToGoType(out, false);
				lines.push(
					`	outstruct.${camelCase(out.name)} = *abi.ConvertType(out[${i}], new(${fieldType})).(*${fieldType})`,
				);
				i++;
			}
			lines.push(`	return *outstruct, err`);
		} else {
			lines.push(`	return ${defaultReturn}`);
		}

		lines.push('}', '');
	}

	return append(fileContent, lines);
};
