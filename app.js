const express = require('express')// loads the express package
const { engine } = require('express-handlebars'); // loads handlebars for Express
const port = 8080 // defines the port
const app = express() // creates the Express application
const bodyParser=require('body-parser')
const session=require('express-session')
const connectSqlite3=require('connect-sqlite3')
const cookieParser= require('cookie-parser')


app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
// defines the views directory
app.set('views', './views');

// define static directory "public" to access css/ and img/
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended:false}))
app.use(bodyParser.json())

const SQLiteStore= connectSqlite3(session)
app.use(session({
  store:new SQLiteStore ({db:"session-db.db"}),
  "saveUninitialized":false,
  "resave":false,
  "secret":"This123Is@Another#456Greatsecret678%Sentence"
}));

app.get('/', (req, res) => {
  db.all("SELECT * FROM Education", function (error1, education) {
    if (error1) {
      const model = {
        dbError: true,
        theError: error1,
        Education: [],
        blog: [],
        isLoggedin: req.session.isLoggedIn, // Add session information
        name: req.session.name,                // Add session information
        isAdmin: req.session.isAdmin      // Add session information
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
            isLoggedin: req.session.isLoggedIn || false, // Add session information
            name: req.session.name || "",                // Add session information
            isAdmin: req.session.isAdmin || false        // Add session information
          };
          res.render("home.handlebars", model);
        } else {
          const model = {
            dbError: false,
            theError: "",
            Education: education,
            blog: blog,
            isLoggedin: req.session.isLoggedIn,// Add session information
            name: req.session.name,       // Add session information
            isAdmin: req.session.isAdmin       // Add session information
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
  const model={
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin  
  }
  res.render('login.handlebars',model)
});

app.get('/logout', function (req, res) {
  const model = {
    isLoggedin: req.session.isLoggedIn,
    name:req.session.name,
    isAdmin:req.session.isAdmin 
  } 
  req.session.isAdmin = false;
  req.session.isLoggedIn = false;
  req.session.name = "";
  res.redirect('/login')
})

app.post('/login',(req, res) => {
  const un=req.body.un
  const pw= req.body.pw

  if(un=="jonathan" && pw=="snygg"){
    console.log("Jonathan is logged in")
    req.session.isAdmin=true
    req.session.isLoggedIn=true
    req.session.name="jonathan"

    res.redirect('/')
  }
  else{
    console.log("Wrong password or username")
    req.session.isAdmin=false
    req.session.isLoggedIn=false
    req.session.name=""
    res.redirect('/login')
  }
});

app.get('/contact', function (req, res) {
  const model={
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin  
  }
  res.render('contact.handlebars',model)
})

app.get('/login', function (req, res) {
  const model={
    isLoggedin: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin  
  }
  res.render('login',model)
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
      }
    });
  }
  else{
    res.redirect('/login');
  }
  
})
;

app.use(function (req, res) {
  res.status(404).render('404.handlebars');
});

/**************************INSERT DATA***************DATABASE STARTS HERE*********************************************************/

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('project-jk.sqlite');

/*db.run(`CREATE TABLE IF NOT EXISTS blog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT
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
  pimgURL TEXT NOT NULL
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

/*db.run(`CREATE TABLE IF NOT EXISTS contactInfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mail TEXT NOT NULL,
  number INTEGER NOT NULL,
  homeAdress TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  )`);
  

  const contactInformation =[
    {"mail": "random.name@hotmail.com","number": "0763399256", "homeAdress": "Street 1", "city": "Jönköping", "country": "Sweden",
  }
  ]
  contactInformation.forEach((contactInformation) => {
    db.run('INSERT INTO contactInfo (mail, number, homeAdress, city, country) VALUES (?,?,?,?,?)', [contactInformation.mail, contactInformation.number, contactInformation.homeAdress, contactInformation.city, contactInformation.country], function(error) {
      if (error) {
        console.error('Error inserting contactinformation post:', error);
      } else {
        console.log('New contact information inserted with ID:', this.lastID);
      }
    });
  });
  */

/*db.run(`CREATE TABLE IF NOT EXISTS skills (
  sid INTEGER PRIMARY KEY AUTOINCREMENT,
  sname TEXT NOT NULL,
  sdesc TEXT NOT NULL,
  stype TEXT NOT NULL
)`, (error) => {
  if (error) {
    console.error('Error creating "skills" table:', error);
  } else {
    console.log('Table "skills" created (or already exists).');
  }
});


const skills = [
  { "sid": "1", "sname": "C/C++", "sdesc": "Programming with C/C++.", "stype": "Programming language." },
  { "sid": "2", "sname": "Java", "sdesc": "Programming with Java.", "stype": "Programming language." },
  { "sid": "3", "sname": "Javascript", "sdesc": "Programming with Javascript.", "stype": "Programming language." },
  { "sid": "4", "sname": "HTML", "sdesc": "Programming with HTML for website.", "stype": "Hypertext Markup Language." },
  { "sid": "5", "sname": "CSS", "sdesc": "Designing website.", "stype": "Cascading style sheets language" },
  { "sid": "6", "sname": "Express", "sdesc": "A framework for programming Javascript on the server side.", "stype": "framework" },
  { "sid": "7", "sname": "NodeJS", "sdesc": "Programming with Javascript on the server side.", "stype": "Programming language" },
  { "sid": "8", "sname": "Object-oriented programming", "sdesc": "Programming with this method", "stype": "Programming method" },
  { "sid": "9", "sname": "VSCode", "sdesc": "Open-source integrated development environment", "stype": "Coding environment" },
  { "sid": "10", "sname": "QT Creator", "sdesc": "Open-source integrated development environment", "stype": "Coding environment" },
];



// inserts skills
// inserts skills
skills.forEach((specificSkill) => {
  db.run("INSERT INTO skills (sid, sname, sdesc, stype) VALUES (?, ?, ?, ?)", [specificSkill.sid, specificSkill.sname, specificSkill.sdesc, specificSkill.stype], (error) => {
    if (error) {
      console.log("ERROR: ", error)
    } else {
      console.log("Line added to skills successfully!")
    }
  })
})
*/

/*db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)`);
const hashPassword = (password) => {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
};
*/


/****************************QUERIES!************************************************* */
//Delete specific ID from BlOG
// Replace with the new image URL you want to set

// SQL query to update the picture (pimgURL) of the row with the specified ID

// Close the database connection when done

// SQL query to remove the "sdesc" column from the "skills" table

/*const user='jonathanKilit';
const password= hashPassword('test123')

db.run('INSERT INTO users (username, password) VALUES (?, ?)', [user, password], function (err) {
  if (err) {
    console.error('Error inserting user:', err);
  } else {
    console.log('New user inserted with ID:', this.lastID);
  }
});
*/
// runs the app and listens to the port
app.listen(port, () => {
  console.log(`Server running and listening on port ${port}...`)
})

