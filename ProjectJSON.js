const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const outputFileName = path.basename(directoryPath) + '_structure.json';

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

function processFileContent(filePath) {
    if (shouldExcludeContent(filePath)) {
        return 'Binary file - content not shown';
    } else if (filePath.endsWith('.env')) {
        return fs.readFileSync(filePath, 'utf8').replace(/=.*/g, '=PLACEHOLDER');
    } else {
        return fs.readFileSync(filePath, 'utf8');
    }
}

function constructFileTree(dir, relativePath = '') {
    let tree = [];
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const relPath = path.join(relativePath, file);

        if (shouldExclude(fullPath)) {
            return;
        }

        if (isDirectory(fullPath)) {
            let subTree = constructFileTree(fullPath, relPath);
            if (subTree.length > 0) {
                tree.push({ [relPath + '/']: subTree });
            } else {
                tree.push(relPath + '/');
            }
        } else {
            tree.push(relPath);
        }
    });
    return tree;
}

function readDirectoryRecursively(dir, obj, relativePath = '') {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const relPath = path.join(relativePath, file);

        if (shouldExclude(fullPath)) {
            return;
        }

        if (isDirectory(fullPath)) {
            obj[relPath + '/'] = {};
            readDirectoryRecursively(fullPath, obj[relPath + '/'], relPath);
        } else {
            obj[relPath] = processFileContent(fullPath);
        }
    });
}

const fileTree = constructFileTree(directoryPath);
const detailedFileTree = {};
readDirectoryRecursively(directoryPath, detailedFileTree);

const projectJson = {
    fileTree: fileTree,
    detailedFileTree: detailedFileTree
};

fs.writeFileSync(outputFileName, JSON.stringify(projectJson, null, 2));
