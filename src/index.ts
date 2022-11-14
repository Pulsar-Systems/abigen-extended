#!/usr/bin/env node
import yargs from 'yargs';
import { runGenerator } from './generator';

export type Options = {
	abi: string;
	pkg: string;
	out: string;
};

const script = async () => {
	// abigen --abi=<FILE-CONTAINING-ABI> --pkg=<PACKAGE-NAME> --out=<TARGET-GO-FILE>
	// yargs.scriptName("abigen-extended").usage('$0 <cmd> [args]').c
	const args: Options = yargs(process.argv.slice(2))
		.scriptName('abigen-extended')
		.option('abi', {
			type: 'string',
			requiresArg: true,
			demandOption: true,
			describe: 'Path to ABI file',
		})
		.option('pkg', {
			type: 'string',
			requiresArg: true,
			demandOption: true,
			describe: 'Golang package name',
		})
		.option('out', {
			type: 'string',
			requiresArg: true,
			demandOption: true,
			describe: 'Golang output file',
		})
		.strict().argv;

	await runGenerator(args);
	console.log('Done');
};
script().then();
