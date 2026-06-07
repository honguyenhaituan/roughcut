const config = {
  '*.{js,jsx,ts,tsx,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,mdx,yml,yaml}': ['prettier --write'],
  '*.css': ['prettier --write'],
};

export default config;
