"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* eslint-disable @typescript-eslint/no-unsafe-call */
require("@nivinjoseph/n-ext");
const Path = require("path");
const aws_sdk_1 = require("aws-sdk");
const Mime = require("mime-types");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
const n_exception_1 = require("@nivinjoseph/n-exception");
const loaderUtils = require("loader-utils");
module.exports = function (content) {
    if (typeof content === "string")
        content = Buffer.from(content);
    const callback = this.async();
    const options = loaderUtils.getOptions(this) || {};
    const awsS3AccessKeyId = options.getValue("awsS3AccessKeyId");
    const awsS3SecretAccessKey = options.getValue("awsS3SecretAccessKey");
    const awsS3Bucket = options.getValue("awsS3Bucket");
    const awsRegion = options.getValue("awsRegion");
    const useAcceleration = options.getValue("useAcceleration");
    const fileStore = new S3FileStore(awsS3AccessKeyId, awsS3SecretAccessKey, awsS3Bucket, awsRegion, useAcceleration);
    fileStore.store(Path.basename(this.resourcePath), content)
        .then(url => callback(null, `module.exports = ${JSON.stringify(url)}`))
        .catch(e => callback(e));
};
module.exports.raw = true;
class S3FileStore {
    constructor(awsS3AccessKeyId, awsS3SecretAccessKey, awsS3Bucket, awsRegion, useAcceleration) {
        (0, n_defensive_1.given)(awsS3AccessKeyId, "awsS3AccessKeyId").ensureHasValue().ensureIsString();
        (0, n_defensive_1.given)(awsS3SecretAccessKey, "awsS3SecretAccessKey").ensureHasValue().ensureIsString();
        (0, n_defensive_1.given)(awsS3Bucket, "awsS3Bucket").ensureHasValue().ensureIsString();
        (0, n_defensive_1.given)(awsRegion, "awsRegion").ensureHasValue().ensureIsString();
        (0, n_defensive_1.given)(useAcceleration, "useAcceleration").ensureHasValue().ensureIsBoolean()
            .ensure(_ => !awsS3Bucket.contains("."), "cannot use acceleration with buckets that have '.' in their name");
        this._connection = new aws_sdk_1.S3({
            signatureVersion: "v4",
            region: awsRegion,
            credentials: {
                accessKeyId: awsS3AccessKeyId,
                secretAccessKey: awsS3SecretAccessKey
            },
            useAccelerateEndpoint: useAcceleration
        });
        this._bucket = awsS3Bucket;
        this._maxFileSize = 1000000 * 1000;
        this._useAcceleration = useAcceleration;
    }
    store(fileName, fileData) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            (0, n_defensive_1.given)(fileName, "fileName").ensureHasValue().ensureIsString();
            (0, n_defensive_1.given)(fileData, "fileData").ensureHasValue().ensureIsType(Buffer).ensure(t => t.byteLength > 0);
            fileName = fileName.replaceAll(":", "-").trim();
            const fileSize = fileData.byteLength;
            if (fileSize > this._maxFileSize)
                throw new n_exception_1.ArgumentException("fileData", "MAX file size of 1 GB exceeded");
            const fileMime = Mime.lookup(fileName) || "application/octet-stream";
            const id = `${n_util_1.Uuid.create().replaceAll("-", "").trim()}${Path.extname(fileName)}`;
            yield this._connection.putObject({
                Bucket: this._bucket,
                Key: id,
                Body: fileData,
                ContentType: fileMime,
                ACL: "public-read"
            }).promise();
            return this._useAcceleration
                ? `https://${this._bucket}.s3-accelerate.amazonaws.com/${id}`
                : this._bucket.contains(".")
                    ? `https://s3.amazonaws.com/${this._bucket}/${id}`
                    : `https://${this._bucket}.s3.amazonaws.com/${id}`;
        });
    }
}
//# sourceMappingURL=aws-file-loader.js.map