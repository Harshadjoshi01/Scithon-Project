//------------------------------REQUIREING NPM PAKAGES-----------------------------------------------------------

const express = require("express");
const bodyParser = require('body-parser');
const mysql = require("mysql");
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
const session = require('express-session');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const path = require("path");
const fs = require("fs");


//-------------------------------------CREATING APP AND MIDDLEWARES------------------------------------------

const dirPdf = path.join(__dirname, "public/pdfs/");
const dirPpt = path.join(__dirname, "public/ppts/");
var MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();

const app = express();
const port = process.env.PORT;
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// default options
app.use(fileUpload());

var options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  insecureAuth: true,
  // Whether or not to automatically check for and clear expired sessions:
  clearExpired: true,
  // How frequently expired sessions will be cleared; milliseconds:
  checkExpirationInterval: 100000,
  // The maximum age of a valid session; milliseconds:
  expiration: 600000,
  schema: {
    tableName: 'usersession',
    columnNames: {
      session_id: 'user_session_id',
      expires: 'session_expires',
      data: 'user_data'
    }
  }
};

var sessionStore = new MySQLStore(options);
var db;
// we have to create a new connection pool as the old one cannot be reused after the connection is closed
var connectToDB = function() {
  db = mysql.createPool(options);
  db.getConnection(function(err, connection) {
    if (err) {
      console.log("error when connecting to db:", err);
      setTimeout(connectToDB, 2000); // We introduce a delay before attempting to reconnect,
    } else {
      console.log("Database Connected");
      connection.release();
    }
  });
  db.on("error", function(err) {
    console.log("Database Error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      connectToDB();
    } else {
      throw err;
    }
  });
};
systemMessage = function(message) {
  console.log("====================================================");
  console.log("Database is Reconnecting But the app will not crash");
  console.log("====================================================");
};

connectToDB();
console.log("Application is Running");

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore
  })
);

const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    req.session.message = {type: "danger", message: "You are not logged in"};
    res.redirect("/");
  }
}

var ChangePassword = false;
const isAllowedChangePassword = (req, res, next) => {
  if (ChangePassword) {
    next();
  } else {
    res.redirect("/");
  }
}

var isAdmin = false;
const isvalidAdmin = (req, res, next) => {
  if (isAdmin) {
    next();
  } else {
    res.redirect("/");
  }
}

app.use((req, res, next) => {
  res.locals.message = req.session.message
  delete req.session.message
  next()
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});
var facts = [];
const fact_array = (facts) => {
  db.query("select * from facts order by factId desc", async (err, results) => {
    if (err) {
      console.log(err);
    } else {
     await results.forEach((fact) => {
        facts.push(fact);
      });
    }
  });
};
fact_array(facts);
var id = "";
var id_email = "";

//-----------------------------------CREATING ROUTES----------------------------------------------------------

//------------------------------HOME PAGE ROUTE---------------------------------------------------------------
app.get("/", (req, res) => {
  ChangePassword = false;
  isAdmin = false;
  res.locals.title = "SCITHON"
  res.render("home", { facts: facts });
});

app.get("/about", (req, res) => {
  res.locals.title = "ABOUT US"
  res.render("about");
})

//------------------------------ADMIN PAGE ROUTE---------------------------------------------------------------
app.get("/n4v8b2f1h3g7t1y", (req, res) => {
  res.locals.title = "MAHVEER"
  res.render("mahveer");
})
app.post("/n4v8b2f1h3g7t1y", (req, res) => {
  const name = req.body.name;
  const password = req.body.password;
  if (name === process.env.ADMIN_NAME && password === process.env.ADMIN_PASSWORD) {
    isAdmin = true;
    res.redirect("/admin");
  } else {
    res.redirect("/");
  }
})
app.get("/admin", isvalidAdmin, (req, res) => {
  res.locals.title = "ADMIN"
  res.render("admin");
});

//--------------------------------USER REGISTRAION ROUTE-----------------------------------------------------

app.post("/register", (req, res) => {
  const name = req.body.user_name;
  const email = req.body.user_email;
  const password = req.body.user_pass;
  db.query("select user_email from user_data where user_email = ?", [email], (err, results) => {
    if (err) {
      console.log(err);
    }
    if (results.length === 0) {
      const token = jwt.sign({ name, email, password }, process.env.JWT_SECRET, { expiresIn: "1d" });
      var msg = `<h1>Please Confirm Your email from by tapping on below link</h1> 
                <a href = "${process.env.BASE_URL}/activateaccount/${token}" ><button type="button" class = "private-button">Confirm Email</button></a>`
      var mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Email from SCITHON',
        html: msg
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      req.session.message = {
        type: "success",
        message: 'Please verify your Email ID then Login'
      }
      res.redirect("/")

    } else {
      req.session.message = { type: "danger", message: "Email already exists please try new email id" }
      res.redirect("/")
    }
  });
});

