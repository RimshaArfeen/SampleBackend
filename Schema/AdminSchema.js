

import mongoose from "mongoose";
const { Schema, model } = mongoose;

const adminSchema = new Schema({
  StudName: {
    type: String,
    required: true
  },
  StudEmail: {
    type: String,
    required: true
  },
  UniversityPreference: {
    type: String,
    required: true
  },
  FacultyPreference: {
     type: String,
     required: true
   },
   Status:{
     type: String,
     required: true
   },
   Percentage:{
     type: Number,
     required:true
   },
   age:{
     type: Number,
     required:true
   }
   ,Country:{
     type: String,
     required: true
   },
  // Usually, confirmPassword isn't stored in the DB
});

const Admin = model('Admin', adminSchema);
export default Admin;
