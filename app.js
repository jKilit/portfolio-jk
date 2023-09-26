const express = require('express') // loads the express package
const { engine } = require('express-handlebars'); // loads handlebars for Express
const port = 8080 // defines the port
const app = express() // creates the Express application

// defines handlebars engine
app.engine('handlebars', engine());
// defines the view engine to be handlebars // KOLLLLLAAAAAAAA
app.set('view engine', 'handlebars');
// defines the views directory
app.set('views', './views');

// define static directory "public" to access css/ and img/
app.use(express.static('public'))

// MODEL (DATA)
const humans = [
    {"id": "0", "name": "Jerome"}, 
    {"id": "1", "name": "Mira"},
    {"id": "2", "name": "Linus"}, 
    {"id": "3", "name": "Susanne"}, 
    {"id": "4", "name": "Ronaldo"}, 
]



// CONTROLLER (THE BOSS)
// defines route "/"
app.get('/', function(request, response){ //   "/" vilken sida du är inne på-> ladda fram home.handlebars
  response.render('home.handlebars')
})

// defines route "/humans"
app.get('/humans', function(request, response){
  const model = { listHumans: humans } // defines the model
  // in the next line, you should send the abovedefined 
  // model to the page and not an empty object {}...
  response.render('humans.handlebars', model)
})

app.get('/humans/:id', function(request, response){
  // Get the id from the dynamic route parameter
  const id = request.params.id;

  // Find the human with the matching ID in the data
  const human = humans.find(h => h.id === id);

  if (human) {
    response.render('human.handlebars', { name: human.name, id: human.id });
  } else {
    // Handle the case where the human with the given ID is not found
    response.status(404).render('404.handlebars');
  }
});


// defines route "/humans/1"
app.get('/humans/1', function(request, response){
  const model = humans[id] // defines the model
  // in the next line, you should send the abovedefined 
  // model to the page and not an empty object {}...
  response.render('human.handlebars', model)
})

// defines the final default route 404 NOT FOUND
app.use(function(req,res){
  res.status(404).render('404.handlebars');
});

// runs the app and listens to the port
app.listen(port, () => {
    console.log(`Server running and listening on port ${port}...`)
})