//------------------------------USER EMAIL VERIFICATION ROUTE-----------------------------------------------------

app.get("/activateaccount/:token", (req, res) => {
  jwt.verify(req.params.token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      res.redirect("*");
    }
    let name = decoded.name;
    let email = decoded.email;
    let password = decoded.password;
    var hasdPsw = await bcrypt.hash(password, 10);
    db.query("select user_email from user_data where user_email = ?", [email], (err, results) => {
      if (err) {
        console.log(err);
      }
      if (results.length === 0) {
        db.query("insert into user_data (user_name, user_email, user_pass) values (?,?,?)", [name, email, hasdPsw], (err, results) => {
          if (err) {
            console.log(err);
          }
          req.session.message = {
            type: "success",
            message: 'Now You can Log into your Account'
          }
          res.redirect("/")
        });
      } else {
        req.session.message = { type: "danger", message: "Email already exists please try new email id" }
        res.redirect("/");
      }
    });
  })
});

// -----------------------------------------------USER LOGIN ROUTE---------------------------------------------------------
app.post("/login", (req, res) => {
  const email = req.body.user_email;
  const password = req.body.user_pass;
  db.query("select user_email, user_pass from user_data where user_email = ?", [email], async (err, results) => {
    if (err) {
      console.log(err);
    }
    if (results.length === 0) {
      req.session.message = { type: "danger", message: "Email doesn't exist" }
      res.redirect("/");
    } else {
      var isMatch = await bcrypt.compare(password, results[0].user_pass);
      if (isMatch) {
        db.query("select user_sid from user_data where user_email = ?", [email], async (err, results) => {
          if (err) {
            console.log(err);
          }
          var new_sid = req.session.id;
          var old_sid = results[0].user_sid;
          if (old_sid.toLowerCase() === "notlogedin") {
            db.query("update user_data set user_sid = ? where user_email = ?", [new_sid, email], async (err, results) => {
              req.session.isAuth = true;
              res.redirect("/shownotes");
            });
          } else {
            db.query("update user_data set user_sid = ? where user_email = ?", [new_sid, email], async (err, results) => {
              if (err) {
                console.log(err);
              }
              db.query("delete from usersession where user_session_id = ?", [old_sid], async (err, results) => {
                if (err) {
                  console.log(err);
                }
                req.session.isAuth = true;
                res.redirect("/shownotes");
              });
            });
          }
        });
      } else {
        req.session.message = { type: "danger", message: "Password is incorrect" }
        res.redirect("/");
      }
    }
  });
});

//---------------------------------SHOW NOTES ROUTE------------------------------------------------------------------------

