export const getNextLineStartIndex = (content: string, search: string) => {
	let index = content.indexOf(search);
	if (index < 0) {
		throw new Error(`Can't find test ${search} in the ABI`);
	}
	index += search.length;

	while (content.charAt(index) !== '\n') {
		index++;
	}
	return index + 1;
};

export const removeLinesAfter = (content: string, search: string, remove: number) => {
	const startIndex = getNextLineStartIndex(content, search);
	let endIndex = startIndex;

	for (let count = 0; count < remove; endIndex++) {
		if (content.charAt(endIndex) == '\n') {
			count++;
		}
	}

	return content.substring(0, startIndex) + content.substring(endIndex);
};

export const insertAfterLine = (content: string, search: string, insert: string[]) => {
	const index = getNextLineStartIndex(content, search);
	let spaces = '';
	for (let spacesIndex = index; ['\t', ' '].includes(content.charAt(spacesIndex)); spacesIndex++) {
		spaces += content.charAt(spacesIndex);
	}

	return content.substring(0, index) + insert.map((l) => spaces + l + '\n').join('') + content.substring(index);
};

export const append = (content: string, insert: string[]) => {
	return content + '\n' + insert.map((l) => l + '\n').join('');
};
