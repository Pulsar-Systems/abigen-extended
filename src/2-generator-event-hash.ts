import { GolangInfo } from './generator';
import { ethers } from 'ethers';
import { append } from './file-utils';

type Event = {
	name: string;
	nameCamelCase: string;
	structName: string;
	constName: string;
	hash: string;
};

/**
 * Add const for event hash (EVENT_XXX_HASH).
 * Add ParseReceiptXXX functions.
 * @param fileContent
 * @param goinfo
 */
export const generatorEventHash = (fileContent: string, goinfo: GolangInfo) => {
	const lines: string[] = [];

	// 1. List events and create const
	const events: Event[] = [];
	for (const frag of goinfo.abi) {
		if (frag.type === 'event') {
			const nameCamelCase = frag.name.charAt(0).toUpperCase() + frag.name.substring(1);
			const event = {
				name: frag.name,
				nameCamelCase: nameCamelCase,
				structName: `${goinfo.structName}${nameCamelCase}`,
				constName: `EVENT_${frag.name.toUpperCase()}_HASH`,
				hash: ethers.utils.id(`${frag.name}(${frag.inputs.map((i) => i.type).join(',')})`),
			};
			events.push(event);

			lines.push(`var ${event.constName} = common.HexToHash("${event.hash}")`);
		}
	}
	lines.push('');

	// 2. Create functions for parsing receipt
	for (const event of events) {
		lines.push(
			`// ParseReceipt${event.nameCamelCase} return all ${event.name} parsed log included in this receipt`,
			`func (contract *${goinfo.structName}) ParseReceipt${event.nameCamelCase}(receipt *types.Receipt) ([]*${event.structName}, error) {`,
			`	result := make([]*${event.structName}, 0, 1)`,
			`	for _, eventLog := range receipt.Logs {`,
			`		if bytes.Equal(eventLog.Topics[0].Bytes(), ${event.constName}.Bytes()) {`,
			`			parsed, err := contract.Parse${event.nameCamelCase}(*eventLog)`,
			`			if err != nil {`,
			`				return nil, err`,
			`			}`,
			`			result = append(result, parsed)`,
			`		}`,
			`	}`,
			`	return result, nil`,
			`}`,
			``,
		);
	}

	return append(fileContent, lines);
};
