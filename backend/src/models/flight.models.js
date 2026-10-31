const mongoose=require('mongoose');

const flightSchema=new mongoose.Schema({
    flightNumber:{
        type:String,
        required:true,
        unique:true,

    },
    airline:{

        type:String,
        required:true,

    },
    arrivalAirport:{
        type:String,
        required:true,

    },
    departureAirport:{
        type:String,
        required:true,
    },
    arrivalTime:{
        type:Date,
        required:true,
    },
    departureTime:{
        type:Date,
        required:true,
    },
    status:{

        type:String,
        default:'Scheduled',
    },
    totalSeats:{
        type:Number,
        min:0,
        default:180,
    },

},{timestamps:true});

module.exports = mongoose.model('Flight', flightSchema);
