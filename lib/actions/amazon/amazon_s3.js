"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonS3Action = void 0;
const Hub = require("../../hub");
const S3 = require("aws-sdk/clients/s3");
class AmazonS3Action extends Hub.Action {
    constructor() {
        super(...arguments);
        this.name = "amazon_s3";
        this.label = "Amazon S3";
        this.iconName = "amazon/amazon_s3.png";
        this.description = "Write data files to an S3 bucket.";
        this.supportedActionTypes = [Hub.ActionType.Dashboard, Hub.ActionType.Query];
        this.usesStreaming = true;
        this.requiredFields = [];
        this.params = [
            {
                name: "access_key_id",
                label: "Access Key",
                required: true,
                sensitive: true,
                description: "Your access key for S3.",
            }, {
                name: "secret_access_key",
                label: "Secret Key",
                required: true,
                sensitive: true,
                description: "Your secret key for S3.",
            }, {
                name: "region",
                label: "Region",
                required: true,
                sensitive: false,
                description: "S3 Region e.g. us-east-1, us-west-1, ap-south-1 from " +
                    "http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region.",
            },
        ];
    }
    async execute(request) {
        if (!request.formParams.bucket) {
            throw new Error("Need Amazon S3 bucket.");
        }
        const s3 = this.amazonS3ClientFromRequest(request);
        const filename = request.formParams.filename || request.suggestedFilename();
        if (!filename) {
            throw new Error("Couldn't determine filename.");
        }
        const bucket = request.formParams.bucket;
        try {
            await request.stream(async (readable) => {
                const params = {
                    Bucket: bucket,
                    Key: filename,
                    Body: readable,
                };
                return s3.upload(params).promise();
            });
            return new Hub.ActionResponse({ success: true });
        }
        catch (err) {
            return new Hub.ActionResponse({ success: false, message: err.message });
        }
    }
    async form(request) {
        const s3 = this.amazonS3ClientFromRequest(request);
        const res = await s3.listBuckets().promise();
        const buckets = res.Buckets ? res.Buckets : [];
        const form = new Hub.ActionForm();
        form.fields = [{
                label: "Bucket",
                name: "bucket",
                required: true,
                options: buckets.map((c) => {
                    return { name: c.Name, label: c.Name };
                }),
                type: "select",
                default: buckets[0].Name,
            }, {
                label: "Path",
                name: "path",
                type: "string",
            }, {
                label: "Filename",
                name: "filename",
                type: "string",
            }];
        return form;
    }
    amazonS3ClientFromRequest(request) {
        return new S3({
            region: request.params.region,
            accessKeyId: request.params.access_key_id,
            secretAccessKey: request.params.secret_access_key,
        });
    }
}
exports.AmazonS3Action = AmazonS3Action;
