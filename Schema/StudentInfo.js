

//Schema/StudentInfo.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Yes, the collection name can come from the **schema automatically** if you're using a framework like **Mongoose**. By default, Mongoose **pluralizes** the model name to create the collection name.
// so, here's studentinfo's

const studentSchema = new mongoose.Schema(
     {
          name: {
               type: String,
               required: true
          },
          Fathersname: {
               type: String,
               required: true
          },
          dob: {
               type: Date,
               required: true
          },
          gender: {
               type: String,
               required: true
          },
          age: {
               type: Number,
               required: true
          },
          cnic: {
               type: String,
               required: true
          },
          phone: {
               type: Number,
               required: true
          },
          email: {
               type: String,
               required: true
          },
          address: {
               type: String,
               required: true
          },
          city: {
               type: String,
               required: true
          },
          country: {
               type: String,
               required: true
          },
          documentUrl: {
               type: String,
               required: true
          },

          // Academic Information
          currentInstitute: {
               type: String,
               required: true
          },
          lastInstitute: {
               type: String,
               required: true
          },
          education: {
               type: String,
               required: true
          },
          qualification: {
               type: String,
               required: true
          },
          percentage: {
               type: Number,
               required: true
          },
          scholarship: {
               type: String,
               required: true
          },

          byFaculty: {
               type: String,
              
          },
          
          byUniversity: {
               type: String,
             
          },

          lowEligibilityField: { type: String },
          mediumEligibilityField: { type: String },
          highEligibilityField: { type: String },

          status: {
               type: String,
               default: "PENDING"
          },

     })

const StudentInfo = model('StudentInfo', studentSchema);
export default StudentInfo;