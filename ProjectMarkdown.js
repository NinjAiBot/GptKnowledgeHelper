const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const outputFileName = path.basename(directoryPath) + '_structure.md';

function isDirectory(filePath) {
    return fs.lstatSync(filePath).isDirectory();
}

function shouldExclude(filePath) {
    const excludedPaths = ['.vercel', '.git', 'node_modules'];
    return excludedPaths.some(excluded => filePath.includes(path.join(directoryPath, excluded))) || 
           path.basename(filePath) === 'package-lock.json';
}

function shouldExcludeContent(filePath) {
    const binaryExtensions = ['.ico', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.ttf', '.woff', '.woff2', '.eot', '.otf', '.mp3', '.mp4', '.avi', '.mov', '.pdf', '.docx', '.pptx', '.xlsx', '.bin'];
    return binaryExtensions.some(ext => filePath.endsWith(ext));
}

function getFileExtension(filePath) {
    return filePath.split('.').pop();
}

function markdownEscape(str) {
    return str.replace(/([_#*])/g, '\\$1');
}

function createMarkdownLink(file, relativePath) {
    const anchor = relativePath.split('/').join('').split('.').join('');
    return `[${markdownEscape(file)}](#${anchor.toLowerCase()})`;
}

function createDirectoryMenu(dir, relativePath = '', depth = 0) {
    let markdown = '';
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const relPath = path.join(relativePath, file);

        if (shouldExclude(fullPath)) {
            return;
        }

        const indent = '  '.repeat(depth);
        if (isDirectory(fullPath)) {
            markdown += `${indent}- ${createMarkdownLink(file, relPath)}\n`;
            markdown += createDirectoryMenu(fullPath, relPath, depth + 1);
        } else {
            markdown += `${indent}- ${createMarkdownLink(file, relPath)}\n`;
        }
    });
    return markdown;
}

function createFileSection(dir, relativePath = '') {
    let content = '';
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const relPath = path.join(relativePath, file);

        if (shouldExclude(fullPath)) {
            return;
        }

        const anchor = relPath.split('/').join('').split('.').join('').toLowerCase();
        if (isDirectory(fullPath)) {
            content += `\n## ${markdownEscape(relPath)}\n\n`;
            content += createFileSection(fullPath, relPath);
        } else {
            const extension = getFileExtension(file);
            let fileContent = shouldExcludeContent(fullPath) ? 'Binary file - content not shown' 
                            : (extension === 'env' ? 'Sensitive content - not shown' 
                            : fs.readFileSync(fullPath, 'utf8'));
            content += `\n### ${markdownEscape(relPath)}\n\n`;
            content += '```' + extension + '\n';
            content += markdownEscape(fileContent) + '\n';
            content += '```\n';
        }
    });
    return content;
}

const directoryMenu = createDirectoryMenu(directoryPath);
const fileSections = createFileSection(directoryPath);

const markdownDocument = `# Project Structure\n\n## Directory Menu\n\n${directoryMenu}\n\n## File Contents\n\n${fileSections}`;

fs.writeFileSync(outputFileName, markdownDocument);
