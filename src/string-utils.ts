export const indent = (content: string, indent: string, ignoreFirstLine = false) => {
	return ((ignoreFirstLine ? '' : indent) + content).split('\n').join(indent);
};

export const camelCase = (str: string) => {
	return str.charAt(0).toUpperCase() + str.substring(1);
};
