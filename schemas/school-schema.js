const mongoose = require("mongoose");

const reqString = {
    type: String,
    required: true,
};
const reqNumber = {
    type: Number,
    required: true,
};

const schoolSchema = new mongoose.Schema(
    {
        _id: { reqString },
        school: {
            name: reqString,
            endpoint: reqString,
            sc: reqString,
            sd: reqString,
            org: reqString,
        },
        users: [
            {
                name: { type: String, required: true },
                encName: { type: String, required: true },
                encBirth: { type: String, required: true },
                token: { type: String, required: true },
                password: { type: String, required: true },
                endpoint: { type: String, required: true },
                _id: false,
            },
        ],
        schedule: {
            type: { type: String },
            kinds: { type: String },
            channelId: { type: String },
            paused: { type: Boolean },
        },
    },
    { versionKey: false }
);

module.exports = mongoose.model("school", schoolSchema);

//* $push: { users: { rawName: "test" } },
