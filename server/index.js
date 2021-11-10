const greets = require('../server/protos/greet_pb');
const service = require('../server/protos/greet_grpc_pb');

const calc = require('../server/protos/calculator_pb');
const caclService = require('../server/protos/calculator_grpc_pb');

const blogs = require('../server/protos/blog_pb');
const blogService = require('../server/protos/blog_grpc_pb');

const fs = require('fs');

const grpc = require('grpc');

// Knex require
const environment = process.env.ENVIRONMENT || 'development';
const config = require('./knexfile')[environment];
const knex = require('knex')(config);

/* 
  Implements the greet RPC method.
*/

/* Blog CRUD */
function listBlog(call, callback) {
  console.log('Received list blog request');
  knex('blogs').then((data) => {
    data.map((element) => {
      let blog = new blogs.Blog();
      blog.setId(element.id);
      blog.setAuthor(element.author);
      blog.setTitle(element.title);
      blog.setContent(element.content);

      let blogResponse = new blogs.ListBlogResponse();
      blogResponse.setBlog(blog);

      // write to the stream
      call.write(blogResponse);
    });

    call.end(); // we are done writing
  });
}

function createBlog(call, callback) {
  console.log('Received Create Blog Request');

  const blog = call.request.getBlog();

  console.log('Inserting a blog....');

  knex('blogs')
    .insert({
      author: blog.getAuthor(),
      title: blog.getTitle(),
      content: blog.getContent(),
    })
    .then(() => {
      const id = blog.getId();

      const addedBlog = new blogs.Blog();

      // Set the blog response to be returned
      addedBlog.setId(id);
      addedBlog.setAuthor(blog.getAuthor());
      addedBlog.setTitle(blog.getTitle());
      addedBlog.setContent(blog.getContent());

      const blogResponse = new blogs.CreateBlogResponse();

      blogResponse.setBlog(addedBlog);

      console.log('Inserted Blog with ID', blogResponse);

      callback(null, blogResponse);
    });
}

function readBlog(call, callback) {
  console.log('Received Blog request');

  // get id
  const blogId = call.request.getBlogId();

  knex('blogs')
    .where({ id: parseInt(blogId) })
    .then((data) => {
      console.log('Searching for a blog...');

      if (data.length) {
        const blog = new blogs.Blog();

        console.log('Blog found and sending message');

        // set the blog response to be returned
        blog.setId(blogId);
        blog.setAuthor(data[0].author);
        blog.setTitle(data[0].title);
        blog.setContent(data[0].content);

        const blogResponse = new blogs.ReadBlogResponse();
        blogResponse.setBlog(blog);

        callback(null, blogResponse);
      } else {
        console.log('Blog not found');
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Blog Not found!',
        });
      }
    });
}

function updateBlog(call, callback) {
  console.log('Received updated Blog Request');

  const blogId = call.request.getBlog().getId();

  console.log('Searching for a blog to update...');

  knex('blogs')
    .where({ id: parseInt(blogId) })
    .update({
      author: call.request.getBlog().getAuthor(),
      title: call.request.getBlog().getTitle(),
      content: call.request.getBlog().getContent(),
    })
    .returning()
    .then((data) => {
      if (data) {
        const blog = new blogs.Blog();

        console.log('Blog found sending message...');

        // set the blog response
        blog.setId(blogId);
        blog.setAuthor(data.author);
        blog.setTitle(data.title);
        blog.setContent(data.content);

        const updateBlogResponse = new blogs.UpdateBlogResponse();
        updateBlogResponse.setBlog(blog);

        console.log('Updated ===', updateBlogResponse.getBlog().getId());

        callback(null, updatedBlogResponse);
      } else {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Blog with corresponding was not found',
        });
      }
    });
}

function deleteBlog(call, callback) {
  console.log('Received Delete Blog request');

  const blogId = call.request.getBlogId();

  knex('blogs')
    .where({ id: parseInt(blogId) })
    .delete()
    .returning()
    .then((data) => {
      console.log('Blog deleteing...');

      if (data) {
        const deleteResponse = new blogs.DeleteBlogResponse();
        deleteResponse.setBlogId(blogId);

        console.log(
          'Blog request is now deleted with id: ',
          deleteResponse.toString()
        );

        callback(null, deleteResponse);
      } else {
        console.log('Nope...');

        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Blog with the corresponding id was not found',
        });
      }
    });
}

function sum(call, callback) {
  const sumResponse = new calc.SumResponse();

  sumResponse.setSumResult(
    call.request.getFirstNumber() + call.request.getSecondNumber()
  );

  callback(null, sumResponse);
}