app.get("/shownotes", isAuth, (req, res) => {
  res.locals.title = "NOTES"
  res.render("shownotes");
});
app.post("/shownotes", (req, res) => {
  const body = req.body;
  const subject = Object.keys(body)[0];
  const chapter_name = body[subject].replace(/ /g,'').toLowerCase();
  console.log(chapter_name);
  console.log(subject);
  switch(subject) {
    case "e_p_topic":
      // code block
      db.query("select * from ep_topic where chapter_name = ? limit 1", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          if (results[0].notes_present === "true") {
            var pdfname = results[0].topic_pdf;
            var data =fs.readFileSync(dirPdf + pdfname);
            res.contentType("application/pdf");
            res.send(data);
          } else {
            res.redirect("/unitnotfound");
          }
        };
      });
      break;
    case "e_c_topic":
      // code block
      db.query("select * from ec_topic where chapter_name = ? limit 1", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          if (results[0].notes_present === "true") {
            var pdfname = results[0].topic_pdf;
            var data =fs.readFileSync(dirPdf + pdfname);
            res.contentType("application/pdf");
            res.send(data);
          } else {
            res.redirect("/unitnotfound");
          }
        };
      });
      break;
    case "e_m_topic":
      // code block
      db.query("select * from em_topic where chapter_name = ? limit 1", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          if (results[0].notes_present === "true") {
            var pdfname = results[0].topic_pdf;
            var data =fs.readFileSync(dirPdf + pdfname);
            res.contentType("application/pdf");
            res.send(data);
          } else {
            res.redirect("/unitnotfound");
          }
        };
      });
      break;
    case "t_p_topic":
      // code block
      db.query("select * from tp_topic where chapter_name = ? limit 1", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          if (results[0].notes_present === "true") {
            var pdfname = results[0].topic_pdf;
            var data =fs.readFileSync(dirPdf + pdfname);
            res.contentType("application/pdf");
            res.send(data);
          } else {
            res.redirect("/unitnotfound");
          }
        };
      });
      break;
    case "t_c_topic":
      // code block
      db.query("select * from tc_topic where chapter_name = ? limit 1", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          if (results[0].notes_present === "true") {
            var pdfname = results[0].topic_pdf;
            var data =fs.readFileSync(dirPdf + pdfname);
            res.contentType("application/pdf");
            res.send(data);
          } else {
            res.redirect("/unitnotfound");
          }
        };
      });
      break;
    case "t_m_topic":
      // code block
      db.query("select * from tm_topic where chapter_name = ? limit 1", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          if (results[0].notes_present === "true") {
            var pdfname = results[0].topic_pdf;
            var data =fs.readFileSync(dirPdf + pdfname);
            res.contentType("application/pdf");
            res.send(data);
          } else {
            res.redirect("/unitnotfound");
          }
        };
      });
      break; 
    default:
      // code block
      res.redirect("/unitnotfound");
  }


});
app.post("/addnotes",(req, res) => {
  const object = req.body;
  console.log(object);
  let PdfFile;
  let FileName;
  let uploadPath;
  let notes_present = "true";
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  PdfFile = req.files.file;
  uploadPath = dirPdf + PdfFile.name;
  FileName = PdfFile.name;
  // Use the mv() method to place the file somewhere on your server
  PdfFile.mv(uploadPath, function (err) {
    if (err)
      return res.status(500).send(err);
  }); 
  for (const [key, value] of Object.entries(object)) {
    if( value != "none"){
      switch(key) {
        case "ep_chapter":
          // code block
          db.query("update ep_topic set topic_pdf = ?, notes_present = ? where chapter_name = ?", [FileName, notes_present, value], (err, results) => {
            if (err) {
              console.log(err);
            }
            req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
            res.redirect("/admin");         
          });
          break;
        case "ec_chapter":
          // code block
          db.query("update ec_topic set topic_pdf = ?, notes_present = ? where chapter_name = ?", [FileName, notes_present, value], (err, results) => {
            if (err) {
              console.log(err);
            }
            req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
            res.redirect("/admin");       
          });          
          break;
        case "em_chapter":
          // code block
          db.query("update em_topic set topic_pdf = ?, notes_present = ? where chapter_name = ?", [FileName, notes_present,value], (err, results) => {
            if (err) {
              console.log(err);
            }
            req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
            res.redirect("/admin");         
          });          
          break;
        case "tp_chapter":
          // code block
          db.query("update tp_topic set topic_pdf = ?, notes_present = ? where chapter_name = ?", [FileName, notes_present,value], (err, results) => {
            if (err) {
              console.log(err);
            }
            req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
            res.redirect("/admin");     
          });   
          break;
        case "tc_chapter":
          // code block
          db.query("update tc_topic set topic_pdf = ?, notes_present = ? where chapter_name = ?", [FileName, notes_present,value], (err, results) => {
            if (err) {
              console.log(err);
            }
            req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
            res.redirect("/admin");           
          });             
          break;
        case "tm_chapter":
          // code block
          db.query("update tm_topic set topic_pdf = ?, notes_present = ? where chapter_name = ?", [FileName, notes_present, value], (err, results) => {
            if (err) {
              console.log(err);
            }
            req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
            res.redirect("/admin");          
          });             
          break; 
        default:
          // code block
          res.redirect("/unitnotfound");
      }
      
    }
  }
  
});

app.post("/navnotes", isAuth, (req, res) => {
  res.redirect("/shownotes");
});

//---------------------------------FORGET PASSWORD ROUTE-----------------------------------------------------





app.get("/forgetpassword", (req, res) => {
  res.locals.title = "FORGET PASSWORD"
  res.render("forgetpassword");
});

