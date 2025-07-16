import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import browserSyncLib from 'browser-sync';
import { deleteAsync } from 'del';
import fg from 'fast-glob';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { unlink, writeFile } from 'fs/promises';
import { dest, parallel, series, src, watch } from 'gulp';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import gcmq from 'gulp-group-css-media-queries';
import pug from 'gulp-pug';
import rename from 'gulp-rename';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import path, { dirname } from 'path';
import { rollup } from 'rollup';
import polyfills from 'rollup-plugin-polyfill-node';
import * as sass from 'sass';

const browserSync = browserSyncLib.create();
const scss = gulpSass(sass);

const _dir = {
    dist: 'htdocs',
    src: 'src',
    autoImports: path.resolve('src/.cache/auto-imports')
};

async function recursiveResolveComponents(pugFile, seenFiles = new Set()) {
    if (seenFiles.has(pugFile)) return new Set();
    seenFiles.add(pugFile);

    const components = new Set();
    if (!fs.existsSync(pugFile)) return components;

    const content = await fs.promises.readFile(pugFile, 'utf8');
    const dir = path.dirname(pugFile);

    const includeRegex = /include\s+([^\n\r]+)/g;
    const matches = [...content.matchAll(includeRegex)];

    for (const match of matches) {
        const rawPath = match[1].trim().replace(/\.pug$/, '');
        const resolvedPath = path.resolve(dir, rawPath + '.pug');

        if (
            rawPath.includes('common/components/') ||
            resolvedPath.includes(path.resolve(_dir.src, 'common/components'))
        ) {
            const maybeComponentName = path.basename(path.dirname(resolvedPath));
            components.add(maybeComponentName);
        }


        if (fs.existsSync(resolvedPath)) {
            const nested = await recursiveResolveComponents(resolvedPath, seenFiles);
            nested.forEach(c => components.add(c));
        }
    }

    return components;
}

async function generatePerPageImports() {
    const entryFiles = await fg([
        `${_dir.src}/pages/**/index.pug`,
        `${_dir.src}/layouts/**/*.pug`
    ]);

    await fsExtra.ensureDir(_dir.autoImports);
    const existingAutoImports = await fg([`${_dir.autoImports}/_*.scss`]);
    const generated = new Set();

    for (const entryFile of entryFiles) {
        const pageDir = path.dirname(entryFile);
        const components = await recursiveResolveComponents(entryFile);

        const relativeName = path.relative(_dir.src, entryFile).replace(/[\\/]/g, '-').replace(/\.pug$/, '');
        const autoImportFilename = `_${relativeName}.scss`;
        const autoImportPath = path.join(_dir.autoImports, autoImportFilename);

        const autoImportPathRelative = path.relative(pageDir, autoImportPath).replace(/\\/g, '/').replace(/^_/, '').replace(/\.scss$/, '');
        const importStatement = `@use '${autoImportPathRelative}' as *;`;

        generated.add(path.resolve(autoImportPath));

        if (components.size === 0) {
            if (fs.existsSync(autoImportPath)) await unlink(autoImportPath);
            continue;
        }

        const lines = [];
        for (const component of components) {
            const scssPath = path.resolve(_dir.src, 'common/components', component, `${component}.scss`);
            if (fs.existsSync(scssPath)) {
                const relativeToCache = path.relative(_dir.autoImports, scssPath).replace(/\\/g, '/');
                lines.push(`@use '${relativeToCache}' as *;`);
            }
        }

        await writeFile(autoImportPath, lines.join('\n') + '\n', 'utf8');

        const scssEntry = path.join(pageDir, 'index.scss');
        if (fs.existsSync(scssEntry)) {
            let content = await fs.promises.readFile(scssEntry, 'utf8');
            const regex = /^@use\s+['"]([^'"]+)['"]\s+as\s+\*;/gm;

            content = content.replace(regex, (line, pathName) =>
                pathName.includes('.cache/auto-imports') || pathName.startsWith('..') ? '' : line
            ).trimStart();

            if (!content.includes(importStatement)) {
                content = `${importStatement}\n${content}`;
                await fs.promises.writeFile(scssEntry, content.trim() + '\n', 'utf8');
            }
        }
    }

    for (const file of existingAutoImports) {
        if (!generated.has(path.resolve(file))) {
            await unlink(file);
        }
    }
}

