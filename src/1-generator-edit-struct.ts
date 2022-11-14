import { insertAfterLine, removeLinesAfter } from './file-utils';
import { GolangInfo } from './generator';

/**
 * Add Address, Backend, ABI to the main struct.
 * Edit the constructor to fill theses fields.
 * @param fileContent
 * @param goinfo
 */
export const generatorEditStruct = (fileContent: string, goinfo: GolangInfo) => {
	fileContent = insertAfterLine(fileContent, 'import (', [`"bytes"`, `"context"`]);

	fileContent = insertAfterLine(fileContent, `type ${goinfo.structName} struct {`, [
		'Address common.Address',
		'Backend bind.ContractBackend',
		'ABI abi.ABI',
	]);

	fileContent = removeLinesAfter(fileContent, `func New${goinfo.structName}(`, 5);
	fileContent = insertAfterLine(
		fileContent,
		`func New${goinfo.structName}(`,
		[
			`parsed, err := abi.JSON(strings.NewReader(${goinfo.structName}ABI))`,
			'if err != nil {',
			'\treturn nil, err',
			'}',
			'contract := bind.NewBoundContract(address, parsed, backend, backend, backend)',
			`return &${goinfo.structName}{`,
			'\tAddress: address,',
			'\tBackend: backend,',
			'\tABI: parsed,',
			`\t${goinfo.structName}Caller: ${goinfo.structName}Caller{contract: contract},`,
			`\t${goinfo.structName}Transactor: ${goinfo.structName}Transactor{contract: contract},`,
			`\t${goinfo.structName}Filterer: ${goinfo.structName}Filterer{contract: contract},`,
			'}, nil',
		].map((l) => '\t' + l),
	);

	return fileContent;
};
