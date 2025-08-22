
//Schema/Applicant.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const applicantSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }, 
  role : {
    type: String,
    required : true
  },


  // Usually, confirmPassword isn't stored in the DB
});

const User = model('User', applicantSchema);
export default User;