app.post("/forgetpassword", (req, res) => {
  const email = req.body.email;
  db.query("select user_id from user_data where user_email = ?", [email], async (err, results) => {
    if (err) {
      console.log(err);
    }
    if (results.length === 0) {
      req.session.message = { type: "danger", message: "Email doesn't exist" }
      res.redirect("/forgetpassword");
    } else {
      var user_id = results[0].user_id;
      var token = jwt.sign({email: email, user_id: user_id }, process.env.JWT_SECRET, { expiresIn: '10m' });
      db.query("update user_data set reset_link = ? where user_id = ?", [token, user_id], async (err, results) => {
        if (err) {
          console.log(err);
        }
        var msg = `<h1>Please Click On Below Button To Reset Your Password</h1> 
        <a href = "${process.env.BASE_URL}/forgetpassword/${token}" ><button type="button" class = "private-button">Reset Password</button></a>`
        var mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: 'Email from SCITHON',
          html: msg
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        req.session.message = {
          type: "success",
          message: 'A Password Reset Link is Sent To Your Email'
        }
        res.redirect("/forgetpassword");
      });
    }
  });
});

app.get("/forgetpassword/:token", async (req, res) => {
  jwt.verify(req.params.token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      res.redirect("*");
    }
    let token = req.params.token;
    let user_id = decoded.user_id;
    let email = decoded.email;
    db.query("select reset_link from user_data where user_id = ?", [user_id], async (err, results) => {
      if (err) {
        console.log(err);
      }
      if (token === results[0].reset_link) {
        id = user_id
        id_email = email
        ChangePassword = true;
        res.redirect("/changepassword");
      } else {
        res.redirect("*");
      }
    });
  });
});

app.get("/changepassword", isAllowedChangePassword, (req, res) => {
  res.locals.title = "CHANGE PASSWORD";
  res.render("changepassword", {user_id: id, user_email: id_email});
})

app.post("/changepassword", async (req, res) => {
  const user_id = req.body.user_id;
  const user_email = req.body.user_email;
  const password = req.body.password;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query("update user_data set user_pass = ? where user_id = ?", [hashedPassword, user_id], async (err, results) => {
    if (err) {
      console.log(err);
    }
    var msg = `<h1>Your Password Changed Sussessfully</h1>`
    var mailOptions = {
      from: process.env.EMAIL,
      to: user_email,
      subject: 'Email from SCITHON',
      html: msg
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    ChangePassword = false;
    res.redirect("/");
  });
})





//------------------------------SHOW MATERIAL ROUTE-----------------------------------------------------------
app.post ("/navbutton", (req, res) => {
  const body = req.body;
  const subject = Object.keys(body)[0];
  const chapter_name = body[subject].replace(/ /g,'').toLowerCase();
  switch(subject) {
    case "e_p_topic":
      // code block
      db.query("select * from ep_topic where chapter_name = ?", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          res.locals.title = chapter_name.toUpperCase();
          res.render("showmaterial", {subject_name: subject, chapter_name: body[subject], material:results})
        };
      });
      break;
    case "e_c_topic":
      // code block
      db.query("select * from ec_topic where chapter_name = ?", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          res.locals.title = chapter_name.toUpperCase();
          res.render("showmaterial", {subject_name: subject, chapter_name: body[subject], material:results})
        };
      });
      break;
    case "e_t_topic":
      // code block
      db.query("select * from et_topic where chapter_name = ?", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          res.locals.title = chapter_name.toUpperCase();
          res.render("showmaterial", {subject_name: subject, chapter_name: body[subject], material:results})
        };
      });
      break;
    case "t_p_topic":
      // code block
      db.query("select * from tp_topic where chapter_name = ?", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          res.locals.title = chapter_name.toUpperCase();
          res.render("showmaterial", {subject_name: subject, chapter_name: body[subject], material:results})
        };
      });
      break;
    case "t_c_topic":
      // code block
      db.query("select * from tc_topic where chapter_name = ?", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          res.locals.title = chapter_name.toUpperCase();
          res.render("showmaterial", {subject_name: subject, chapter_name: body[subject], material:results})
        };
      });
      break;
    case "t_m_topic":
      // code block
      db.query("select * from tm_topic where chapter_name = ?", [chapter_name], (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.length === 0) {
            res.redirect("/unitnotfound");
        } else {
          res.locals.title = chapter_name.toUpperCase();
          res.render("showmaterial", {subject_name: subject, chapter_name: body[subject], material:results})
        };
      });
      break; 
    default:
      // code block
      res.redirect("/unitnotfound");
  }

});

app.get("/unitnotfound", (req, res) => {
  res.locals.title = "UNIT NOT FOUND"
  res.render("unitnotfound");
})

app.get("/showmaterial", (req, res) => {
  res.locals.title = "XI JEE-NEET"
  res.render("showmaterial");
});

