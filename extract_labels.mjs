// info from https://ryanpacini.com/posts/vifileformat/
// seems to be based on mac resource forks https://formats.kaitai.io/resource_fork/resource_fork.svg
import { readFileSync, writeFileSync } from 'fs';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { unzipSync } from 'zlib';


//const filePath = './square_wave_generator.vi';
const filePath = './square_wave_generator_previous.vi';
const data = readFileSync(filePath, {encoding: null});
const rsrcHeader = data.subarray(0, 32);

{
	// checks that the header rules match for
	// the first 16 bytes
	const expectedHeader = Buffer.from([
		0x52, 0x53, 0x52, 0x43,
		0x0D, 0x0A, 0x00, 0x03,
		0x4C, 0x56, 0x49, 0x4E,
		0x4C, 0x42, 0x56, 0x57
	]);
	assert.deepEqual(rsrcHeader.subarray(0, 16), expectedHeader,
		'This vi file is not valid because the header does not match what is expected'
	);
}

const rsrcOffset = rsrcHeader.readUInt32BE(16);

// checks that rsrcHeader2 is the same as header 1
assert.deepEqual(
	rsrcHeader,
	data.subarray(rsrcOffset, rsrcOffset + 32),
	'This vi file is likely corrupted because the duplicate header does not match'
);

const rsrcSize = rsrcHeader.readUInt32BE(20);
const dataOffset = rsrcHeader.readUInt32BE(24); // I think is always 32
const dataSize = rsrcHeader.readUInt32BE(28);

console.log({rsrcOffset, rsrcSize, dataOffset, dataSize});

// Checks that the file actually fully matches the expected size
assert.equal(
	data.length,
	rsrcHeader.length + rsrcSize + dataSize,
	'This vi file is likely corrupted because it is not the expected length'
);

const rsrcInfo = data.subarray(rsrcOffset + 32, rsrcOffset + 32 + 20);

// Ryan's documentation seems to be wrong but I think this is what he meant
// because he lists CHUNK_CNT as 4 bytes immediately following RSRC_HEADER2(32 bytes)
// and RSRC_INFO(20 bytes) and RSRC_INFO[12-16](DATA_OFFSET) is always 52 bytes from 
// what I can see.  But Ryan says "DATA_OFFSET  // I32 offset to CHUNK_CNT from RSRC_HEADER1" 
const chunkCountOffset = rsrcInfo.readUInt32BE(12) + rsrcOffset;
// so this should always be `52 + rsrcOffset` aka immediately after rsrcInfo

const chunkCount = data.readUInt32BE(chunkCountOffset) + 1;

const chunkIdsOffset = chunkCountOffset + 4;

for ( let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++ ) {
	const chunkIdStart = chunkIdsOffset + (chunkIndex * 12);
	const chunkId = data.subarray(chunkIdStart, chunkIdStart + 12);
	const chunkName = chunkId.toString('ascii', 0, 4);
	const infoCount = chunkId.readUInt32BE(4);
	const infoOffset = chunkId.readUInt32BE(8) + rsrcOffset + 32;
	
	const chunkInfo = data.subarray(infoOffset, infoOffset + 20);
	const chunkDataOffset = chunkInfo.readUInt32BE(12) + 32;
	const chunkLength = data.readUInt32BE(chunkDataOffset);

	console.log(chunkName, chunkDataOffset, chunkLength);

	const chunk = data.subarray(chunkDataOffset + 4, chunkDataOffset + 4 + chunkLength);
	if (chunkName !== 'FPSE') {
		continue;
	}

	const uncompressedChunkSize = chunk.readUint32BE(0); 

	const zlibChunk = chunk.subarray(4);

	const unzipped = unzipSync(zlibChunk);

	assert.equal(uncompressedChunkSize, unzipped.length, 'FPSE chunk uncompression not matching expected size');
	const unzippedChunkLength = unzipped.readUInt32BE(0);
	assert.equal(uncompressedChunkSize, unzippedChunkLength + 4, 'The unzipped expected just be 4 + the total uncompressed size, 4 for the 4 bytes of its own number');
	writeFileSync('./unzippeddata', unzipped.subarray(4));

}