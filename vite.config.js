import {defineConfig} from 'vite';
import {cpSync} from 'node:fs';
export default defineConfig({base:'./',server:{host:'0.0.0.0',allowedHosts:['terminal.local']},build:{target:'es2022',outDir:'dist',assetsInlineLimit:0},plugins:[{name:'local-runtime-assets',closeBundle(){cpSync('assets','dist/assets',{recursive:true});cpSync('manifest.webmanifest','dist/manifest.webmanifest');cpSync('docs/SPECTOR-LICENSE.txt','dist/SPECTOR-LICENSE.txt');}}]});