function css(cb) {
    const scssFiles = fg.sync(`${_dir.src}/pages/**/!(_)*.scss`);
    if (scssFiles.length === 0) return cb();

    return src(scssFiles, { base: _dir.src + '/pages' })
        .pipe(sourcemaps.init())
        .pipe(scss({
            includePaths: [
                path.resolve('node_modules'),
                _dir.autoImports
            ]
        }).on('error', scss.logError))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version', 'not dead'] }))
        .pipe(gcmq())
        .pipe(cleanCSS())
        .pipe(rename(filePath => {
            const pageName = path.basename(filePath.dirname);
            filePath.dirname = '';
            filePath.basename = `page-${pageName}`;
            filePath.extname = '.min.css';
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(_dir.dist + '/css'))
        .pipe(browserSync.stream());
}

function globalCss(cb) {
    const globalPath = path.join(_dir.src, 'assets/scss/main.scss');
    if (!fs.existsSync(globalPath)) return cb();

    return src(globalPath)
        .pipe(sourcemaps.init())
        .pipe(scss({
            includePaths: [
                path.resolve('node_modules'),
                _dir.autoImports
            ]
        }).on('error', scss.logError))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version', 'not dead'] }))
        .pipe(gcmq())
        .pipe(cleanCSS())
        .pipe(rename({ basename: 'global', suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(_dir.dist + '/css'))
        .pipe(browserSync.stream());
}

function html(cb) {
    if (!fs.existsSync(_dir.src + '/pages')) return cb();

    return src(_dir.src + '/pages/**/*.pug')
        .pipe(pug({ pretty: true, basedir: _dir.src }))
        .pipe(rename(path => {
            path.basename = path.dirname.replace(/\\/g, '-');
            path.dirname = '';
        }))
        .pipe(dest(_dir.dist))
        .on('end', browserSync.reload);
}

async function js(cb) {
    const entry = _dir.src + '/assets/js/main.js';
    if (!fs.existsSync(entry)) return cb();

    const inputOptions = {
        input: entry,
        plugins: [
            polyfills(),
            resolve({ browser: true, preferBuiltins: false }),
            commonjs({ transformMixedEsModules: true }),
            json(),
            babel({
                babelHelpers: 'bundled',
                presets: ['@babel/preset-env'],
                exclude: 'node_modules/**',
            })
        ]
    };

    const outputOptions = {
        file: _dir.dist + '/js/main.min.js',
        format: 'iife',
        sourcemap: true,
    };

    const bundle = await rollup(inputOptions);
    await fsExtra.ensureDir(dirname(outputOptions.file));
    await bundle.write(outputOptions);
    browserSync.reload();
}

function files(cb) {
    const srcPath = path.resolve(_dir.src, 'assets/files');
    const distPath = path.resolve(_dir.dist, 'files');

    fsExtra.copy(srcPath, distPath)
        .then(() => {
            browserSync.reload();
            cb();
        })
        .catch(err => {
            console.error('[files] Copy failed:', err);
            cb(err);
        });
}

function clean() {
    return deleteAsync([_dir.dist + '/**', '!' + _dir.dist]);
}

function browser_sync() {
    browserSync.init({
        server: {
            baseDir: _dir.dist,
            index: 'index.html'
        },
        open: true
    });
}

function watch_files() {
    watch(_dir.src + '/scss/**/*.scss', css);
    watch(_dir.src + '/assets/scss/**/*.scss', globalCss);
    watch([
        _dir.src + '/pages/**/*.pug',
        _dir.src + '/common/components/**/*.pug'
    ], series(generatePerPageImports, html, css));
    watch(_dir.src + '/common/components/**/*.scss', series(generatePerPageImports, css));
    watch(_dir.src + '/pages/**/index.scss', css);
    watch(_dir.src + '/**/*.js', js);
    watch(_dir.src + '/assets/files/**/*', files);
}

export const build = series(
    clean,
    generatePerPageImports,
    parallel(html, css, globalCss, js, files)
);

export default series(build, parallel(browser_sync, watch_files));
