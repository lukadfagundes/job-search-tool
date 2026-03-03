import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerZIP } from '@electron-forge/maker-zip';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'job-hunt',
    executableName: 'job-hunt',
    appCopyright: 'Copyright 2026 Luka Fagundes',
    appBundleId: 'com.lukadfagundes.jobhunt',
    win32metadata: {
      CompanyName: 'Luka Fagundes',
      FileDescription: 'Job Hunt - AI-Powered Job Search Tool',
      ProductName: 'Job Hunt',
      InternalName: 'job-hunt',
    },
  },
  makers: [
    new MakerSquirrel({
      authors: 'Luka Fagundes',
      description: 'Job Hunt - AI-powered job search tool with resume generation',
      setupExe: 'JobHuntSetup.exe',
      noMsi: true,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      format: 'ULFO',
      name: 'Job Hunt',
    }),
    new MakerDeb({
      options: {
        maintainer: 'Luka Fagundes',
        homepage: 'https://github.com/lukadfagundes/job-search-tool',
        categories: ['Utility'],
      },
    }),
    new MakerRpm({
      options: {
        homepage: 'https://github.com/lukadfagundes/job-search-tool',
        categories: ['Utility'],
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
  hooks: {
    postPackage: async (_config, options) => {
      const fs = await import('fs/promises');
      const path = await import('path');

      // Generate app-update.yml for electron-updater in the final packaged output
      const appUpdateYml = `provider: github
owner: lukadfagundes
repo: job-search-tool
`;

      for (const outputPath of options.outputPaths) {
        let resourcesPath: string;

        if (options.platform === 'darwin') {
          resourcesPath = path.join(outputPath, 'job-hunt.app', 'Contents', 'Resources');
        } else {
          resourcesPath = path.join(outputPath, 'resources');
        }

        await fs.mkdir(resourcesPath, { recursive: true });

        const appUpdatePath = path.join(resourcesPath, 'app-update.yml');
        await fs.writeFile(appUpdatePath, appUpdateYml, 'utf-8');
        console.log(`Generated app-update.yml at ${appUpdatePath}`);
      }
    },
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'lukadfagundes',
          name: 'job-search-tool',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
};

export default config;
