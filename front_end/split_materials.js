import { NodeIO } from '@gltf-transform/core';

async function run() {
    const io = new NodeIO();
    const doc = await io.read('./public/models/zanatomycolored.glb');
    const root = doc.getRoot();
    
    // We want to keep the specific anatomical names (as they are medically distinct)
    // but format them nicely for the UI.
    function simplifyName(originalName) {
        // Remove the .l or .r at the end, and append (Left) or (Right)
        let clean = originalName.replace(/\.[lr]$/i, (match) => match.toLowerCase() === '.l' ? ' (Left)' : ' (Right)');
        
        // Remove some redundant words like "muscle" or "part of" to keep UI clean
        clean = clean.replace(/ muscle/ig, '');
        clean = clean.replace(/part of /ig, '');
        
        // Capitalize the first letter
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        
        return clean.trim();
    }

    let clonedCount = 0;
    
    // Keep track of meshes we've already modified so we can clone them if shared
    const processedMeshes = new Set();
    
    // Iterate over all nodes in the scene
    for (const node of root.listNodes()) {
        let mesh = node.getMesh();
        if (mesh) {
            
            // If this mesh is shared (already processed by a previous node, like the Left side),
            // we MUST explicitly clone its primitives so the Right side can have its own independent materials!
            if (processedMeshes.has(mesh)) {
                const oldMesh = mesh;
                mesh = doc.createMesh(oldMesh.getName());
                for (const prim of oldMesh.listPrimitives()) {
                    mesh.addPrimitive(prim.clone());
                }
                node.setMesh(mesh);
            }
            processedMeshes.add(mesh);

            // For each primitive in the mesh
            for (const prim of mesh.listPrimitives()) {
                const mat = prim.getMaterial();
                if (mat) {
                    // Clone the material so it's unique to this node/muscle
                    const newMat = mat.clone();
                    
                    // Assign the clinical name
                    const clinicalName = simplifyName(node.getName() || mesh.getName() || 'Unknown Muscle');
                    newMat.setName(clinicalName);
                    
                    const color = newMat.getBaseColorFactor() || [1, 1, 1, 1];
                    
                    // The user wants everything that looks like skin/muscle/fascia to be dark red.
                    // We will color both the fascia and the muscles dark red!
                    const nameLower = clinicalName.toLowerCase();
                    const boneTerms = ['bone', 'vertebra', 'cartilage', 'disc'];
                    const isBone = boneTerms.some(term => nameLower.includes(term));
                    
                    if (!isBone) {
                        // Dark red for Fascia, Muscles, Tendons, etc.
                        color[0] = 0.05;
                        color[1] = 0.005;
                        color[2] = 0.005;
                        
                        // Give it a slightly glossy sheen for better highlights
                        newMat.setRoughnessFactor(0.3);
                        newMat.setMetallicFactor(0.0);
                    } else {
                        // Darkish gray for Bones, Cartilage, etc. so it isn't blinding
                        color[0] = 0.15;
                        color[1] = 0.15;
                        color[2] = 0.15;
                        newMat.setRoughnessFactor(0.6);
                        newMat.setMetallicFactor(0.0);
                    }
                    
                    // Introduce a microscopic difference to prevent gltf-transform from deduplicating identical L/R materials
                    color[3] = color[3] - (Math.random() * 0.00001);
                    newMat.setBaseColorFactor(color);
                    
                    prim.setMaterial(newMat);
                    clonedCount++;
                }
            }
        }
    }
    
    console.log(`Cloned and renamed ${clonedCount} materials. Total unique meshes: ${processedMeshes.size}`);
    
    await io.write('./public/models/zanatomy_split.glb', doc);
    console.log('Saved to zanatomy_split.glb');
}

run().catch(console.error);
