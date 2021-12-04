const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserinfoSchema = new Schema({
    fname: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true,
        // enum: [ 'male' , 'female']
    },
    mobile: {
        type: Number,
        required: true,
        unique: true
    },
    fdose: {
        type: String,
        // required: true,
        // enum: ['y','n']
    },
    fdate: {
        type: String
    },
    vaccine: {
        type: String
    },
    fpositive: {
        type: String
    },
    fsymp: {
        type: String
    },
    sdose: {
        type: String,
        // enum: ['y','n']
    },
    sdate: {
        type: String,
    },
    spositive: {
        type: String
    },
    ssymp: {
        type: String
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

const Userinfo = mongoose.model('Userinfo', UserinfoSchema);

module.exports = Userinfo;