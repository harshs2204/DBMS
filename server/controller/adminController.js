import Admin from "../models/admin.js";
import Department from "../models/department.js";
import Faculty from "../models/faculty.js";
import Student from "../models/student.js";
import Subject from "../models/subject.js";
import Notice from "../models/notice.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mysql from "mysql";

// Assuming you have configured your MySQL connection
// const connection = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "dbms",
// });

export const adminLogin = (req, res) => {
  const {username, password} = req.body;
  const errors = {usernameError: "", passwordError: ""};

  // Create a new connection for this query
  const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "dbms",
  });

  // Connect to the MySQL database
  connection.connect();

  // Query to find the admin with the given username
  const query = `SELECT * FROM admin WHERE username = ?`;

  // Execute the query
  connection.query(query, [username], (error, results) => {
    if (error) {
      console.log(error);
      connection.end(); // Close the connection in case of an error
      return res.status(500).json({error: "Internal server error"});
    }

    if (results.length === 0) {
      errors.usernameError = "Admin doesn't exist.";
      connection.end(); // Close the connection if no admin is found
      return res.status(404).json(errors);
    }

    const existingAdmin = results[0];

    // No need for password comparison if passwords are hashed
    // Assuming passwords are stored in plaintext in the database
    if (password !== existingAdmin.password) {
      errors.passwordError = "Incorrect password.";
      connection.end(); // Close the connection if password is incorrect
      return res.status(401).json(errors);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username: existingAdmin.username,
        id: existingAdmin.id,
      },
      "sEcReT",
      {expiresIn: "1h"}
    );

    res.status(200).json({result: existingAdmin, token});
  });

  // Close the connection after the query execution
  connection.end();
};

