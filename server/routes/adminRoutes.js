import express from "express";
import auth from "../middleware/auth.js";
import {
  adminLogin,
  updateAdmin,
  addAdmin,
  addFaculty,
  getFaculty,
  addSubject,
  getSubject,
  addStudent,
  getStudent,
  addDepartment,
  getAllStudent,
  getAllFaculty,
  getAllAdmin,
  getAllDepartment,
  getAllSubject,
  updatedPassword,
  getAdmin,
  deleteAdmin,
  deleteDepartment,
  deleteFaculty,
  deleteStudent,
  deleteSubject,
  createNotice,
  getNotice,
} from "../controller/adminController.js";
const router = express.Router();
console.log("Routes Page");
router.post("/login", adminLogin);
router.post("/updatepassword", updatedPassword);
router.get("/getallstudent", getAllStudent);
router.post("/createnotice", createNotice);
router.get("/getallfaculty", getAllFaculty);
router.get("/getalldepartment", getAllDepartment);
router.get("/getallsubject", getAllSubject);
router.get("/getalladmin", getAllAdmin);
router.post("/updateprofile", updateAdmin);
router.post("/addadmin", addAdmin);
router.post("/adddepartment", addDepartment);
router.post("/addfaculty", addFaculty);
router.post("/getfaculty", getFaculty);
router.post("/addsubject", addSubject);
router.post("/getsubject", getSubject);
router.post("/addstudent", addStudent);
router.post("/getstudent", getStudent);
router.get("/getnotice", getNotice);
router.post("/getadmin", getAdmin);
router.post("/deleteadmin", deleteAdmin);
router.post("/deletefaculty", deleteFaculty);
router.post("/deletestudent", deleteStudent);
router.post("/deletedepartment", deleteDepartment);
router.post("/deletesubject", deleteSubject);

export default router;