app.post("/addmaterial",(req, res) => {
  console.log(req.body);
  const object = req.body;
  let PptFile;
  let FileName;
  let uploadPath;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  PptFile = req.files.file;
  uploadPath = dirPpt + PptFile.name;
  FileName = PptFile.name;
  // Use the mv() method to place the file somewhere on your server
  PptFile.mv(uploadPath, function (err) {
    if (err)
      return res.status(500).send(err);
  });
  const topic_name = req.body.topic_name;
  const topic_link = req.body.video_link;
  const keys = [];
  const values = [];
  for (const [key, value] of Object.entries(object)) {
    keys.push(key);
    values.push(value);
  }
  for (var i = 2; i < keys.length; i++) {
    if (values[i] != "none") {
      var chapter_name = values[i];
      var subject_name = keys[i];
      switch(subject_name) {
        case "ep_chapter":
          // code block
          db.query("select * from ep_topic where chapter_name = ? limit 1",[chapter_name], (err, results) => {
            if (err) {
              console.log(err);
            }
            if (results.length === 0) {
              db.query("insert into ep_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [chapter_name, topic_name, FileName, topic_link], (err, results) => {
                if (err) {
                  console.log(err);
                }
                console.log(chapter_name, topic_name, FileName, topic_link);
                req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                res.redirect("/admin");
              });
            } else {
              if(results[0].notes_present === "true"){
                var pdfname = results[0].topic_pdf;
                var notes_present = "true"
                db.query("insert into ep_topic (chapter_name, topic_name, topic_pdf, topic_ppt, topic_link, notes_present) values (?, ?, ?, ?, ?, ?)", [chapter_name, topic_name, pdfname, FileName, topic_link, notes_present], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              } else {
                db.query("insert into ep_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [chapter_name, topic_name, FileName, topic_link], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              }
            }
          });
          break;
        case "ec_chapter":
          // code block
          db.query("select * from ec_topic where chapter_name = ? limit 1",[values[i]], (err, results) => {
            if (err) {
              console.log(err);
            }
            if (results.length === 0) {
              db.query("insert into ec_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                if (err) {
                  console.log(err);
                }
                req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                res.redirect("/admin");
              });
            } else {
              if(results[0].notes_present === "true"){
                var pdfname = results[0].topic_pdf;
                var notes_present = "true"
                db.query("insert into ec_topic (chapter_name, topic_name, topic_pdf, topic_ppt, topic_link, notes_present) values (?, ?, ?, ?, ?, ?)", [values[i], topic_name, pdfname, FileName, topic_link, notes_present], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              } else {
                db.query("insert into ec_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              }
            }
          });      
          break;
        case "em_chapter":
          // code block
          db.query("select * from em_topic where chapter_name = ? limit 1",[values[i]], (err, results) => {
            if (err) {
              console.log(err);
            }
            if (results.length === 0) {
              db.query("insert into em_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                if (err) {
                  console.log(err);
                }
                req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                res.redirect("/admin");
              });
            } else {
              if(results[0].notes_present === "true"){
                var pdfname = results[0].topic_pdf;
                var notes_present = "true"
                db.query("insert into em_topic (chapter_name, topic_name, topic_pdf, topic_ppt, topic_link, notes_present) values (?, ?, ?, ?, ?, ?)", [values[i], topic_name, pdfname, FileName, topic_link, notes_present], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              } else {
                db.query("insert into em_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              }
            }
          });     
          break;
        case "tp_chapter":
          // code block 
          db.query("select * from tp_topic where chapter_name = ? limit 1",[values[i]], (err, results) => {
            if (err) {
              console.log(err);
            }
            if (results.length === 0) {
              db.query("insert into tp_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                if (err) {
                  console.log(err);
                }
                req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                res.redirect("/admin");
              });
            } else {
              if(results[0].notes_present === "true"){
                var pdfname = results[0].topic_pdf;
                var notes_present = "true"
                db.query("insert into tp_topic (chapter_name, topic_name, topic_pdf, topic_ppt, topic_link, notes_present) values (?, ?, ?, ?, ?, ?)", [values[i], topic_name, pdfname, FileName, topic_link, notes_present], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              } else {
                db.query("insert into tp_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              }
            }
          });
          breakt
        case "tc_chapter":
          // code block
          db.query("select * from tc_topic where chapter_name = ? limit 1",[values[i]], (err, results) => {
            if (err) {
              console.log(err);
            }
            if (results.length === 0) {
              db.query("insert into tc_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                if (err) {
                  console.log(err);
                }
                req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                res.redirect("/admin");
              });
            } else {
              if(results[0].notes_present === "true"){
                var pdfname = results[0].topic_pdf;
                var notes_present = "true"
                db.query("insert into tc_topic (chapter_name, topic_name, topic_pdf, topic_ppt, topic_link, notes_present) values (?, ?, ?, ?, ?, ?)", [values[i], topic_name, pdfname, FileName, topic_link, notes_present], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              } else {
                db.query("insert into tc_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              }
            }
          });            
          break;
        case "tm_chapter":
          // code block 
          db.query("select * from tm_topic where chapter_name = ? limit 1",[values[i]], (err, results) => {
            if (err) {
              console.log(err);
            }
            if (results.length === 0) {
              db.query("insert into tm_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                if (err) {
                  console.log(err);
                }
                req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                res.redirect("/admin");
              });
            } else {
              if(results[0].notes_present === "true"){
                var pdfname = results[0].topic_pdf;
                var notes_present = "true"
                db.query("insert into tm_topic (chapter_name, topic_name, topic_pdf, topic_ppt, topic_link, notes_present) values (?, ?, ?, ?, ?, ?)", [values[i], topic_name, pdfname, FileName, topic_link, notes_present], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              } else {
                db.query("insert into tm_topic (chapter_name, topic_name, topic_ppt, topic_link) values (?, ?, ?, ?)", [values[i], topic_name, FileName, topic_link], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                  req.session.message = {type: "success", message: "Notes Uploaded Sussessfully"};
                  res.redirect("/admin");
                });
              }
            }
          });           
          break; 
        default:
          // code block
          res.redirect("/unitnotfound");
      }
    }
  }
});

app.get("/notes/:pdfname", isAuth, (req, res) => {
  var data =fs.readFileSync(dirPdf + req.params.pdfname);
  res.contentType("application/pdf");
  res.send(data);
});
app.get("/ppt/:pptname", (req, res) => {
  var data =fs.readFileSync(dirPpt + req.params.pptname);
  res.contentType("application/pdf");
  res.send(data);
});
//------------------------------------FACTS RELATED ROUTES-----------------------------------------------------

app.post("/addfact", (req, res) => {
  const factHeading = req.body.Heading.toLowerCase();
  const factDiscription = req.body.Discription;
  const factVideoCode = req.body.Video_Code;
  const factContent = req.body.Content;
  const fileName = req.files.file.name;
  let ImageFile;
  let uploadPath;
  db.query("insert into facts (factHeading, factDiscription, imgsrc, factContent, video_url) values (?,?,?,?,?)", [factHeading, factDiscription, fileName, factContent, factVideoCode], (err, results) => {
    if (err) {
      console.log(err);
    }
  });
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  ImageFile = req.files.file;
  uploadPath = __dirname + '/public/images/facts/' + ImageFile.name;

  // Use the mv() method to place the file somewhere on your server
  ImageFile.mv(uploadPath, function (err) {
    if (err)
      return res.status(500).send(err);
  });

  facts = [];
  fact_array(facts);
  req.session.message = { type: "success", message: "Sussessfully Added the Fact" }
  res.redirect("/admin");
});
app.post("/deletefact", (req, res) => {
  var factHeading = req.body.Heading.toLowerCase();
  db.query("delete from facts where factHeading = ?", [factHeading], (err, results) => {
    if (err) {
      console.log(err);
    }
    facts = [];
    fact_array(facts);
    req.session.message = { type: "success", message: "Sussessfully Deleted the Fact" }
    res.redirect("/admin");
  });
});
app.get("/showallfacts", (req, res) => {
  res.locals.title = "ALLFACTS"
  res.render("showallfacts", { facts: facts });
});
app.post("/showfact", (req, res) => {
  let factId = req.body.factId;
  db.query("select * from facts where factId = ?", [factId], (err, results) => {
    if (err) {
      console.log(err);
    }
    let factHeading = results[0].factHeading;
    let factimgsrc = results[0].imgsrc;
    let factContent = results[0].factContent;
    let factVideo = results[0].video_url;
    res.locals.title = factHeading.toUpperCase();
    res.render("showfact", { factHeading: factHeading, factimgsrc: factimgsrc, factContent: factContent, factVideo: factVideo });
  });
});

//------------------------------------LOGOUT ERROR ROUTES-----------------------------------------------------
app.post("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.get("*", (req, res) => {
  res.locals.title = "404"
  res.render("404");
});
app.listen(port, () => console.log(`app listening on port ${port}`));
