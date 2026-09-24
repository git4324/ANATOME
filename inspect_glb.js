const fs = require('fs');
const filePath = 'front_end/public/models/zanatomy1.glb';
const buffer = fs.readFileSync(filePath);
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonBuffer = buffer.slice(20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonBuffer.toString('utf8'));

console.log('Meshes:', gltf.meshes ? gltf.meshes.length : 0);
console.log('Nodes:', gltf.nodes ? gltf.nodes.length : 0);
console.log('Materials:', gltf.materials ? gltf.materials.length : 0);

if (gltf.nodes) {
    const sampleNodes = gltf.nodes.filter(n => n.name).slice(0, 20);
    console.log('Sample Nodes:', sampleNodes.map(n => n.name));
}