export const updatedPassword = async (req, res) => {
  try {
    const {newPassword, confirmPassword, email} = req.body;
    const errors = {mismatchError: ""};

    if (newPassword !== confirmPassword) {
      errors.mismatchError =
        "Your password and confirmation password do not match";
      return res.status(400).json(errors);
    }

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Execute the update query
    const updateQuery = `UPDATE admin SET password = ?, passwordUpdated = true WHERE email = ?`;
    connection.query(updateQuery, [newPassword, email], (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({error: "Internal server error"});
      }

      if (results.affectedRows === 0) {
        connection.end(); // Close the connection if no admin is found
        return res.status(404).json({error: "Admin not found"});
      }

      // Close the connection after successful update
      connection.end();

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Internal server error"});
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const {name, dob, department, contactNumber, avatar, email} = req.body;
    const updatedFields = {};

    if (name) {
      updatedFields.name = name;
    }
    if (dob) {
      updatedFields.dob = dob;
    }
    if (department) {
      updatedFields.department = department;
    }
    if (contactNumber) {
      updatedFields.contactNumber = contactNumber;
    }
    if (avatar) {
      updatedFields.avatar = avatar;
    }

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Generate SET clause for the update query
    const setClause = Object.keys(updatedFields)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(updatedFields);
    values.push(email);

    // Execute the update query
    const updateQuery = `UPDATE admin SET ${setClause} WHERE email = ?`;
    connection.query(updateQuery, values, (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({error: "Internal server error"});
      }

      if (results.affectedRows === 0) {
        connection.end(); // Close the connection if no admin is found
        return res.status(404).json({error: "Admin not found"});
      }

      // Close the connection after successful update
      connection.end();

      res
        .status(200)
        .json({success: true, message: "Admin updated successfully"});
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Internal server error"});
  }
};

export const addAdmin = async (req, res) => {
  try {
    const {
      name,
      dob,
      username,
      department,
      password,
      contactNumber,
      avatar,
      email,
      joiningYear,
    } = req.body;

    const errors = {emailError: ""};

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    connection.connect();

    // Check if admin with the same email already exists
    const emailCheckQuery = `SELECT * FROM admin WHERE email = ?`;
    connection.query(
      emailCheckQuery,
      [email],
      async (emailError, emailResults) => {
        if (emailError) {
          console.log(emailError);
          return res.status(500).json({error: "Internal server error"});
        }

        if (emailResults.length > 0) {
          errors.emailError = "Email already exists";
          return res.status(400).json(errors);
        }
        const newUsername = username ? username : email;
        const newPassword = password ? password : dob;

        // Insert new admin into the database
        const insertAdminQuery = `INSERT INTO admin (name, email, password, joiningYear, username, department, avatar, contactNumber, dob, passwordUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const insertAdminValues = [
          name,
          email,
          newPassword,
          joiningYear,
          newUsername,
          department,
          avatar,
          contactNumber,
          dob,
          false,
        ];
        connection.query(
          insertAdminQuery,
          insertAdminValues,
          (insertError, insertResults) => {
            if (insertError) {
              console.log(insertError);
              return res.status(500).json({error: "Internal server error"});
            }

            return res.status(200).json({
              success: true,
              message: "Admin registered successfully",
              response: {
                name,
                email,
                password: newPassword,
                joiningYear,
                username: newUsername,
                department,
                avatar,
                contactNumber,
                dob,
                passwordUpdated: false,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Internal server error"});
  }
};

export const createNotice = async (req, res) => {
  try {
    const {from, content, topic, date, noticeFor} = req.body;

    const errors = {noticeError: ""};

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Check if the notice already exists
    const selectQuery = `SELECT * FROM notice WHERE topic = ? AND content = ? AND date = ?`;
    connection.query(
      selectQuery,
      [topic, content, date],
      async (error, results) => {
        if (error) {
          console.log(error);
          connection.end(); // Close the connection in case of an error
          return res.status(500).json({error: "Internal server error"});
        }

        if (results.length > 0) {
          connection.end(); // Close the connection if notice already exists
          errors.noticeError = "Notice already created";
          return res.status(400).json(errors);
        }

        // Insert the new notice into the database
        const insertQuery = `INSERT INTO notice (from_user, content, topic, notice_for, date) VALUES (?, ?, ?, ?, ?)`;
        connection.query(
          insertQuery,
          [from, content, topic, noticeFor, date],
          (error, results) => {
            if (error) {
              console.log(error);
              connection.end(); // Close the connection in case of an error
              return res.status(500).json({error: "Internal server error"});
            }

            // Close the connection after successful insert
            connection.end();

            return res.status(200).json({
              success: true,
              message: "Notice created successfully",
              response: {
                from,
                content,
                topic,
                noticeFor,
                date,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Internal server error"});
  }
};

export const addDepartment = async (req, res) => {
  try {
    const errors = {departmentError: ""};
    const {department} = req.body;

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Check if the department already exists
    const selectQuery = `SELECT * FROM department WHERE department = ?`;
    connection.query(selectQuery, [department], async (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({error: "Internal server error"});
      }

      if (results.length > 0) {
        connection.end(); // Close the connection if department already exists
        errors.departmentError = "Department already added";
        return res.status(400).json(errors);
      }

      // Insert the new department into the database
      const insertQuery = `INSERT INTO department (department, departmentCode) VALUES (?, ?)`;

      // Fetch the total number of departments
      const countQuery = `SELECT COUNT(*) AS departmentCount FROM department`;
      connection.query(countQuery, (error, results) => {
        if (error) {
          console.log(error);
          connection.end(); // Close the connection in case of an error
          return res.status(500).json({error: "Internal server error"});
        }

        const departmentCount = results[0].departmentCount;
        let departmentCode = (departmentCount + 1).toString().padStart(2, "0");

        // Execute the insert query
        connection.query(
          insertQuery,
          [department, departmentCode],
          (error, results) => {
            if (error) {
              console.log(error);
              connection.end(); // Close the connection in case of an error
              return res.status(500).json({error: "Internal server error"});
            }

            // Close the connection after successful insert
            connection.end();

            return res.status(200).json({
              success: true,
              message: "Department added successfully",
              response: {
                department,
                departmentCode,
              },
            });
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Internal server error"});
  }
};

export const addFaculty = async (req, res) => {
  try {
    const {
      name,
      dob,
      department,
      contactNumber,
      avatar,
      email,
      joiningYear,
      gender,
      designation,
    } = req.body;

    const errors = {emailError: ""};

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Check if the faculty email already exists
    const selectQuery = `SELECT * FROM faculty WHERE email = ?`;
    connection.query(selectQuery, [email], async (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({error: "Internal server error"});
      }

      if (results.length > 0) {
        connection.end(); // Close the connection if email already exists
        errors.emailError = "Email already exists";
        return res.status(400).json(errors);
      }

      // Fetch the department code
      const departmentQuery = `SELECT departmentCode FROM department WHERE department = ?`;
      connection.query(
        departmentQuery,
        [department],
        async (error, results) => {
          if (error) {
            console.log(error);
            connection.end(); // Close the connection in case of an error
            return res.status(500).json({error: "Internal server error"});
          }

          if (results.length === 0) {
            connection.end(); // Close the connection if department does not exist
            return res.status(400).json({error: "Department does not exist"});
          }

          const departmentHelper = results[0].departmentCode;

          // Fetch the count of faculties in the same department
          const countQuery = `SELECT COUNT(*) AS facultyCount FROM faculty WHERE department = ?`;
          connection.query(countQuery, [department], async (error, results) => {
            if (error) {
              console.log(error);
              connection.end(); // Close the connection in case of an error
              return res.status(500).json({error: "Internal server error"});
            }

            const facultyCount = results[0].facultyCount;
            let helper =
              facultyCount < 10
                ? "00" + facultyCount
                : facultyCount < 100
                ? "0" + facultyCount
                : facultyCount;

            var date = new Date();
            var components = [
              "FAC",
              date.getFullYear(),
              departmentHelper,
              helper,
            ];

            // Insert the new faculty into the database
            const insertQuery = `INSERT INTO faculty (name, email, password, joiningYear, username, department, avatar, contactNumber, dob, gender, designation, passwordUpdated) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            connection.query(
              insertQuery,
              [
                name,
                email,
                dob,
                joiningYear,
                email,
                department,
                avatar,
                contactNumber,
                dob,
                gender,
                designation,
                false,
              ],
              (error, results) => {
                if (error) {
                  console.log(error);
                  connection.end(); // Close the connection in case of an error
                  return res.status(500).json({error: "Internal server error"});
                }

                // Close the connection after successful insert
                connection.end();

                return res.status(200).json({
                  success: true,
                  message: "Faculty registered successfully",
                  response: {
                    name,
                    email,
                    joiningYear,
                    email,
                    department,
                    avatar,
                    contactNumber,
                    dob,
                    gender,
                    designation,
                    passwordUpdated: false,
                  },
                });
              }
            );
          });
        }
      );
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Internal server error"});
  }
};

