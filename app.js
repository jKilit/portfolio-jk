const express = require('express')
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser')
const session = require('express-session')
const connectSqlite3 = require('connect-sqlite3')
const sqlite3 = require('sqlite3');

// EXPRESS APP
const port = 8080
const app = express() 

// DATABASE
const db = new sqlite3.Database('project-jk.sqlite');

// VÍEW ENGINE HANDLEBARS
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// CONFIG
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// SESSION
const SQLiteStore = connectSqlite3(session)
app.use(session({
  store: new SQLiteStore({ db: "session-db.db" }),
  "saveUninitialized": false,
  "resave": false,
  "secret": "This123Is@Another#456Greatsecret678%Sentence"
}));

// ROUTES
app.get('/', (req, res) => {
  db.all("SELECT * FROM Education", function (error1, education) {
    if (error1) {
      const model = {
        dbError: true,
        theError: error1,
        Education: [],
        blog: [],
        isLoggedin: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
      };
      res.render("home.handlebars", model);
    } else {
      db.all("SELECT * FROM blog", function (error2, blog) {
        if (error2) {
          const model = {
            dbError: true,
            theError: error2,
            Education: [],
            blog: [],
            isLoggedin: req.session.isLoggedIn,
            name: req.session.name || "",
            isAdmin: req.session.isAdmin
          };
          res.render("home.handlebars", model);
        } else {
          const model = {
            dbError: false,
            theError: "",
            Education: education,
            blog: blog,
            isLoggedin: req.session.isLoggedIn,
            name: req.session.name,
            isAdmin: req.session.isAdmin
          };
          res.render("home.handlebars", model);
        }
      });
    }
  });
});


app.get('/about', (req, res) => {
  db.all("SELECT * FROM languages", function (error, languages) {
    if (error) {
      const model = {
        dbError: true,
        theError: error,
        languages: [],
        isLoggedin: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
      };
      res.render("about.handlebars", model);
    } else {
      const model = {
        dbError: false,
        theError: "",
        languages: languages,
        isLoggedin: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
      };
      res.render("about.handlebars", model);
    }
  });
});


app.get('/specific/:id', function (req, res) {
  const id = req.params.id;

  const query = 'SELECT * FROM Projects WHERE id = ?';

  db.get(query, [id], function (error, specificProject) {
    if (error) {
      const model = {
        dbError: true,
        theError: error,
        specificProject: null,
        isLoggedin: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
      };
      res.render('specific.handlebars', model);
    } else if (specificProject) {
      const model = {
        dbError: false,
        theError: "",
        specificProject: specificProject,
        isLoggedin: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
      };

      res.render('specific.handlebars', model);
    }
  });
});