function greetManyTimes(call, callback) {
  const firstName = call.request.getGreeting().getFirstName();

  let count = 0,
    intervalID = setInterval(() => {
      const greetManyTimesResponse = new greets.GreetManyTimesResponse();
      greetManyTimesResponse.setResult(firstName);

      // Setup streaming
      call.write(greetManyTimesResponse);
      if (++count > 9) {
        clearInterval(intervalID);
        call.end(); // we have sent all messages!
      }
    }, 1000);
}

// Prime Factor
function primeNumberDecomposition(call, callback) {
  let number = call.request.getNumber();
  let divisor = 2;

  console.log('Received number: ', number);

  while (number > 1) {
    if (number % divisor === 0) {
      const primeNumberDecompositionResponse =
        new calc.PrimeNumberDecompositionResponse();

      primeNumberDecompositionResponse.setPrimeFactor(divisor);

      number = number / divisor;

      // Write message using call.write()

      call.write(primeNumberDecompositionResponse);
    } else {
      divisor++;
      console.log('Divisor has increased to ', divisor);
    }
  }

  call.end(); // all messages sent! we are done!
}

function longGreet(call, callback) {
  call.on('data', (request) => {
    const fullName =
      request.getGreet().getFirstName() +
      ' ' +
      request.getGreet().getLastName();

    console.log('Hello ' + fullName);
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    const response = new greets.LongGreetResponse();
    response.setResult('Long Greet Client Streaming....');

    callback(null, response);
  });
}

function computeAverage(call, callback) {
  // Running sum and count
  let sum = 0;
  let count = 0;

  call.on('data', (request) => {
    // increment sum
    sum += request.getNumber();

    console.log('Got number: ' + request.getNumber());

    // increment count
    count += 1;
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    // compute the actual average
    let average = sum / count;

    const response = new calc.ComputeAverageResponse();
    response.setAverage(average);

    callback(null, response);
  });
}

async function sleep(interval) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), interval);
  });
}

// Find Maximum
async function findMaximum(call, callback) {
  let currentMax = 0;
  let currentNumber = 0;

  call.on('data', (request) => {
    currentNumber = request.getNumber();

    if (currentNumber > currentMax) {
      currentMax = currentNumber;

      const response = new calc.FindMaximumResponse();
      response.setMaximum(currentMax);

      call.write(response);
    } else {
      //  do noting
    }

    console.log('Streamed number: ', request.getNumber());
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    const response = new calc.FindMaximumResponse();
    response.setMaximum(currentMax);

    call.write(response);

    call.end();

    console.log('The End!');
  });
}

async function greetEveryone(call, callback) {
  call.on('data', (response) => {
    const fullName =
      response.getGreet().getFirstName() +
      ' ' +
      response.getGreet().getLastName();

    console.log('Hello ' + fullName);
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    console.log('The End...');
  });

  for (let index = 0; index < 10; index++) {
    // const greeting = new greets.Greeting();
    // greeting.setFirstName('Fahmi');
    // greeting.setLastName('Alfareza');

    const response = new greets.GreetEveryoneResponse();
    response.setResult('Fahmi Alfareza');

    call.write(response);
    await sleep(1000);
  }

  call.end();
}

function greet(call, callback) {
  const greeting = new greets.GreetResponse();

  greeting.setResult(
    'Hello ' +
      call.request.getGreeting().getFirstName() +
      ' ' +
      call.request.getGreeting().getLastName()
  );

  callback(null, greeting);
}

function squareRoot(call, callback) {
  const number = call.request.getNumber();

  if (number >= 0) {
    let numberRoot = Math.sqrt(number);
    let response = new calc.SquareRootResponse();
    response.setNumberRoot(numberRoot);

    callback(null, response);
  } else {
    // Error handling
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message:
        'The number being sent is not positive ' + ' Number sent: ' + number,
    });
  }
}

function main() {
  let credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync('../certs/ca.crt'),
    [
      {
        cert_chain: fs.readFileSync('../certs/server.crt'),
        private_key: fs.readFileSync('../certs/server.key'),
      },
    ],
    true
  );

  let unsafeCreds = grpc.ServerCredentials.createInsecure();

  const server = new grpc.Server();

  server.addService(blogService.BlogServiceService, {
    listBlog,
    createBlog,
    readBlog,
    updateBlog,
    deleteBlog,
  });
  server.addService(caclService.CalculatorServiceService, {
    sum,
    primeNumberDecomposition,
    computeAverage,
    findMaximum,
    squareRoot,
  });
  server.addService(service.GreetServiceService, {
    greet,
    greetManyTimes,
    longGreet,
    greetEveryone,
  });

  server.bind('127.0.0.1:50051', credenuntials);
  server.start();

  console.log('Server running on port 127.0.0.1:50051');
}

main();