export const getFaculty = async (req, res) => {
  try {
    const {department} = req.body;

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Query to fetch faculty data based on department
    const query = `SELECT * FROM faculty WHERE department = ?`;
    connection.query(query, [department], (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({error: "Internal server error"});
      }

      if (results.length === 0) {
        connection.end(); // Close the connection if no faculty found
        return res.status(404).json({noFacultyError: "No Faculty Found"});
      }

      // Close the connection after successful retrieval
      connection.end();

      return res.status(200).json({result: results});
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({backendError: "Internal server error"});
  }
};

export const getNotice = async (req, res) => {
  try {
    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Query to fetch all notices
    const query = `SELECT * FROM notice`;
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({backendError: "Internal server error"});
      }

      if (results.length === 0) {
        connection.end(); // Close the connection if no notices found
        return res.status(404).json({noNoticeError: "No Notice Found"});
      }

      // Close the connection after successful retrieval
      connection.end();

      return res.status(200).json({result: results});
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({backendError: "Internal server error"});
  }
};

export const addSubject = async (req, res) => {
  try {
    const {totalLectures, department, subjectCode, subjectName, year} =
      req.body;
    const errors = {subjectError: String};

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Check if the subject with the given subjectCode already exists
    const existingSubjectQuery = `SELECT * FROM subject WHERE subjectCode = ?`;
    connection.query(
      existingSubjectQuery,
      [subjectCode],
      async (error, results) => {
        if (error) {
          console.log(error);
          connection.end(); // Close the connection in case of an error
          return res.status(500).json({backendError: "Internal server error"});
        }

        if (results.length > 0) {
          connection.end(); // Close the connection if subject already exists
          errors.subjectError = "Given Subject is already added";
          return res.status(400).json(errors);
        }

        // If subject does not exist, insert the new subject into the database
        const insertSubjectQuery = `INSERT INTO subject (totalLectures, department, subjectCode, subjectName, year) VALUES (?, ?, ?, ?, ?)`;
        connection.query(
          insertSubjectQuery,
          [totalLectures, department, subjectCode, subjectName, year],
          async (error, result) => {
            if (error) {
              console.log(error);
              connection.end(); // Close the connection in case of an error
              return res
                .status(500)
                .json({backendError: "Internal server error"});
            }

            const newSubjectId = result.insertId;

            // Fetch students from the same department and year
            const fetchStudentsQuery = `SELECT * FROM student WHERE department = ? AND year = ?`;
            connection.query(
              fetchStudentsQuery,
              [department, year],
              async (error, studentResults) => {
                if (error) {
                  console.log(error);
                  connection.end(); // Close the connection in case of an error
                  return res
                    .status(500)
                    .json({backendError: "Internal server error"});
                }

                // Update subjects for each student
                if (studentResults.length !== 0) {
                  for (const student of studentResults) {
                    const studentId = student.id;
                    const updateStudentQuery = `UPDATE student SET subjects = JSON_ARRAY_APPEND(subjects, '$', ?) WHERE id = ?`;
                    connection.query(
                      updateStudentQuery,
                      [newSubjectId, studentId],
                      (error) => {
                        if (error) {
                          console.log(error);
                          return; // Log error but continue updating other students
                        }
                      }
                    );
                  }
                }

                // Close the connection after successful execution
                connection.end();

                return res.status(200).json({
                  success: true,
                  message: "Subject added successfully",
                  response: {
                    id: newSubjectId,
                    totalLectures,
                    department,
                    subjectCode,
                    subjectName,
                    year,
                  },
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({backendError: "Internal server error"});
  }
};

export const getSubject = async (req, res) => {
  try {
    const {department, year} = req.body;

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Query to fetch subjects for the specified department and year
    const query = `SELECT * FROM subject WHERE department = ? AND year = ?`;
    connection.query(query, [department, year], (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({backendError: "Internal server error"});
      }

      if (results.length === 0) {
        connection.end(); // Close the connection if no subjects found
        return res.status(404).json({noSubjectError: "No Subject Found"});
      }

      // Close the connection after successful retrieval
      connection.end();

      return res.status(200).json({result: results});
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({backendError: "Internal server error"});
  }
};

export const getAdmin = async (req, res) => {
  try {
    const {department} = req.body;

    // Connect to the MySQL database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Query to fetch admins for the specified department
    const query = `SELECT * FROM admin WHERE department = ?`;
    connection.query(query, [department], (error, results) => {
      if (error) {
        console.log(error);
        connection.end(); // Close the connection in case of an error
        return res.status(500).json({backendError: "Internal server error"});
      }

      if (results.length === 0) {
        connection.end(); // Close the connection if no admins found
        return res.status(404).json({noAdminError: "No Admin Found"});
      }

      // Close the connection after successful retrieval
      connection.end();

      return res.status(200).json({result: results});
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({backendError: "Internal server error"});
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const adminIds = req.body; // Assuming req.body contains an array of admin IDs to delete
    const errors = {noAdminError: ""};

    if (!adminIds || adminIds.length === 0) {
      errors.noAdminError = "No admin IDs provided";
      return res.status(400).json(errors);
    }

    // Connect to the database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    connection.connect();

    for (let i = 0; i < adminIds.length; i++) {
      const adminId = adminIds[i];
      console.log(adminIds[i]);
      // SQL DELETE query to remove admin by ID
      const query = `DELETE FROM admin WHERE id = ?`;

      // Execute the query
      connection.query(query, [adminId], (error, results) => {
        if (error) {
          console.error("Error deleting admin:", error);
          return res.status(500).json({backendError: "Error deleting admin"});
        }
      });
    }

    // Close the database connection
    connection.end();

    res.status(200).json({message: "Admin(s) deleted successfully"});
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculties = req.body;
    const errors = {noFacultyError: String};

    // Create a new connection for this query
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });
    // Connect to the MySQL database
    connection.connect();

    for (var i = 0; i < faculties.length; i++) {
      var faculty = faculties[i];

      // Query to delete faculty with the given ID
      const query = `DELETE FROM faculty WHERE id = ?`;

      // Execute the query
      await new Promise((resolve, reject) => {
        connection.query(query, [faculty], (error, results) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    }

    // Close the connection after all queries are executed
    connection.end();

    res.status(200).json({message: "Faculty Deleted"});
  } catch (error) {
    const errors = {backendError: String};
    errors.backendError = error;
    res.status(500).json(errors);
  }
};

export const deleteStudent = async (req, res) => {
  const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "dbms",
  });
  try {
    const studentIds = req.body; // Assuming req.body contains an array of student IDs to delete
    const errors = {noStudentError: ""};

    if (!studentIds || studentIds.length === 0) {
      errors.noStudentError = "No student IDs provided";
      return res.status(400).json(errors);
    }

    // Connect to the database
    connection.connect();

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];

      // SQL DELETE query to remove student by ID
      const query = `DELETE FROM student WHERE id = ?`;

      // Execute the query
      connection.query(query, [studentId], (error, results) => {
        if (error) {
          console.error("Error deleting student:", error);
          return res.status(500).json({backendError: "Error deleting student"});
        }
      });
    }

    // Close the database connection
    connection.end();

    res.status(200).json({message: "Student(s) deleted successfully"});
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subjects = req.body;
    const errors = {noSubjectError: String};

    // Create a new connection for this query
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Connect to the MySQL database
    connection.connect();

    for (const subjectId of subjects) {
      // Delete subject by ID
      const queryDeleteSubject = `DELETE FROM subject WHERE _id = ?`;
      await new Promise((resolve, reject) => {
        connection.query(queryDeleteSubject, [subjectId], (error, results) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    }

    // Close the connection after all queries are executed
    connection.end();

    res.status(200).json({message: "Subject(s) Deleted"});
  } catch (error) {
    const errors = {backendError: String};
    errors.backendError = error;
    res.status(500).json(errors);
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    const {department} = req.body;
    const errors = {noDepartmentError: ""};

    if (!department) {
      errors.noDepartmentError = "No department provided";
      return res.status(400).json(errors);
    }

    // Connect to the database
    connection.connect();

    // SQL DELETE query to remove department by name
    const query = `DELETE FROM department WHERE department = ?`;

    // Execute the query
    connection.query(query, [department], (error, results) => {
      if (error) {
        console.error("Error deleting department:", error);
        return res
          .status(500)
          .json({backendError: "Error deleting department"});
      }
    });

    // Close the database connection
    connection.end();

    res.status(200).json({message: "Department deleted successfully"});
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const addStudent = async (req, res) => {
  try {
    const {
      name,
      dob,
      department,
      contactNumber,
      avatar,
      email,
      section,
      gender,
      batch,
      fatherName,
      motherName,
      fatherContactNumber,
      year,
    } = req.body;

    const errors = {emailError: String};

    // Create a new connection for this query
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Connect to the MySQL database
    connection.connect();

    // Check if email already exists
    const queryCheckEmail = `SELECT * FROM student WHERE email = ?`;
    const existingStudent = await new Promise((resolve, reject) => {
      connection.query(queryCheckEmail, [email], (error, results) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    if (existingStudent.length > 0) {
      errors.emailError = "Email already exists";
      connection.end();
      return res.status(400).json(errors);
    }

    // Get department code
    const queryGetDepartmentCode = `SELECT departmentCode FROM department WHERE department = ?`;
    const departmentResult = await new Promise((resolve, reject) => {
      connection.query(
        queryGetDepartmentCode,
        [department],
        (error, results) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });

    const departmentCode = departmentResult[0].departmentCode;

    // Get student count for generating username
    const queryGetStudentCount = `SELECT COUNT(*) AS studentCount FROM student WHERE department = ?`;
    const studentCountResult = await new Promise((resolve, reject) => {
      connection.query(queryGetStudentCount, [department], (error, results) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    const studentCount = studentCountResult[0].studentCount;
    let helper;
    if (studentCount < 10) {
      helper = "00" + studentCount.toString();
    } else if (studentCount < 100 && studentCount > 9) {
      helper = "0" + studentCount.toString();
    } else {
      helper = studentCount.toString();
    }

    // Generate username
    let date = new Date();
    let components = ["STU", date.getFullYear(), departmentCode, helper];
    let username = components.join("");
    var newStudent;
    // Insert new student record
    const queryInsertStudent = `INSERT INTO student (name, dob, password, username, department, contactNumber, avatar, email, section, gender, batch, fatherName, motherName, fatherContactNumber, year, passwordUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await new Promise((resolve, reject) => {
      connection.query(
        queryInsertStudent,
        [
          name,
          dob,
          dob,
          email,
          department,
          contactNumber,
          avatar,
          email,
          section,
          gender,
          batch,
          fatherName,
          motherName,
          fatherContactNumber,
          year,
          false,
        ],
        (error, results) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            newStudent = results;
            resolve(results);
          }
        }
      );
    });

    // Insert student subjects
    const queryGetSubjects = `SELECT id FROM subject WHERE department = ? AND year = ?`;
    const subjectsResult = await new Promise((resolve, reject) => {
      connection.query(
        queryGetSubjects,
        [department, year],
        (error, results) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });

    for (const subject of subjectsResult) {
      const queryInsertStudentSubject = `INSERT INTO student_subject (student_id, sub_id) VALUES (?, ?)`;
      await new Promise((resolve, reject) => {
        connection.query(
          queryInsertStudentSubject,
          [username, subject._id],
          (error, results) => {
            if (error) {
              console.log(error);
              reject(error);
            } else {
              resolve(results);
            }
          }
        );
      });
    }

    // Close the connection after all queries are executed
    connection.end();

    res.status(200).json({
      success: true,
      message: "Student registered successfully",
      response: newStudent,
    });
  } catch (error) {
    const errors = {backendError: String};
    errors.backendError = error;
    res.status(500).json(errors);
  }
};

export const getStudent = async (req, res) => {
  try {
    const {department, year, section} = req.body;
    const errors = {noStudentError: ""};

    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    // Connect to the database
    connection.connect();

    // SQL SELECT query to retrieve students based on department, year, and section
    const query = `SELECT * FROM student WHERE department = ? AND year = ? `;

    // Execute the query
    connection.query(query, [department, year, section], (error, results) => {
      if (error) {
        console.error("Error fetching students:", error);
        return res.status(500).json({backendError: "Error fetching students"});
      }

      if (results.length === 0) {
        errors.noStudentError = "No Student Found";
        return res.status(404).json(errors);
      }

      res.status(200).json({result: results});
    });

    // Close the database connection
    connection.end();
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const getAllStudent = async (req, res) => {
  try {
    // Connect to the database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    connection.connect();

    // SQL SELECT query to fetch all students
    const query = `SELECT * FROM student`;

    // Execute the query
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching students:", error);
        return res.status(500).json({backendError: "Error fetching students"});
      }

      res.status(200).json(results);
    });

    // Close the database connection
    connection.end();
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const getAllFaculty = async (req, res) => {
  try {
    // Connect to the database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    connection.connect();

    // SQL SELECT query to fetch all faculty members
    const query = `SELECT * FROM faculty`;

    // Execute the query
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching faculty members:", error);
        return res
          .status(500)
          .json({backendError: "Error fetching faculty members"});
      }

      res.status(200).json(results);
    });

    // Close the database connection
    connection.end();
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const getAllAdmin = async (req, res) => {
  try {
    // Connect to the database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    connection.connect();

    // SQL SELECT query to fetch all admin users
    const query = `SELECT * FROM admin`;

    // Execute the query
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching admin users:", error);
        return res
          .status(500)
          .json({backendError: "Error fetching admin users"});
      }

      res.status(200).json(results);
    });

    // Close the database connection
    connection.end();
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const getAllDepartment = async (req, res) => {
  try {
    // Connect to the database
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dbms",
    });

    connection.connect();

    // SQL SELECT query to fetch all departments
    const query = `SELECT * FROM department`;

    // Execute the query
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching departments:", error);
        return res
          .status(500)
          .json({backendError: "Error fetching departments"});
      }

      res.status(200).json(results);
    });

    // Close the database connection
    connection.end();
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};

export const getAllSubject = async (req, res) => {
  try {
    // Connect to the database
    connection.connect();

    // SQL SELECT query to fetch all subjects
    const query = `SELECT * FROM subject`;

    // Execute the query
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching subjects:", error);
        return res.status(500).json({backendError: "Error fetching subjects"});
      }

      res.status(200).json(results);
    });

    // Close the database connection
    connection.end();
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({backendError: "Internal server error"});
  }
};
