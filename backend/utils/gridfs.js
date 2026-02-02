const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket;

function initBucket() {
    if (!bucket && mongoose.connection.db) {
        bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'resumes'
        });
        console.log('GridFS Bucket initialized');
    }
    return bucket;
}

/**
 * Upload a buffer to GridFS
 * @param {Buffer} buffer 
 * @param {string} filename 
 * @param {string} contentType 
 * @returns {Promise<string>} The file path/ID to store in Candidate model
 */
async function uploadFile(buffer, filename, contentType) {
    const initializedBucket = initBucket();
    if (!initializedBucket) throw new Error('Database not connected');

    return new Promise((resolve, reject) => {
        const uploadStream = initializedBucket.openUploadStream(filename, {
            contentType: contentType
        });

        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
            // We store it as a virtual path that our route will handle
            resolve(`/api/candidates/resume/${uploadStream.id}`);
        });

        uploadStream.end(buffer);
    });
}

function getBucket() {
    return initBucket();
}

module.exports = {
    uploadFile,
    getBucket
};
