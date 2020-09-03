const fs = require('fs');
const path = require('path');
const logger = console;

const stubPatchMarker = `function stub(object, property) {
    if (arguments.length > 2) {
        throw new TypeError("stub(obj, 'meth', fn) has been removed, see documentation");
    }

    if (isEsModule(object)) {
        throw new TypeError("ES Modules cannot be stubbed");
    }

    throwOnFalsyObject.apply(null, arguments);

    if (isNonExistentOwnProperty(object, property)) {
        throw new TypeError("Cannot stub non-existent own property " + valueToString(property));
    }

    var actualDescriptor = getPropertyDescriptor(object, property);
`;

const stubPatchContents = `
// [HACK] Convert access descriptors to data descriptors in ES modules compiled this way since TypeScript 4
if (actualDescriptor && object.__esModule && actualDescriptor.value === undefined) {
    const propertyValue = object[property];
    delete object[property];
    object[property] = propertyValue;
    actualDescriptor = getPropertyDescriptor(object, property);
}
// [/HACK]
`;

function patchStub(fileName) {
    try {
        logger.log(`Patching "${fileName}"`);

        const contents = fs.readFileSync(fileName);
        fs.writeFileSync(fileName + '.backup', contents);
        
        let patchedContents = String(contents);
        if (patchedContents.indexOf(stubPatchContents) === -1) {
            patchedContents = patchedContents.replace(stubPatchMarker, stubPatchMarker + stubPatchContents);
            fs.writeFileSync(fileName, patchedContents);
            logger.log('Done');
        } else {
            logger.log('Already patched');
        }
    } catch (err) {
        logger.error(err);
    }
}


const sinonPath = path.dirname(require.resolve('sinon/package.json'));
const sinonNodePath = path.join(sinonPath, 'lib', 'sinon', 'stub.js');
const sinonBrowserPath = path.join(sinonPath, 'pkg', 'sinon.js');

patchStub(sinonNodePath);
patchStub(sinonBrowserPath);
