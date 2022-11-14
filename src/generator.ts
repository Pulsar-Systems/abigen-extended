import { Options } from './index';
import { exec } from 'child_process';
import * as fs from 'fs';
import { generatorEditStruct } from './1-generator-edit-struct';
import { JsonFragment } from '@ethersproject/abi';
import { generatorEventHash } from './2-generator-event-hash';
import { append } from './file-utils';
import { generatorStaticCall } from './3-generator-static-call';

export type GolangInfo = {
	structName: string;
	abi: ReadonlyArray<JsonFragment>;
};

export const runGenerator = async (args: Options) => {
	// 1. Generate the connector with abigen
	await new Promise((res, rej) => {
		exec(`abigen --abi=${args.abi} --pkg=${args.pkg} --out=${args.out}`, (error) => {
			if (error) rej(error);
			else res(undefined);
		});
	});

	// 2. Get basics infos
	const goinfo: GolangInfo = {
		structName: args.pkg.substring(0, 1).toUpperCase() + args.pkg.substring(1),
		abi: JSON.parse(fs.readFileSync(args.abi, { encoding: 'utf8' })),
	};

	let fileContent = fs.readFileSync(args.out, { encoding: 'utf8' });

	fileContent = generatorEditStruct(fileContent, goinfo);

	fileContent = append(fileContent, [
		'/////////////////////////////////////////////////',
		'//////////////// ABIGEN EXTENDED ////////////////',
		'/////////////////////////////////////////////////',
	]);
	fileContent = generatorEventHash(fileContent, goinfo);
	fileContent = generatorStaticCall(fileContent, goinfo);

	fs.writeFileSync(args.out, fileContent, { encoding: 'utf8' });
};
