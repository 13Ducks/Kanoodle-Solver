import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
      appDir: 'app', // Required as the default is _app
      adapter: adapter()
  },
  paths: {
    base: process.argv.includes('dev') ? '' : '/kanoodle-solver'
  },
  preprocess: vitePreprocess()
};

export default config;