app.get('/project', (req, res) => {
  db.all("SELECT * FROM Projects", function (error, Projects) {
    if (error) {
      const model = {
        dbError: true,
        theError: error,
        projects: [],
        isLoggedin: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
      }

      res.render("project.handlebars", model)
    }
    else {
      const model = {
        dbError: false,
        theError: "",
        projects: Projects,
        isLoggedin: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
      }
      res.render("project.handlebars", model)
    }
  })
});
app.get('/login', function (req, res) {
  const model = {
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('login.handlebars', model)
});

app.get('/logout', function (req, res) {
  const model = {
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  req.session.isAdmin = false;
  req.session.isLoggedIn = false;
  req.session.name = "";
  res.redirect('/login')
})

const bcrypt = require('bcrypt');

app.post('/login', (req, res) => {
  const un = req.body.un;
  const pw = req.body.pw;

  db.get("SELECT * FROM users WHERE username = ?", [un], (dberror, user) => {
    if (dberror) {
      res.redirect('/');
    } else if (user) {
      const cryptedpass = user.password;

      bcrypt.compare(pw, cryptedpass, (compareE, resultat) => {
        if (compareE) {
          res.redirect('/login');
        } else {
          if (resultat) {
            const isAdmin = user.isAdmin === 1;
            req.session.isAdmin = isAdmin;
            req.session.isLoggedIn = true;
            req.session.name = user.username;
            res.redirect('/');
          } else {
            req.session.isAdmin = false;
            req.session.isLoggedIn = false;
            req.session.name = "";
            res.redirect('/');
          }
        }
      });
    } else {
      req.session.isAdmin = false;
      req.session.isLoggedIn = false;
      req.session.name = "";
      res.redirect('/login');
    }
  });
});



app.get('/contact', function (req, res) {
  const model = {
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('contact.handlebars', model)
})

app.get('/new-blogpost', function (req, res) {
  const model = {
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('new-blogpost', model)
})

app.post('/new-blogpost', (req, res) => {
  const title = req.body['blog-title'];
  const content = req.body['blog-text'];

  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    const newPost = {
      title: title,
      content: content
    };

    db.run("INSERT INTO blog (title, content) VALUES (?, ?)", [newPost.title, newPost.content], (error) => {
      if (error) {
        console.log("ERROR:", error);
      } else {
        console.log("Line added into blog table!");
        res.redirect('/');
      }
    });
  }
  else {
    res.redirect('/login');
  }


});


app.get('/edit-blogpost/:id', (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM blog WHERE id=?", [id], function (error, blog) {
    if (error) {
      console.log("ERROR: ", error);
      const model = {
        dbError: true,
        theError: error,
        blog: {},
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };

      res.render("edit-blogpost.handlebars", model);
    } else {
      const model = {
        dbError: false,
        theError: "",
        blog: blog,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };

      res.render("edit-blogpost.handlebars", model);
    }
  });
});


app.post('/edit-blogpost/:id', (req, res) => {
  const id = req.params.id;
  const newTitle = req.body['blog-title'];
  const newContent = req.body['blog-text'];

  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {

    db.run("UPDATE blog SET title=?, content=? WHERE id=?", [newTitle, newContent, id], (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("Blogpost updated!");
      }
      res.redirect('/');
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/delete-blogpost/:id', (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn === true && req.session.isAdmin === true){
    db.run("DELETE FROM blog WHERE id=?", [id], (error, blog) => {
      if (error) {
        const model = {
          dbError: true,theError: error,
          isLoggedin: req.session.isLoggedin,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        }
        res.render("home.handlebars", model)
      } else {
        const model = {
          dbError: false,theError: "",
          isLoggedin: req.session.isLoggedin,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        }
        res.render("home.handlebars", model)
      }
      res.redirect("/");
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/create-project', function (req, res) {
  const model = {
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('create-project.handlebars', model);
});

app.post('/create-project', (req, res) => {
  const title = req.body['project-title'];
  const year = req.body['project-year'];
  const desc = req.body['project-desc'];

  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    const newPost = {
      title: title,
      desc: desc,
      year: year
    };

    db.run("INSERT INTO Projects (title,year,desc) VALUES (?, ?,?)", [newPost.title, newPost.year ,newPost.desc], (error) => {
      if (error) {
        console.log("ERROR:", error);
      } else {
        console.log("Line added into blog table!");
        res.redirect('/');
      }
    });
  }
  else {
    res.redirect('/login');
  }
});



app.get('/edit-project/:id', (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM Projects WHERE id=?", [id], function (error, Projects) {
    if (error) {
      console.log("ERROR: ", error);
      const model = {
        dbError: true,
        theError: error,
        Projects: {},
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };

      res.render("edit-project.handlebars", model);
    } else {
      const model = {
        dbError: false,
        theError: "",
        Projects: Projects,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };

      res.render("edit-project.handlebars", model);
    }
  });
});

app.post('/edit-project/:id', (req, res) => {
  const id = req.params.id;
  const newTitle = req.body['project-title'];
  const newYear = req.body['project-year'];
  const newDesc = req.body['project-desc'];

  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {

    db.run("UPDATE Projects SET title=?, year=?, desc=? WHERE id=?", [newTitle, newYear, newDesc, id], (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("Project updated!");
      }
      res.redirect('/project');
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/delete-project/:id', (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run("DELETE FROM Projects WHERE id=?", [id], (error, project) => {
      if (error) {
        const model = {
          dbError: true, theError: error,
          isLoggedin: req.session.isLoggedin,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        }
        res.render("project.handlebars", model)
      } else {
        const model = {
          dbError: false, theError: "",
          isLoggedin: req.session.isLoggedin,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        }
        res.render("project.handlebars", model)
      }
      res.redirect("/");
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/register', function (req, res) {
  res.render('register.handlebars');
});


app.post('/register', (req, res) => {
  const username = req.body['unR'];
  const plainPassword = req.body['pwR'];

  const hashedPassword = bcrypt.hashSync(plainPassword, 10);
  const reg ={
    username:username,
    password:hashedPassword,
    isAdmin:0
  };

  db.run("INSERT INTO users (username, password,isAdmin) VALUES (?, ?, ?)", [reg.username, reg.password,reg.isAdmin], (error) => {
    if (error) {
      console.log("ERROR:", error);
    } else {
      console.log("User added into the users table!");
      res.redirect('/');
    }
  });
});




app.use(function (req, res) {
  res.status(404).render('404.handlebars');
});

/**************************INSERT DATA***************DATABASE STARTS HERE*********************************************************/


/*db.run(`CREATE TABLE IF NOT EXISTS blog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL
  )`);
  
  const blogposts = [
    { "title": "Why programming", "author": "Jonathan","content": "Programming is the language of the future! With this langauge, you can not only communicate, you can create! It makes life easier and it also pays the bills ;)" },
    { "title": "Why JTH", "author": "Jonathan","content": " University offers a unique blend of great education, great city, great student life and is over GREAT! I am very pleased with my choice of University." },
    { "title": "My thoughts on my program", "author": "Jonathan", "content": "I study software engineering, The program is called software development and mobile platforms and I am very happy with my choice, I learn how to implement and program. The skills I have learned will be used throught my life!" },
    { "title": "Life balance","author": "Jonathan", "content": "I believe life balance is the most important thing when studying. To manage workload and your freetime will, I feel, help you mentally and make you more consistent throught your studies!" },
    { "title": "Future","author": "Jonathan", "content": "I think the future is bright for young software engineers. Although, the most important thing is to like what you do, almost fall in love with it. I like programming, I therefore never work!" },
  ];

  blogposts.forEach((blogpost) => {
    db.run('INSERT INTO blog (title, content) VALUES (?, ?)', [blogpost.title, blogpost.author, blogpost.content], function(err) {
      if (err) {
        console.error('Error inserting blog post:', err);
      } else {
        console.log('New blog post inserted with ID:', this.lastID);
      }
    });
  });
*/

/*db.run(`CREATE TABLE IF NOT EXISTS Projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  desc TEXT NOT NULL,
  year INTEGER NOT NULL,
)`);

const projects = [
  { "title": "Hotel Managment", "desc": "A hotel managment system that books rooms and keeps track of bookings", "year": 2023, "pimgURL": "/img/hotel-management.jpg" },
  { "title": "Inheritance", "desc": "A project where it can shows how inheritance works in C++", "year": 2023, "pimgURL": "/img/4.Vem-som-arver-.png" },
  { "title": "Trace", "desc": "A project that shows and implements a object that traces other functions", "year": 2023, "pimgURL": "/img/hotel-management.jpg" },
  { "title": "Strong pointers", "desc": "A project that shows how to implement and use strong pointers in C++", "year": 2023, "pimgURL": "/img/strong-bodybuilder-biceps-flex-arm-vector-icon.jpg" },
  {"title": "Tree pogram", "desc": "A project that shows how information can be stored in the tree structure", "year": 2023, "pimgURL": "/img/1_Z89j_NoDx9HkFcPHy3rPZg.png" },
  // Add more projects as needed
];

projects.forEach((project) => {
  db.run('INSERT INTO Projects (title, desc, year, pimgURL) VALUES (?, ?, ?, ?)', [project.title, project.desc, project.year, project.pimgURL], function(err) {
    if (err) {
      console.error('Error inserting project:', err);
    } else {
      console.log('New project inserted with ID:', this.lastID);
    }
  });
});
*/

/*db.run(`CREATE TABLE IF NOT EXISTS languages(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level INTEGER NOT NULL
)`);
*/

/*const language = [
  { "id": "1","name": "Swedish", "level": "Fluent"},
  { "id": "2","name": "English", "level": "Fluent"},
  { "id": "3","name": "German", "level": "Basics" },
  { "id": "4","name": "Arabic", "level": "Basics" },
  { "id": "5","name": "Turkish", "level": "Beginner" },

  // Add more education entries as needed
];

language.forEach((lan) => {
  db.run('INSERT INTO languages (name,level) VALUES (?, ?)', [lan.name, lan.level], function(err) {
    if (err) {
      console.error('Error inserting languages:', err);
    } else {
      console.log('New languages entry inserted with ID:', this.lastID);
    }
  });
});
*/


/*db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  isAdmin INTEGER NOT NULL 
)`);
*/


/*
const users = 'Jerome'
const plainPassword = '123'
const hashedPassword = bcrypt.hashSync(plainPassword, 10);

  db.run('INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)', [users, hashedPassword, 1], function(err) {
    if (err) {
      console.error('Error inserting user:', err);
    } else {
      console.log('New user entry inserted with ID:', this.lastID);
    }
  });
  */




/*
const hashPassword = (password) => {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
};
*/


app.listen(port, () => {
  console.log(`Server running and listening on port ${port}...`)
})

